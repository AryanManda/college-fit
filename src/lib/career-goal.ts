import type { AppState } from "./types";
import { CAREERS, getCareer, type CareerProfile } from "../data/careers";

/** Student has a direction — either self-declared or from assessment. Assessment is optional. */
export function hasCareerGoal(state: AppState) {
  return Boolean(
    state.careerAssessment.primaryCareerId ||
      state.career.intendedCareers.some((c) => c.trim()) ||
      state.career.intendedMajors.some((m) => m.trim()),
  );
}

/** Assessment was finished — useful for “explore” matches, not required for pathing. */
export function careerAssessmentComplete(state: AppState) {
  return state.careerAssessment.completed;
}

export function careerGoalLabel(state: AppState) {
  const fromId = getCareer(state.careerAssessment.primaryCareerId)?.title;
  return fromId || state.career.intendedCareers[0]?.trim() || "";
}

export function findCareerMatch(query: string): CareerProfile | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  return (
    CAREERS.find((c) => c.title.toLowerCase() === q || c.shortTitle.toLowerCase() === q) ||
    CAREERS.find((c) => c.title.toLowerCase().includes(q) || q.includes(c.shortTitle.toLowerCase())) ||
    CAREERS.find((c) => c.tags.some((t) => t.toLowerCase() === q || q.includes(t.toLowerCase())))
  );
}

/** Apply a known career (catalog id or free-text). Skips assessment. */
export function applyKnownCareer(state: AppState, input: {
  careerId?: string;
  careerTitle?: string;
  majors?: string[];
}): AppState {
  const fromId = input.careerId ? getCareer(input.careerId) : undefined;
  const fromTitle = !fromId && input.careerTitle ? findCareerMatch(input.careerTitle) : undefined;
  const matched = fromId ?? fromTitle;
  const title = matched?.title || input.careerTitle?.trim() || "";
  if (!title && !input.majors?.length) return state;

  const majors =
    input.majors?.length
      ? input.majors
      : matched
        ? matched.commonMajors.slice(0, 3)
        : state.career.intendedMajors;

  return {
    ...state,
    careerAssessment: {
      ...state.careerAssessment,
      primaryCareerId: matched
        ? matched.id
        : input.careerTitle
          ? ""
          : state.careerAssessment.primaryCareerId,
      completed: state.careerAssessment.completed,
    },
    career: {
      ...state.career,
      intendedCareers: title
        ? [title, ...state.career.intendedCareers.filter((t) => t.toLowerCase() !== title.toLowerCase())]
        : state.career.intendedCareers,
      intendedMajors: majors.length ? majors : state.career.intendedMajors,
    },
    savedCareerIds:
      matched && !state.savedCareerIds.includes(matched.id)
        ? [...state.savedCareerIds, matched.id]
        : state.savedCareerIds,
  };
}
