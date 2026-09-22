"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "../../../lib/store";
import { PageHeader } from "../../../components/ui";
import {
  ACADEMIC_SUBJECTS,
  INTEREST_OPTIONS,
  VALUE_LABELS,
  WORK_ENV_OPTIONS,
  WORK_STYLE_OPTIONS,
} from "../../../lib/career-assessment-data";
import { topCareers } from "../../../lib/career-matching";
import type { CareerAssessment } from "../../../lib/types";
import { CareerFlowNav, CareerGoalsEditor } from "../../../components/CareerGoalsEditor";

const STEPS = ["Interests", "Environment", "Work style", "Values", "Academics"];
const ALT_STEPS = ["Passions", "Daily energy", "Collaboration", "Impact", "Subjects"];

function stepIsValid(step: number, a: CareerAssessment) {
  if (step === 0) return a.interests.length > 0;
  if (step === 1) return a.workEnvironments.length > 0;
  if (step === 2) return a.workStyles.length > 0;
  return true;
}

function stepHint(step: number) {
  if (step === 0) return "Select at least one interest to continue.";
  if (step === 1) return "Select at least one work environment to continue.";
  if (step === 2) return "Select at least one work style to continue.";
  return "";
}

export default function CareerAssessmentPage() {
  const { state, setState } = useStore();
  const router = useRouter();
  const search = useSearchParams();
  const alternate = search.get("style") === "alternate";
  const labels = alternate ? ALT_STEPS : STEPS;
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const a = state.careerAssessment;

  const toggle = (key: "interests" | "workEnvironments" | "workStyles", value: string) => {
    setStepError(null);
    setState((p) => {
      const list = p.careerAssessment[key];
      const next = list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
      return { ...p, careerAssessment: { ...p.careerAssessment, [key]: next } };
    });
  };

  const setSlider = (kind: "values" | "academicInterests", key: string, n: number) => {
    setState((p) => ({
      ...p,
      careerAssessment: {
        ...p.careerAssessment,
        [kind]: { ...p.careerAssessment[kind], [key]: n },
      },
    }));
  };

  const goBack = () => {
    setStepError(null);
    if (step === 0) {
      router.push("/career");
      return;
    }
    setStep((s) => s - 1);
  };

  const goNext = () => {
    if (!stepIsValid(step, a)) {
      setStepError(stepHint(step));
      return;
    }
    setStepError(null);
    setStep((s) => s + 1);
  };

  const finish = () => {
    setState((p) => {
      const values = { ...p.careerAssessment.values };
      const academicInterests = { ...p.careerAssessment.academicInterests };
      for (const k of Object.keys(VALUE_LABELS)) {
        if (values[k] == null) values[k] = 3;
      }
      for (const sub of ACADEMIC_SUBJECTS) {
        if (academicInterests[sub] == null) academicInterests[sub] = 3;
      }
      const next = {
        ...p,
        careerAssessment: {
          ...p.careerAssessment,
          completed: true,
          values,
          academicInterests,
        },
      };
      const top = topCareers(next, 1)[0];
      return {
        ...next,
        careerAssessment: {
          ...next.careerAssessment,
          primaryCareerId: top?.career.id ?? next.careerAssessment.primaryCareerId,
        },
      };
    });
    router.push("/career/matches");
  };

  const selectedCount =
    step === 0 ? a.interests.length :
    step === 1 ? a.workEnvironments.length :
    step === 2 ? a.workStyles.length :
    0;

  return (
    <div>
      <PageHeader
        title={alternate ? "Alternate career assessment" : "Career assessment"}
        subtitle={`Step ${step + 1} of ${labels.length}: ${labels[step]}${alternate ? " · different framing, same core insights" : ""}`}
      />
      <CareerFlowNav />
      <CareerGoalsEditor compact />
      <div className="mb-4 flex gap-2">
        {labels.map((label, i) => (
          <div
            key={label}
            className={`h-2 flex-1 rounded-full transition ${i <= step ? "bg-(--accent)" : "bg-(--line)"}`}
            title={label}
          />
        ))}
      </div>
      <div className="card p-5">
        {step === 0 ? (
          <>
            <h2 className="font-semibold">What sounds most interesting to you?</h2>
            <p className="mt-1 text-sm text-(--muted)">Choose all that apply. {selectedCount ? `${selectedCount} selected.` : ""}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((o) => (
                <button key={o} type="button" className={`btn ${a.interests.includes(o) ? "btn-primary" : "btn-ghost"}`} onClick={() => toggle("interests", o)}>{o}</button>
              ))}
            </div>
          </>
        ) : null}
        {step === 1 ? (
          <>
            <h2 className="font-semibold">Where would you rather spend most of your workday?</h2>
            <p className="mt-1 text-sm text-(--muted)">Choose all that apply. {selectedCount ? `${selectedCount} selected.` : ""}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {WORK_ENV_OPTIONS.map((o) => (
                <button key={o} type="button" className={`btn ${a.workEnvironments.includes(o) ? "btn-primary" : "btn-ghost"}`} onClick={() => toggle("workEnvironments", o)}>{o}</button>
              ))}
            </div>
          </>
        ) : null}
        {step === 2 ? (
          <>
            <h2 className="font-semibold">Which sounds most like you?</h2>
            <p className="mt-1 text-sm text-(--muted)">Choose all that apply. {selectedCount ? `${selectedCount} selected.` : ""}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {WORK_STYLE_OPTIONS.map((o) => (
                <button key={o.id} type="button" className={`btn ${a.workStyles.includes(o.id) ? "btn-primary" : "btn-ghost"}`} onClick={() => toggle("workStyles", o.id)}>{o.label}</button>
              ))}
            </div>
          </>
        ) : null}
        {step === 3 ? (
          <>
            <h2 className="font-semibold">How important are these to you? (1–5)</h2>
            <div className="mt-4 grid gap-4">
              {Object.entries(VALUE_LABELS).map(([k, label]) => (
                <label key={k} className="text-sm">{label}: {a.values[k] ?? 3}
                  <input type="range" min={1} max={5} value={a.values[k] ?? 3} onChange={(e) => setSlider("values", k, Number(e.target.value))} className="mt-1 w-full accent-(--accent)" />
                </label>
              ))}
            </div>
          </>
        ) : null}
        {step === 4 ? (
          <>
            <h2 className="font-semibold">Rate your academic interests (1–5)</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {ACADEMIC_SUBJECTS.map((sub) => (
                <label key={sub} className="text-sm">{sub}: {a.academicInterests[sub] ?? 3}
                  <input type="range" min={1} max={5} value={a.academicInterests[sub] ?? 3} onChange={(e) => setSlider("academicInterests", sub, Number(e.target.value))} className="mt-1 w-full accent-(--accent)" />
                </label>
              ))}
            </div>
          </>
        ) : null}
        {stepError ? (
          <p className="mt-4 text-sm font-semibold text-(--accent-2)">{stepError}</p>
        ) : null}
        <div className="mt-6 flex justify-between">
          <button type="button" className="btn btn-ghost" onClick={goBack}>{step === 0 ? "← Back to Career" : "Back"}</button>
          {step < labels.length - 1 ? (
            <button type="button" className="btn btn-primary" onClick={goNext}>Next</button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={finish}>See my career matches</button>
          )}
        </div>
      </div>
    </div>
  );
}
