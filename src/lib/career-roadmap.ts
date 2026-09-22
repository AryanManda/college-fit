import type { AppState, College, MatchBreakdown } from "./types";
import { getCareer } from "../data/careers";
import { gpaOnFour, parseNum } from "./defaults";
import { careerAssessmentComplete, hasCareerGoal } from "./career-matching";
import { similarMoreAchievable } from "./discovery";

export type RoadmapAction = {
  phase: string;
  items: string[];
};

export type CareerRoadmap = {
  careerTitle: string;
  gradeLabel: string;
  preparedPercent: number;
  preparedExplanation: string;
  strengths: string[];
  gaps: string[];
  actions: RoadmapAction[];
};

function gradeLabel(state: AppState) {
  const y = state.student.graduationYear;
  if (!y) return "Current student";
  const grad = Number(y);
  const now = new Date().getFullYear();
  if (grad <= now) return "Senior / applying";
  if (grad === now + 1) return "11th grade";
  if (grad === now + 2) return "10th grade";
  return `${grad - now} years before graduation`;
}

export function buildCareerRoadmap(state: AppState): CareerRoadmap | null {
  const id = state.careerAssessment.primaryCareerId || state.savedCareerIds[0];
  const career = id ? getCareer(id) : null;
  const title = career?.title ?? state.career.intendedCareers[0];
  if (!title) return null;

  const gpa = gpaOnFour(state);
  const sat = parseNum(state.testing.sat?.total ?? "");
  const ap = state.courses.filter((c) => c.level === "AP").length;
  const leadership = state.activities.filter((a) => a.hasLeadership).length;
  const work = state.work.length;
  const careerDone = hasCareerGoal(state) || careerAssessmentComplete(state);

  const strengths: string[] = [];
  const gaps: string[] = [];
  let score = 35;

  if (gpa && gpa >= 3.5) { strengths.push("GPA is competitive for many pathways"); score += 15; }
  else if (gpa) gaps.push("GPA could be strengthened for more selective programs");
  else gaps.push("Add your GPA so we can assess academic readiness");

  if (ap >= 3) { strengths.push("Rigorous coursework on your transcript"); score += 10; }
  else gaps.push("Consider additional rigorous courses where appropriate");

  if (sat && sat >= 1200) { strengths.push("Standardized test score provides a benchmark"); score += 10; }
  else gaps.push("No standardized test score on file — begin SAT/ACT prep if you plan to submit scores");

  if (leadership >= 1) { strengths.push("Leadership experience"); score += 8; }
  else gaps.push("Develop leadership in a primary extracurricular");

  if (work >= 1) { strengths.push("Professional or work experience"); score += 7; }
  else gaps.push("Limited professional experience — explore internships or part-time work");

  if (state.career.intendedMajors.length) { strengths.push("Intended major direction is defined"); score += 8; }
  else gaps.push("Connect your career target to an intended major");

  if (careerDone) score += 10;
  else gaps.push("Set a career goal (or take the assessment) for a more focused roadmap");

  const preparedPercent = Math.min(92, Math.max(18, score));

  const actions: RoadmapAction[] = [
    {
      phase: "This semester",
      items: [
        gaps.includes("Consider additional rigorous courses where appropriate") ? "Take or complete an advanced course in a relevant subject" : "Maintain strong grades in core subjects",
        leadership < 1 ? "Join or lead a club related to your career interest" : "Deepen leadership in your primary activity",
        !sat ? "Begin SAT/ACT preparation if you plan to submit scores" : "Retake standardized tests only if it fits your plan",
      ],
    },
    {
      phase: "Summer",
      items: [
        `Explore a ${title.toLowerCase()}-related internship, job shadow, or summer program`,
        "Visit 3–5 colleges that support your intended major",
        "Build one concrete skill tied to your target field (verify programs on official sites)",
      ],
    },
    {
      phase: "Before college applications",
      items: [
        "Finalize a balanced college list (Likely / Target / Reach)",
        "Apply for financial aid and scholarships",
        "Draft school-specific essays that connect your experience to your goals",
      ],
    },
  ];

  return {
    careerTitle: title,
    gradeLabel: gradeLabel(state),
    preparedPercent,
    preparedExplanation:
      "This score reflects gaps we can see in your profile today — coursework, testing, experience, and career clarity. It is not an objective measurement of your potential.",
    strengths: strengths.length ? strengths : ["You are early in building your profile — that is normal."],
    gaps: gaps.length ? gaps : ["Keep updating your profile as you grow."],
    actions,
  };
}

