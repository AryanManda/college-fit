import type { AppState, StrengthCategory } from "./types";
import { gpaOnFour } from "./defaults";
import { profilePercent } from "./completion";
import { matchAll } from "./matching";
import { scoreResume } from "./resume";

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function applicationStrength(state: AppState): {
  overall: number;
  categories: StrengthCategory[];
  recommendations: string[];
} {
  const apIb = state.courses.filter((c) => ["AP", "IB", "Dual Enrollment", "College"].includes(c.level)).length;
  const honors = state.courses.filter((c) => c.level === "Honors").length;
  const gpa = gpaOnFour(state) ?? 0;

  const academics = gpa
    ? clamp(40 + Math.min(gpa, 4) * 14 + (state.academic.classRank ? 6 : 0))
    : 28;
  const rigor = clamp(30 + apIb * 8 + honors * 3);
  const testing = state.testing.testOptional
    ? 70
    : state.testing.sat || state.testing.act
      ? clamp(50 + (Number(state.testing.sat?.total || 0) / 1600) * 40 + Number(state.testing.act?.composite || 0) * 1.2)
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
  const awards = clamp(state.awards.length ? 50 + state.awards.length * 10 + (state.awards.some((a) => a.level === "National" || a.level === "International") ? 12 : 0) : 18);
  const career = clamp(
    (state.career.intendedCareers.length ? 40 : 15) +
      (state.career.intendedMajors.length ? 30 : 10) +
      (state.career.industries.length ? 20 : 0),
  );
  const resume = state.resumes.length ? scoreResume(state.resumes.find((r) => r.id === state.activeResumeId) ?? state.resumes[0], state).overall : 20;
  const matches = matchAll(state);
  const collegeFit = matches[0]?.overall ?? 40;

  const categories: StrengthCategory[] = [
    {
      key: "academics",
      label: "Academics",
      score: academics,
      explanation: gpa
        ? `Your academic record is captured with a GPA of ${gpa}${state.academic.classRank ? ` and class rank ${state.academic.classRank}` : ""}. Adding missing rank or trend context can still help.`
        : "Add GPA so academic strength can be scored from your record rather than assumed.",
    },
    {
      key: "rigor",
      label: "Course Rigor",
      score: rigor,
      explanation:
        apIb >= 5
          ? `You list ${apIb} advanced courses (AP/IB/college-level), which signals a demanding transcript.`
          : "Add AP, IB, honors, or dual-enrollment courses so rigor reflects what you actually took.",
    },
    {
      key: "testing",
      label: "Testing",
      score: testing,
      explanation: state.testing.testOptional
        ? "You selected test-optional. Schools that do not require tests are not penalizing missing scores in match results."
        : state.testing.sat || state.testing.act
          ? "Published scores are included. They are compared only against schools that report ranges."
          : "No SAT/ACT entered. You can add scores or mark test-optional.",
    },
    {
      key: "extras",
      label: "Extracurriculars",
      score: extras,
      explanation:
        extras >= 80
          ? "You demonstrate depth across activities with sustained time commitment."
          : state.activities.length
            ? "Your activities are a start. Depth (hours, years, and impact) will raise this more than adding many shallow entries."
            : "Add extracurriculars — this is one of the most important parts of a complete application file.",
    },
    {
      key: "leadership",
      label: "Leadership",
      score: leadership,
      explanation:
        leadership >= 80
          ? "Your profile demonstrates meaningful leadership through organizations, with room to quantify people or projects influenced."
          : "If you led people or projects, mark leadership and include how many people you led. Do not invent titles.",
    },
    {
      key: "work",
      label: "Work Experience",
      score: work,
      explanation: state.work.length
        ? "Work and internships are present. Quantified results make this section more distinctive."
        : "Work experience is optional, but internships, jobs, or family work can strengthen career alignment.",
    },
    {
      key: "awards",
      label: "Awards",
      score: awards,
      explanation: state.awards.length
        ? "Awards are recorded with level and description. Selective recognition is weighted more than volume."
        : "Add awards only if you earned them. Empty is honest; invented awards are never appropriate.",
    },
    {
      key: "career",
      label: "Career Alignment",
      score: career,
      explanation: state.career.intendedCareers.length
        ? "Career goals are defined enough to match schools with related undergraduate strengths."
        : "Name an intended career and major so recommendations can be specific.",
    },
    {
      key: "resume",
      label: "Resume",
      score: resume,
      explanation: state.resumes.length
        ? "A resume version exists and is scored for verbs, numbers, and consistency."
        : "Build a resume from your profile, then improve bullets without adding fake statistics.",
    },
    {
      key: "fit",
      label: "College Fit",
      score: collegeFit,
      explanation: matches[0]
        ? `Your current top overall match scores ${matches[0].overall}/100. This is fit, not a chance-of-admission forecast.`
        : "Complete preferences to generate college-fit analysis.",
    },
  ];

  const overall = clamp(categories.reduce((a, c) => a + c.score, 0) / categories.length);
  const recommendations: string[] = [];
  if (!state.academic.classRank) recommendations.push("Add your class rank to improve college matching accuracy, if your school ranks.");
  if (state.career.industries.includes("Finance") || state.career.intendedCareers.some((c) => /business|financ|consult/i.test(c)))
    recommendations.push("Your profile has business-related experience or goals. Consider adding schools with strong undergraduate business programs.");
  if (state.activities.filter((a) => a.hasLeadership).length >= 2 && state.activities.every((a) => !a.peopleLed))
    recommendations.push("You have several leadership activities but few quantified accomplishments. Add measurable results you can verify.");
  const reaches = matchAll(state).slice(0, 8).filter((m) => m.category === "Reach" || m.category === "High Reach").length;
  if (reaches >= 6)
    recommendations.push("Your current top of list contains mostly reach schools. Consider adding 2–3 target and likely schools.");
  if (profilePercent(state) < 80) recommendations.push("Complete remaining profile sections so match scores are based on you, not blanks.");
  if (!state.testing.sat && !state.testing.act && !state.testing.testOptional)
    recommendations.push("Add a test score or select test-optional / no test score.");

  return { overall, categories, recommendations: recommendations.slice(0, 6) };
}
