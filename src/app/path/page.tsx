"use client";

import Link from "next/link";
import { getCollege } from "../../data/colleges";
import { CAREERS, getCareer } from "../../data/careers";
import { useStore } from "../../lib/store";
import { PageHeader } from "../../components/ui";
import { buildCareerRoadmap } from "../../lib/career-roadmap";
import { collegesForCareer } from "../../lib/pathway";
import { recommendedList } from "../../lib/discovery";
import { profilePercent, recommendedActions } from "../../lib/completion";
import { hasCareerGoal } from "../../lib/career-matching";
import { applyKnownCareer } from "../../lib/career-goal";
import { LIKELIHOOD_DISCLAIMER } from "../../lib/admission-likelihood";
import { MATCH_DISCLAIMER, US_STATES } from "../../lib/constants";
import { CareerFlowNav } from "../../components/CareerGoalsEditor";
import { ProfilePromptBanner } from "../../components/ProfilePromptBanner";
import { KnowYourPathCard, NotSureYetCard } from "../../components/KnowYourPath";
import { syncResidencePatch } from "../../lib/location-prefs";

export default function PathPage() {
  const { state, setState } = useStore();
  const roadmap = buildCareerRoadmap(state);
  const rec = recommendedList(state);
  const completeness = profilePercent(state);
  const actions = recommendedActions(state);
  const hasGoal = hasCareerGoal(state);
  const primary = getCareer(state.careerAssessment.primaryCareerId);
  const home = state.student.state;
  const inState = rec.all.filter((m) => m.inStateForStudent).slice(0, 6);
  const collegeMatches = collegesForCareer(state, 3);

  const setCareer = (careerId: string) => {
    setState((p) => applyKnownCareer(p, { careerId }));
  };

  const majorChoices = [
    ...new Set([
      ...(primary?.commonMajors ?? []),
      ...state.career.intendedMajors,
      "Computer Science",
      "Engineering",
      "Business",
      "Finance",
      "Biology",
      "Economics",
      "Psychology",
      "Nursing",
      "Political Science",
    ]),
  ];

  return (
    <div>
      <PageHeader
        title="My path"
        subtitle="Know your career? Enter it here. Unsure? Take the assessment — either way, colleges follow your goal."
      />
      <CareerFlowNav />
      <ProfilePromptBanner />

      {!hasGoal ? (
        <>
          <KnowYourPathCard />
          <NotSureYetCard />
        </>
      ) : (
        <KnowYourPathCard title="Change your career or major anytime" />
      )}

      <section className="card mb-5 p-5">
        <h2 className="serif text-3xl">Career → Major → College → Action plan</h2>
        <p className="mt-1 text-sm text-(--muted)">Quick switches — or use the form above to type any career name.</p>
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
          <label className="block cursor-pointer rounded-xl border border-(--line) p-3 hover:border-(--accent)">
            <div className="text-(--muted)">Career</div>
            <select
              className="mt-1 w-full appearance-none border-0 bg-transparent p-0 text-base font-semibold text-(--ink) outline-none"
              value={state.careerAssessment.primaryCareerId || ""}
              onChange={(e) => setCareer(e.target.value)}
            >
              <option value="">Choose a career…</option>
              {CAREERS.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </label>

          <label className="block cursor-pointer rounded-xl border border-(--line) p-3 hover:border-(--accent)">
            <div className="text-(--muted)">Major</div>
            <select
              className="mt-1 w-full appearance-none border-0 bg-transparent p-0 text-base font-semibold text-(--ink) outline-none"
              value={state.career.intendedMajors[0] || ""}
              onChange={(e) => {
                const major = e.target.value;
                if (!major) return;
                setState((p) => ({
                  ...p,
                  career: {
                    ...p.career,
                    intendedMajors: [major, ...p.career.intendedMajors.filter((m) => m !== major)].slice(0, 3),
                  },
                }));
              }}
            >
              <option value="">Choose a major…</option>
              {majorChoices.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            {state.career.intendedMajors.length > 1 ? (
              <div className="mt-1 text-xs text-(--muted)">Also: {state.career.intendedMajors.slice(1).join(", ")}</div>
            ) : null}
          </label>

          <div className="rounded-xl border border-(--line) p-3">
            <div className="text-(--muted)">Recommended colleges</div>
            <div className="mt-1 font-semibold">
              {collegeMatches.length
                ? collegeMatches.map((m) => getCollege(m.collegeId)?.shortName).filter(Boolean).join(", ")
                : "Pick career & major"}
            </div>
          </div>

          <div className="rounded-xl border border-(--line) p-3">
            <div className="text-(--muted)">Profile completeness</div>
            <div className="mt-1 font-semibold">{completeness}%</div>
          </div>
        </div>
      </section>

      <section className="card mb-5 grid gap-4 p-5 md:grid-cols-3">
        <h2 className="serif text-3xl md:col-span-3">Location & school priority</h2>
        <label className="block text-sm">
          <span className="label">Home state</span>
          <select
            className="field"
            value={state.student.state}
            onChange={(e) => setState((p) => syncResidencePatch(p, { state: e.target.value }))}
          >
            <option value="">Select</option>
            {US_STATES.map((st) => <option key={st} value={st}>{st}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          <span className="label">City</span>
          <input
            className="field"
            value={state.student.city}
            onChange={(e) => setState((p) => syncResidencePatch(p, { city: e.target.value }))}
            placeholder="Optional"
          />
        </label>
        <div className="text-sm text-(--muted)">
          {home
            ? <>Showing <strong>{home}</strong> schools first in matches.</>
            : "Set your state to prioritize in-state public universities."}
        </div>
        {home && inState.length ? (
          <div className="md:col-span-3">
            <div className="font-semibold">{home} schools near the top of your list</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {inState.map((m) => {
                const c = getCollege(m.collegeId);
                return c ? (
                  <Link key={c.id} href={`/colleges/${c.id}`} className="btn btn-ghost">
                    {c.shortName} · {m.category}
                  </Link>
                ) : null;
              })}
            </div>
          </div>
        ) : null}
      </section>

      {!hasGoal ? null : !state.careerAssessment.completed ? (
        <div className="mb-5 text-sm text-(--muted)">
          Optional: <Link href="/career/assessment" className="font-semibold text-(--accent)">take the assessment</Link> if you want alternate career ideas — not required for college matching.
        </div>
      ) : null}

      {roadmap ? (
        <section className="card mb-5 p-5">
          <h2 className="serif text-3xl">Career roadmap: {roadmap.careerTitle}</h2>
          <p className="text-sm text-(--muted)">{roadmap.gradeLabel} · {roadmap.preparedPercent}% prepared (explained estimate)</p>
          <p className="mt-1 text-xs text-(--muted)">{roadmap.preparedExplanation}</p>
          {roadmap.actions.map((a) => (
            <div key={a.phase} className="mt-4">
              <div className="font-semibold">{a.phase}</div>
              <ul className="list-disc pl-5 text-sm text-(--muted)">{a.items.map((i) => <li key={i}>{i}</li>)}</ul>
            </div>
          ))}
        </section>
      ) : null}

      <section className="card mb-5 p-5">
        <h2 className="serif text-3xl">College roadmap</h2>
        <p className="text-sm text-(--muted)">{rec.achievable.length} realistic schools found (Likely / Target focus)</p>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {rec.likely.slice(0, 1).map((m) => {
            const c = getCollege(m.collegeId);
            return c ? <Link key={m.collegeId} href={`/colleges/${c.id}`} className="rounded-xl border border-(--line) p-3 hover:bg-(--bg-warm)"><div className="text-(--muted)">Likely</div><div className="font-semibold">{c.shortName}</div></Link> : null;
          })}
          {rec.target.slice(0, 1).map((m) => {
            const c = getCollege(m.collegeId);
            return c ? <Link key={m.collegeId} href={`/colleges/${c.id}`} className="rounded-xl border border-(--line) p-3 hover:bg-(--bg-warm)"><div className="text-(--muted)">Target</div><div className="font-semibold">{c.shortName}</div></Link> : null;
          })}
          {rec.reach.slice(0, 1).map((m) => {
            const c = getCollege(m.collegeId);
            return c ? <Link key={m.collegeId} href={`/colleges/${c.id}`} className="rounded-xl border border-(--line) p-3 hover:bg-(--bg-warm)"><div className="text-(--muted)">Stretch reach</div><div className="font-semibold">{c.shortName}</div></Link> : null;
          })}
        </div>
        <Link href="/colleges/matches" className="btn btn-primary mt-4">View all realistic schools</Link>
      </section>

      <section className="card p-5">
        <h2 className="serif text-3xl">Progress & next actions</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-(--muted)">
          {actions.slice(0, 6).map((a) => (
            <li key={a.title}><Link href={a.href} className="font-semibold text-(--ink)">{a.title}</Link> — {a.detail}</li>
          ))}
        </ul>
      </section>
      <p className="mt-4 text-xs text-(--muted)">{LIKELIHOOD_DISCLAIMER} {MATCH_DISCLAIMER}</p>
    </div>
  );
}
