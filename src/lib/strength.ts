import type { AppState, StrengthCategory } from "./types";
import { getCollege } from "../data/colleges";
import { getCareer } from "../data/careers";
import { gpaOnFour, parseNum } from "./defaults";
import { profilePercent } from "./completion";
import { careerGoalLabel, hasCareerGoal } from "./career-goal";
import { collegesForCareer } from "./pathway";
import {
  matchAll,
  schoolAcademicBar,
  statsAlignment,
  studentAcademicStrength,
} from "./matching";
import { scoreResume } from "./resume";

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export type StrengthAdvice = {
  priority: "critical" | "high" | "medium";
  title: string;
  detail: string;
  href: string;
  cta: string;
  metric?: { current: string; target: string };
};

export type GoalSnapshot = {
  career: string;
  majors: string[];
  targetSchools: { id: string; name: string; category: string; bar: number }[];
  academicYou: number;
  academicGoal: number;
  academicProgress: number;
  careerReady: number;
  listBalance: { likely: number; target: number; reach: number };
  status: "on-track" | "close" | "needs-work" | "set-goals";
  statusLabel: string;
};

export type OverallStrength = {
  overall: number;
  categories: StrengthCategory[];
  goals: GoalSnapshot;
  advice: StrengthAdvice[];
  recommendations: string[];
};

function goalColleges(state: AppState) {
  const saved = state.savedCollegeIds
    .map((id) => getCollege(id))
    .filter(Boolean)
    .map((c) => c!);
  if (saved.length) return saved.slice(0, 6);

  const forCareer = collegesForCareer(state, 6)
    .map((m) => getCollege(m.collegeId))
    .filter(Boolean)
    .map((c) => c!);
  if (forCareer.length) return forCareer;

  return matchAll(state)
    .slice(0, 5)
    .map((m) => getCollege(m.collegeId))
    .filter(Boolean)
    .map((c) => c!);
}

function careerReadiness(state: AppState): number {
  if (!hasCareerGoal(state)) return 18;
  let score = 35;
  const career = getCareer(state.careerAssessment.primaryCareerId);
  const majors = state.career.intendedMajors.map((m) => m.toLowerCase());
  if (majors.length) score += 18;
  if (career) {
    const aligned = career.commonMajors.some((m) =>
      majors.some((x) => x.includes(m.toLowerCase()) || m.toLowerCase().includes(x)),
    );
    if (aligned) score += 14;
  } else if (state.career.intendedCareers.length) {
    score += 8;
  }
  if (state.career.industries.length) score += 8;
  const tags = (career?.tags ?? []).map((t) => t.toLowerCase());
  const relatedWork = state.work.filter((w) => {
    const blob = `${w.employer} ${w.position} ${w.description}`.toLowerCase();
    return tags.some((t) => blob.includes(t)) || /intern|research|engineer|analyst|consult|nurse|teach/i.test(blob);
  }).length;
  const relatedActs = state.activities.filter((a) => {
    const blob = `${a.name} ${a.organization} ${a.accomplishments}`.toLowerCase();
    return tags.some((t) => blob.includes(t)) || Boolean(a.hasLeadership);
  }).length;
  score += Math.min(relatedWork * 8, 16);
  score += Math.min(relatedActs * 5, 12);
  if (state.resumes.length) score += 6;
  return clamp(score);
}

