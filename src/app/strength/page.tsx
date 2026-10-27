"use client";

import Link from "next/link";
import { overallStrength, type StrengthAdvice } from "../../lib/strength";
import { useStore } from "../../lib/store";
import { PageHeader, Ring, ScoreBar } from "../../components/ui";
import { MATCH_DISCLAIMER } from "../../lib/constants";

export default function StrengthPage() {
  const { state } = useStore();
  const result = overallStrength(state);
  const { goals, advice, categories, overall } = result;

  const statusColor =
    goals.status === "on-track"
      ? "text-(--accent)"
      : goals.status === "close"
        ? "text-(--accent-2)"
        : goals.status === "needs-work"
          ? "text-(--danger)"
          : "text-(--muted)";

  return (
    <div>
      <PageHeader
        title="Overall Strength"
        subtitle="Where your current stats stand against your career and college goals — and what to improve next."
      />

      <div className="card mb-6 flex flex-wrap items-center gap-6 p-5">
        <Ring value={overall} size={110} />
        <div className="min-w-0 flex-1">
          <div className="text-sm text-(--muted)">Overall strength vs your goals</div>
          <div className="serif text-4xl">{overall}/100</div>
          <p className={`mt-2 text-sm font-semibold ${statusColor}`}>{goals.statusLabel}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/path" className="btn btn-ghost">
              Edit goals
            </Link>
            <Link href="/profile" className="btn btn-primary">
              Improve profile
            </Link>
          </div>
        </div>
      </div>

      <section className="mb-6 grid gap-4 md:grid-cols-2">
        <article className="card p-5">
          <h2 className="serif text-2xl">Your goals</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-(--muted)">Career</dt>
              <dd className="font-semibold text-(--ink)">
                {goals.career || (
                  <Link href="/path" className="text-(--accent) hover:underline">
                    Set a career on My Path
                  </Link>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-(--muted)">Majors</dt>
              <dd className="font-semibold text-(--ink)">
                {goals.majors.length ? goals.majors.join(" · ") : "None set yet"}
              </dd>
            </div>
            <div>
              <dt className="text-(--muted)">List balance</dt>
              <dd className="font-semibold text-(--ink)">
                {goals.listBalance.likely} Likely · {goals.listBalance.target} Target ·{" "}
                {goals.listBalance.reach} Reach
              </dd>
            </div>
          </dl>
          {goals.targetSchools.length ? (
            <ul className="mt-4 space-y-2 border-t border-(--line) pt-4">
              {goals.targetSchools.slice(0, 5).map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2 text-sm">
                  <Link href={`/colleges/${s.id}`} className="font-semibold text-(--ink) hover:text-(--accent)">
                    {s.name}
                  </Link>
                  <span className="shrink-0 text-(--muted)">
                    {s.category} · bar {s.bar}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-(--muted)">
              Save colleges or set a career so we can compare you to specific campuses.{" "}
              <Link href="/colleges" className="font-semibold text-(--accent) hover:underline">
                Browse colleges
              </Link>
            </p>
          )}
        </article>

        <article className="card p-5">
          <h2 className="serif text-2xl">Where you stand</h2>
          <div className="mt-4 space-y-4">
            <ScoreBar label="Academics vs goal schools" value={goals.academicProgress} />
            <div className="flex justify-between text-xs text-(--muted)">
              <span>You {goals.academicYou}/100</span>
              <span>Goal bar ~{goals.academicGoal}/100</span>
            </div>
            <ScoreBar label="Career readiness" value={goals.careerReady} />
            <p className="text-sm text-(--muted)">
              Academic progress compares your GPA, tests, and rigor to the selectivity of schools tied to your
              goals. Career readiness checks majors, related experience, and resume alignment.
            </p>
          </div>
        </article>
      </section>

      <section className="mb-6">
        <h2 className="serif mb-3 text-3xl">What to improve</h2>
        <p className="mb-4 max-w-3xl text-sm text-(--muted)">
          Highest-leverage steps to close the gap between your current profile and the goals above. Closing a
          gap improves your comparison — it does not guarantee admission.
        </p>
        {advice.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {advice.map((a) => (
              <AdviceCard key={a.title} tip={a} />
            ))}
          </div>
        ) : (
          <div className="card p-5 text-sm text-(--muted)">
            You’re in solid shape relative to your current goals. Keep refining activities and resume bullets.
          </div>
        )}
      </section>

      <h2 className="serif mb-3 text-3xl">Profile breakdown</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {categories.map((c) => (
          <article key={c.key} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold">{c.label}</h3>
              <div className="text-xl font-semibold tabular-nums">{c.score}/100</div>
            </div>
            <div className="mt-3">
              <ScoreBar label="" value={c.score} />
            </div>
            <p className="mt-3 text-sm text-(--muted)">{c.explanation}</p>
          </article>
        ))}
      </div>

      <p className="mt-4 text-xs text-(--muted)">{MATCH_DISCLAIMER}</p>
    </div>
  );
}

function AdviceCard({ tip }: { tip: StrengthAdvice }) {
  const tone =
    tip.priority === "critical"
      ? "border-(--danger) bg-[color-mix(in_srgb,var(--danger)_6%,white)]"
      : tip.priority === "high"
        ? "border-(--accent-2)/40 bg-(--surface)"
        : "border-(--line) bg-(--surface)";
  return (
    <div className={`rounded-[var(--radius)] border p-4 ${tone}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`text-[10px] font-bold uppercase tracking-wider ${
            tip.priority === "critical"
              ? "text-(--danger)"
              : tip.priority === "high"
                ? "text-(--accent-2)"
                : "text-(--muted)"
          }`}
        >
          {tip.priority}
        </span>
        {tip.metric ? (
          <span className="text-xs text-(--muted)">
            Now {tip.metric.current} → aim {tip.metric.target}
          </span>
        ) : null}
      </div>
      <div className="mt-1 text-lg font-semibold leading-snug">{tip.title}</div>
      <p className="mt-2 text-sm text-(--ink)/85">{tip.detail}</p>
      <Link href={tip.href} className="btn btn-primary mt-3">
        {tip.cta}
      </Link>
    </div>
  );
}
