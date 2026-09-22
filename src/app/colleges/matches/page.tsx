"use client";

import Link from "next/link";
import { getCollege } from "../../../data/colleges";
import { useStore } from "../../../lib/store";
import { realisticBuckets } from "../../../lib/pathway";
import { PageHeader } from "../../../components/ui";
import { CollegesTopTabs } from "../../../components/CollegesTopTabs";
import { InfoTip } from "../../../components/InfoTip";
import { LIKELIHOOD_DISCLAIMER } from "../../../lib/admission-likelihood";
import { hasCareerGoal } from "../../../lib/career-matching";

export default function RealisticSchoolsPage() {
  const { state } = useStore();
  const buckets = realisticBuckets(state);
  const hasGoal = hasCareerGoal(state);

  return (
    <div>
      <PageHeader
        title="My realistic schools"
        subtitle="Schools you have a realistic path toward getting into — ranked by fit and conservative admission outlook."
      />
      <CollegesTopTabs />
      {!hasGoal ? (
        <div className="card mb-5 p-5">
          <p className="text-sm text-(--muted)">Set a career goal for more focused college recommendations — enter one you already want, or take the assessment if you&apos;re unsure.</p>
          <Link href="/career" className="btn btn-primary mt-3">Set career goal</Link>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {buckets.map((b) => {
          const c = b.match ? getCollege(b.match.collegeId) : null;
          if (!c || !b.match) return null;
          return (
            <article key={b.key} className="card p-5">
              <div className="text-sm text-(--muted)">{b.title}</div>
              <Link href={`/colleges/${c.id}`} className="serif text-2xl hover:underline">{c.name}</Link>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="chip">{b.match.admissionOutlook} <InfoTip term="Admission Outlook" /></span>
                {b.match.estimatedLikelihood != null ? (
                  <span className="chip">{b.match.estimatedLikelihood}% est. <InfoTip term="Estimated Likelihood" /></span>
                ) : null}
                <span className="chip">Fit {b.match.overall}/100</span>
              </div>
              <ul className="mt-3 list-disc pl-5 text-sm text-(--muted)">
                {b.match.why.slice(0, 3).map((w) => <li key={w}>{w}</li>)}
              </ul>
              <Link href={`/colleges/${c.id}`} className="btn btn-primary mt-4">View school</Link>
            </article>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-(--muted)">{LIKELIHOOD_DISCLAIMER}</p>
    </div>
  );
}
