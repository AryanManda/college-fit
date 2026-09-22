"use client";

import { useState } from "react";
import Link from "next/link";
import { CAREERS } from "../data/careers";
import { applyKnownCareer, careerGoalLabel, hasCareerGoal } from "../lib/career-goal";
import { useStore } from "../lib/store";

const MAJOR_SUGGESTIONS = [
  "Computer Science",
  "Engineering",
  "Business",
  "Finance",
  "Economics",
  "Biology",
  "Nursing",
  "Psychology",
  "Political Science",
  "Mathematics",
  "Communications",
  "Accounting",
];

/** Primary entry for students who already know their direction. */
export function KnowYourPathCard({
  title = "I already know what I want to do",
  afterSaveHref,
}: {
  title?: string;
  afterSaveHref?: string;
}) {
  const { state, setState } = useStore();
  const existing = careerGoalLabel(state);
  const [careerText, setCareerText] = useState(existing);
  const [majorText, setMajorText] = useState(state.career.intendedMajors[0] || "");
  const [saved, setSaved] = useState(false);
  const hasGoal = hasCareerGoal(state);

  const save = () => {
    const titleTrim = careerText.trim();
    const majorTrim = majorText.trim();
    if (!titleTrim && !majorTrim) return;
    setState((p) =>
      applyKnownCareer(p, {
        careerTitle: titleTrim || undefined,
        majors: majorTrim ? [majorTrim, ...p.career.intendedMajors.filter((m) => m !== majorTrim)].slice(0, 3) : undefined,
      }),
    );
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  return (
    <section className="mb-6 border-2 border-(--accent) bg-[color-mix(in_srgb,var(--accent)_7%,white)] p-5">
      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-(--accent)">Know your path</div>
      <h2 className="serif mt-1 text-3xl leading-tight">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm text-(--muted)">
        Skip the assessment. Type your career and major — we&apos;ll build college recommendations and your roadmap from that.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="block text-sm">
          <span className="label">Career / what you want to be</span>
          <input
            className="field"
            list="career-catalog"
            value={careerText}
            onChange={(e) => setCareerText(e.target.value)}
            placeholder="e.g. Software Engineer, Nurse, Lawyer…"
          />
          <datalist id="career-catalog">
            {CAREERS.map((c) => (
              <option key={c.id} value={c.title} />
            ))}
          </datalist>
        </label>
        <label className="block text-sm">
          <span className="label">Intended major (optional)</span>
          <input
            className="field"
            list="major-catalog"
            value={majorText}
            onChange={(e) => setMajorText(e.target.value)}
            placeholder="e.g. Computer Science"
          />
          <datalist id="major-catalog">
            {MAJOR_SUGGESTIONS.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-primary" onClick={save}>
          {hasGoal ? "Update my path" : "Save & continue"}
        </button>
        {afterSaveHref ? (
          <Link href={afterSaveHref} className="btn btn-ghost">
            Go to My Path →
          </Link>
        ) : null}
        {saved ? <span className="text-sm font-semibold text-(--score-high)">Saved — roadmap updated.</span> : null}
      </div>
      {hasGoal ? (
        <p className="mt-3 text-sm">
          Current goal: <strong>{careerGoalLabel(state) || state.career.intendedMajors[0]}</strong>
          {state.career.intendedMajors[0] ? <> · {state.career.intendedMajors.slice(0, 2).join(", ")}</> : null}
        </p>
      ) : null}
    </section>
  );
}

export function NotSureYetCard() {
  return (
    <section className="mb-8 border border-(--line) bg-white/70 p-5">
      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-(--muted)">Not sure yet</div>
      <h2 className="serif mt-1 text-2xl leading-tight">I don&apos;t know what I want to do</h2>
      <p className="mt-2 max-w-2xl text-sm text-(--muted)">
        Take a short assessment about interests, work style, and values. We&apos;ll suggest careers — then you can lock one in and move to colleges.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/career/assessment" className="btn btn-primary">Start career assessment</Link>
        <Link href="/career/matches" className="btn btn-ghost">Browse career ideas</Link>
      </div>
    </section>
  );
}