function buildGoals(state: AppState): GoalSnapshot {
  const career = careerGoalLabel(state) || state.career.intendedCareers[0] || "";
  const majors = state.career.intendedMajors.filter(Boolean).slice(0, 4);
  const colleges = goalColleges(state);
  const matches = matchAll(state);
  const matchById = new Map(matches.map((m) => [m.collegeId, m]));

  const targetSchools = colleges.map((c) => {
    const m = matchById.get(c.id);
    return {
      id: c.id,
      name: c.shortName || c.name,
      category: m?.category ?? "—",
      bar: schoolAcademicBar(c),
    };
  });

  const academicYou = studentAcademicStrength(state);
  const academicGoal = targetSchools.length
    ? clamp(targetSchools.reduce((a, s) => a + s.bar, 0) / targetSchools.length)
    : 55;
  const align = statsAlignment(academicYou, academicGoal);
  // Progress: how close your stats are to the bar your goals imply
  const academicProgress = clamp(
    academicGoal <= 0 ? 50 : (academicYou / Math.max(academicGoal, 1)) * 88 + align * 0.12,
  );
  const careerReady = careerReadiness(state);

  const pool = state.savedCollegeIds.length
    ? matches.filter((m) => state.savedCollegeIds.includes(m.collegeId))
    : matches.slice(0, 12);
  const listBalance = {
    likely: pool.filter((m) => m.category === "Likely").length,
    target: pool.filter((m) => m.category === "Target").length,
    reach: pool.filter((m) => m.category === "Reach" || m.category === "High Reach").length,
  };

  const hasGoals = Boolean(career || majors.length || targetSchools.length);
  let status: GoalSnapshot["status"] = "set-goals";
  let statusLabel = "Set a career or save target colleges to measure progress.";
  if (hasGoals) {
    const blended = clamp(academicProgress * 0.55 + careerReady * 0.45);
    if (blended >= 78) {
      status = "on-track";
      statusLabel = "On track — your stats line up well with the goals you set.";
    } else if (blended >= 58) {
      status = "close";
      statusLabel = "Close — a few focused upgrades would put you firmly on track.";
    } else {
      status = "needs-work";
      statusLabel = "Needs work — close the gaps below to reach your stated goals.";
    }
  }

  return {
    career,
    majors,
    targetSchools,
    academicYou,
    academicGoal,
    academicProgress,
    careerReady,
    listBalance,
    status,
    statusLabel,
  };
}

