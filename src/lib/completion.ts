import type { AppState } from "./types";

export type CompletionSlice = {
  key: string;
  label: string;
  value: number;
};

function filled(v: unknown) {
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "boolean") return true;
  return String(v ?? "").trim().length > 0;
}

export function completionSlices(state: AppState): CompletionSlice[] {
  const personal = [
    state.student.firstName,
    state.student.lastName,
    state.student.email,
    state.student.highSchool,
    state.student.graduationYear,
    state.student.city,
    state.student.state,
  ].filter(filled).length / 7;

  const academics = [
    state.academic.unweightedGpa || state.academic.weightedGpa,
    state.academic.gpaScale,
    state.courses.length > 0,
    state.academic.gpaTrend,
  ].filter(Boolean).length / 4;

  const testing =
    state.testing.testOptional ||
    state.testing.sat ||
    state.testing.act ||
    state.testing.ap.length > 0 ||
    state.testing.ib.length > 0
      ? 1
      : 0.15;

  const extras = state.activities.length ? Math.min(1, 0.4 + state.activities.length * 0.2) : 0;
  const work = state.work.length ? 1 : 0;
  const awards = state.awards.length ? 1 : 0;
  const prefs =
    [
      state.preferences.geographic.preferredStates.length > 0 || Boolean(state.student.state),
      state.preferences.financial.maxAnnualCost,
      state.preferences.lifestyle.tags.length > 0,
    ].filter(Boolean).length / 3;
  const career =
    [
      state.career.intendedCareers.length > 0,
      state.career.intendedMajors.length > 0,
      state.careerAssessment.completed || state.career.intendedCareers.length > 0,
    ].filter(Boolean).length / 3;
  const resume = state.resumes.length ? 1 : 0;

  return [
    { key: "academics", label: "Academics", value: academics },
    { key: "testing", label: "Test Scores", value: testing },
    { key: "extras", label: "Extracurriculars", value: extras },
    { key: "work", label: "Work Experience", value: work },
    { key: "awards", label: "Awards", value: awards },
    { key: "prefs", label: "College Preferences", value: prefs },
    { key: "career", label: "Career Goals", value: career },
    { key: "resume", label: "Resume", value: resume },
    { key: "personal", label: "Personal", value: personal },
  ];
}

export function profilePercent(state: AppState) {
  const slices = completionSlices(state).filter((s) => s.key !== "personal");
  const personal = completionSlices(state).find((s) => s.key === "personal")?.value ?? 0;
  const core = slices.reduce((a, b) => a + b.value, 0) / slices.length;
  return Math.round((personal * 0.15 + core * 0.85) * 100);
}

/** How many personalized college recommendations to unlock based on profile depth. */
export type CollegeFeedUnlock = {
  level: "locked" | "starter" | "guided" | "full";
  percent: number;
  /** Max schools to show (0 = none). */
  limit: number;
  title: string;
  message: string;
  ctaHref: string;
  ctaLabel: string;
};

export function collegeFeedUnlock(state: AppState): CollegeFeedUnlock {
  const percent = profilePercent(state);
  const missing = missingCriticalFields(state);
  const hasBasics =
    Boolean(state.student.state || state.student.city) &&
    Boolean(state.academic.unweightedGpa || state.academic.weightedGpa);

  if (percent < 22 || !hasBasics) {
    return {
      level: "locked",
      percent,
      limit: 0,
      title: "Complete your profile to see colleges",
      message:
        missing.length > 0
          ? `Add ${missing.slice(0, 3).join(", ")}${missing.length > 3 ? `, and ${missing.length - 3} more` : ""} so we can recommend schools that fit you — not a random list.`
          : "Tell us where you live and your GPA first. Then we’ll show colleges that match your preferences.",
      ctaHref: "/profile",
      ctaLabel: "Complete profile",
    };
  }

  if (percent < 45) {
    return {
      level: "starter",
      percent,
      limit: 8,
      title: "Starter matches from your preferences",
      message:
        "Your profile is still light, so these are generally strong fits based on location and what you’ve shared so far. Add testing, activities, and majors for sharper odds.",
      ctaHref: "/profile",
      ctaLabel: "Improve recommendations",
    };
  }

  if (percent < 70) {
    return {
      level: "guided",
      percent,
      limit: 24,
      title: "Colleges matched to your preferences",
      message:
        "Showing schools aligned with your location, academics, and goals. Finish budget, career, and activities for a fuller feed.",
      ctaHref: "/profile",
      ctaLabel: "Complete remaining sections",
    };
  }

  return {
    level: "full",
    percent,
    limit: Number.POSITIVE_INFINITY,
    title: "Personalized college feed",
    message: "Your profile is detailed enough for full matching within your preferences and range.",
    ctaHref: "/profile",
    ctaLabel: "Edit profile",
  };
}

