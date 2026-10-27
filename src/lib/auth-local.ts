/**
 * Local persistent accounts (email/password) with profile sync.
 * Passwords are PBKDF2-hashed in-browser; profiles stored per account on this device.
 * In FERPA mode profiles are AES-GCM encrypted with a key derived from the password, and the
 * session (email + key) lives in sessionStorage so it ends with the tab or after idle time.
 * Google/Apple OAuth can be layered later with provider keys.
 */

import type { AppState } from "./types";
import { FERPA_MODE, IDLE_LIMIT_MS } from "./ferpa";

const ACCOUNTS_KEY = "aether.accounts.v1";
const SESSION_KEY = "aether.session.v1";
const SECURE_SESSION_KEY = "aether.secure-session.v1";

export type StoredAccount = {
  email: string;
  salt: string;
  hash: string;
  createdAt: string;
  /** Plain profile (regular mode, or a FERPA-mode account not yet migrated). */
  profileJson?: string;
  /** FERPA mode: salt for the encryption key and the encrypted profile. */
  encSalt?: string;
  profileCipher?: { iv: string; data: string };
};

type AccountDb = Record<string, StoredAccount>;

type SecureSession = { email: string; key: string; lastActive: number };

function loadDb(): AccountDb {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "{}") as AccountDb;
  } catch {
    return {};
  }
}

function saveDb(db: AccountDb) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(db));
}

function bytesToHex(buf: ArrayBuffer) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string) {
  return new Uint8Array(hex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
}

async function deriveBits(password: string, saltHex: string): Promise<ArrayBuffer> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  return crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: hexToBytes(saltHex), iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    256,
  );
}

async function deriveHash(password: string, saltHex: string): Promise<string> {
  return bytesToHex(await deriveBits(password, saltHex));
}

function randomHex(bytes: number) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return bytesToHex(arr.buffer);
}

function randomSalt() {
  return randomHex(16);
}

function aesKey(keyHex: string, usage: KeyUsage) {
  return crypto.subtle.importKey("raw", hexToBytes(keyHex), "AES-GCM", false, [usage]);
}

async function encryptProfile(keyHex: string, profile: AppState) {
  const iv = randomHex(12);
  const data = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: hexToBytes(iv) },
    await aesKey(keyHex, "encrypt"),
    new TextEncoder().encode(JSON.stringify(profile)),
  );
  return { iv, data: bytesToHex(data) };
}

async function decryptProfile(keyHex: string, cipher: { iv: string; data: string }): Promise<AppState> {
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: hexToBytes(cipher.iv) },
    await aesKey(keyHex, "decrypt"),
    hexToBytes(cipher.data),
  );
  return JSON.parse(new TextDecoder().decode(plain)) as AppState;
}

