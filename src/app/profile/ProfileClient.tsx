"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import {
  ACADEMIC_PREF_KEYS,
  ACTIVITY_CATEGORIES,
  CAMPUS_PREF_KEYS,
  IMPORTANCE_OPTIONS,
  INDUSTRIES,
  LIFESTYLE_TAGS,
  US_STATES,
} from "../../lib/constants";
import { uid } from "../../lib/id";
import { useStore } from "../../lib/store";
import type {
  Activity,
  AppState,
  Award,
  Course,
  CourseLevel,
  Importance,
  WorkExperience,
} from "../../lib/types";
import { PageHeader } from "../../components/ui";
import { DemographicsForm, LocationAndDistance } from "../../components/ProfileExtras";
import { syncResidencePatch } from "../../lib/location-prefs";
import { ProfilePromptBanner } from "../../components/ProfilePromptBanner";
import { HighSchoolPicker } from "../../components/HighSchoolPicker";
import { CourseNamePicker } from "../../components/CourseNamePicker";
import { inferSubjectFromCourseName } from "../../data/ap-ib-courses";

const TABS = [
  ["personal", "Personal"],
  ["location", "Location"],
  ["academics", "Academics & Testing"],
  ["activities", "Activities"],
  ["work", "Work"],
  ["awards", "Awards"],
  ["career", "Career"],
  ["preferences", "College Preferences"],
  ["demographics", "Demographics"],
] as const;

type TabId = (typeof TABS)[number][0];

function normalizeTab(raw: string | null): TabId {
  if (raw === "testing") return "academics";
  if (raw && TABS.some(([id]) => id === raw)) return raw as TabId;
  return "personal";
}