function buildAdvice(state: AppState, goals: GoalSnapshot): StrengthAdvice[] {
  const advice: StrengthAdvice[] = [];
  const gpa = gpaOnFour(state);
  const sat = parseNum(state.testing.sat?.total);
  const act = parseNum(state.testing.act?.composite);

  if (!hasCareerGoal(state)) {
    advice.push({
      priority: "critical",
      title: "Name a career or major goal",
      detail: "Overall strength is measured against what you’re aiming for. Set a career on My Path so advice becomes specific.",
      href: "/path",
      cta: "Set your path",
    });
  }

  if (goals.targetSchools.length && goals.academicYou + 8 < goals.academicGoal) {
    const gap = goals.academicGoal - goals.academicYou;
    advice.push({
      priority: gap >= 18 ? "critical" : "high",
      title: "Raise academics toward your target schools",
      detail: `Your academic profile sits around ${goals.academicYou}/100 vs ~${goals.academicGoal}/100 for the schools tied to your goals. Focus on GPA, rigor, and (if submitting) test scores.`,
      href: "/profile?tab=academics",
      cta: "Update academics",
      metric: { current: `${goals.academicYou}`, target: `${goals.academicGoal}` },
    });
  }

  if (gpa == null) {
    advice.push({
      priority: "critical",
      title: "Add your GPA",
      detail: "Without GPA we can’t compare you to published admitted-student ranges for your goals.",
      href: "/profile?tab=academics",
      cta: "Add GPA",
    });
  } else if (gpa < 3.5 && goals.academicGoal >= 70) {
    advice.push({
      priority: "high",
      title: "Improve GPA trend for selective targets",
      detail: `Your GPA (${gpa.toFixed(2)}) is below the bar implied by your more selective goals. An upward senior-year trend and strong rigor help the comparison.`,
      href: "/profile?tab=academics",
      cta: "Edit academics",
      metric: { current: gpa.toFixed(2), target: "3.7+" },
    });
  }

  const advanced = state.courses.filter((c) =>
    ["AP", "IB", "Dual Enrollment", "College"].includes(c.level),
  ).length;
  if (advanced < 4 && goals.academicGoal >= 65) {
    advice.push({
      priority: "high",
      title: "Build course rigor",
      detail: `You list ${advanced} advanced courses. Target schools at your goal level usually expect a heavier AP/IB/college load when available.`,
      href: "/profile?tab=academics",
      cta: "Add coursework",
      metric: { current: String(advanced), target: "6+" },
    });
  }

  if (!state.testing.testOptional && sat == null && act == null) {
    advice.push({
      priority: "high",
      title: "Add test scores or mark test-optional",
      detail: "Many of your goal schools publish SAT/ACT ranges. Enter scores if you’ll submit them, or mark test-optional so matching doesn’t assume blanks.",
      href: "/profile?tab=academics",
      cta: "Update testing",
    });
  } else if (sat != null && goals.academicGoal >= 75 && sat < 1350) {
    advice.push({
      priority: "medium",
      title: "Consider a testing bump if you’ll submit scores",
      detail: `SAT ${sat} sits below the middle range for many selective goals. Retesting only helps if you plan to send scores.`,
      href: "/profile?tab=academics",
      cta: "Edit SAT",
      metric: { current: String(sat), target: "1400+" },
    });
  }

  if (hasCareerGoal(state) && goals.careerReady < 60) {
    const career = goals.career || "your career";
    advice.push({
      priority: "high",
      title: `Align activities and work with ${career}`,
      detail: "Add internships, projects, or clubs that clearly connect to your goal — depth and impact matter more than volume.",
      href: "/profile?tab=activities",
      cta: "Edit activities",
    });
    if (!state.work.length) {
      advice.push({
        priority: "medium",
        title: "Add relevant work or internships",
        detail: `Even one role tied to ${career} strengthens career readiness and resume bullets.`,
        href: "/profile?tab=work",
        cta: "Add work",
      });
    }
  }

  if (state.activities.filter((a) => a.hasLeadership).length === 0 && state.activities.length > 0) {
    advice.push({
      priority: "medium",
      title: "Capture real leadership",
      detail: "If you led people or projects, mark leadership and quantify who you led. Don’t invent titles.",
      href: "/profile?tab=activities",
      cta: "Edit leadership",
    });
  }

  if (!state.resumes.length) {
    advice.push({
      priority: "medium",
      title: "Build a resume from your profile",
      detail: "A scored resume shows how well your story supports your goals — and where bullets need numbers.",
      href: "/resume",
      cta: "Open resume",
    });
  }

  if (goals.listBalance.reach >= 5 && goals.listBalance.likely + goals.listBalance.target < 2) {
    advice.push({
      priority: "high",
      title: "Balance your college list",
      detail: "Your list leans heavily Reach. Add Target and Likely schools that still fit your major/career so you have realistic options.",
      href: "/colleges",
      cta: "Browse colleges",
    });
  }

  if (!state.savedCollegeIds.length && hasCareerGoal(state)) {
    advice.push({
      priority: "medium",
      title: "Save colleges that fit your path",
      detail: "Saving schools turns Overall Strength into a progress check against specific campuses, not just averages.",
      href: "/colleges",
      cta: "Find colleges",
    });
  }

  if (profilePercent(state) < 70) {
    advice.push({
      priority: "medium",
      title: "Complete more of your profile",
      detail: "Gaps in location, preferences, or academics make goal progress look worse than it may be.",
      href: "/profile",
      cta: "Finish profile",
    });
  }

  const order = { critical: 0, high: 1, medium: 2 } as const;
  return advice.sort((a, b) => order[a.priority] - order[b.priority]).slice(0, 8);
}

