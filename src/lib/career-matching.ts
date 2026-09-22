import type { AppState, CareerMatchBreakdown } from "./types";
import { CAREERS, type CareerProfile } from "../data/careers";

const VALUE_KEYS = [
  "highIncome",
  "jobSecurity",
  "workLifeBalance",
  "helpingOthers",
  "prestige",
  "creativity",
  "independence",
  "leadership",
  "travel",
  "workingOutdoors",
  "intellectualChallenge",
  "entrepreneurship",
] as const;

function overlap(a: string[], b: string[]) {
  if (!a.length || !b.length) return 0;
  let hits = 0;
  for (const x of a) {
    if (b.some((y) => y.toLowerCase().includes(x.toLowerCase()) || x.toLowerCase().includes(y.toLowerCase()))) hits += 1;
  }
  return hits / Math.max(a.length, 1);
}

function valueScore(assessment: AppState["careerAssessment"], career: CareerProfile) {
  const vals = assessment.values;
  let sum = 0;
  let n = 0;
  for (const k of career.values) {
    const student = vals[k] ?? 3;
    sum += Math.min(5, student) / 5;
    n += 1;
  }
  return n ? Math.round(40 + (sum / n) * 55) : 55;
}

function academicScore(assessment: AppState["careerAssessment"], career: CareerProfile) {
  const ac = assessment.academicInterests;
  let sum = 0;
  let n = 0;
  for (const sub of career.academic) {
    const student = ac[sub] ?? 3;
    sum += Math.min(5, student) / 5;
    n += 1;
  }
  return n ? Math.round(38 + (sum / n) * 58) : 50;
}

export function matchCareer(state: AppState, career: CareerProfile): CareerMatchBreakdown {
  const a = state.careerAssessment;
  const why: string[] = [];
  let score = 52;

  const interestHit = overlap(a.interests, career.interests);
  score += interestHit * 22;
  if (interestHit >= 0.4) why.push("Your selected interests align with typical work in this field.");

  const envHit = overlap(a.workEnvironments, career.workEnvironment);
  score += envHit * 12;
  if (envHit >= 0.35) why.push("Your preferred work environment matches this career.");

  const styleHit = overlap(a.workStyles, career.workStyles);
  score += styleHit * 10;
  if (styleHit >= 0.35) why.push("Your work style preferences fit common expectations in this role.");

  score += (valueScore(a, career) - 55) * 0.25;
  score += (academicScore(a, career) - 50) * 0.2;

  for (const c of state.career.intendedCareers) {
    if (career.title.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(career.shortTitle.toLowerCase())) {
      score += 12;
      why.push("You listed this career among your goals.");
    }
  }

  const fb = a.feedback[career.id];
  if (fb?.status === "interested") score += 8;
  if (fb?.status === "not") score -= 28;

  if (!a.completed && !state.career.intendedCareers.length) {
    why.push("Set a career goal or complete the assessment for more accurate matches.");
  }

  return {
    careerId: career.id,
    fit: Math.max(0, Math.min(100, Math.round(score))),
    why: why.length ? why.slice(0, 5) : ["Explore this career to see if it fits your interests and values."],
  };
}

export function matchAllCareers(state: AppState) {
  return CAREERS.map((c) => ({ career: c, match: matchCareer(state, c) }))
    .filter((x) => state.careerAssessment.feedback[x.career.id]?.status !== "not")
    .sort((a, b) => b.match.fit - a.match.fit);
}

export function topCareers(state: AppState, limit = 5) {
  return matchAllCareers(state).slice(0, limit);
}

export { hasCareerGoal, careerAssessmentComplete, careerGoalLabel } from "./career-goal";

export { VALUE_KEYS };
