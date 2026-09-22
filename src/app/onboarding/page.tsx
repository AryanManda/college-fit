"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "../../lib/store";
import { PageHeader } from "../../components/ui";
import { LabelWithInfo } from "../../components/InfoTip";
import { US_STATES } from "../../lib/constants";
import { syncResidencePatch } from "../../lib/location-prefs";
import { HighSchoolPicker } from "../../components/HighSchoolPicker";

export default function OnboardingPage() {
  const { state, setState } = useStore();
  const router = useRouter();
  const s = state.student;

  const finish = () => {
    setState((p) => ({ ...p, onboardingComplete: true }));
    router.push("/upload");
  };

  return (
    <div>
      <PageHeader
        eyebrow="Welcome"
        title="Build your path"
        subtitle="Find careers that fit you. Find schools you can realistically get into."
      />
      <div className="card mb-5 p-5">
        <p className="text-sm text-(--muted)">
          We&apos;ll learn about your interests, academics, experience, and goals to help you build a realistic path from where you are today to where you want to go.
        </p>
        <p className="mt-2 text-sm font-medium text-(--accent-2)">
          Tip: set your home state now so we can prioritize that state&apos;s schools. Also add GPA and testing so odds estimates stay honest.
        </p>
      </div>
      <div className="card grid gap-4 p-5 md:grid-cols-2">
        <label className="block">
          <span className="label">First name</span>
          <input className="field" value={s.firstName} onChange={(e) => setState((p) => ({ ...p, student: { ...p.student, firstName: e.target.value } }))} />
        </label>
        <label className="block">
          <span className="label">Last name</span>
          <input className="field" value={s.lastName} onChange={(e) => setState((p) => ({ ...p, student: { ...p.student, lastName: e.target.value } }))} />
        </label>
        <label className="block">
          <span className="label">Email (optional)</span>
          <input className="field" type="email" value={s.email} onChange={(e) => setState((p) => ({ ...p, student: { ...p.student, email: e.target.value } }))} />
        </label>
        <label className="block">
          <span className="label">State</span>
          <select
            className="field"
            value={s.state}
            onChange={(e) => setState((p) => syncResidencePatch(p, { state: e.target.value }))}
          >
            <option value="">Select state</option>
            {US_STATES.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </label>
        <label className="block md:col-span-2">
          <span className="label">High school</span>
          <HighSchoolPicker
            stateCode={s.state}
            value={s.highSchool}
            onChange={(name) => setState((p) => ({ ...p, student: { ...p.student, highSchool: name } }))}
            onSelectSchool={(school) => {
              setState((p) =>
                syncResidencePatch(p, {
                  highSchool: school.name,
                  city: school.city || p.student.city,
                  state: school.state || p.student.state,
                  zip: school.zip || p.student.zip,
                  latitude: school.latitude,
                  longitude: school.longitude,
                  country: "United States",
                }),
              );
            }}
          />
        </label>
        <label className="block">
          <span className="label"><LabelWithInfo label="Graduation year" term="Graduation year" /></span>
          <input className="field" value={s.graduationYear} onChange={(e) => setState((p) => ({ ...p, student: { ...p.student, graduationYear: e.target.value } }))} />
        </label>
        <label className="block">
          <span className="label">City</span>
          <input className="field" value={s.city} onChange={(e) => setState((p) => syncResidencePatch(p, { city: e.target.value }))} />
        </label>
        <label className="block">
          <span className="label"><LabelWithInfo label="Unweighted GPA" term="Unweighted GPA" /></span>
          <input className="field" value={state.academic.unweightedGpa} onChange={(e) => setState((p) => ({ ...p, academic: { ...p.academic, unweightedGpa: e.target.value } }))} />
        </label>
        <label className="block">
          <span className="label"><LabelWithInfo label="Class rank" term="Class Rank" /></span>
          <input className="field" value={state.academic.classRank} onChange={(e) => setState((p) => ({ ...p, academic: { ...p.academic, classRank: e.target.value } }))} />
        </label>
        <label className="block md:col-span-2">
          <span className="label">SAT total (optional)</span>
          <input className="field" value={state.testing.sat?.total ?? ""} onChange={(e) => setState((p) => ({ ...p, testing: { ...p.testing, sat: { total: e.target.value, readingWriting: p.testing.sat?.readingWriting ?? "", math: p.testing.sat?.math ?? "", date: p.testing.sat?.date ?? "" } } }))} />
        </label>
      </div>
      <p className="mb-4 text-sm text-(--muted)">
        Next: activities, budget, and career goals in <Link href="/profile" className="font-semibold text-(--accent)">Profile</Link>. Then continue to career discovery.
      </p>
      <button type="button" className="btn btn-primary" onClick={finish}>Continue to document upload</button>
    </div>
  );
}