export default function ProfilePage() {
  const params = useSearchParams();
  const router = useRouter();
  const initial = normalizeTab(params.get("tab"));
  const [tab, setTabState] = useState<TabId>(initial);
  const { state, setState } = useStore();
  const patch = (fn: (s: AppState) => AppState) => setState(fn);

  useEffect(() => {
    setTabState(normalizeTab(params.get("tab")));
  }, [params]);

  const setTab = (id: TabId) => {
    setTabState(id);
    router.replace(`/profile?tab=${id}`, { scroll: false });
  };

  const tabIndex = TABS.findIndex(([id]) => id === tab);
  const prevTab = tabIndex > 0 ? TABS[tabIndex - 1] : null;
  const nextTab = tabIndex >= 0 && tabIndex < TABS.length - 1 ? TABS[tabIndex + 1] : null;

  return (
    <div>
      <PageHeader
        title="My Profile"
        subtitle="Enter information once. Matching, resume, and application strength all read from this profile."
      />
      <ProfilePromptBanner dense />
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap ${
              tab === id ? "bg-(--accent) text-white" : "bg-(--surface) text-(--muted) border border-(--line)"
            }`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "personal" && <Personal state={state} patch={patch} />}
      {tab === "location" && <LocationAndDistance state={state} patch={patch} />}
      {tab === "academics" && <AcademicsAndTesting state={state} patch={patch} />}
      {tab === "activities" && <Activities state={state} patch={patch} />}
      {tab === "work" && <Work state={state} patch={patch} />}
      {tab === "awards" && <Awards state={state} patch={patch} />}
      {tab === "career" && <Career state={state} patch={patch} />}
      {tab === "preferences" && <Preferences state={state} patch={patch} />}
      {tab === "demographics" && <DemographicsForm state={state} patch={patch} />}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-(--line) pt-5">
        {prevTab ? (
          <button type="button" className="btn btn-ghost" onClick={() => setTab(prevTab[0])}>
            ← Back · {prevTab[1]}
          </button>
        ) : (
          <span />
        )}
        {nextTab ? (
          <button type="button" className="btn btn-primary" onClick={() => setTab(nextTab[0])}>
            Next · {nextTab[1]} →
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => router.push("/path")}>
            Done · Go to My Path →
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function Personal({ state, patch }: { state: AppState; patch: (fn: (s: AppState) => AppState) => void }) {
  const s = state.student;
  const set = (k: keyof typeof s, v: string) => {
    if (k === "state" || k === "city" || k === "zip" || k === "country") {
      patch((prev) => ({ ...syncResidencePatch(prev, { [k]: v }), onboardingComplete: true }));
      return;
    }
    patch((prev) => ({ ...prev, student: { ...prev.student, [k]: v }, onboardingComplete: true }));
  };
  return (
    <div className="card grid gap-4 p-5 md:grid-cols-2">
      <Field label="First name"><input className="field" value={s.firstName} onChange={(e) => set("firstName", e.target.value)} /></Field>
      <Field label="Last name"><input className="field" value={s.lastName} onChange={(e) => set("lastName", e.target.value)} /></Field>
      <Field label="Email"><input className="field" type="email" value={s.email} onChange={(e) => set("email", e.target.value)} /></Field>
      <Field label="Age"><input className="field" value={s.age} onChange={(e) => set("age", e.target.value)} /></Field>
      <Field label="State">
        <select className="field" value={s.state} onChange={(e) => set("state", e.target.value)}>
          <option value="">Select</option>
          {US_STATES.map((st) => <option key={st}>{st}</option>)}
        </select>
      </Field>
      <Field label="High school">
        <HighSchoolPicker
          stateCode={s.state}
          value={s.highSchool}
          onChange={(name) => set("highSchool", name)}
          onSelectSchool={(school) => {
            patch((prev) => ({
              ...syncResidencePatch(prev, {
                highSchool: school.name,
                city: school.city || prev.student.city,
                state: school.state || prev.student.state,
                zip: school.zip || prev.student.zip,
                latitude: school.latitude,
                longitude: school.longitude,
                country: "United States",
              }),
              onboardingComplete: true,
            }));
          }}
        />
      </Field>
      <Field label="Graduation year"><input className="field" value={s.graduationYear} onChange={(e) => set("graduationYear", e.target.value)} /></Field>
      <Field label="City"><input className="field" value={s.city} onChange={(e) => set("city", e.target.value)} /></Field>
      <Field label="Country"><input className="field" value={s.country} onChange={(e) => set("country", e.target.value)} /></Field>
      {!s.state ? (
        <p className="text-sm text-(--accent-2) md:col-span-2">Set your home state so we can load that state&apos;s high schools and prioritize in-state colleges.</p>
      ) : null}
    </div>
  );
}

function AcademicsAndTesting({ state, patch }: { state: AppState; patch: (fn: (s: AppState) => AppState) => void }) {
  const a = state.academic;
  const t = state.testing;
  const setA = (k: keyof typeof a, v: string) => patch((prev) => ({ ...prev, academic: { ...prev.academic, [k]: v } }));
  return (
    <div className="grid gap-5">
      <div className="card grid gap-4 p-5 md:grid-cols-3">
        <h2 className="serif text-2xl md:col-span-3">Academics</h2>
        <Field label="Weighted GPA"><input className="field" value={a.weightedGpa} onChange={(e) => setA("weightedGpa", e.target.value)} /></Field>
        <Field label="Unweighted GPA"><input className="field" value={a.unweightedGpa} onChange={(e) => setA("unweightedGpa", e.target.value)} /></Field>
        <Field label="GPA scale">
          <select className="field" value={a.gpaScale} onChange={(e) => setA("gpaScale", e.target.value as typeof a.gpaScale)}>
            <option value="4.0">4.0</option><option value="5.0">5.0</option><option value="100">100</option><option value="Other">Other</option>
          </select>
        </Field>
        <Field label="Class rank"><input className="field" value={a.classRank} onChange={(e) => setA("classRank", e.target.value)} /></Field>
        <Field label="Class size"><input className="field" value={a.classSize} onChange={(e) => setA("classSize", e.target.value)} /></Field>
        <Field label="Class percentile"><input className="field" value={a.percentile} onChange={(e) => setA("percentile", e.target.value)} /></Field>
      </div>
      <div className="card p-5">
        <div className="font-semibold">Academic trends</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[["increased", "GPA increased"], ["decreased", "GPA decreased"], ["consistent", "GPA remained relatively consistent"]].map(([id, label]) => (
            <button key={id} type="button" className={`btn ${a.gpaTrend === id ? "btn-primary" : "btn-ghost"}`} onClick={() => setA("gpaTrend", id)}>{label}</button>
          ))}
        </div>
        <Field label="Optional explanation">
          <textarea className="field mt-2 min-h-24" value={a.gpaTrendExplanation} onChange={(e) => setA("gpaTrendExplanation", e.target.value)} />
        </Field>
      </div>
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Coursework</div>
          <button type="button" className="btn btn-primary" onClick={() => patch((p) => ({ ...p, courses: [...p.courses, { id: uid(), name: "", subject: "", level: "AP", grade: "", year: "" }] }))}>
            <Plus size={16} /> Add course
          </button>
        </div>
        <div className="mt-4 grid gap-3">
          {state.courses.map((c) => <CourseRow key={c.id} course={c} patch={patch} />)}
        </div>
      </div>

      <label className="card flex items-center gap-3 p-5">
        <input type="checkbox" checked={t.testOptional} onChange={(e) => patch((p) => ({ ...p, testing: { ...p.testing, testOptional: e.target.checked } }))} />
        <div>
          <div className="font-semibold">Test-optional / no test score</div>
          <div className="text-sm text-(--muted)">Matching will not penalize missing SAT/ACT at test-optional or test-blind universities.</div>
        </div>
      </label>
      <div className="card grid gap-4 p-5 md:grid-cols-4">
        <div className="serif text-2xl md:col-span-4">Testing · SAT</div>
        {(["total", "readingWriting", "math", "date"] as const).map((k) => (
          <Field key={k} label={k === "readingWriting" ? "Reading/Writing" : k[0].toUpperCase() + k.slice(1)}>
            <input className="field" value={t.sat?.[k] ?? ""} onChange={(e) => patch((p) => ({ ...p, testing: { ...p.testing, sat: { total: "", readingWriting: "", math: "", date: "", ...p.testing.sat, [k]: e.target.value } } }))} />
          </Field>
        ))}
      </div>
      <div className="card grid gap-4 p-5 md:grid-cols-3">
        <div className="font-semibold md:col-span-3">ACT</div>
        {(["composite", "english", "math", "reading", "science", "date"] as const).map((k) => (
          <Field key={k} label={k[0].toUpperCase() + k.slice(1)}>
            <input className="field" value={t.act?.[k] ?? ""} onChange={(e) => patch((p) => ({ ...p, testing: { ...p.testing, act: { composite: "", english: "", math: "", reading: "", science: "", date: "", ...p.testing.act, [k]: e.target.value } } }))} />
          </Field>
        ))}
      </div>
      <SubjectBlock title="AP scores" list={t.ap} onChange={(ap) => patch((p) => ({ ...p, testing: { ...p.testing, ap } }))} />
      <SubjectBlock title="IB scores" list={t.ib} onChange={(ib) => patch((p) => ({ ...p, testing: { ...p.testing, ib } }))} />
    </div>
  );
}

function CourseRow({ course, patch }: { course: Course; patch: (fn: (s: AppState) => AppState) => void }) {
  const set = (k: keyof Course, v: string) =>
    patch((p) => ({
      ...p,
      courses: p.courses.map((x) => {
        if (x.id !== course.id) return x;
        const next = { ...x, [k]: v };
        if (k === "name" && (x.level === "AP" || x.level === "IB")) next.subject = inferSubjectFromCourseName(v);
        if (k === "level" && (v === "AP" || v === "IB")) {
          next.name = "";
          next.subject = "";
        }
        return next;
      }),
    }));
  return (
    <div className="grid gap-2 rounded-2xl border border-(--line) p-3 md:grid-cols-6">
      <CourseNamePicker level={course.level} value={course.name} onChange={(name) => set("name", name)} />
      <input className="field" placeholder="Subject" value={course.subject} onChange={(e) => set("subject", e.target.value)} />
      <select className="field" value={course.level} onChange={(e) => set("level", e.target.value as CourseLevel)}>
        <option>AP</option><option>IB</option><option>Honors</option><option>Dual Enrollment</option><option>College</option><option>Other</option>
      </select>
      <input className="field" placeholder="Grade" value={course.grade} onChange={(e) => set("grade", e.target.value)} />
      <input className="field" placeholder="Year taken" value={course.year} onChange={(e) => set("year", e.target.value)} />
      <button type="button" className="btn btn-ghost" onClick={() => patch((p) => ({ ...p, courses: p.courses.filter((x) => x.id !== course.id) }))}><Trash2 size={16} /></button>
    </div>
  );
}

function SubjectBlock({ title, list, onChange }: { title: string; list: { id: string; subject: string; score: string }[]; onChange: (v: { id: string; subject: string; score: string }[]) => void }) {
  const level = title.startsWith("AP") ? "AP" : title.startsWith("IB") ? "IB" : "Other";
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className="font-semibold">{title}</div>
        <button type="button" className="btn btn-primary" onClick={() => onChange([...list, { id: uid(), subject: "", score: "" }])}><Plus size={16} /> Add</button>
      </div>
      <div className="mt-3 grid gap-2">
        {list.map((row) => (
          <div key={row.id} className="grid grid-cols-[1fr_120px_40px] gap-2">
            <CourseNamePicker
              level={level}
              value={row.subject}
              onChange={(subject) => onChange(list.map((x) => (x.id === row.id ? { ...x, subject } : x)))}
              placeholder={`${level} subject`}
            />
            <input className="field" placeholder="Score" value={row.score} onChange={(e) => onChange(list.map((x) => (x.id === row.id ? { ...x, score: e.target.value } : x)))} />
            <button type="button" className="btn btn-ghost" onClick={() => onChange(list.filter((x) => x.id !== row.id))}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function emptyActivity(): Activity {
  return {
    id: uid(), name: "", organization: "", category: "Clubs", position: "", yearsParticipated: "", startDate: "", endDate: "",
    hoursPerWeek: "", weeksPerYear: "", hasLeadership: false, leadershipTitle: "", peopleLed: "", leadershipResponsibilities: "",
    accomplishments: "", createdSomething: false, grewMembership: false, raisedMoney: false, generatedRevenue: false,
    wonAward: false, organizedEvent: false, helpedPeople: false, peopleImpacted: "", recognition: "",
  };
}

function Activities({ state, patch }: { state: AppState; patch: (fn: (s: AppState) => AppState) => void }) {
  const [open, setOpen] = useState<string | null>(state.activities[0]?.id ?? null);
  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <button className="btn btn-primary" onClick={() => { const next = emptyActivity(); patch((p) => ({ ...p, activities: [next, ...p.activities] })); setOpen(next.id); }}>
          <Plus size={16} /> Add activity
        </button>
      </div>
      {state.activities.map((a) => (
        <div key={a.id} className="card overflow-hidden">
          <button className="flex w-full items-center justify-between p-4 text-left" onClick={() => setOpen(open === a.id ? null : a.id)}>
            <div>
              <div className="font-semibold">{a.name || "Untitled activity"}</div>
              <div className="text-sm text-(--muted)">{a.position} {a.organization ? `· ${a.organization}` : ""}</div>
            </div>
            <span className="text-sm text-(--muted)">{open === a.id ? "Hide" : "Edit"}</span>
          </button>
          {open === a.id ? <ActivityEditor activity={a} patch={patch} /> : null}
        </div>
      ))}
    </div>
  );
}

function ActivityEditor({ activity, patch }: { activity: Activity; patch: (fn: (s: AppState) => AppState) => void }) {
  const set = <K extends keyof Activity>(k: K, v: Activity[K]) =>
    patch((p) => ({ ...p, activities: p.activities.map((x) => (x.id === activity.id ? { ...x, [k]: v } : x)) }));
  const bools: [keyof Activity, string][] = [
    ["createdSomething", "Did you create something?"], ["grewMembership", "Did you grow membership?"],
    ["raisedMoney", "Did you raise money?"], ["generatedRevenue", "Did you generate revenue?"],
    ["wonAward", "Did you win an award?"], ["organizedEvent", "Did you organize an event?"],
    ["helpedPeople", "Did you help people?"],
  ];
  return (
    <div className="grid gap-3 border-t border-(--line) p-4 md:grid-cols-2">
      <Field label="Activity name"><input className="field" value={activity.name} onChange={(e) => set("name", e.target.value)} /></Field>
      <Field label="Organization"><input className="field" value={activity.organization} onChange={(e) => set("organization", e.target.value)} /></Field>
      <Field label="Category">
        <select className="field" value={activity.category} onChange={(e) => set("category", e.target.value as Activity["category"])}>
          {ACTIVITY_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Position / title"><input className="field" value={activity.position} onChange={(e) => set("position", e.target.value)} /></Field>
      <Field label="Years participated"><input className="field" value={activity.yearsParticipated} onChange={(e) => set("yearsParticipated", e.target.value)} /></Field>
      <Field label="Start date"><input className="field" type="month" value={activity.startDate} onChange={(e) => set("startDate", e.target.value)} /></Field>
      <Field label="End date"><input className="field" value={activity.endDate} onChange={(e) => set("endDate", e.target.value)} placeholder="Present or YYYY-MM" /></Field>
      <Field label="Hours per week"><input className="field" value={activity.hoursPerWeek} onChange={(e) => set("hoursPerWeek", e.target.value)} /></Field>
      <Field label="Weeks per year"><input className="field" value={activity.weeksPerYear} onChange={(e) => set("weeksPerYear", e.target.value)} /></Field>
      <label className="flex items-center gap-2 md:col-span-2">
        <input type="checkbox" checked={activity.hasLeadership} onChange={(e) => set("hasLeadership", e.target.checked)} />
        Did you hold a leadership position?
      </label>
      {activity.hasLeadership ? (
        <>
          <Field label="Leadership title"><input className="field" value={activity.leadershipTitle} onChange={(e) => set("leadershipTitle", e.target.value)} /></Field>
          <Field label="Number of people led"><input className="field" value={activity.peopleLed} onChange={(e) => set("peopleLed", e.target.value)} /></Field>
          <div className="md:col-span-2"><Field label="Responsibilities"><textarea className="field min-h-20" value={activity.leadershipResponsibilities} onChange={(e) => set("leadershipResponsibilities", e.target.value)} /></Field></div>
        </>
      ) : null}
      <div className="md:col-span-2"><Field label="What did you accomplish?"><textarea className="field min-h-28" value={activity.accomplishments} onChange={(e) => set("accomplishments", e.target.value)} /></Field></div>
      {bools.map(([k, label]) => (
        <label key={k} className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={Boolean(activity[k])} onChange={(e) => set(k, e.target.checked as never)} /> {label}
        </label>
      ))}
      <Field label="How many people did you impact?"><input className="field" value={activity.peopleImpacted} onChange={(e) => set("peopleImpacted", e.target.value)} /></Field>
      <Field label="Regional / state / national recognition">
        <select className="field" value={activity.recognition} onChange={(e) => set("recognition", e.target.value as Activity["recognition"])}>
          <option value="">Select</option><option>None</option><option>Regional</option><option>State</option><option>National</option>
        </select>
      </Field>
      <button className="btn btn-ghost md:col-span-2" onClick={() => patch((p) => ({ ...p, activities: p.activities.filter((x) => x.id !== activity.id) }))}>Remove activity</button>
    </div>
  );
}

function emptyWork(): WorkExperience {
  return { id: uid(), employer: "", position: "", startDate: "", endDate: "", hoursPerWeek: "", paid: "", description: "", accomplishments: "", leadershipResponsibilities: "", revenueGenerated: "", peopleManaged: "", quantifiableResults: "" };
}

function Work({ state, patch }: { state: AppState; patch: (fn: (s: AppState) => AppState) => void }) {
  const setW = (id: string, k: keyof WorkExperience, v: string) =>
    patch((p) => ({ ...p, work: p.work.map((x) => (x.id === id ? { ...x, [k]: v } : x)) }));
  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <button className="btn btn-primary" onClick={() => patch((p) => ({ ...p, work: [emptyWork(), ...p.work] }))}><Plus size={16} /> Add job / internship</button>
      </div>
      {state.work.map((w) => (
        <div key={w.id} className="card grid gap-3 p-5 md:grid-cols-2">
          <Field label="Employer"><input className="field" value={w.employer} onChange={(e) => setW(w.id, "employer", e.target.value)} /></Field>
          <Field label="Position"><input className="field" value={w.position} onChange={(e) => setW(w.id, "position", e.target.value)} /></Field>
          <Field label="Start date"><input className="field" type="month" value={w.startDate} onChange={(e) => setW(w.id, "startDate", e.target.value)} /></Field>
          <Field label="End date"><input className="field" value={w.endDate} onChange={(e) => setW(w.id, "endDate", e.target.value)} /></Field>
          <Field label="Hours per week"><input className="field" value={w.hoursPerWeek} onChange={(e) => setW(w.id, "hoursPerWeek", e.target.value)} /></Field>
          <Field label="Paid / unpaid">
            <select className="field" value={w.paid} onChange={(e) => setW(w.id, "paid", e.target.value)}>
              <option value="">Select</option><option>Paid</option><option>Unpaid</option>
            </select>
          </Field>
          <div className="md:col-span-2"><Field label="Description"><textarea className="field min-h-20" value={w.description} onChange={(e) => setW(w.id, "description", e.target.value)} /></Field></div>
          <div className="md:col-span-2"><Field label="Major accomplishments"><textarea className="field min-h-20" value={w.accomplishments} onChange={(e) => setW(w.id, "accomplishments", e.target.value)} /></Field></div>
          <Field label="Leadership responsibilities"><input className="field" value={w.leadershipResponsibilities} onChange={(e) => setW(w.id, "leadershipResponsibilities", e.target.value)} /></Field>
          <Field label="Revenue generated (only if real)"><input className="field" value={w.revenueGenerated} onChange={(e) => setW(w.id, "revenueGenerated", e.target.value)} /></Field>
          <Field label="People managed"><input className="field" value={w.peopleManaged} onChange={(e) => setW(w.id, "peopleManaged", e.target.value)} /></Field>
          <Field label="Quantifiable results"><input className="field" value={w.quantifiableResults} onChange={(e) => setW(w.id, "quantifiableResults", e.target.value)} /></Field>
          <button className="btn btn-ghost md:col-span-2" onClick={() => patch((p) => ({ ...p, work: p.work.filter((x) => x.id !== w.id) }))}>Remove</button>
        </div>
      ))}
    </div>
  );
}

function Awards({ state, patch }: { state: AppState; patch: (fn: (s: AppState) => AppState) => void }) {
  const setA = (id: string, k: keyof Award, v: string) =>
    patch((p) => ({ ...p, awards: p.awards.map((x) => (x.id === id ? { ...x, [k]: v } : x)) }));
  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <button className="btn btn-primary" onClick={() => patch((p) => ({ ...p, awards: [{ id: uid(), name: "", organization: "", date: "", level: "School", description: "" }, ...p.awards] }))}>
          <Plus size={16} /> Add award
        </button>
      </div>
      {state.awards.map((a) => (
        <div key={a.id} className="card grid gap-3 p-5 md:grid-cols-2">
          <Field label="Award name"><input className="field" value={a.name} onChange={(e) => setA(a.id, "name", e.target.value)} /></Field>
          <Field label="Organization"><input className="field" value={a.organization} onChange={(e) => setA(a.id, "organization", e.target.value)} /></Field>
          <Field label="Date"><input className="field" type="month" value={a.date} onChange={(e) => setA(a.id, "date", e.target.value)} /></Field>
          <Field label="Level">
            <select className="field" value={a.level} onChange={(e) => setA(a.id, "level", e.target.value)}>
              <option>School</option><option>Local</option><option>Regional</option><option>State</option><option>National</option><option>International</option>
            </select>
          </Field>
          <div className="md:col-span-2"><Field label="What did you do to earn this?"><textarea className="field min-h-20" value={a.description} onChange={(e) => setA(a.id, "description", e.target.value)} /></Field></div>
          <button className="btn btn-ghost md:col-span-2" onClick={() => patch((p) => ({ ...p, awards: p.awards.filter((x) => x.id !== a.id) }))}>Remove</button>
        </div>
      ))}
    </div>
  );
}

function TagInput({ values, onChange, placeholder }: { values: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState("");
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2">
        {values.map((v) => <button key={v} className="chip" onClick={() => onChange(values.filter((x) => x !== v))}>{v} ×</button>)}
      </div>
      <input className="field" placeholder={placeholder} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => {
        if (e.key === "Enter" && draft.trim()) { e.preventDefault(); onChange([...values, draft.trim()]); setDraft(""); }
      }} />
    </div>
  );
}

function Career({ state, patch }: { state: AppState; patch: (fn: (s: AppState) => AppState) => void }) {
  const c = state.career;
  const set = (k: keyof typeof c, v: typeof c[typeof k]) => patch((p) => ({ ...p, career: { ...p.career, [k]: v } }));
  return (
    <div className="card grid gap-4 p-5 md:grid-cols-2">
      <div><div className="label">Intended career (press Enter to add)</div><TagInput values={c.intendedCareers} onChange={(v) => set("intendedCareers", v)} placeholder="e.g. Software engineering" /></div>
      <div><div className="label">Intended major(s)</div><TagInput values={c.intendedMajors} onChange={(v) => set("intendedMajors", v)} placeholder="e.g. Computer Science" /></div>
      <div className="md:col-span-2">
        <div className="label">Industry</div>
        <div className="flex flex-wrap gap-2">
          {INDUSTRIES.map((ind) => (
            <button key={ind} className={`btn ${c.industries.includes(ind) ? "btn-primary" : "btn-ghost"}`} onClick={() => set("industries", c.industries.includes(ind) ? c.industries.filter((x) => x !== ind) : [...c.industries, ind])}>{ind}</button>
          ))}
        </div>
      </div>
      <Field label="Desired salary range"><input className="field" value={c.salaryRange} onChange={(e) => set("salaryRange", e.target.value)} /></Field>
      <Field label="Graduate school interest">
        <select className="field" value={c.graduateSchoolInterest} onChange={(e) => set("graduateSchoolInterest", e.target.value)}>
          <option>No</option><option>Undecided</option><option>Maybe later</option><option>Yes</option>
        </select>
      </Field>
      <div><div className="label">Work environment</div><TagInput values={c.workEnvironment} onChange={(v) => set("workEnvironment", v)} placeholder="e.g. Collaborative" /></div>
      <div><div className="label">Career geographic preferences</div><TagInput values={c.geographicPreferences} onChange={(v) => set("geographicPreferences", v)} placeholder="e.g. Texas" /></div>
      <div><div className="label">Remote / hybrid / in-person</div><TagInput values={c.workMode} onChange={(v) => set("workMode", v)} placeholder="e.g. Hybrid" /></div>
      <div><div className="label">Company size</div><TagInput values={c.companySize} onChange={(v) => set("companySize", v)} placeholder="e.g. Startup" /></div>
      <Field label="Professional school interest"><input className="field" value={c.professionalSchoolInterest} onChange={(e) => set("professionalSchoolInterest", e.target.value)} /></Field>
    </div>
  );
}

function Preferences({ state, patch }: { state: AppState; patch: (fn: (s: AppState) => AppState) => void }) {
  const p = state.preferences;
  const setSlider = (k: keyof typeof p.campusSliders, v: number) =>
    patch((s) => ({ ...s, preferences: { ...s.preferences, campusSliders: { ...s.preferences.campusSliders, [k]: v } } }));
  return (
    <div className="grid gap-5">
      <div className="card p-5">
        <h2 className="serif text-3xl">What does your ideal college look like?</h2>
        <p className="mt-1 text-sm text-(--muted)">
          Everything starts at Neutral (weight 0) and only affects matching after you change it. Overall Match prioritizes admission odds first.
        </p>
      </div>
      <div className="card p-5">
        <h3 className="font-semibold">Academic preferences</h3>
        <div className="mt-4 grid gap-3">
          {ACADEMIC_PREF_KEYS.map(([key, label]) => (
            <div key={key} className="grid items-center gap-2 md:grid-cols-[220px_1fr]">
              <div className="text-sm">{label}</div>
              <select className="field" value={p.academic[key]} onChange={(e) => patch((s) => ({ ...s, preferences: { ...s.preferences, academic: { ...s.preferences.academic, [key]: e.target.value as Importance } } }))}>
                {IMPORTANCE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>
      <div className="card grid gap-5 p-5">
        <h3 className="font-semibold">Campus preferences</h3>
        <Slider label="School size" left="Small" right="Very large" value={p.campusSliders.schoolSize} onChange={(v) => setSlider("schoolSize", v)} />
        <Slider label="Setting" left="Urban" right="Rural" value={p.campusSliders.urbanRural} onChange={(v) => setSlider("urbanRural", v)} />
        <Slider label="Campus feel" left="Traditional" right="Modern" value={p.campusSliders.traditionalModern} onChange={(v) => setSlider("traditionalModern", v)} />
        <Slider label="Class size" left="Small classes" right="Large classes" value={p.campusSliders.classSize} onChange={(v) => setSlider("classSize", v)} />
        {CAMPUS_PREF_KEYS.map(([key, label]) => (
          <div key={key} className="grid items-center gap-2 md:grid-cols-[220px_1fr]">
            <div className="text-sm">{label}</div>
            <select className="field" value={p.campus[key]} onChange={(e) => patch((s) => ({ ...s, preferences: { ...s.preferences, campus: { ...s.preferences.campus, [key]: e.target.value as Importance } } }))}>
              {IMPORTANCE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>
      <div className="card grid gap-4 p-5 md:grid-cols-2">
        <h3 className="font-semibold md:col-span-2">Geographic preferences</h3>
        <div><div className="label">Preferred states</div><StateMulti values={p.geographic.preferredStates} onChange={(v) => patch((s) => ({ ...s, preferences: { ...s.preferences, geographic: { ...s.preferences.geographic, preferredStates: v } } }))} /></div>
        <div><div className="label">States willing to consider</div><StateMulti values={p.geographic.considerStates} onChange={(v) => patch((s) => ({ ...s, preferences: { ...s.preferences, geographic: { ...s.preferences.geographic, considerStates: v } } }))} /></div>
        <div><div className="label">States unwilling to attend</div><StateMulti values={p.geographic.unwillingStates} onChange={(v) => patch((s) => ({ ...s, preferences: { ...s.preferences, geographic: { ...s.preferences.geographic, unwillingStates: v } } }))} /></div>
        <Field label="Maximum distance from home (miles)">
          <input className="field" value={p.geographic.maxDistanceMiles} onChange={(e) => patch((s) => ({ ...s, preferences: { ...s.preferences, geographic: { ...s.preferences.geographic, maxDistanceMiles: e.target.value } } }))} />
        </Field>
      </div>
      <div className="card p-5">
        <h3 className="font-semibold">Lifestyle</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {LIFESTYLE_TAGS.map((tag) => (
            <button key={tag} className={`btn ${p.lifestyle.tags.includes(tag) ? "btn-primary" : "btn-ghost"}`} onClick={() => patch((s) => ({ ...s, preferences: { ...s.preferences, lifestyle: { tags: p.lifestyle.tags.includes(tag) ? p.lifestyle.tags.filter((x) => x !== tag) : [...p.lifestyle.tags, tag] } } }))}>{tag}</button>
          ))}
        </div>
      </div>
      <div className="card grid gap-4 p-5 md:grid-cols-2">
        <h3 className="font-semibold md:col-span-2">Financial preferences</h3>
        <Field label="Maximum annual cost"><input className="field" value={p.financial.maxAnnualCost} onChange={(e) => patch((s) => ({ ...s, preferences: { ...s.preferences, financial: { ...s.preferences.financial, maxAnnualCost: e.target.value } } }))} /></Field>
        <Field label="Importance of financial aid">
          <select className="field" value={p.financial.financialAidImportance} onChange={(e) => patch((s) => ({ ...s, preferences: { ...s.preferences, financial: { ...s.preferences.financial, financialAidImportance: e.target.value as Importance } } }))}>
            {IMPORTANCE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Maximum acceptable student debt"><input className="field" value={p.financial.maxStudentDebt} onChange={(e) => patch((s) => ({ ...s, preferences: { ...s.preferences, financial: { ...s.preferences.financial, maxStudentDebt: e.target.value } } }))} /></Field>
        <label className="flex items-center gap-2"><input type="checkbox" checked={p.financial.needBasedAid} onChange={(e) => patch((s) => ({ ...s, preferences: { ...s.preferences, financial: { ...s.preferences.financial, needBasedAid: e.target.checked } } }))} /> Need-based aid matters</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={p.financial.meritScholarships} onChange={(e) => patch((s) => ({ ...s, preferences: { ...s.preferences, financial: { ...s.preferences.financial, meritScholarships: e.target.checked } } }))} /> Merit scholarships matter</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={p.financial.willingOutOfState} onChange={(e) => patch((s) => ({ ...s, preferences: { ...s.preferences, financial: { ...s.preferences.financial, willingOutOfState: e.target.checked } } }))} /> Willing to attend out-of-state</label>
      </div>
    </div>
  );
}

function Slider({ label, left, right, value, onChange }: { label: string; left: string; right: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="mb-1 text-sm font-semibold">{label}</div>
      <input type="range" min={0} max={100} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-(--accent)" />
      <div className="flex justify-between text-xs text-(--muted)"><span>{left}</span><span>{right}</span></div>
    </div>
  );
}

function StateMulti({ values, onChange }: { values: string[]; onChange: (v: string[]) => void }) {
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1">
        {values.map((v) => <button key={v} type="button" className="chip" onClick={() => onChange(values.filter((x) => x !== v))}>{v} ×</button>)}
      </div>
      <select className="field" value="" onChange={(e) => e.target.value && onChange([...new Set([...values, e.target.value])])}>
        <option value="">Add state</option>
        {US_STATES.map((s) => <option key={s}>{s}</option>)}
      </select>
    </div>
  );
}
