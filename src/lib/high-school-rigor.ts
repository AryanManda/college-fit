import type { AppState } from "./types";

/**
 * Contextual high-school rigor for admissions odds.
 * Uses selected school name + advanced coursework intensity as a stand-in until
 * official school-level historical peer outcomes are wired in.
 */
export function highSchoolRigorContext(state: AppState): {
  rigorIndex: number;
  bonusCourses: number;
  peerBand: "Below typical" | "Typical" | "Above typical" | "Unknown";
  note: string;
} {
  const hs = state.student.highSchool.trim();
  const advanced = state.courses.filter((c) =>
    ["AP", "IB", "Dual Enrollment", "College"].includes(c.level),
  ).length;
  const apScores = state.testing.ap.length;
  const ibScores = state.testing.ib.length;

  let rigorIndex = 48;
  if (!hs) {
    return {
      rigorIndex: 50,
      bonusCourses: 0,
      peerBand: "Unknown",
      note: "",
    };
  }

  // Name/type heuristics (charter magnet, academy, prep → slightly higher expected rigor)
  if (/\b(magnet|prep|academy|stem|ib world|early college)\b/i.test(hs)) rigorIndex += 10;
  if (/\b(charter)\b/i.test(hs)) rigorIndex += 4;
  if (/\b(alternative|continuation)\b/i.test(hs)) rigorIndex -= 8;

  // Course load vs what a competitive peer set typically carries
  rigorIndex += Math.min(18, advanced * 2.2 + apScores * 1.2 + ibScores * 1.5);

  const classRank = Number(state.academic.classRank);
  const classSize = Number(state.academic.classSize);
  if (classRank > 0 && classSize > 20) {
    const pct = classRank / classSize;
    if (pct <= 0.1) rigorIndex += 8;
    else if (pct <= 0.25) rigorIndex += 4;
    else if (pct >= 0.6) rigorIndex -= 4;
  }

  rigorIndex = Math.max(20, Math.min(92, Math.round(rigorIndex)));

  const peerBand =
    rigorIndex >= 68 ? "Above typical" : rigorIndex >= 45 ? "Typical" : "Below typical";

  const note =
    peerBand === "Above typical"
      ? `Relative to peers at ${hs}, your advanced course load looks stronger than a typical applicant from a similar environment.`
      : peerBand === "Below typical"
        ? `Relative to peers at ${hs}, adding more AP/IB or dual-enrollment coursework would strengthen rigor context for selective schools.`
        : `Odds treat your academics in the context of ${hs}'s expected rigor band.`;

  return {
    rigorIndex,
    bonusCourses: peerBand === "Above typical" ? 1 : 0,
    peerBand,
    note,
  };
}
