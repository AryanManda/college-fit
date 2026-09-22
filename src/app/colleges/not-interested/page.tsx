"use client";

import Link from "next/link";
import { useStore } from "../../../lib/store";
import { getCollege, logoUrl } from "../../../data/colleges";
import { restoreBanishedCollege, schoolDescription } from "../../../lib/college-feed";
import { CollegesTopTabs } from "../../../components/CollegesTopTabs";
import { PageHeader } from "../../../components/ui";

export default function NotInterestedPage() {
  const { state, setState } = useStore();
  const schools = (state.banishedCollegeIds ?? []).map((id) => getCollege(id)).filter(Boolean);

  return (
    <div>
      <PageHeader
        title="Not interested"
        subtitle="Schools you opted out of. They're hidden from recommendations — bring any back anytime."
      />
      <CollegesTopTabs />
      {!schools.length ? (
        <div className="card p-5 text-sm text-(--muted)">
          You haven&apos;t opted out of any schools yet. On{" "}
          <Link href="/colleges" className="font-semibold text-(--accent) hover:underline">
            For You
          </Link>
          , tap Not Interested to hide a school.
        </div>
      ) : (
        <div className="grid gap-4">
          {schools.map((college) =>
            college ? (
              <article key={college.id} className="card flex flex-wrap items-start gap-4 p-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl(college)} alt="" className="h-10 w-10 rounded-[var(--radius-sm)] border border-(--line) bg-white object-contain p-1" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{college.name}</div>
                  <p className="mt-1 text-sm text-(--muted)">{schoolDescription(college)}</p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setState((s) => restoreBanishedCollege(s, college.id))}
                >
                  Bring back
                </button>
              </article>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}
