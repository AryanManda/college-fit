"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AppState } from "./types";
import { demoState, emptyState } from "./defaults";
import { getSessionEmail, saveAccountProfile } from "./auth-local";

const KEY = "aether.collegefit.v4";
const OLD_KEYS = ["aether.collegefit.v3", "aether.collegefit.v2", "aether.collegefit.v1"];

function mergeState(saved: Partial<AppState> | null): AppState {
  const base = emptyState();
  if (!saved) return base;
  return {
    ...base,
    ...saved,
    student: { ...base.student, ...saved.student },
    academic: { ...base.academic, ...saved.academic },
    courses: saved.courses ?? base.courses,
    testing: { ...base.testing, ...saved.testing },
    activities: saved.activities ?? base.activities,
    work: saved.work ?? base.work,
    awards: saved.awards ?? base.awards,
    career: { ...base.career, ...saved.career },
    careerAssessment: {
      ...base.careerAssessment,
      ...saved.careerAssessment,
      feedback: { ...base.careerAssessment.feedback, ...saved.careerAssessment?.feedback },
      values: { ...base.careerAssessment.values, ...saved.careerAssessment?.values },
      academicInterests: { ...base.careerAssessment.academicInterests, ...saved.careerAssessment?.academicInterests },
    },
    savedCareerIds: saved.savedCareerIds ?? base.savedCareerIds,
    preferences: {
      ...base.preferences,
      ...saved.preferences,
      academic: { ...base.preferences.academic, ...saved.preferences?.academic },
      campusSliders: { ...base.preferences.campusSliders, ...saved.preferences?.campusSliders },
      campus: { ...base.preferences.campus, ...saved.preferences?.campus },
      geographic: { ...base.preferences.geographic, ...saved.preferences?.geographic },
      lifestyle: { ...base.preferences.lifestyle, ...saved.preferences?.lifestyle },
      financial: { ...base.preferences.financial, ...saved.preferences?.financial },
    },
    savedCollegeIds: saved.savedCollegeIds ?? base.savedCollegeIds,
    banishedCollegeIds: saved.banishedCollegeIds ?? base.banishedCollegeIds,
    compareIds: saved.compareIds ?? base.compareIds,
    resumes: saved.resumes ?? base.resumes,
    activeResumeId: saved.activeResumeId ?? base.activeResumeId,
    onboardingComplete: saved.onboardingComplete ?? false,
    accountEmail: saved.accountEmail ?? null,
    profileRevisions: saved.profileRevisions ?? [],
  };
}

type Store = {
  state: AppState;
  hydrated: boolean;
  setState: (updater: AppState | ((prev: AppState) => AppState)) => void;
  reset: () => void;
  loadDemo: () => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setStateRaw] = useState<AppState>(emptyState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      let raw: string | null = null;
      for (const k of [KEY, ...OLD_KEYS]) {
        raw = localStorage.getItem(k);
        if (raw) break;
      }
      let next = mergeState(raw ? (JSON.parse(raw) as Partial<AppState>) : null);
      const session = getSessionEmail();
      if (session && !next.accountEmail) next = { ...next, accountEmail: session };
      setStateRaw(next);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(KEY, JSON.stringify(state));
    if (state.accountEmail) {
      try {
        saveAccountProfile(state.accountEmail, state);
      } catch {
        /* ignore */
      }
    }
  }, [state, hydrated]);

  const setState = useCallback((updater: AppState | ((prev: AppState) => AppState)) => {
    setStateRaw((prev) => (typeof updater === "function" ? updater(prev) : updater));
  }, []);

  const reset = useCallback(() => setStateRaw(emptyState()), []);
  const loadDemo = useCallback(() => setStateRaw(demoState()), []);

  const value = useMemo(
    () => ({ state, hydrated, setState, reset, loadDemo }),
    [state, hydrated, setState, reset, loadDemo],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
