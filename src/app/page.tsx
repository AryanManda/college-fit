"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { studentName } from "../lib/defaults";
import { recommendedList } from "../lib/discovery";
import { useStore } from "../lib/store";
import { getCollege } from "../data/colleges";
import { MatchCard } from "../components/Cards";
import { PageHeader } from "../components/ui";
import { ProfilePromptBanner } from "../components/ProfilePromptBanner";
import { profilePercent, recommendedActions } from "../lib/completion";
import { hasCareerGoal, topCareers } from "../lib/career-matching";
import { careerGoalLabel } from "../lib/career-goal";
import { realisticBuckets } from "../lib/pathway";
import { getCareer } from "../data/careers";

export default function DashboardPage() {
  const { state, loadDemo, hydrated } = useStore();
  const router = useRouter();
  const name = studentName(state);
  const rec = recommendedList(state);
  const careers = topCareers(state, 3);
  const buckets = realisticBuckets(state);
  const completeness = profilePercent(state);
  const actions = recommendedActions(state);
  const hasGoal = hasCareerGoal(state);
  const primaryCareer = getCareer(state.careerAssessment.primaryCareerId);
  const goalLabel = careerGoalLabel(state);

  useEffect(() => {
    if (hydrated && !state.onboardingComplete && !state.student.firstName) {
      router.push("/onboarding");
    }
  }, [hydrated, state.onboardingComplete, state.student.firstName, router]);

  if (!hydrated) return <div className="text-(--muted)">Loading your workspace…</div>;

  return (
    <div>
      <PageHeader
        eyebrow="Home"
        title={`Welcome back, ${name}`}
        subtitle="Browse colleges, save schools you like, and build your path — realistic matches first."
        actions={
          <div className="flex gap-2">
            {!state.student.firstName ? (
              <button type="button" className="btn btn-ghost" onClick={loadDemo}>Load sample student</button>
            ) : null}
            <Link href="/colleges" className="btn btn-primary">Colleges feed</Link>
          </div>
        }
      />
      <ProfilePromptBanner />

      {!hasGoal ? (
        <section className="mb-8 grid gap-4 md:grid-cols-2">
          <div className="border-l-2 border-(--accent) bg-(--accent-soft)/50 py-4 pl-5 pr-4">
            <h2 className="font-semibold text-(--ink)">I already know my career</h2>
            <p className="mt-1 text-sm text-(--muted)">Skip the quiz — type your goal on Career or My Path.</p>
            <Link href="/career" className="btn btn-primary mt-3">Enter my career</Link>
          </div>
          <div className="border border-(--line) bg-white/70 py-4 pl-5 pr-4">
            <h2 className="font-semibold text-(--ink)">I&apos;m not sure yet</h2>
            <p className="mt-1 text-sm text-(--muted)">Take a short assessment and get ranked career ideas.</p>
            <Link href="/career/assessment" className="btn btn-ghost mt-3">Start assessment</Link>
          </div>
        </section>
      ) : null}

      <section className="mb-10 grid gap-8 md:grid-cols-[1.1fr_1.6fr]">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-(--muted)">Career goal</div>
          <div className="serif mt-2 text-3xl leading-tight">{goalLabel || primaryCareer?.title || "Set your career"}</div>
          <div className="mt-2 text-sm text-(--muted)">Profile {completeness}% complete</div>
          <Link href={hasGoal ? "/path" : "/career"} className="mt-4 inline-block text-sm font-semibold text-(--accent) hover:underline">
            {hasGoal ? "Edit on My Path →" : "Set career goal →"}
          </Link>
        </div>
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-(--muted)">
              {state.careerAssessment.completed ? "Top career matches" : "Next steps"}
            </h2>
            {state.careerAssessment.completed ? (
              <Link href="/career/matches" className="text-sm font-semibold text-(--accent) hover:underline">See all</Link>
            ) : null}
          </div>
          {state.careerAssessment.completed && careers.length ? (
            <div className="divide-y divide-(--line) border-y border-(--line)">
              {careers.map(({ career, match }, i) => (
                <Link key={career.id} href={`/career/${career.id}`} className="flex items-center justify-between gap-3 py-3 transition hover:bg-white/50">
                  <span className="text-sm"><span className="text-(--muted)">{i + 1}.</span> {career.title}</span>
                  <span className="font-semibold tabular-nums text-(--accent)">{match.fit}%</span>
                </Link>
              ))}
            </div>
          ) : hasGoal ? (
            <p className="text-sm text-(--muted)">
              Goal locked in. <Link href="/colleges/matches" className="font-semibold text-(--accent)">See colleges</Link> that fit this path, or optionally take the assessment for more ideas.
            </p>
          ) : (
            <p className="text-sm text-(--muted)">Enter a career you already want, or start the assessment if you&apos;re unsure.</p>
          )}
        </div>
      </section>

      <section className="mb-10">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="serif text-3xl">College matches</h2>
            <p className="mt-1 text-sm text-(--muted)">{rec.achievable.length} realistic schools in your Likely / Target range</p>
          </div>
          <Link href="/colleges/matches" className="text-sm font-semibold text-(--accent) hover:underline">View all →</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {buckets.slice(0, 3).map((b) => {
            const c = b.match ? getCollege(b.match.collegeId) : null;
            if (!c || !b.match) return null;
            return (
              <Link key={b.key} href={`/colleges/${c.id}`} className="border border-(--line) bg-(--surface)/80 p-4 transition hover:border-(--accent) hover:bg-white">
                <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-(--muted)">{b.title}</div>
                <div className="mt-2 font-semibold">{c.shortName}</div>
                <div className="mt-1 text-sm text-(--muted)">{b.match.admissionOutlook}{b.match.estimatedLikelihood != null ? ` · ${b.match.estimatedLikelihood}% est.` : ""}</div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mb-10 grid gap-6 border-t border-(--line) pt-6 md:grid-cols-2">
        <div>
          <h2 className="serif text-3xl">Progress</h2>
          <div className="mt-3 grid gap-2 text-sm">
            <div className="flex justify-between border-b border-(--line) py-2"><span className="text-(--muted)">GPA</span><span className="font-semibold">{state.academic.unweightedGpa || "Add in profile"}</span></div>
            <div className="flex justify-between border-b border-(--line) py-2"><span className="text-(--muted)">SAT</span><span className="font-semibold">{state.testing.sat?.total || "Add in profile"}</span></div>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-(--muted)">Next actions</h2>
          <ul className="mt-3 space-y-2">
            {actions.map((a) => (
              <li key={a.title}>
                <Link href={a.href} className="text-sm font-semibold text-(--ink) underline-offset-2 hover:text-(--accent) hover:underline">{a.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="serif mb-1 text-3xl">Schools you can actually get into</h2>
        <p className="mb-5 text-sm text-(--muted)">Strong admissions alignment first. Prestige is not the ranking.</p>
        <div className="grid gap-4 md:grid-cols-2">
          {rec.achievable.slice(0, 4).map((m) => {
            const college = getCollege(m.collegeId);
            if (!college) return null;
            return <MatchCard key={m.collegeId} college={college} match={m} />;
          })}
        </div>
      </section>
    </div>
  );
}