/** Profile categories + goal progress + prioritized advice. */
export function overallStrength(state: AppState): OverallStrength {
  const apIb = state.courses.filter((c) =>
    ["AP", "IB", "Dual Enrollment", "College"].includes(c.level),
  ).length;
  const honors = state.courses.filter((c) => c.level === "Honors").length;
  const gpa = gpaOnFour(state) ?? 0;

  const academics = gpa
    ? clamp(40 + Math.min(gpa, 4) * 14 + (state.academic.classRank ? 6 : 0))
    : 28;
  const rigor = clamp(30 + apIb * 8 + honors * 3);
  const testing = state.testing.testOptional
    ? 70
    : state.testing.sat || state.testing.act
      ? clamp(
          50 +
            (Number(state.testing.sat?.total || 0) / 1600) * 40 +
            Number(state.testing.act?.composite || 0) * 1.2,
        )
      : 32;
  const extras = clamp(
    Math.min(state.activities.length * 14, 42) +
      Math.min(state.activities.filter((a) => Number(a.hoursPerWeek) >= 5).length * 10, 30) +
      (state.activities.some((a) => a.recognition === "National") ? 12 : 0),
  );
  const leadership = clamp(
    20 +
      state.activities.filter((a) => a.hasLeadership).length * 18 +
      state.activities.filter((a) => Number(a.peopleLed) >= 10).length * 8,
  );
  const work = clamp(state.work.length ? 55 + Math.min(state.work.length * 12, 30) : 22);
  const awards = clamp(
    state.awards.length
      ? 50 +
          state.awards.length * 10 +
          (state.awards.some((a) => a.level === "National" || a.level === "International") ? 12 : 0)
      : 18,
  );
  const career = clamp(
    (state.career.intendedCareers.length ? 40 : 15) +
      (state.career.intendedMajors.length ? 30 : 10) +
      (state.career.industries.length ? 20 : 0),
  );
  const resume = state.resumes.length
    ? scoreResume(
        state.resumes.find((r) => r.id === state.activeResumeId) ?? state.resumes[0],
        state,
      ).overall
    : 20;
  const matches = matchAll(state);
  const collegeFit = matches[0]?.overall ?? 40;

  const goals = buildGoals(state);

  const categories: StrengthCategory[] = [
    {
      key: "academics",
      label: "Academics",
      score: academics,
      explanation: gpa
        ? `GPA ${gpa}${state.academic.classRank ? ` · rank ${state.academic.classRank}` : ""} — compared against ~${goals.academicGoal}/100 for your goal schools.`
        : "Add GPA so we can score academics against your college goals.",
    },
    {
      key: "rigor",
      label: "Course Rigor",
      score: rigor,
      explanation:
        apIb >= 5
          ? `${apIb} advanced courses on file — strong signal for selective goals.`
          : "Add AP, IB, honors, or dual-enrollment courses your school offers.",
    },
    {
      key: "testing",
      label: "Testing",
      score: testing,
      explanation: state.testing.testOptional
        ? "Marked test-optional — schools that don’t require tests won’t penalize blanks."
        : state.testing.sat || state.testing.act
          ? "Scores are included and compared to published ranges when available."
          : "No SAT/ACT yet. Add scores or mark test-optional.",
    },
    {
      key: "extras",
      label: "Extracurriculars",
      score: extras,
      explanation: state.activities.length
        ? "Depth (hours, years, impact) beats a long list of shallow activities."
        : "Add activities — especially ones tied to your career goal.",
    },
    {
      key: "leadership",
      label: "Leadership",
      score: leadership,
      explanation:
        leadership >= 70
          ? "Meaningful leadership is on your profile. Keep quantifying impact."
          : "Mark real leadership roles and how many people you led.",
    },
    {
      key: "work",
      label: "Work Experience",
      score: work,
      explanation: state.work.length
        ? "Work/internships present — tie descriptions to your intended career when true."
        : "Optional, but goal-aligned jobs or internships raise career readiness.",
    },
    {
      key: "awards",
      label: "Awards",
      score: awards,
      explanation: state.awards.length
        ? "Recognition is recorded. Selective awards weigh more than volume."
        : "Only add awards you earned — empty is fine.",
    },
    {
      key: "career",
      label: "Career readiness",
      score: goals.careerReady,
      explanation: hasCareerGoal(state)
        ? `${goals.career || "Goal set"} — majors, related experience, and resume drive this score.`
        : "Set a career and major on My Path to unlock goal-based scoring.",
    },
    {
      key: "resume",
      label: "Resume",
      score: resume,
      explanation: state.resumes.length
        ? "Resume scored for verbs, numbers, and consistency with your profile."
        : "Build a resume from your profile, then tighten bullets.",
    },
    {
      key: "fit",
      label: "Goal-school fit",
      score: clamp(goals.academicProgress * 0.6 + collegeFit * 0.4),
      explanation: goals.targetSchools.length
        ? `Stats vs goal schools: you ${goals.academicYou}/100 · goal bar ~${goals.academicGoal}/100.`
        : "Save colleges or set a career so fit is measured against real targets.",
    },
  ];

  const overall = clamp(
    categories.reduce((a, c) => a + c.score, 0) / categories.length * 0.7 +
      goals.academicProgress * 0.18 +
      goals.careerReady * 0.12,
  );

  const advice = buildAdvice(state, goals);
  const recommendations = advice.map((a) => a.title);

  return { overall, categories, goals, advice, recommendations };
}

/** @deprecated Prefer overallStrength */
export function applicationStrength(state: AppState) {
  return overallStrength(state);
}
