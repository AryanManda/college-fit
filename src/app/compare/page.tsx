"use client";

import Link from "next/link";
import { COLLEGES, getCollege } from "../../data/colleges";
import { matchCollege } from "../../lib/matching";
import { useStore } from "../../lib/store";
import { money, pct } from "../../lib/format";
import { PageHeader } from "../../components/ui";
import { CollegesTopTabs } from "../../components/CollegesTopTabs";
import { MATCH_DISCLAIMER } from "../../lib/constants";

export default function ComparePage() {
  const { state, setState } = useStore();
  const ids = state.compareIds.slice(0, 5);
  const schools = ids.map((id) => getCollege(id)).filter(Boolean);

  const add = (id: string) => {
    if (!id || ids.includes(id) || ids.length >= 5) return;
    setState((s) => ({ ...s, compareIds: [...s.compareIds, id] }));
  };
  const remove = (id: string) => setState((s) => ({ ...s, compareIds: s.compareIds.filter((x) => x !== id) }));

  const rows: { label: string; values: string[] }[] = schools.length
    ? [
        { label: "University", values: schools.map((c) => c!.name) },
        { label: "Estimated category", values: schools.map((c) => matchCollege(state, c!).category) },
        { label: "Overall Fit", values: schools.map((c) => `${matchCollege(state, c!).overall}/100`) },
        { label: "Admissions Match", values: schools.map((c) => String(matchCollege(state, c!).admissions)) },
        { label: "Academic Match", values: schools.map((c) => String(matchCollege(state, c!).academic)) },
        { label: "Major Match", values: schools.map((c) => String(matchCollege(state, c!).major)) },
        { label: "Location Match", values: schools.map((c) => String(matchCollege(state, c!).location)) },
        { label: "Financial Match", values: schools.map((c) => String(matchCollege(state, c!).financial)) },
        { label: "Career Match", values: schools.map((c) => String(matchCollege(state, c!).career)) },
        { label: "Distance", values: schools.map((c) => {
          const m = matchCollege(state, c!);
          return m.miles != null ? `${m.miles} miles` : "Unavailable";
        }) },
        { label: "Est. drive", values: schools.map((c) => {
          const m = matchCollege(state, c!);
          return m.driveMinutes != null ? `${m.driveMinutes} min` : "Unavailable";
        }) },
        { label: "Location", values: schools.map((c) => `${c!.city}, ${c!.state}`) },
        { label: "In-state tuition", values: schools.map((c) => money(c!.cost.tuitionInState)) },
        { label: "Out-of-state tuition", values: schools.map((c) => money(c!.cost.tuitionOutOfState)) },
        { label: "You likely pay", values: schools.map((c) => matchCollege(state, c!).inStateForStudent && c!.type !== "Private" ? "In-state" : "Out-of-state / private") },
        { label: "Enrollment", values: schools.map((c) => c!.undergraduateEnrollment.toLocaleString()) },
        { label: "Acceptance Rate", values: schools.map((c) => pct(c!.admissions.acceptanceRate)) },
        { label: "GPA", values: schools.map((c) => c!.academics.gpaAverage?.toFixed(2) ?? "Unavailable") },
        { label: "SAT", values: schools.map((c) => (c!.academics.sat25 && c!.academics.sat75 ? `${c!.academics.sat25}–${c!.academics.sat75}` : "Unavailable")) },
        { label: "ACT", values: schools.map((c) => (c!.academics.act25 && c!.academics.act75 ? `${c!.academics.act25}–${c!.academics.act75}` : "Unavailable")) },
        { label: "Cost", values: schools.map((c) => money(c!.cost.estimatedTotalOutOfState)) },
        { label: "Graduation Rate", values: schools.map((c) => pct(c!.outcomes.graduationRate)) },
        { label: "Student-Faculty Ratio", values: schools.map((c) => (c!.studentFacultyRatio ? `${c!.studentFacultyRatio}:1` : "Unavailable")) },
      ]
    : [];

  return (
    <div>
      <PageHeader title="Compare Colleges" subtitle="Select up to 5 schools. Missing cells stay labeled Unavailable." />
      <CollegesTopTabs />
      <div className="card mb-4 flex flex-wrap items-center gap-3 p-4">
        <select className="field max-w-sm" value="" onChange={(e) => add(e.target.value)}>
          <option value="">Add a school</option>
          {COLLEGES.filter((c) => !ids.includes(c.id)).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <span className="text-sm text-(--muted)">{ids.length}/5 selected</span>
      </div>
      {!schools.length ? (
        <div className="card p-6 text-(--muted)">Add schools from Explore, or use the dropdown above.</div>
      ) : (
        <div className="card overflow-x-auto p-4">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr>
                <th className="p-2"> </th>
                {schools.map((c) => (
                  <th key={c!.id} className="p-2 align-top">
                    <Link href={`/colleges/${c!.id}`} className="font-semibold hover:underline">{c!.shortName}</Link>
                    <button className="mt-2 block text-xs text-(--danger)" onClick={() => remove(c!.id)}>Remove</button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(1).map((row) => (
                <tr key={row.label} className="border-t border-(--line)">
                  <th className="p-2 font-semibold text-(--muted)">{row.label}</th>
                  {row.values.map((v, i) => (
                    <td key={i} className="p-2">{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-4 text-xs text-(--muted)">{MATCH_DISCLAIMER}</p>
    </div>
  );
}
