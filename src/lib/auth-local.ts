/**
 * Local persistent accounts (email/password) with profile sync.
 * Passwords are PBKDF2-hashed in-browser; profiles stored per account on this device.
 * Google/Apple OAuth can be layered later with provider keys.
 */

import type { AppState } from "./types";

const ACCOUNTS_KEY = "aether.accounts.v1";
const SESSION_KEY = "aether.session.v1";

export type StoredAccount = {
  email: string;
  salt: string;
  hash: string;
  createdAt: string;
  profileJson: string;
};

type AccountDb = Record<string, StoredAccount>;

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

async function deriveHash(password: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    256,
  );
  return bytesToHex(bits);
}

function randomSalt() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return bytesToHex(arr.buffer);
}

export function getSessionEmail(): string | null {
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

export async function registerAccount(email: string, password: string, profile: AppState): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = email.toLowerCase().trim();
  if (!key.includes("@") || password.length < 8) {
    return { ok: false, error: "Use a valid email and a password of at least 8 characters." };
  }
  const db = loadDb();
  if (db[key]) return { ok: false, error: "An account with that email already exists. Log in instead." };
  const salt = randomSalt();
  const hash = await deriveHash(password, salt);
  db[key] = {
    email: key,
    salt,
    hash,
    createdAt: new Date().toISOString(),
    profileJson: JSON.stringify({ ...profile, accountEmail: key }),
  };
  saveDb(db);
  setSessionEmail(key);
  return { ok: true };
}

export async function loginAccount(email: string, password: string): Promise<{ ok: true; profile: AppState } | { ok: false; error: string }> {
  const key = email.toLowerCase().trim();
  const db = loadDb();
  const acct = db[key];
  if (!acct) return { ok: false, error: "No account found for that email." };
  const hash = await deriveHash(password, acct.salt);
  if (hash !== acct.hash) return { ok: false, error: "Incorrect password." };
  setSessionEmail(key);
  try {
    const profile = JSON.parse(acct.profileJson) as AppState;
    return { ok: true, profile: { ...profile, accountEmail: key } };
  } catch {
    return { ok: false, error: "Account profile is corrupted." };
  }
}

export function logoutAccount() {
  setSessionEmail(null);
}

export function saveAccountProfile(email: string, profile: AppState) {
  const key = email.toLowerCase().trim();
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
  if (!acct) return null;
  try {
    return JSON.parse(acct.profileJson) as AppState;
  } catch {
    return null;
  }
}