function readSecureSession(): SecureSession | null {
  try {
    const raw = sessionStorage.getItem(SECURE_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as SecureSession;
    if (Date.now() - session.lastActive > IDLE_LIMIT_MS) {
      sessionStorage.removeItem(SECURE_SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function writeSecureSession(session: SecureSession | null) {
  if (!session) sessionStorage.removeItem(SECURE_SESSION_KEY);
  else sessionStorage.setItem(SECURE_SESSION_KEY, JSON.stringify(session));
}

/** FERPA mode: derive the encryption key for an account, adding a salt to accounts made before. */
async function openAccount(db: AccountDb, key: string, password: string) {
  const acct = db[key];
  const encSalt = acct.encSalt ?? randomSalt();
  const encKey = await deriveHash(password, encSalt);
  db[key] = { ...acct, encSalt };
  writeSecureSession({ email: key, key: encKey, lastActive: Date.now() });
  return encKey;
}

export function getSessionEmail(): string | null {
  if (FERPA_MODE) return readSecureSession()?.email ?? null;
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function setSessionEmail(email: string | null) {
  if (!email) localStorage.removeItem(SESSION_KEY);
  else localStorage.setItem(SESSION_KEY, email.toLowerCase().trim());
}

/** FERPA mode: record activity so the idle timer restarts. */
export function touchSession() {
  const session = readSecureSession();
  if (session) writeSecureSession({ ...session, lastActive: Date.now() });
}

/** FERPA mode: true while a signed-in session exists and has not gone idle. */
export function hasActiveSession() {
  return Boolean(readSecureSession());
}

export async function registerAccount(email: string, password: string, profile: AppState): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = email.toLowerCase().trim();
  if (!key.includes("@") || password.length < 8) {
    return { ok: false, error: "Use a valid email and a password of at least 8 characters." };
  }
  const db = loadDb();
  if (db[key]) return { ok: false, error: "An account with that email already exists. Log in instead." };
  const salt = randomSalt();
  const hash = await deriveHash(password, salt);
  const withEmail = { ...profile, accountEmail: key };
  db[key] = { email: key, salt, hash, createdAt: new Date().toISOString() };
  if (FERPA_MODE) {
    const encKey = await openAccount(db, key, password);
    db[key].profileCipher = await encryptProfile(encKey, withEmail);
  } else {
    db[key].profileJson = JSON.stringify(withEmail);
    setSessionEmail(key);
  }
  saveDb(db);
  return { ok: true };
}

export async function loginAccount(email: string, password: string): Promise<{ ok: true; profile: AppState } | { ok: false; error: string }> {
  const key = email.toLowerCase().trim();
  const db = loadDb();
  const acct = db[key];
  if (!acct) return { ok: false, error: "No account found for that email." };
  const hash = await deriveHash(password, acct.salt);
  if (hash !== acct.hash) return { ok: false, error: "Incorrect password." };
  try {
    let profile: AppState;
    if (FERPA_MODE) {
      const encKey = await openAccount(db, key, password);
      if (acct.profileCipher) {
        profile = await decryptProfile(encKey, acct.profileCipher);
      } else {
        profile = JSON.parse(acct.profileJson || "{}") as AppState;
        db[key].profileCipher = await encryptProfile(encKey, { ...profile, accountEmail: key });
        delete db[key].profileJson;
      }
      saveDb(db);
    } else {
      profile = JSON.parse(acct.profileJson || "") as AppState;
      setSessionEmail(key);
    }
    return { ok: true, profile: { ...profile, accountEmail: key } };
  } catch {
    writeSecureSession(null);
    return { ok: false, error: "Account profile is corrupted." };
  }
}

export function logoutAccount() {
  if (FERPA_MODE) writeSecureSession(null);
  else setSessionEmail(null);
}

let saveChain: Promise<void> = Promise.resolve();

export function saveAccountProfile(email: string, profile: AppState) {
  const key = email.toLowerCase().trim();
  if (FERPA_MODE) {
    // Encryption is async; chain the saves so an older one never lands after a newer one.
    saveChain = saveChain
      .then(async () => {
        const session = readSecureSession();
        if (!session || session.email !== key) return;
        const db = loadDb();
        if (!db[key]) return;
        db[key] = { ...db[key], profileCipher: await encryptProfile(session.key, { ...profile, accountEmail: key }) };
        saveDb(db);
      })
      .catch(() => {
        /* ignore */
      });
    return;
  }
  const db = loadDb();
  if (!db[key]) return;
  db[key] = {
    ...db[key],
    profileJson: JSON.stringify({ ...profile, accountEmail: key }),
  };
  saveDb(db);
}

export function loadAccountProfile(email: string): AppState | null {
  const db = loadDb();
  const acct = db[email.toLowerCase().trim()];
  if (!acct?.profileJson) return null;
  try {
    return JSON.parse(acct.profileJson) as AppState;
  } catch {
    return null;
  }
}

/** FERPA mode: decrypt the signed-in account's profile, if the session is still active. */
export async function loadSecureProfile(): Promise<AppState | null> {
  const session = readSecureSession();
  if (!session) return null;
  const acct = loadDb()[session.email];
  if (!acct?.profileCipher) return null;
  try {
    return { ...(await decryptProfile(session.key, acct.profileCipher)), accountEmail: session.email };
  } catch {
    writeSecureSession(null);
    return null;
  }
}

/** Remove one account and its profile from this device, and end its session. */
export function deleteAccount(email: string) {
  const key = email.toLowerCase().trim();
  const db = loadDb();
  delete db[key];
  saveDb(db);
  logoutAccount();
}
