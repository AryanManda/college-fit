import type { AppState, MatchBreakdown } from "./types";
import { getCollege } from "../data/colleges";
import { getCareer } from "../data/careers";
import { matchAll } from "./matching";
import { topCareers } from "./career-matching";

export function careerToMajors(state: AppState) {
  const id = state.careerAssessment.primaryCareerId;
  const career = id ? getCareer(id) : null;
  const fromCareer = career?.commonMajors ?? [];
  const fromStudent = state.career.intendedMajors;
  return [...new Set([...fromStudent, ...fromCareer])].slice(0, 6);
}

export function collegesForCareer(state: AppState, limit = 6) {
  const majors = careerToMajors(state);
  const all = matchAll(state).filter((m) => !m.outOfRange);
  const filtered = majors.length
    ? all.filter((m) => {
        const c = getCollege(m.collegeId);
        if (!c) return false;
        return majors.some((maj) =>
          [...c.majors, ...c.academicStrengths].some((x) =>
            x.toLowerCase().includes(maj.toLowerCase()) || maj.toLowerCase().includes(x.toLowerCase()),
          ),
        );
      })
    : all;
  // Prefer schools at the student's academic level that also offer the major
  const pool = filtered.length ? filtered : all;
  return pool
    .filter((m) => m.category === "Likely" || m.category === "Target" || m.category === "Reach")
    .slice(0, limit);
}

export type RealisticBucket = {
  key: "bestOverall" | "bestAcademic" | "bestValue" | "bestCareer" | "bestLocation";
  title: string;
  match: MatchBreakdown | null;
};

export function realisticBuckets(state: AppState): RealisticBucket[] {
  const all = matchAll(state).filter(
    (m) => !m.outOfRange && (m.category === "Likely" || m.category === "Target" || m.admissions >= 50),
  );
  if (!all.length) return [];

  const pick = (sort: (a: MatchBreakdown, b: MatchBreakdown) => number) => [...all].sort(sort)[0] ?? null;

  return [
    { key: "bestOverall", title: "Best Overall Match", match: all[0] ?? null },
    { key: "bestAcademic", title: "Best Academic Match", match: pick((a, b) => b.admissions - a.admissions || b.academic - a.academic) },
    { key: "bestValue", title: "Best Value", match: pick((a, b) => b.financial - a.financial || b.admissions - a.admissions) },
    { key: "bestCareer", title: "Best Career Match", match: pick((a, b) => b.career - a.career || b.admissions - a.admissions) },
    { key: "bestLocation", title: "Best Location", match: pick((a, b) => b.location - a.location || b.admissions - a.admissions) },
  ];
}

export function pathwaySummary(state: AppState) {
  const careers = topCareers(state, 3);
  const majors = careerToMajors(state);
  const colleges = collegesForCareer(state, 4);
  return { careers, majors, colleges };
}

export function answerCareerQuestion(q: string, state: AppState) {
  const t = q.toLowerCase();
  const matches = topCareers(state, 5);

  if (/over \$?100|100k|six figures/.test(t)) {
    const highPay = matches.filter((m) => /financial|software|consultant|product|lawyer/.test(m.career.id));
    return highPay.length
      ? `Careers in your matches with strong income potential include: ${highPay.map((x) => x.career.title).join(", ")}. Verify salary data on official labor statistics sites.`
      : "Complete the career assessment to see income-aligned matches. Published salaries vary widely by location and experience.";
  }
  if (/travel/.test(t)) {
    const travel = matches.filter((m) => m.career.workEnvironment.includes("Traveling"));
    return travel.length
      ? `Careers that often involve travel: ${travel.map((x) => x.career.title).join(", ")}.`
      : "Management consulting and some sales or field roles often involve travel. Explore career pages for details.";
  }
  if (/lawyer|law school/.test(t)) {
    return "Lawyers typically need a bachelor's degree followed by law school (JD). Common undergraduate majors include Political Science, History, Economics, and English.";
  }
  if (/engineer|engineering/.test(t)) {
    const eng = matches.find((m) => m.career.id.includes("engineer"));
    return eng
      ? `Based on your assessment, ${eng.career.title} (${eng.match.fit}% fit) may be worth exploring. Engineering paths usually require strong math and science coursework.`
      : "Engineering careers typically require a bachelor's in engineering or a related field, with strong math and science preparation.";
  }
  if (/good at|would i be/.test(t)) {
    return matches[0]
      ? `Your top career match is ${matches[0].career.title} (${matches[0].match.fit}% fit). ${matches[0].match.why[0] ?? ""} Explore the career page to decide if it fits you.`
      : "Complete the career assessment so we can compare your interests and work style to career options.";
  }
  if (/outdoors|outside/.test(t)) {
    const out = matches.filter((m) => m.career.tags.includes("outdoors") || m.career.workEnvironment.includes("Outdoors"));
    return out.length
      ? `Outdoor-oriented matches: ${out.map((x) => x.career.title).join(", ")}.`
      : "Environmental science, field engineering, and some healthcare or trades roles can involve outdoor work.";
  }
  if (/business/.test(t)) {
    const biz = matches.filter((m) => m.career.tags.includes("business"));
    return biz.length
      ? `Business-aligned careers for you: ${biz.map((x) => x.career.title).join(", ")}.`
      : "Business, finance, consulting, and operations roles are common pathways — complete the assessment to rank them for you.";
  }

  return matches[0]
    ? `Try asking about salary, travel, degrees required, or whether you'd fit a field. Your top match today: ${matches[0].career.title} (${matches[0].match.fit}% fit).`
    : "Complete the career assessment, then ask about specific careers, salaries, travel, or degree requirements.";
}
