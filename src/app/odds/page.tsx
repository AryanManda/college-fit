"use client";

import { useEffect, useMemo, useState } from "react";
import { COLLEGES, getCollege } from "../../data/colleges";
import { admissionsBreakdown, improveOdds, similarMoreAchievable, applyWhatIf, whatIfShifts } from "../../lib/discovery";
import { buildPathForward } from "../../lib/career-roadmap";
import { matchAll } from "../../lib/matching";
import { useStore } from "../../lib/store";
import { PageHeader, ScoreBar } from "../../components/ui";
import { CollegesTopTabs } from "../../components/CollegesTopTabs";
import { MATCH_DISCLAIMER } from "../../lib/constants";
import { LIKELIHOOD_DISCLAIMER } from "../../lib/admission-likelihood";
import { InfoTip } from "../../components/InfoTip";
import { ImproveOddsPanel } from "../../components/ImproveOddsPanel";
import { ProfilePromptBanner } from "../../components/ProfilePromptBanner";
import { scoreTone } from "../../lib/format";
import Link from "next/link";

export default function OddsPage() {
  const { state, hydrated } = useStore();
  const [q, setQ] = useState("");
  const [id, setId] = useState("ut-austin");
  const [sat, setSat] = useState(1280);
  const [gpa, setGpa] = useState(3.6);
  const [apExtra, setApExtra] = useState(0);
  const [leadership, setLeadership] = useState(false);
  const [impact, setImpact] = useState(false);
  const [major, setMajor] = useState("");
  const [drive, setDrive] = useState(0);
  const [willingRetake, setWillingRetake] = useState(false);
  const [willingAp, setWillingAp] = useState(false);
  const [willingLead, setWillingLead] = useState(false);
  const college = getCollege(id);

  useEffect(() => {
    const school = new URLSearchParams(window.location.search).get("school");
    if (school && getCollege(school)) setId(school);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const profileSat = Number(state.testing.sat?.total || 0);
    const profileGpa = Number(state.academic.unweightedGpa || state.academic.weightedGpa || 0);
    if (profileSat) setSat(profileSat);
    if (profileGpa) setGpa(Math.min(4, profileGpa));
  }, [hydrated, state.testing.sat?.total, state.academic.unweightedGpa, state.academic.weightedGpa]);

  const hits = useMemo(
    () => COLLEGES.filter((c) => `${c.name} ${c.shortName}`.toLowerCase().includes(q.toLowerCase())).slice(0, 8),
    [q],
  );

  if (!college) return null;
  const br = admissionsBreakdown(state, college);
  const sim = similarMoreAchievable(state, college, 4);
  const simulated = applyWhatIf(state, {
    sat: willingRetake ? Math.max(sat, college.academics.sat50 ?? sat) : sat,
    gpa,
    apExtra: willingAp ? Math.max(apExtra, 2) : apExtra,
    leadershipExtra: leadership || willingLead,
    extraImpact: impact,
    major: major || undefined,
    maxDriveMinutes: drive || undefined,
  });
  const simAll = matchAll(simulated);
  const simMatch = simAll.find((m) => m.collegeId === college.id);
  const shifts = whatIfShifts(matchAll(state), simAll);
  const pathForward = buildPathForward(state, college, br.match);
  const tips = improveOdds(state, college);
  const out = br.match.outOfRange;

  return (
    <div>
      <PageHeader title="Check my odds" subtitle="Have a specific college in mind? This is an estimate — not a prediction or guarantee of admission." />
      <CollegesTopTabs />
      <ProfilePromptBanner dense />

      <div className="card mb-5 p-4">
        <div className="label">Search for any university</div>
        <input className="field" value={q} onChange={(e) => setQ(e.target.value)} placeholder="University of Texas at Austin" />
        <div className="mt-2 flex flex-wrap gap-2">
          {hits.map((c) => (
            <button key={c.id} className={`btn ${c.id === id ? "btn-primary" : "btn-ghost"}`} onClick={() => { setId(c.id); setQ(c.name); }}>
              {c.shortName}
            </button>
          ))}
        </div>
      </div>

      {out ? (
        <div className="mb-5 border-2 border-(--danger) bg-[color-mix(in_srgb,var(--danger)_12%,white)] p-5">
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-(--danger)">Out of range</div>
          <h2 className="serif mt-1 text-3xl text-(--danger)">Not a reasonable option right now</h2>
          <p className="mt-2 max-w-3xl text-sm font-medium">
            Your academics are substantially below {college.shortName}&apos;s published admitted-student ranges.
            Do not build your plan around this school as a primary or safety choice. Use similar, more achievable schools below and treat any path here as a long-shot pivot.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
            {br.match.concerns.filter((c) => c.startsWith("OUT OF RANGE") || c.startsWith("Not a reasonable")).map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <section className="card mb-5 p-5">
        <h2 className="serif text-3xl">Your {college.shortName} admissions match</h2>
        <div className="mt-2 flex flex-wrap items-end gap-4">
          <div>
            <div className="text-sm text-(--muted)">Estimated category</div>
            <div className="text-3xl font-semibold">{br.match.category} <InfoTip term={br.match.category === "Likely" ? "Likely School" : "Target School"} /></div>
          </div>
          <div>
            <div className="text-sm text-(--muted)">Admission outlook <InfoTip term="Admission Outlook" /></div>
            <div className={`text-3xl font-semibold ${out ? "text-(--danger)" : ""}`}>{br.match.admissionOutlook}</div>
          </div>
          {br.match.estimatedLikelihood != null ? (
            <div>
              <div className="text-sm text-(--muted)">Estimated likelihood <InfoTip term="Estimated Likelihood" /></div>
              <div className={`text-4xl font-semibold ${scoreTone(br.match.estimatedLikelihood)}`}>{br.match.estimatedLikelihood}%</div>
            </div>
          ) : null}
          <div>
            <div className="text-sm text-(--muted)">Admissions match</div>
            <div className={`text-4xl font-semibold ${scoreTone(br.match.admissions)}`}>{br.match.admissions}/100</div>
          </div>
        </div>
        <p className="mt-3 text-sm text-(--muted)">
          This is an estimate based on publicly available admissions data and the information you provided. It is not a prediction or guarantee of admission.
        </p>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          <ScoreBar label="Admissions" value={br.match.admissions} />
          <ScoreBar label="Academic" value={br.match.academic} />
          <ScoreBar label="Major" value={br.match.major} />
          <ScoreBar label="Location" value={br.match.location} />
          <ScoreBar label="Financial" value={br.match.financial} />
          <ScoreBar label="Career" value={br.match.career} />
        </div>
      </section>

      <ImproveOddsPanel schoolName={college.shortName} tips={tips} />

      <section className="card mb-5 grid gap-4 p-5 md:grid-cols-2">
        <h2 className="serif text-3xl md:col-span-2">Admissions breakdown</h2>
        {br.gpa.student != null || br.gpa.typical != null ? (
          <Block title="Academic profile" lines={[
            br.gpa.student != null ? `Student GPA: ${br.gpa.student}` : "Add your GPA in profile",
            br.gpa.typical != null ? `Typical reported: ${br.gpa.typical}` : "School typical GPA not in catalog",
            `Status: ${br.gpa.label}`,
          ]} />
        ) : null}
        {br.sat.student != null || (br.sat.low != null && br.sat.high != null) ? (
          <Block title="Test scores" lines={[
            br.sat.student != null ? `Student SAT: ${br.sat.student}` : "No SAT on file",
            br.sat.low != null && br.sat.high != null ? `School range: ${br.sat.low}–${br.sat.high}` : "School SAT range not in catalog",
            `Status: ${br.sat.label}`,
          ]} />
        ) : null}
        <Block title="Course rigor" lines={[`AP: ${br.rigor.ap}`, `Honors: ${br.rigor.honors}`, `Dual/college: ${br.rigor.dual}`, `Assessment: ${br.rigor.label}`]} />
        <Block title="Extracurriculars" lines={[`${br.extras.extras} activities`, `Assessment: ${br.extras.label}`]} />
        <Block title="Leadership" lines={[`${br.leadership.leadership} leadership roles`, `Assessment: ${br.leadership.label}`]} />
        <Block title="Work / major" lines={[`Work: ${br.work.label}`, `Intended major: ${br.major.label}`]} />
      </section>

      <section className="card mb-5 p-5">
        <h2 className="serif text-3xl">What if? simulator</h2>
        <p className="text-sm text-(--muted)">Simulated estimates only. Moving a school’s category does not mean you will be admitted.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm">SAT {sat}
            <input type="range" min={800} max={1600} step={10} value={sat} onChange={(e) => setSat(Number(e.target.value))} className="w-full accent-(--accent)" />
          </label>
          <label className="text-sm">GPA {gpa.toFixed(2)}
            <input type="range" min={2} max={4} step={0.05} value={gpa} onChange={(e) => setGpa(Number(e.target.value))} className="w-full accent-(--accent)" />
          </label>
          <label className="text-sm">Additional AP courses {apExtra}
            <input type="range" min={0} max={4} step={1} value={apExtra} onChange={(e) => setApExtra(Number(e.target.value))} className="w-full accent-(--accent)" />
          </label>
          <label className="text-sm">Max drive time (min) {drive || "no change"}
            <input type="range" min={0} max={480} step={30} value={drive} onChange={(e) => setDrive(Number(e.target.value))} className="w-full accent-(--accent)" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={leadership} onChange={(e) => setLeadership(e.target.checked)} />
            Add leadership (simulated)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={impact} onChange={(e) => setImpact(e.target.checked)} />
            Quantify extracurricular impact (simulated)
          </label>
          <label className="text-sm md:col-span-2">Different intended major
            <input className="field mt-1" value={major} onChange={(e) => setMajor(e.target.value)} placeholder="Leave blank to keep current" />
          </label>
        </div>
        {simMatch ? (
          <p className="mt-3 text-sm">
            Simulated category for {college.shortName}: <strong>{simMatch.category}</strong> (admissions {simMatch.admissions}/100)
            {simMatch.outOfRange ? " — still out of range" : ""}. Current: {br.match.category}.
          </p>
        ) : null}
        {shifts.length ? (
          <div className="mt-3 text-sm">
            <div className="font-semibold">Schools that may move toward a more achievable category (simulated):</div>
            <ul className="mt-1 list-disc pl-5 text-(--muted)">
              {shifts.map((s) => {
                const c = getCollege(s.id);
                return <li key={s.id}>{c?.shortName ?? s.id}: {s.from} → {s.to}</li>;
              })}
            </ul>
          </div>
        ) : null}
      </section>

      <section className={`mb-5 border p-5 ${pathForward.mode === "pivot" ? "border-(--danger) bg-[color-mix(in_srgb,var(--danger)_6%,white)]" : "card"}`}>
        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-(--accent)">Interactive path forward</div>
        <h2 className="serif mt-1 text-3xl">{pathForward.headline}</h2>
        <p className="mt-2 text-sm font-medium text-(--ink)/85">{pathForward.summary}</p>

        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <label className="flex items-center gap-2 rounded-lg border border-(--line) bg-white px-3 py-2">
            <input type="checkbox" checked={willingRetake} onChange={(e) => setWillingRetake(e.target.checked)} />
            I&apos;m willing to retake the SAT
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-(--line) bg-white px-3 py-2">
            <input type="checkbox" checked={willingAp} onChange={(e) => setWillingAp(e.target.checked)} />
            I can take more APs
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-(--line) bg-white px-3 py-2">
            <input type="checkbox" checked={willingLead} onChange={(e) => setWillingLead(e.target.checked)} />
            I can deepen leadership
          </label>
        </div>
        {simMatch && (willingRetake || willingAp || willingLead) ? (
          <p className="mt-3 text-sm">
            With those commitments (simulated): <strong>{simMatch.category}</strong> · admissions {simMatch.admissions}/100 · {simMatch.admissionOutlook}
            {simMatch.estimatedLikelihood != null ? ` · ~${simMatch.estimatedLikelihood}% est.` : ""}
          </p>
        ) : null}

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {pathForward.gaps.map((g) => (
            <div key={g.label} className={`rounded-xl border p-3 text-sm ${g.severity === "critical" ? "border-(--danger)" : "border-(--line)"}`}>
              <div className="font-semibold">{g.label} · {g.severity}</div>
              <div>Current: {g.current}</div>
              <div className="text-(--muted)">Target: {g.target}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {pathForward.phases.map((phase) => (
            <div key={phase.id} className="rounded-xl border border-(--line) bg-white/80 p-3">
              <div className="font-semibold">{phase.title}</div>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-(--muted)">
                {phase.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <div className="font-semibold">Checklist (updates from your real profile)</div>
          <ul className="mt-2 space-y-2">
            {pathForward.checklist.map((item) => (
              <li key={item.id} className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-(--line) bg-white px-3 py-2 text-sm">
                <div>
                  <div className="font-medium">{item.done ? "✓ " : "○ "}{item.label}</div>
                  <div className="text-(--muted)">{item.detail}</div>
                </div>
                {item.href ? <Link href={item.href} className="btn btn-ghost">Fix</Link> : null}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-4 text-sm">Current outlook: <strong>{pathForward.currentOutlook}</strong> → With improvements (simulated): <strong>{pathForward.improvedOutlook}</strong></p>
      </section>

      <section className="card p-5">
        <h2 className="serif text-3xl">
          {out ? "Build around these more achievable schools instead" : "Similar schools you have a stronger chance of getting into"}
        </h2>
        <p className="mt-1 text-sm text-(--muted)">
          These share characteristics with {college.shortName}, but your academic profile is more competitive relative to their typical admitted students.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {sim.map((s) => (
            <Link key={s.college.id} href={`/colleges/${s.college.id}`} className="btn btn-ghost">
              {s.college.shortName} · {s.match.category} · {s.match.admissions}
            </Link>
          ))}
        </div>
      </section>
      <p className="mt-4 text-xs text-(--muted)">{LIKELIHOOD_DISCLAIMER} {MATCH_DISCLAIMER}</p>
    </div>
  );
}

function Block({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-2xl border border-(--line) p-4">
      <div className="font-semibold">{title}</div>
      {lines.map((l) => <div key={l} className="text-sm text-(--muted)">{l}</div>)}
    </div>
  );
}
