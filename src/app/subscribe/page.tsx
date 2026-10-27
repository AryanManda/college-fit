"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { APP_NAME } from "../../lib/constants";
import { useStore } from "../../lib/store";

const INCLUDED = [
  "A real student profile: academics, activities, and college preferences",
  "Career matches, a college feed, and a next-step path from that record",
  "Transcript and resume upload for the counseling conversation",
  "A resume and an overall strength read the family can review",
  "Progress saved on this device",
];

export default function SubscribePage() {
  const router = useRouter();
  const { access, canRestoreFull, enterFull, hydrated } = useStore();
  const [email, setEmail] = useState(access?.email ?? "");
  const [error, setError] = useState("");

  const alreadyFull = hydrated && access?.mode === "full";

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter a valid email so we can attach the subscription to you.");
      return;
    }
    const restoring = canRestoreFull;
    enterFull(trimmed);
    router.push(restoring || alreadyFull ? "/home" : "/onboarding");
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 py-6 md:px-6 md:py-10">
      <header className="flex items-center justify-between gap-3">
        <Link href="/" className="serif text-[1.85rem] leading-none tracking-tight text-(--ink)">
          {APP_NAME}
        </Link>
        <Link href="/" className="text-sm font-semibold text-(--muted) hover:text-(--ink)">
          Back
        </Link>
      </header>

      <main className="py-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-(--muted)">
          For counselors, districts, and schools
        </p>
        <h1 className="serif mt-3 text-[2.6rem] leading-[1.02] text-(--ink) md:text-[3.2rem]">
          Subscribe for full access
        </h1>
        <p className="mt-4 text-[1.02rem] leading-relaxed text-(--muted)">
          If you are new to Aether, the sample is the faster way to see the product. A subscription opens
          the workspace for a real student: academics, activities, a college list, a path, and a resume.
        </p>

        <ul className="card mt-6 space-y-3 p-5 text-sm text-(--ink) md:p-6">
          {INCLUDED.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-(--accent)" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {alreadyFull ? (
          <div className="mt-6">
            <p className="text-sm text-(--ink)">
              Full access is already on for {access.email || "this device"}.
            </p>
            <Link href="/home" className="btn btn-primary mt-4">
              Open the workspace
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="label">Work email</span>
              <input
                className="field"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
                placeholder="name@district.edu"
                required
              />
            </label>
            {error ? <p className="text-sm text-(--danger)">{error}</p> : null}
            <button type="submit" className="btn btn-primary w-full">
              Start the subscription
            </button>
            <p className="text-xs leading-relaxed text-(--muted)">
              This turns on full access on this device for the counseling workspace. Card billing is not
              connected, so you are not charged.
            </p>
          </form>
        )}

        <p className="mt-8 text-sm text-(--muted)">
          Prefer to show the finished example first?{" "}
          <Link href="/" className="font-semibold text-(--accent) hover:underline">
            Preview the sample student
          </Link>
        </p>
      </main>
    </div>
  );
}
