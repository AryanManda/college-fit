"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { COLLEGES, getCollege, logoUrl } from "../../../data/colleges";
import { matchCollege } from "../../../lib/matching";
import { ADMISSIONS_FACTOR_KEYS, MATCH_DISCLAIMER } from "../../../lib/constants";
import { useStore } from "../../../lib/store";
import { money, pct, scoreTone } from "../../../lib/format";
import { PageHeader, ScoreBar } from "../../../components/ui";
import { answerSchoolQuestion, applicationStrategy, similarMoreAchievable } from "../../../lib/discovery";
import { TRAVEL_NOTE } from "../../../lib/geo";

export default function CollegeProfileClient() {
  const { id } = useParams<{ id: string }>();
  const college = getCollege(id);
  const { state, setState } = useStore();
  const [toast, setToast] = useState<string | null>(null);

  if (!college) {
    return (
      <div>
        <PageHeader title="School not found" />
        <Link href="/colleges" className="btn btn-primary">
          Back to explore
        </Link>
      </div>
    );
  }
  const match = matchCollege(state, college);
  const saved = state.savedCollegeIds.includes(college.id);
  const comparing = state.compareIds.includes(college.id);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl(college)} alt="" className="h-14 w-14 rounded-2xl border border-(--line) bg-white" />
        <div className="flex-1">
          <PageHeader
            eyebrow="College profile"
            title={college.name}
            subtitle={`${college.city}, ${college.state} · ${college.type} · ${college.campusSetting} · Data last updated: ${college.dataUpdated}`}
          />
        </div>
        <div className={`text-4xl font-semibold ${scoreTone(match.overall)}`}>{match.overall}/100</div>
      </div>
      {toast ? <div className="mb-4 text-sm font-semibold text-(--accent)">{toast}</div> : null}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link href={`/odds?school=${college.id}`} className="btn btn-primary">
          Check Odds
        </Link>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            setState((s) => ({
              ...s,
              savedCollegeIds: saved
                ? s.savedCollegeIds.filter((x) => x !== college.id)
                : [...s.savedCollegeIds, college.id],
            }));
            flash(saved ? "Removed from saved schools" : "Saved to your college list");
          }}
        >
          {saved ? "Saved" : "Save School"}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            if (!comparing && state.compareIds.length >= 5) {
              flash("Compare list is full (5/5). Remove a school first.");
              return;
            }
            setState((s) => ({
              ...s,
              compareIds: comparing
                ? s.compareIds.filter((x) => x !== college.id)
                : [...s.compareIds, college.id],
            }));
            flash(comparing ? "Removed from compare" : "Added to compare");
          }}
        >
          {comparing ? "In Compare" : "Compare"}
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="serif text-3xl">Overview</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <Item k="Location" v={`${college.city}, ${college.state}`} />
            <Item k="Size" v={college.campus.sizeBand} />
            <Item k="Type" v={college.type} />
            <Item k="Undergraduate enrollment" v={college.undergraduateEnrollment.toLocaleString()} />
            <Item k="Campus setting" v={college.campusSetting} />
            <Item k="Student-faculty ratio" v={college.studentFacultyRatio ? `${college.studentFacultyRatio}:1` : null} />
            <Item k="Religious affiliation" v={college.religiousAffiliation ?? "None listed"} />
            <Item k="Region" v={college.region} />
          </dl>
        </section>
        <section className="card p-5">
          <h2 className="serif text-3xl">Your match</h2>
          {match.outOfRange ? (
            <div className="mt-2 border border-(--danger) bg-[color-mix(in_srgb,var(--danger)_10%,white)] p-3 text-sm">
              <div className="font-bold text-(--danger)">Out of range — not a reasonable primary option</div>
              <p className="mt-1 text-(--muted)">Your academics sit substantially below published admitted-student ranges for this school.</p>
            </div>
          ) : (
            <div className="chip mt-2">{match.category}</div>
          )}
          <div className="mt-4 grid gap-2">
            <ScoreBar label="Admissions" value={match.admissions} />
            <ScoreBar label="Academic" value={match.academic} />
            <ScoreBar label="Major" value={match.major} />
            <ScoreBar label="Location" value={match.location} />
            <ScoreBar label="Financial" value={match.financial} />
            <ScoreBar label="Lifestyle" value={match.lifestyle} />
            <ScoreBar label="Career" value={match.career} />
          </div>
          <div className="mt-4 text-sm">
            <div className="font-semibold">Why you match</div>
            <ul className="mt-1 list-disc pl-5 text-(--muted)">
              {match.why.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
            {match.concerns.length ? (
              <>
                <div className="mt-3 font-semibold">Potential concerns</div>
                <ul className="mt-1 list-disc pl-5 text-(--muted)">
                  {match.concerns.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
          <Link href={`/odds?school=${college.id}`} className="btn btn-primary mt-4">Improve odds & path forward</Link>
        </section>
        <section className="card p-5">
          <h2 className="serif text-3xl">Admissions</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <Item k="Acceptance rate" v={pct(college.admissions.acceptanceRate)} />
            {college.admissions.yield != null ? <Item k="Yield" v={pct(college.admissions.yield)} /> : null}
            {college.admissions.earlyAction !== undefined ? (
              <Item k="Early Action" v={college.admissions.earlyAction ? "Yes" : "Not listed"} />
            ) : null}
            {college.admissions.earlyDecision !== undefined ? (
              <Item k="Early Decision" v={college.admissions.earlyDecision ? "Yes" : "Not listed"} />
            ) : null}
            {college.admissions.regularDeadline ? <Item k="Regular decision" v={college.admissions.regularDeadline} /> : null}
            <Item k="Test policy" v={college.admissions.testPolicy} />
          </dl>
        </section>
        {(() => {
          const academicItems = [
            college.academics.gpaAverage != null ? ["Typical GPA", college.academics.gpaAverage.toFixed(2)] as const : null,
            college.academics.sat25 != null ? ["SAT 25th", String(college.academics.sat25)] as const : null,
            college.academics.sat50 != null ? ["SAT 50th", String(college.academics.sat50)] as const : null,
            college.academics.sat75 != null ? ["SAT 75th", String(college.academics.sat75)] as const : null,
            college.academics.act25 != null ? ["ACT 25th", String(college.academics.act25)] as const : null,
            college.academics.act50 != null ? ["ACT 50th", String(college.academics.act50)] as const : null,
            college.academics.act75 != null ? ["ACT 75th", String(college.academics.act75)] as const : null,
            college.academics.classRankInfo ? ["Class rank", college.academics.classRankInfo] as const : null,
            college.academics.courseworkExpectations ? ["Coursework", college.academics.courseworkExpectations] as const : null,
          ].filter(Boolean) as [string, string][];
          if (!academicItems.length) return null;
          return (
            <section className="card p-5">
              <h2 className="serif text-3xl">Academic profile</h2>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                {academicItems.map(([k, v]) => <Item key={k} k={k} v={v} />)}
              </dl>
            </section>
          );
        })()}
        {(() => {
          const known = ADMISSIONS_FACTOR_KEYS.filter((k) => {
            const v = college.admissionsFactors[k];
            return v && v !== "Unknown";
          });
          if (!known.length) return null;
          return (
            <section className="card p-5 lg:col-span-2">
              <h2 className="serif text-3xl">Admissions factors</h2>
              <p className="mt-1 text-sm text-(--muted)">
                From published Common Data Set-style weights in this catalog. Factors without published values are omitted.
              </p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-(--muted)">
                      <th className="py-2">Factor</th>
                      <th>Importance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {known.map((k) => (
                      <tr key={k} className="border-t border-(--line)">
                        <td className="py-2">{k}</td>
                        <td>{college.admissionsFactors[k]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })()}
        <section className="card p-5">
          <h2 className="serif text-3xl">Cost</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <Item k="In-state tuition" v={money(college.cost.tuitionInState)} />
            <Item k="Out-of-state / private tuition" v={money(college.cost.tuitionOutOfState)} />
            <Item k="You likely pay" v={match.inStateForStudent && college.type !== "Private" ? "In-state (based on your listed home state)" : "Out-of-state or private tuition (based on your listed residency)"} />
            {college.cost.fees != null ? <Item k="Fees" v={money(college.cost.fees)} /> : null}
            {college.cost.roomAndBoard != null ? <Item k="Room and board" v={money(college.cost.roomAndBoard)} /> : null}
            {college.cost.estimatedTotalInState != null ? <Item k="Est. total in-state" v={money(college.cost.estimatedTotalInState)} /> : null}
            {college.cost.estimatedTotalOutOfState != null ? <Item k="Est. total out-of-state" v={money(college.cost.estimatedTotalOutOfState)} /> : null}
            {college.cost.averageAid != null ? <Item k="Average aid (if published)" v={money(college.cost.averageAid)} /> : null}
          </dl>
        </section>
        {(() => {
          const outcomeItems = [
            college.outcomes.graduationRate != null ? ["Graduation rate", pct(college.outcomes.graduationRate)] as const : null,
            college.outcomes.retentionRate != null ? ["Retention", pct(college.outcomes.retentionRate)] as const : null,
            college.outcomes.employmentNote ? ["Employment", college.outcomes.employmentNote] as const : null,
            college.outcomes.graduateSchoolNote ? ["Graduate school", college.outcomes.graduateSchoolNote] as const : null,
            college.outcomes.majorOutcomesNote ? ["Major / career outcomes", college.outcomes.majorOutcomesNote] as const : null,
          ].filter(Boolean) as [string, string][];
          if (!outcomeItems.length) return null;
          return (
            <section className="card p-5">
              <h2 className="serif text-3xl">Student outcomes</h2>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                {outcomeItems.map(([k, v]) => <Item key={k} k={k} v={v} />)}
              </dl>
            </section>
          );
        })()}
      </div>
      <SchoolTools collegeId={college.id} />
      <p className="mt-4 text-xs text-(--muted)">
        Sources: {college.dataSources.join(", ")}. Last updated: {college.dataUpdated}. {MATCH_DISCLAIMER}
      </p>
      <div className="mt-6">
        <h3 className="mb-3 font-semibold">Nearby in catalog</h3>
        <div className="flex flex-wrap gap-2">
          {COLLEGES.filter((c) => c.state === college.state && c.id !== college.id)
            .slice(0, 6)
            .map((c) => (
              <Link key={c.id} href={`/colleges/${c.id}`} className="btn btn-ghost">
                {c.shortName}
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}

function SchoolTools({ collegeId }: { collegeId: string }) {
  const { state } = useStore();
  const college = getCollege(collegeId);
  const [q, setQ] = useState("Would this be a good school for me?");
  const [a, setA] = useState("");
  if (!college) return null;
  const match = matchCollege(state, college);
  const strat = applicationStrategy(college, match);
  const similar = similarMoreAchievable(state, college, 4);
  const prompts = [
    "Would this be a good school for me?",
    "How competitive am I?",
    "What majors are strongest here?",
    "How much would it cost me?",
    "How far is it from home?",
    "What similar schools should I consider?",
    "What should I improve before applying?",
    "Should I apply Early Action?",
    "What are my biggest weaknesses for this school?",
  ];
  return (
    <div className="mt-6 grid gap-5">
      <section className="card p-5">
        <h2 className="serif text-3xl">Recommended application strategy</h2>
        <dl className="mt-3 grid gap-2 text-sm">
          <div><span className="text-(--muted)">Category: </span>{strat.category}</div>
          <div><span className="text-(--muted)">Round: </span>{strat.round}</div>
          <div><span className="text-(--muted)">Testing: </span>{strat.tests}</div>
          <div><span className="text-(--muted)">Major: </span>{strat.major}</div>
        </dl>
        {match.miles != null ? <p className="mt-2 text-sm text-(--muted)">{match.miles} miles · ~{match.driveMinutes} min drive. {TRAVEL_NOTE}</p> : null}
      </section>
      <section className="card p-5">
        <h2 className="serif text-3xl">Ask about this school</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {prompts.map((p) => (
            <button key={p} className="btn btn-ghost" onClick={() => { setQ(p); setA(answerSchoolQuestion(p, state, college)); }}>{p}</button>
          ))}
        </div>
        <input className="field mt-3" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn btn-primary mt-2" onClick={() => setA(answerSchoolQuestion(q, state, college))}>Ask</button>
        {a ? <p className="mt-3 text-sm text-(--muted)">{a}</p> : null}
      </section>
      <section className="card p-5">
        <h2 className="serif text-3xl">Similar schools you have a stronger chance of getting into</h2>
        <p className="mt-1 text-sm text-(--muted)">Shared programs or campus type, with better admissions alignment for your profile.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {similar.map((s) => (
            <Link key={s.college.id} href={`/colleges/${s.college.id}`} className="btn btn-ghost">
              {s.college.shortName} · {s.match.category}
            </Link>
          ))}
        </div>
      </section>
      <section className="card p-5">
        <h2 className="serif text-3xl">Student population</h2>
        <p className="text-sm text-(--muted)">The university reports the following student demographic information.</p>
        <p className="mt-2 text-sm">{college.demographics.populationNote ?? "Data unavailable"}</p>
        <p className="mt-2 text-sm text-(--muted)">International student percentage: Unavailable in this catalog (not estimated).</p>
        <div className="mt-3">
          <div className="font-semibold">Relevant resources</div>
          <ul className="list-disc pl-5 text-sm text-(--muted)">
            {college.demographics.resources.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </div>
      </section>
    </div>
  );
}

function Item({ k, v }: { k: string; v: string | number | null | undefined }) {
  if (v === null || v === undefined || v === "" || v === "Unavailable") return null;
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-(--muted)">{k}</dt>
      <dd className="font-semibold">{String(v)}</dd>
    </div>
  );
}
