"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "../../components/ui";
import { useStore } from "../../lib/store";
import { loginAccount, logoutAccount, registerAccount } from "../../lib/auth-local";
import { mergeStateSafe } from "../../lib/merge-state";

export default function AccountPage() {
  const { state, setState, reset } = useStore();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState(state.student.email || "");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const signedIn = Boolean(state.accountEmail);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (mode === "register") {
        const profile = {
          ...state,
          student: { ...state.student, email: email.trim() || state.student.email },
        };
        const res = await registerAccount(email, password, profile);
        if (!res.ok) {
          setError(res.error);
          return;
        }
        setState((s) => ({ ...s, accountEmail: email.toLowerCase().trim(), student: { ...s.student, email: email.trim() } }));
        setMessage("Account created. Your profile will stay synced on this device when you return.");
        router.push("/upload");
      } else {
        const res = await loginAccount(email, password);
        if (!res.ok) {
          setError(res.error);
          return;
        }
        setState(mergeStateSafe(res.profile));
        setMessage("Welcome back — profile restored.");
        router.push(res.profile.onboardingComplete ? "/path" : "/upload");
      }
    } finally {
      setBusy(false);
    }
  };

  const onLogout = () => {
    logoutAccount();
    reset();
    setMessage("Signed out. Local guest profile cleared.");
  };

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title={signedIn ? "Your account" : "Sign in"}
        subtitle="Create an account to keep your profile, uploads, and progress across sessions on this device. Google/Apple SSO can be connected when provider keys are configured."
      />

      {signedIn ? (
        <div className="card space-y-3 p-5">
          <p className="text-sm">
            Signed in as <span className="font-semibold">{state.accountEmail}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/upload" className="btn btn-primary">Upload transcript / resume</Link>
            <Link href="/profile" className="btn btn-ghost">Edit profile</Link>
            <button type="button" className="btn btn-ghost" onClick={onLogout}>Sign out</button>
          </div>
          {state.profileRevisions.length ? (
            <div className="mt-4">
              <div className="label">Profile update history</div>
              <ul className="mt-2 space-y-2 text-sm text-(--muted)">
                {state.profileRevisions.slice(-8).reverse().map((r) => (
                  <li key={r.id}>
                    <span className="font-medium text-(--ink)">{r.source}</span> · {new Date(r.at).toLocaleString()} — {r.summary}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="card max-w-lg p-5">
          <div className="mb-4 flex gap-2">
            <button type="button" className={`btn ${mode === "login" ? "btn-primary" : "btn-ghost"}`} onClick={() => setMode("login")}>Log in</button>
            <button type="button" className={`btn ${mode === "register" ? "btn-primary" : "btn-ghost"}`} onClick={() => setMode("register")}>Create account</button>
          </div>
          <form className="grid gap-3" onSubmit={onSubmit}>
            <label className="block">
              <span className="label">Email</span>
              <input className="field" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="block">
              <span className="label">Password</span>
              <input className="field" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
            </button>
          </form>
          <p className="mt-4 text-xs text-(--muted)">
            OAuth (Google / Apple) requires provider API keys in production. Email/password accounts store an encrypted password hash and your profile locally for continuous sessions on this browser.
          </p>
        </div>
      )}

      {error ? <p className="mt-3 text-sm text-(--danger)">{error}</p> : null}
      {message ? <p className="mt-3 text-sm text-(--score-high)">{message}</p> : null}
    </div>
  );
}
