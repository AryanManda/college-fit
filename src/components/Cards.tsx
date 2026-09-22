"use client";

import Link from "next/link";
import type { College, MatchBreakdown } from "../lib/types";
import { logoUrl } from "../data/colleges";
import { ScoreBar } from "./ui";
import { InfoTip } from "./InfoTip";
import { pct, scoreTone } from "../lib/format";
import { useStore } from "../lib/store";
import { useState } from "react";

export function MatchCard({
  college,
  match,
}: {
  college: College;
  match: MatchBreakdown;
}) {
  const { state, setState } = useStore();
  const [toast, setToast] = useState<string | null>(null);
  const saved = state.savedCollegeIds.includes(college.id);
  const comparing = state.compareIds.includes(college.id);
  const tipTerm =
    match.category === "Likely" ? "Likely School" :
    match.category === "Target" ? "Target School" :
    match.category === "High Reach" ? "Reach School" :
    "Reach School";

  const toggleSave = () => {
    setState((s) => ({
      ...s,
      savedCollegeIds: saved
        ? s.savedCollegeIds.filter((x) => x !== college.id)
        : [...s.savedCollegeIds, college.id],
    }));
    setToast(saved ? "Removed from saved schools" : "Saved to your college list");
    window.setTimeout(() => setToast(null), 2500);
  };

  const toggleCompare = () => {
    if (!comparing && state.compareIds.length >= 5) {
      setToast("Compare list is full (5/5). Remove a school first.");
      window.setTimeout(() => setToast(null), 3000);
      return;
    }
    setState((s) => ({
      ...s,
      compareIds: comparing
        ? s.compareIds.filter((x) => x !== college.id)
        : [...s.compareIds, college.id],
    }));
    setToast(comparing ? "Removed from compare" : "Added to compare");
    window.setTimeout(() => setToast(null), 2500);
  };

  return (
    <article className="card flex h-full flex-col p-5">
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl(college)} alt="" className="h-10 w-10 rounded-[var(--radius-sm)] border border-(--line) bg-white object-contain p-1" />
        <div className="min-w-0 flex-1">
          <div className="font-semibold leading-snug tracking-tight">{college.name}</div>
          <div className="mt-0.5 text-sm text-(--muted)">
            {college.city}, {college.state}
          </div>
        </div>
        <div className="text-right">
          <div className={`serif text-3xl leading-none ${scoreTone(match.overall)}`}>{match.overall}</div>
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-(--muted)">Fit</div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <span className="chip">{match.category} <InfoTip term={tipTerm} /></span>
        {match.outOfRange ? (
          <span className="chip border-(--danger) text-(--danger)">Out of range — not realistic as a primary choice</span>
        ) : null}
        {match.estimatedLikelihood != null ? (
          <span className="chip">{match.admissionOutlook} · {match.estimatedLikelihood}% est. <InfoTip term="Estimated Likelihood" /></span>
        ) : null}
        {match.inStateForStudent ? <span className="chip">In-state tuition likely</span> : null}
      </div>
      <div className="mt-4 grid gap-2">
        <ScoreBar label="Admissions Match" value={match.admissions} />
        <ScoreBar label="Academic Match" value={match.academic} />
        <ScoreBar label="Career Match" value={match.career} />
        <ScoreBar label="Location Match" value={match.location} />
        <ScoreBar label="Financial Match" value={match.financial} />
        <ScoreBar label="Major Match" value={match.major} />
      </div>
      <div className="mt-4">
        <div className="text-sm font-semibold">Why we recommend it</div>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-(--muted)">
          {match.why.slice(0, 4).map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      </div>
      {match.concerns.length ? (
        <div className="mt-3 text-sm text-(--accent-2)">
          <span className="font-semibold">Potential concerns: </span>
          {match.concerns[0]}
        </div>
      ) : null}
      {toast ? <div className="mt-3 text-sm font-semibold text-(--accent)">{toast}</div> : null}
      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        <Link href={`/colleges/${college.id}`} className="btn btn-primary flex-1">
          View School
        </Link>
        <Link href={`/odds?school=${college.id}`} className="btn btn-ghost">
          Check Odds
        </Link>
        <button type="button" className="btn btn-ghost" onClick={toggleSave}>
          {saved ? "Saved" : "Save"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={toggleCompare}>
          {comparing ? "In Compare" : "Compare"}
        </button>
      </div>
    </article>
  );
}

export function CollegeCard({
  college,
  match,
  saved,
  comparing,
  onSave,
  onCompare,
}: {
  college: College;
  match?: MatchBreakdown;
  saved?: boolean;
  comparing?: boolean;
  onSave?: () => void;
  onCompare?: () => void;
}) {
  return (
    <article className="card p-5">
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl(college)} alt="" className="h-10 w-10 rounded-xl border border-(--line) bg-white" />
        <div className="min-w-0 flex-1">
          <Link href={`/colleges/${college.id}`} className="font-semibold leading-tight hover:underline">
            {college.name}
          </Link>
          <div className="text-sm text-(--muted)">
            {college.city}, {college.state} · {college.type} · {college.campusSetting}
          </div>
        </div>
        {match ? (
          <div className={`text-xl font-semibold ${scoreTone(match.overall)}`}>{match.overall}</div>
        ) : null}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
        <Meta label="Enrollment" value={college.undergraduateEnrollment.toLocaleString()} />
        <Meta label="Acceptance" value={pct(college.admissions.acceptanceRate)} />
        <Meta label="GPA" value={college.academics.gpaAverage?.toFixed(2) ?? "Unavailable"} />
        <Meta
          label="SAT"
          value={
            college.academics.sat25 && college.academics.sat75
              ? `${college.academics.sat25}–${college.academics.sat75}`
              : "Unavailable"
          }
        />
        <Meta
          label="ACT"
          value={
            college.academics.act25 && college.academics.act75
              ? `${college.academics.act25}–${college.academics.act75}`
              : "Unavailable"
          }
        />
        <Meta
          label="Est. cost"
          value={
            college.cost.estimatedTotalOutOfState
              ? `$${Math.round(college.cost.estimatedTotalOutOfState / 1000)}k`
              : "Unavailable"
          }
        />
        <Meta label="Grad rate" value={pct(college.outcomes.graduationRate)} />
        <Meta label="S/F ratio" value={college.studentFacultyRatio ? `${college.studentFacultyRatio}:1` : "Unavailable"} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-(--muted)">
        {college.majors.slice(0, 4).map((m) => (
          <span key={m} className="rounded-full border border-(--line) px-2 py-1">
            {m}
          </span>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/colleges/${college.id}`} className="btn btn-primary">
          View School
        </Link>
        <Link href={`/odds?school=${college.id}`} className="btn btn-ghost">
          Check Odds
        </Link>
        {onSave ? (
          <button type="button" className="btn btn-ghost" onClick={onSave}>
            {saved ? "Saved" : "Save School"}
          </button>
        ) : null}
        {onCompare ? (
          <button type="button" className="btn btn-ghost" onClick={onCompare}>
            {comparing ? "In Compare" : "Compare"}
          </button>
        ) : null}
      </div>
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-(--muted)">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
