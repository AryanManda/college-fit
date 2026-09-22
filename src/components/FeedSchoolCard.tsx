"use client";

import Link from "next/link";
import type { College, MatchBreakdown } from "../lib/types";
import { logoUrl } from "../data/colleges";
import { schoolDescription } from "../lib/college-feed";
import { scoreTone } from "../lib/format";

export function FeedSchoolCard({
  college,
  match,
  saved,
  onSaveLike,
  onNotInterested,
}: {
  college: College;
  match?: MatchBreakdown;
  saved?: boolean;
  onSaveLike: () => void;
  onNotInterested: () => void;
}) {
  return (
    <article className="card p-5">
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl(college)}
          alt=""
          className="h-11 w-11 rounded-[var(--radius-sm)] border border-(--line) bg-white object-contain p-1"
        />
        <div className="min-w-0 flex-1">
          <Link href={`/colleges/${college.id}`} className="serif text-xl leading-snug hover:text-(--accent)">
            {college.name}
          </Link>
          <p className="mt-1 text-sm text-(--muted)">{schoolDescription(college)}</p>
        </div>
        {match ? (
          <div className="text-right">
            <div className={`serif text-2xl leading-none ${scoreTone(match.overall)}`}>{match.overall}</div>
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-(--muted)">Fit</div>
          </div>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={`btn ${saved ? "btn-primary" : "btn-ghost"}`} onClick={onSaveLike}>
          {saved ? "Saved" : "Save & Like"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onNotInterested}>
          Not Interested
        </button>
        <Link href={`/colleges/${college.id}`} className="btn btn-ghost">
          View School
        </Link>
        <Link href={`/odds?school=${college.id}`} className="btn btn-ghost">
          Check Odds
        </Link>
      </div>
    </article>
  );
}
