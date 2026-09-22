"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CAREERS } from "../data/careers";
import { useStore } from "../lib/store";

const FLOW = [
  { href: "/career", label: "Hub" },
  { href: "/path", label: "My Path" },
  { href: "/career/assessment", label: "Assessment" },
  { href: "/career/matches", label: "Matches" },
  { href: "/career/saved", label: "Saved" },
  { href: "/career/ask", label: "Ask" },
] as const;

export function CareerFlowNav() {
  const pathname = usePathname();
  const idx = FLOW.findIndex((f) => f.href === pathname || (f.href !== "/career" && pathname.startsWith(f.href)));
  const prev = idx > 0 ? FLOW[idx - 1] : null;
  const next = idx >= 0 && idx < FLOW.length - 1 ? FLOW[idx + 1] : null;

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-(--line) pb-3">
      <div className="flex flex-wrap gap-1.5">
        {FLOW.map((f) => {
          const active = pathname === f.href || (f.href !== "/career" && pathname.startsWith(f.href));
          return (
            <Link key={f.href} href={f.href} className={`btn ${active ? "btn-primary" : "btn-ghost"}`}>
              {f.label}
            </Link>
          );
        })}
      </div>
      <div className="flex gap-2">
        {prev ? <Link href={prev.href} className="btn btn-ghost">← {prev.label}</Link> : null}
        {next ? <Link href={next.href} className="btn btn-ghost">{next.label} →</Link> : null}
      </div>
    </div>
  );
}

export function CareerGoalsEditor({ compact = false }: { compact?: boolean }) {
  const { state, setState } = useStore();
  const c = state.career;
  const primary = state.careerAssessment.primaryCareerId;

  const setList = (key: "intendedCareers" | "intendedMajors" | "industries", raw: string) => {
    const values = raw
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    setState((p) => ({ ...p, career: { ...p.career, [key]: values } }));
  };

  return (
    <section className={`mb-5 border border-(--line) bg-white/70 p-4 ${compact ? "" : "p-5"}`}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="serif text-2xl">Your career goals</h2>
          <p className="text-sm text-(--muted)">Edit anytime — no assessment required if you already know your path.</p>
        </div>
        <Link href="/career/assessment" className="btn btn-ghost">Not sure? Take assessment</Link>
      </div>
      <div className={`mt-3 grid gap-3 ${compact ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3"}`}>
        <label className="block text-sm">
          <span className="label">Primary career match</span>
          <select
            className="field"
            value={primary}
            onChange={(e) => {
              const id = e.target.value;
              const title = CAREERS.find((x) => x.id === id)?.title;
              setState((p) => ({
                ...p,
                careerAssessment: { ...p.careerAssessment, primaryCareerId: id, completed: true },
                career: {
                  ...p.career,
                  intendedCareers: title
                    ? [...new Set([title, ...p.career.intendedCareers.filter((t) => t !== title)])]
                    : p.career.intendedCareers,
                },
                savedCareerIds: id && !p.savedCareerIds.includes(id) ? [...p.savedCareerIds, id] : p.savedCareerIds,
              }));
            }}
          >
            <option value="">Select a career</option>
            {CAREERS.map((career) => (
              <option key={career.id} value={career.id}>{career.title}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="label">Career goals (comma-separated)</span>
          <input
            className="field"
            value={c.intendedCareers.join(", ")}
            onChange={(e) => setList("intendedCareers", e.target.value)}
            placeholder="e.g. Software engineer, Product manager"
          />
        </label>
        <label className="block text-sm">
          <span className="label">Intended majors</span>
          <input
            className="field"
            value={c.intendedMajors.join(", ")}
            onChange={(e) => setList("intendedMajors", e.target.value)}
            placeholder="e.g. Computer Science, Economics"
          />
        </label>
        <label className="block text-sm">
          <span className="label">Industries</span>
          <input
            className="field"
            value={c.industries.join(", ")}
            onChange={(e) => setList("industries", e.target.value)}
            placeholder="e.g. Tech, Healthcare"
          />
        </label>
        <label className="block text-sm">
          <span className="label">Salary range preference</span>
          <input
            className="field"
            value={c.salaryRange}
            onChange={(e) => setState((p) => ({ ...p, career: { ...p.career, salaryRange: e.target.value } }))}
            placeholder="e.g. $80k–$120k"
          />
        </label>
        <label className="block text-sm">
          <span className="label">Graduate school interest</span>
          <input
            className="field"
            value={c.graduateSchoolInterest}
            onChange={(e) => setState((p) => ({ ...p, career: { ...p.career, graduateSchoolInterest: e.target.value } }))}
            placeholder="Yes / No / Maybe"
          />
        </label>
      </div>
    </section>
  );
}