export function missingCriticalFields(state: AppState): string[] {
  const missing: string[] = [];
  if (!state.student.state) missing.push("home state");
  if (!(state.academic.unweightedGpa || state.academic.weightedGpa)) missing.push("GPA");
  if (!state.testing.sat && !state.testing.act && !state.testing.testOptional) missing.push("testing decision");
  if (!state.activities.length) missing.push("activities");
  if (!state.preferences.financial.maxAnnualCost) missing.push("budget");
  if (!state.career.intendedMajors.length) missing.push("intended major");
  if (!state.career.intendedCareers.length && !state.careerAssessment.primaryCareerId) missing.push("career goal");
  return missing;
}

export function recommendedActions(state: AppState) {
  const actions: { title: string; detail: string; href: string }[] = [];

  if (!state.student.state)
    actions.push({
      title: "Set your home state",
      detail: "We prioritize your state's public universities and in-state tuition once residence is set.",
      href: "/profile?tab=personal",
    });

  if (!(state.academic.unweightedGpa || state.academic.weightedGpa))
    actions.push({
      title: "Add your GPA",
      detail: "Odds and reach labels are unreliable without academics.",
      href: "/profile?tab=academics",
    });

  if (!state.testing.sat && !state.testing.act && !state.testing.testOptional)
    actions.push({
      title: "Add your SAT or ACT score",
      detail: "Or mark test-optional so matching does not assume missing tests.",
      href: "/profile?tab=academics",
    });

  if (state.courses.filter((c) => ["AP", "IB", "Dual Enrollment", "College"].includes(c.level)).length < 2)
    actions.push({
      title: "Add advanced coursework",
      detail: "List AP/IB/dual enrollment so rigor is visible in your match.",
      href: "/profile?tab=academics",
    });

  if (!state.activities.length)
    actions.push({
      title: "Add your extracurricular activities",
      detail: "Depth, leadership, and impact drive both matching and application strength.",
      href: "/profile?tab=activities",
    });
  else if (!state.activities.some((a) => a.accomplishments && /\d/.test(a.accomplishments)))
    actions.push({
      title: "Quantify activity impact",
      detail: "Add hours, people, or outcomes you can verify — do not invent stats.",
      href: "/profile?tab=activities",
    });

  if (!state.awards.length)
    actions.push({
      title: "Add awards or recognition",
      detail: "Even school-level awards help paint academic and extracurricular strength.",
      href: "/profile?tab=awards",
    });

  if (!state.preferences.financial.maxAnnualCost)
    actions.push({
      title: "Complete financial preferences",
      detail: "A budget range is required for an honest financial-fit score.",
      href: "/profile?tab=preferences",
    });

  if (state.resumes.length) {
    const bullets = state.resumes.flatMap((r) => r.sections.flatMap((s) => s.items.flatMap((i) => i.bullets)));
    const weak = bullets.filter((b) => b.text.split(" ").length < 10).length;
    if (weak >= 3)
      actions.push({
        title: `Improve ${Math.min(weak, 8)} resume bullet points`,
        detail: "Use Improve to make bullets more specific — without inventing numbers.",
        href: "/resume",
      });
  } else {
    actions.push({
      title: "Start or upload a resume",
      detail: "Build a version from your profile, then tighten language with the editor.",
      href: "/resume",
    });
  }

  if (!state.career.intendedCareers.length && !state.careerAssessment.primaryCareerId)
    actions.push({
      title: "Set your career goal",
      detail: "If you already know what you want, enter it on Career or My Path. Only take the assessment if you're unsure.",
      href: "/career",
    });

  if (!state.career.intendedMajors.length)
    actions.push({
      title: "Add an intended major",
      detail: "Major match is one of the six scores behind every college recommendation.",
      href: "/profile?tab=career",
    });

  return actions.slice(0, 6);
}
