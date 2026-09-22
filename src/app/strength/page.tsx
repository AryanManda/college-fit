"use client";

import Link from "next/link";
import { applicationStrength } from "../../lib/strength";
import { useStore } from "../../lib/store";
import { PageHeader, Ring, ScoreBar } from "../../components/ui";
import { MATCH_DISCLAIMER } from "../../lib/constants";

export default function StrengthPage() {
  const { state } = useStore();
  const result = applicationStrength(state);

  return (
    <div>
      <PageHeader
        title="Application Strength"
        subtitle="A profile-wide read of academics, activities, and fit — not a prediction of admission."
      />
      <div className="card mb-6 flex flex-wrap items-center gap-6 p-5">
        <Ring value={result.overall} size={110} />
        <div>
          <div className="text-sm text-(--muted)">Overall application strength</div>
          <div className="serif text-4xl">{result.overall}/100</div>
          <Link href="/profile" className="btn btn-primary mt-3">Improve profile</Link>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {result.categories.map((c) => (
          <article key={c.key} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold">{c.label}</h2>
              <div className="text-xl font-semibold">{c.score}/100</div>
            </div>
            <div className="mt-3"><ScoreBar label="" value={c.score} /></div>
            <p className="mt-3 text-sm text-(--muted)">{c.explanation}</p>
          </article>
        ))}
      </div>
      <section className="card mt-6 p-5">
        <h2 className="serif text-3xl">Personalized recommendations</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-(--muted)">
          {result.recommendations.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>
      <p className="mt-4 text-xs text-(--muted)">{MATCH_DISCLAIMER}</p>
    </div>
  );
}
