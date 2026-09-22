"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "../../../lib/store";
import { PageHeader } from "../../../components/ui";
import { matchAllCareers } from "../../../lib/career-matching";
import { NOT_INTERESTED_REASONS } from "../../../lib/career-assessment-data";
import { InfoTip } from "../../../components/InfoTip";
import { getCareer } from "../../../data/careers";
import { CareerFlowNav, CareerGoalsEditor } from "../../../components/CareerGoalsEditor";

export default function CareerMatchesPage() {
  const { state, setState } = useStore();
  const matches = matchAllCareers(state);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!savedMessage) return;
    const timer = window.setTimeout(() => setSavedMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [savedMessage]);

  const setFeedback = (id: string, status: "interested" | "not" | "more", reason?: string) => {
    const career = getCareer(id);
    setState((p) => {
      const intendedCareers =
        status === "interested" && career && !p.career.intendedCareers.includes(career.title)
          ? [...p.career.intendedCareers, career.title]
          : p.career.intendedCareers;

      return {
        ...p,
        career: { ...p.career, intendedCareers },
        careerAssessment: {
          ...p.careerAssessment,
          feedback: { ...p.careerAssessment.feedback, [id]: { status, reason } },
          primaryCareerId: status === "interested" ? id : p.careerAssessment.primaryCareerId,
        },
        savedCareerIds:
          status === "interested" && !p.savedCareerIds.includes(id)
            ? [...p.savedCareerIds, id]
            : p.savedCareerIds,
      };
    });
    setRejectId(null);
    if (status === "interested" && career) {
      setSavedMessage(`${career.title} saved to your pathway.`);
    } else if (status === "not" && career) {
      setSavedMessage(`We'll show fewer careers like ${career.shortTitle}.`);
    }
  };

  return (
    <div>
      <PageHeader title="Careers that may fit you" subtitle="We explain why each career was selected. Your feedback improves future suggestions." />
      <CareerFlowNav />
      <CareerGoalsEditor compact />
      {savedMessage ? (
        <div className="card mb-4 border-(--accent) bg-(--accent-soft) p-4 text-sm">
          <span className="font-semibold text-(--ink)">{savedMessage}</span>{" "}
          <Link href="/career/saved" className="font-semibold text-(--accent)">View saved careers →</Link>
        </div>
      ) : null}
      <div className="grid gap-4">
        {matches.slice(0, 10).map(({ career, match }, i) => {
          const feedback = state.careerAssessment.feedback[career.id];
          const interested = feedback?.status === "interested";
          const isPrimary = state.careerAssessment.primaryCareerId === career.id;

          return (
          <article
            key={career.id}
            className={`card p-5 transition ${interested ? "border-(--accent) bg-(--accent-soft)/30" : ""}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm text-(--muted)">#{i + 1}</div>
                <Link href={`/career/${career.id}`} className="serif text-2xl hover:underline">{career.title}</Link>
                <div className="mt-1 font-semibold text-(--accent)">Match: {match.fit}%</div>
                {interested ? (
                  <div className="mt-2 text-sm font-semibold text-(--accent)">
                    {isPrimary ? "✓ Saved — your primary career goal" : "✓ Saved to your pathway"}
                  </div>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {interested ? (
                  <Link href={`/career/${career.id}`} className="btn btn-primary">View career</Link>
                ) : (
                  <button className="btn btn-primary" onClick={() => setFeedback(career.id, "interested")}>I'm interested</button>
                )}
                <Link href={`/career/${career.id}`} className="btn btn-ghost">Tell me more</Link>
                {!interested ? (
                  <button className="btn btn-ghost" onClick={() => setRejectId(career.id)}>Not for me</button>
                ) : null}
              </div>
            </div>            <div className="mt-3">
              <div className="text-sm font-semibold">Why it matches</div>
              <ul className="mt-1 list-disc pl-5 text-sm text-(--muted)">
                {match.why.map((w) => <li key={w}>{w}</li>)}
              </ul>
            </div>
            <dl className="mt-3 grid gap-2 text-sm md:grid-cols-3">
              <div><span className="text-(--muted)">Typical education: </span>{career.education} <InfoTip term="Bachelor's Degree" /></div>
              <div><span className="text-(--muted)">Typical salary: </span>{career.salaryRange} <InfoTip term="Typical Salary" /></div>
              <div><span className="text-(--muted)">Job growth: </span>{career.jobGrowth} <InfoTip term="Job Growth" /></div>
            </dl>
            {rejectId === career.id ? (
              <div className="mt-3 rounded-xl border border-(--line) p-3">
                <div className="text-sm font-semibold">What didn't appeal to you?</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {NOT_INTERESTED_REASONS.map((r) => (
                    <button key={r} className="btn btn-ghost" onClick={() => setFeedback(career.id, "not", r)}>{r}</button>
                  ))}
                </div>
              </div>
            ) : null}
          </article>
          );
        })}      </div>
    </div>
  );
}
