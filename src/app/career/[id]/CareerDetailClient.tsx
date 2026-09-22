"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { getCareer } from "../../../data/careers";
import { useStore } from "../../../lib/store";
import { matchCareer } from "../../../lib/career-matching";
import { buildCareerRoadmap } from "../../../lib/career-roadmap";
import { collegesForCareer, careerToMajors } from "../../../lib/pathway";
import { getCollege } from "../../../data/colleges";
import { PageHeader } from "../../../components/ui";
import { InfoTip } from "../../../components/InfoTip";
import { CareerFlowNav, CareerGoalsEditor } from "../../../components/CareerGoalsEditor";

export default function CareerDetailClient() {
  const { id } = useParams<{ id: string }>();
  const career = getCareer(id);
  const { state, setState } = useStore();
  if (!career) {
    return (
      <div>
        <PageHeader title="Career not found" />
        <Link href="/career/matches" className="btn btn-primary">Back to matches</Link>
      </div>
    );
  }
  const ctx = { ...state, careerAssessment: { ...state.careerAssessment, primaryCareerId: career.id } };
  const match = matchCareer(state, career);
  const roadmap = buildCareerRoadmap(ctx);
  const majors = career.commonMajors;
  const colleges = collegesForCareer(ctx, 5);
  const saved = state.savedCareerIds.includes(career.id);

  return (
    <div>
      <CareerFlowNav />
      <CareerGoalsEditor compact />
      <PageHeader
        title={career.title}
        subtitle={`Career fit: ${match.fit}%`}
        actions={
          <button
            className="btn btn-primary"
            onClick={() => setState((p) => ({
              ...p,
              savedCareerIds: saved ? p.savedCareerIds.filter((x) => x !== career.id) : [...p.savedCareerIds, career.id],
              careerAssessment: { ...p.careerAssessment, primaryCareerId: career.id },
              career: {
                ...p.career,
                intendedCareers: [...new Set([...p.career.intendedCareers, career.title])],
                intendedMajors: [...new Set([...p.career.intendedMajors, ...majors.slice(0, 2)])],
              },
            }))}
          >
            {saved ? "Saved" : "Add to my possibilities"}
          </button>
        }
      />
      <section className="card mb-5 p-5">
        <h2 className="serif text-2xl">What is it? <InfoTip term="Career Fit" /></h2>
        <p className="mt-2 text-sm text-(--muted)">{career.description}</p>
        <dl className="mt-4 grid gap-2 text-sm md:grid-cols-2">
          <div><span className="text-(--muted)">Education: </span>{career.education}</div>
          <div><span className="text-(--muted)">Common majors: </span>{majors.join(", ")}</div>
          <div><span className="text-(--muted)">Typical employers: </span>{career.typicalEmployers.join(", ")}</div>
          <div><span className="text-(--muted)">Work environment: </span>{career.workEnvironment.join(", ")}</div>
          <div><span className="text-(--muted)">Competitiveness: </span>{career.competitiveness}</div>
        </dl>
      </section>

      <section className="card mb-5 p-5">
        <h2 className="serif text-2xl">What would your path look like?</h2>
        <p className="mt-2 text-sm text-(--muted)">High School → College → Internships → Entry-level position → Career</p>
      </section>

      {roadmap ? (
        <section className="card mb-5 p-5">
          <h2 className="serif text-2xl">Your path to {career.title}</h2>
          <p className="text-sm text-(--muted)">{roadmap.gradeLabel}</p>
          <div className="mt-3 text-3xl font-semibold">{roadmap.preparedPercent}% prepared</div>
          <p className="text-xs text-(--muted)">{roadmap.preparedExplanation}</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <div className="font-semibold">Your strengths</div>
              <ul className="list-disc pl-5 text-sm text-(--muted)">{roadmap.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
            </div>
            <div>
              <div className="font-semibold">Gaps to address</div>
              <ul className="list-disc pl-5 text-sm text-(--muted)">{roadmap.gaps.map((g) => <li key={g}>{g}</li>)}</ul>
            </div>
          </div>
          {roadmap.actions.map((a) => (
            <div key={a.phase} className="mt-4">
              <div className="font-semibold">{a.phase}</div>
              <ul className="list-disc pl-5 text-sm text-(--muted)">{a.items.map((i) => <li key={i}>{i}</li>)}</ul>
            </div>
          ))}
        </section>
      ) : null}

      <section className="card p-5">
        <h2 className="serif text-2xl">Career → Major → College</h2>
        <p className="text-sm text-(--muted)">Majors: {careerToMajors(ctx).join(", ")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {colleges.map((m) => {
            const c = getCollege(m.collegeId);
            if (!c) return null;
            return (
              <Link key={m.collegeId} href={`/colleges/${c.id}`} className="btn btn-ghost">
                {c.shortName} · {m.admissionOutlook} · {m.estimatedLikelihood ?? "—"}% est.
              </Link>
            );
          })}
        </div>
        <Link href="/path" className="btn btn-primary mt-4">View full pathway</Link>
      </section>
    </div>
  );
}
