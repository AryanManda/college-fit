"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { studentName } from "../../lib/defaults";
import { recommendedList } from "../../lib/discovery";
import { useStore } from "../../lib/store";
import { getCollege } from "../../data/colleges";
import { MatchCard } from "../../components/Cards";
import { Ring } from "../../components/ui";
import { MATCH_DISCLAIMER } from "../../lib/constants";
import { completionSlices, collegeFeedUnlock, profilePercent, recommendedActions } from "../../lib/completion";

function ProfileBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[13px]">
        <span className="font-medium text-(--ink)">{label}</span>
        <span className="tabular-nums text-(--muted)">{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-(--bg-warm)">
        <div
          className="h-full rounded-full bg-(--accent) transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { state, loadDemo, hydrated } = useStore();
  const name = studentName(state);
  const completeness = profilePercent(state);
  const slices = completionSlices(state).filter((s) => s.key !== "personal");
  const actions = recommendedActions(state).slice(0, 4);
  const unlock = collegeFeedUnlock(state);
  const rec = recommendedList(state);
  const showStartCard = completeness < 85;

  if (!hydrated) return <div className="text-(--muted)">Loading your workspace…</div>;

  return (
    <div>
      <div className="mb-8">
        <div className="min-w-0">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-(--muted)">
            Dashboard
          </div>
          <h1 className="serif text-[2.35rem] leading-[1.05] text-(--ink) md:text-[3rem]">
            {`Welcome back, ${name}`}
          </h1>
          <p className="mt-2 text-[0.98rem] text-(--muted)">Let&apos;s build your strongest college application.</p>
        </div>
      </div>

      {showStartCard ? (
        <section className="card mb-6 p-6 md:p-7">
          <h2 className="serif text-2xl text-(--ink) md:text-[1.75rem]">Start in about 15 minutes</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-(--muted)">
            Enter your academics, activities, career goals, and ideal college. Aether will generate
            matches, comparisons, and resume help from that one profile.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/profile" className="btn btn-primary">
              Complete Profile
            </Link>
            <button type="button" className="btn btn-ghost" onClick={loadDemo}>
              Explore with a demo profile
            </button>
          </div>
        </section>
      ) : null}

      <section className="mb-8 grid gap-5 lg:grid-cols-[minmax(260px,0.9fr)_1.4fr]">
        <div className="card flex flex-col p-6">
          <div className="flex flex-col items-center text-center">
            <Ring value={completeness} size={112} />
            <div className="mt-2 text-sm text-(--muted)">Profile completion</div>
            <div className="mt-1 text-sm font-semibold text-(--ink)">Profile {completeness}% Complete</div>
            <Link href="/profile" className="btn btn-primary mt-4 w-full max-w-[220px]">
              Complete Profile
            </Link>
          </div>
          <div className="mt-6 space-y-3.5 border-t border-(--line) pt-5">
            {slices.map((s) => (
              <ProfileBar key={s.key} label={s.label} value={s.value} />
            ))}
          </div>
        </div>

        <div className="card p-6 md:p-7">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
            <h2 className="serif text-3xl text-(--ink)">Recommended actions</h2>
            <Link href="/strength" className="text-sm font-semibold text-(--ink) hover:text-(--accent)">
              Overall strength
            </Link>
          </div>
          {actions.length ? (
            <div className="space-y-3">
              {actions.map((a) => (
                <Link
                  key={a.title}
                  href={a.href}
                  className="flex items-start justify-between gap-4 rounded-[var(--radius)] border border-(--line) bg-(--surface) px-4 py-3.5 transition hover:border-(--accent)/40 hover:bg-white"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-(--ink)">{a.title}</div>
                    <p className="mt-1 text-sm leading-snug text-(--muted)">{a.detail}</p>
                  </div>
                  <ArrowRight className="mt-1 shrink-0 text-(--muted)" size={18} strokeWidth={1.75} />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-(--muted)">
              Your profile looks solid.{" "}
              <Link href="/colleges" className="font-semibold text-(--accent) hover:underline">
                Browse your college feed
              </Link>{" "}
              or check{" "}
              <Link href="/strength" className="font-semibold text-(--accent) hover:underline">
                overall strength
              </Link>
              .
            </p>
          )}
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="serif text-3xl text-(--ink)">Top college matches</h2>
            <p className="mt-1 text-sm text-(--muted)">
              {unlock.level === "locked"
                ? "Complete your profile to unlock matches."
                : unlock.level === "starter"
                  ? "Generally strong fits from your preferences — add more profile details for sharper odds."
                  : "Strong admissions alignment first — not prestige rankings."}
            </p>
          </div>
          {unlock.level === "locked" ? (
            <Link href="/profile" className="btn btn-primary">
              Complete profile
            </Link>
          ) : (
            <Link href="/colleges" className="text-sm font-semibold text-(--accent) hover:underline">
              See college feed →
            </Link>
          )}
        </div>
        {unlock.level === "locked" ? (
          <div className="card p-6 text-sm text-(--muted)">
            <p className="font-semibold text-(--ink)">{unlock.title}</p>
            <p className="mt-2">{unlock.message}</p>
            <Link href="/profile" className="btn btn-primary mt-4">
              Complete profile
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {rec.achievable.slice(0, unlock.level === "starter" ? 4 : 4).map((m) => {
                const college = getCollege(m.collegeId);
                if (!college) return null;
                return <MatchCard key={m.collegeId} college={college} match={m} />;
              })}
            </div>
            {!rec.achievable.length ? (
              <p className="mt-3 text-sm text-(--muted)">
                Add location and academics to unlock preference-based matches, or load a demo profile.
              </p>
            ) : null}
          </>
        )}
        <p className="mt-5 text-xs leading-relaxed text-(--muted)">{MATCH_DISCLAIMER}</p>
      </section>
    </div>
  );
}
