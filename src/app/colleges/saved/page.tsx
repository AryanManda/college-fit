"use client";

import Link from "next/link";
import { useStore } from "../../../lib/store";
import { getCollege, logoUrl } from "../../../data/colleges";
import { schoolDescription } from "../../../lib/college-feed";
import { CollegesTopTabs } from "../../../components/CollegesTopTabs";
import { PageHeader } from "../../../components/ui";

export default function CollegesSavedPage() {
  const { state, setState } = useStore();
  const schools = state.savedCollegeIds.map((id) => getCollege(id)).filter(Boolean);

  return (
    <div>
      <PageHeader
        title="Saved schools"
        subtitle="Schools you liked. We use these to recommend more schools with similar size, location, and programs."
      />
      <CollegesTopTabs />
      {!schools.length ? (
        <div className="card p-5 text-sm text-(--muted)">
          No saved schools yet.{" "}
          <Link href="/colleges" className="font-semibold text-(--accent) hover:underline">
            Open For You
          </Link>{" "}
          and tap Save &amp; Like.
        </div>
      ) : (
        <div className="grid gap-4">
          {schools.map((college) =>
            college ? (
              <article key={college.id} className="card flex flex-wrap items-start gap-4 p-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl(college)} alt="" className="h-10 w-10 rounded-[var(--radius-sm)] border border-(--line) bg-white object-contain p-1" />
                <div className="min-w-0 flex-1">
                  <Link href={`/colleges/${college.id}`} className="font-semibold hover:text-(--accent)">
                    {college.name}
                  </Link>
                  <p className="mt-1 text-sm text-(--muted)">{schoolDescription(college)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/odds?school=${college.id}`} className="btn btn-ghost">Check Odds</Link>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() =>
                      setState((s) => ({
                        ...s,
                        savedCollegeIds: s.savedCollegeIds.filter((x) => x !== college.id),
                      }))
                    }
                  >
                    Remove
                  </button>
                </div>
              </article>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}
