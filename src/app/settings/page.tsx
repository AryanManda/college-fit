"use client";

import Link from "next/link";
import { useState } from "react";
import { APP_NAME } from "../../lib/constants";
import { COLLEGES } from "../../data/colleges";
import { useStore } from "../../lib/store";
import { PageHeader } from "../../components/ui";

export default function SettingsPage() {
  const { state, reset, loadDemo } = useStore();
  const [message, setMessage] = useState<string | null>(null);

  const onLoadDemo = () => {
    loadDemo();
    setMessage("Demo student loaded. Explore Career, Colleges, and My Path.");
  };

  const onReset = () => {
    if (!window.confirm("Reset your profile? This clears saved schools, careers, and progress in this browser.")) return;
    reset();
    setMessage("Profile reset. Create a new profile to continue.");
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle={`${APP_NAME} saves your profile in this browser. Create an account to keep a named login on this device.`} />
      {message ? <div className="card mb-4 border-(--accent) bg-(--accent-soft) p-4 text-sm font-semibold">{message}</div> : null}
      <div className="grid gap-4">
        <section className="card p-5">
          <h2 className="font-semibold">Your account</h2>
          <p className="mt-1 text-sm text-(--muted)">
            {state.accountEmail
              ? `Signed in as ${state.accountEmail}.`
              : state.student.firstName
                ? `Local profile as ${state.student.firstName} ${state.student.lastName}`.trim()
                : "You don't have a profile yet."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/account" className="btn btn-primary">{state.accountEmail ? "Manage account" : "Create account / log in"}</Link>
            <Link href="/upload" className="btn btn-ghost">Upload transcript</Link>
            {!state.student.firstName ? (
              <Link href="/onboarding" className="btn btn-ghost">Create your profile</Link>
            ) : null}
          </div>
        </section>
        <section className="card p-5">
          <h2 className="font-semibold">Career &amp; Assessment Settings</h2>
          <p className="mt-1 text-sm text-(--muted)">
            Not feeling your current career match? Browse careers, redo the quiz, or switch assessment style.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/career/matches" className="btn btn-primary">Change My Career</Link>
            <Link href="/career/assessment" className="btn btn-ghost">Redo the Assessment</Link>
            <Link href="/career/assessment?style=alternate" className="btn btn-ghost">Change the Assessment</Link>
          </div>
        </section>
        <section className="card p-5">
          <h2 className="font-semibold">Tools</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/resume" className="btn btn-ghost">Resume Builder</Link>
            <Link href="/admitted" className="btn btn-ghost">How to Get Admitted</Link>
            <Link href="/strength" className="btn btn-ghost">Application strength</Link>
            <Link href="/profile" className="btn btn-ghost">Edit profile</Link>
          </div>
        </section>
        <section className="card p-5">
          <h2 className="font-semibold">Data</h2>
          <p className="mt-1 text-sm text-(--muted)">
            College catalog: {COLLEGES.length} universities. Important figures include a source list and “Data last updated: 2024–25”. Always verify deadlines, costs, and testing rules with the university.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn btn-ghost" onClick={onLoadDemo}>Load demo student</button>
            <button type="button" className="btn btn-ghost" onClick={onReset}>Reset my profile</button>
          </div>
        </section>
        <section className="card p-5 text-sm text-(--muted)">
          <h2 className="font-semibold text-(--ink)">AI behavior</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Never invents student achievements or statistics.</li>
            <li>Asks for missing numbers instead of fabricating them.</li>
            <li>Explains resume bullet changes and preserves your experience.</li>
            <li>Never guarantees college admission.</li>
            <li>Uses Likely / Target / Reach / High Reach categories — not a percentage chance of admission.</li>
            <li>Does not use race or other protected characteristics in the individual admissions-match score.</li>
            <li>Marks unpublished university fields as Unavailable rather than guessing.</li>
            <li>The best college for you isn’t necessarily the hardest college to get into.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
