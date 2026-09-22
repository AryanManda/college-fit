import type { AppState } from "./types";
import { emptyState } from "./defaults";

/** Safe merge for account restore (mirrors store mergeState). */
export function mergeStateSafe(saved: Partial<AppState> | null): AppState {
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
      academicInterests: {
        ...base.careerAssessment.academicInterests,
        ...saved.careerAssessment?.academicInterests,
      },
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