export type PathForwardChecklistItem = {
  id: string;
  label: string;
  detail: string;
  done: boolean;
  href?: string;
};

export type PathForwardPhase = {
  id: string;
  title: string;
  items: string[];
};

export type PathForwardPlan = {
  mode: "build" | "pivot";
  headline: string;
  summary: string;
  gaps: { label: string; current: string; target: string; severity: "critical" | "high" | "ok" }[];
  phases: PathForwardPhase[];
  checklist: PathForwardChecklistItem[];
  alternateSchoolIds: string[];
  currentOutlook: string;
  improvedOutlook: string;
};

export function buildPathForward(
  state: AppState,
  college: College,
  match: MatchBreakdown,
): PathForwardPlan {
  const gpa = gpaOnFour(state);
  const sat = parseNum(state.testing.sat?.total ?? "");
  const ap = state.courses.filter((c) => ["AP", "IB", "Dual Enrollment"].includes(c.level)).length;
  const leadership = state.activities.filter((a) => a.hasLeadership).length;
  const quantified = state.activities.some((a) => a.accomplishments && /\d/.test(a.accomplishments));
  const outOfRange = match.outOfRange;
  const competitive = match.category === "Likely" || match.admissions >= 74;

  const gaps: PathForwardPlan["gaps"] = [];
  if (gpa != null && college.academics.gpaAverage) {
    const gap = college.academics.gpaAverage - gpa;
    gaps.push({
      label: "GPA",
      current: gpa.toFixed(2),
      target: `~${college.academics.gpaAverage.toFixed(2)} published typical`,
      severity: gap > 0.35 ? "critical" : gap > 0.1 ? "high" : "ok",
    });
  } else if (gpa != null) {
    gaps.push({
      label: "GPA",
      current: gpa.toFixed(2),
      target: competitive ? "Maintain through senior year" : "Raise toward school typical range",
      severity: competitive ? "ok" : "high",
    });
  } else {
    gaps.push({ label: "GPA", current: "Missing", target: "Add unweighted GPA", severity: "critical" });
  }

  if (sat && college.academics.sat25) {
    gaps.push({
      label: "SAT",
      current: String(sat),
      target: `${college.academics.sat25}–${college.academics.sat75 ?? college.academics.sat50 ?? "mid"} published range`,
      severity: sat < college.academics.sat25 - 80 ? "critical" : sat < college.academics.sat25 ? "high" : "ok",
    });
  } else if (sat) {
    gaps.push({
      label: "SAT",
      current: String(sat),
      target: competitive ? "Optional support score" : "Improve if submitting scores",
      severity: competitive ? "ok" : "high",
    });
  }

  gaps.push({
    label: "Course rigor",
    current: ap >= 4 ? "Strong" : ap >= 2 ? "Moderate" : "Limited",
    target: ap >= 4 ? "Keep rigor sustainable" : "Increase advanced coursework where appropriate",
    severity: ap < 2 ? "high" : "ok",
  });
  gaps.push({
    label: "Leadership",
    current: leadership >= 2 ? "Strong" : leadership === 1 ? "Moderate" : "Limited",
    target: leadership >= 2 ? "Deepen impact" : "Own one primary leadership role",
    severity: leadership === 0 ? "high" : "ok",
  });

  const alts = similarMoreAchievable(state, college, 4).map((s) => s.college.id);

  if (outOfRange) {
    return {
      mode: "pivot",
      headline: `Not a reasonable primary plan for ${college.shortName} right now`,
      summary:
        "Your academics sit substantially below this school's published admitted-student ranges. Build toward more achievable schools first, then revisit this campus via transfer, stronger senior grades, or a verified testing jump — not as your main plan.",
      gaps,
      phases: [
        {
          id: "now",
          title: "This month",
          items: [
            "Anchor your list on Likely / Target schools that fit your major and budget",
            "Stop treating this school as a safety or primary — it is currently out of range",
            "Fill missing profile fields so distance and cost matching stay honest",
          ],
        },
        {
          id: "semester",
          title: "This semester",
          items: [
            "Raise GPA with core academic courses — not padding electives",
            "If testing is required or helpful, run a real prep cycle before any retake",
            "Document leadership and impact you already have (no invented titles)",
          ],
        },
        {
          id: "later",
          title: "Later pathway (optional)",
          items: [
            "Consider strong state universities or community-college → transfer routes",
            "Re-check this school only after your academics move into published ranges",
            "Verify transfer pathways and major prerequisites on the official site",
          ],
        },
      ],
      checklist: [
        { id: "alts", label: "Save 3 more-achievable similar schools", detail: "Build a list you can actually execute.", done: alts.some((id) => state.savedCollegeIds.includes(id)), href: `/odds?school=${college.id}` },
        { id: "gpa", label: "Update GPA / senior schedule", detail: "Keep academics current.", done: Boolean(gpa), href: "/profile?tab=academics" },
        { id: "budget", label: "Set max annual cost", detail: "Avoid schools you cannot fund.", done: Boolean(state.preferences.financial.maxAnnualCost), href: "/profile?tab=preferences" },
        { id: "major", label: "Confirm intended major", detail: "Align applications with programs you can name.", done: state.career.intendedMajors.length > 0, href: "/profile?tab=career" },
      ],
      alternateSchoolIds: alts,
      currentOutlook: "Very Unlikely / Out of range",
      improvedOutlook: "Still a stretch unless academics move into published ranges",
    };
  }

  const improved =
    match.admissions >= 55 ? "Target / Strong Match (simulated)" :
    match.admissions >= 40 ? "Reach / Target (simulated)" :
    "Reach (simulated — still not guaranteed)";

  return {
    mode: "build",
    headline: competitive
      ? `Stay competitive at ${college.shortName}`
      : `Close the gap for ${college.shortName}`,
    summary: competitive
      ? "Your profile already looks competitive relative to published ranges. Use the plan below to stay strong and keep options open."
      : "You're below this school's typical admitted profile in some areas. The plan below is interactive — check off real work in your profile, and use What-if to simulate gains.",
    gaps,
    phases: [
      {
        id: "semester",
        title: "This semester",
        items: [
          competitive ? "Keep senior-year grades strong and document academic growth" : "Raise GPA through strong senior-year grades if time remains",
          ap < 4 ? "Add sustainable advanced coursework tied to your major" : "Protect rigor without burning out",
          !sat ? "Decide whether you will submit SAT/ACT and prep accordingly" : "Retake only if a realistic score jump is within reach",
        ],
      },
      {
        id: "summer",
        title: "Summer",
        items: [
          "Deepen one activity with measurable impact (hours, people, outcomes)",
          "Visit or deeply research this campus and 2–3 alternatives",
          "Draft a school-specific essay outline grounded in real experience",
        ],
      },
      {
        id: "apps",
        title: "Application season",
        items: [
          "Finalize a balanced list (Likely / Target / Reach) — do not overweight High Reach",
          "Complete aid forms early and verify deadlines on the school site",
          "Ask recommenders who can speak to verified impact",
        ],
      },
    ],
    checklist: [
      { id: "gpa", label: "GPA on file and current", detail: "Unweighted GPA drives admissions matching.", done: Boolean(gpa), href: "/profile?tab=academics" },
      { id: "tests", label: "Testing decision recorded", detail: "Scores entered or test-optional marked.", done: Boolean(sat) || Boolean(state.testing.act) || state.testing.testOptional, href: "/profile?tab=academics" },
      { id: "lead", label: "At least one leadership role", detail: "Responsibility you can verify.", done: leadership >= 1, href: "/profile?tab=activities" },
      { id: "nums", label: "Quantified activity impact", detail: "Numbers you can defend.", done: quantified, href: "/profile?tab=activities" },
      { id: "major", label: "Intended major set", detail: "Aligns essays and major-fit score.", done: state.career.intendedMajors.length > 0, href: "/profile?tab=career" },
      { id: "home", label: "Home state set", detail: "Unlocks in-state prioritization.", done: Boolean(state.student.state), href: "/profile?tab=personal" },
    ],
    alternateSchoolIds: alts,
    currentOutlook: match.category,
    improvedOutlook: improved,
  };
}
