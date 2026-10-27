"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { AppState } from "./types";
import { demoState, emptyState } from "./defaults";
import { getSessionEmail, saveAccountProfile } from "./auth-local";
import {
  type AccessRecord,
  FULL_BACKUP_KEY,
  hasFullBackup,
  isDemoStudent,
  readAccess,
  writeAccess,
} from "./access";

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

function hasOwnProfile(state: AppState) {
  if (isDemoStudent(state.student, state.accountEmail)) return false;
  return Boolean(state.accountEmail || state.student.firstName || state.student.lastName || state.onboardingComplete);
}

type Store = {
  state: AppState;
  hydrated: boolean;
  access: AccessRecord | null;
  canRestoreFull: boolean;
  setState: (updater: AppState | ((prev: AppState) => AppState)) => void;
  reset: () => void;
  loadDemo: () => void;
  enterSample: () => void;
  enterFull: (email?: string) => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setStateRaw] = useState<AppState>(emptyState);
  const [hydrated, setHydrated] = useState(false);
  const [access, setAccess] = useState<AccessRecord | null>(null);
  const [canRestoreFull, setCanRestoreFull] = useState(false);
  const stateRef = useRef(state);
  const accessRef = useRef(access);
  stateRef.current = state;
  accessRef.current = access;

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
      let savedAccess = readAccess();
      if (!savedAccess && hasOwnProfile(next)) {
        savedAccess = { mode: "full", startedAt: new Date().toISOString() };
        writeAccess(savedAccess);
      }
      setAccess(savedAccess);
      setCanRestoreFull(hasFullBackup());
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

  const enterSample = useCallback(() => {
    const prev = stateRef.current;
    if (hasOwnProfile(prev)) {
      localStorage.setItem(FULL_BACKUP_KEY, JSON.stringify(prev));
      setCanRestoreFull(true);
    }
    setStateRaw(demoState());
    const next: AccessRecord = {
      mode: "sample",
      email: accessRef.current?.email,
      startedAt: new Date().toISOString(),
    };
    writeAccess(next);
    setAccess(next);
  }, []);

  const enterFull = useCallback((email?: string) => {
    const backupRaw = localStorage.getItem(FULL_BACKUP_KEY);
    if (backupRaw) {
      try {
        setStateRaw(mergeState(JSON.parse(backupRaw) as Partial<AppState>));
      } catch {
        setStateRaw(emptyState());
      }
      localStorage.removeItem(FULL_BACKUP_KEY);
      setCanRestoreFull(false);
    } else {
      setStateRaw((prev) => (isDemoStudent(prev.student, prev.accountEmail) ? emptyState() : prev));
    }
    const next: AccessRecord = {
      mode: "full",
      email: email?.trim() || accessRef.current?.email,
      startedAt: accessRef.current?.startedAt || new Date().toISOString(),
    };
    writeAccess(next);
    setAccess(next);
  }, []);

  const value = useMemo(
    () => ({ state, hydrated, access, canRestoreFull, setState, reset, loadDemo, enterSample, enterFull }),
    [state, hydrated, access, canRestoreFull, setState, reset, loadDemo, enterSample, enterFull],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
