import type { AdmissionCategory, AdmissionOutlook, AppState, College } from "./types";
import { parseNum } from "./defaults";
import { gpaOnFour } from "./defaults";
import { highSchoolRigorContext } from "./high-school-rigor";

/** Conservative estimate — not a validated predictive model or guarantee. */
export function estimateLikelihood(
  admissionsScore: number,
  category: AdmissionCategory,
  college: College,
  state: AppState,
  outOfRange = false,
): { likelihood: number; outlook: AdmissionOutlook } {
  const selective = (college.admissions.acceptanceRate ?? 1) < 0.15;
  const ultra = (college.admissions.acceptanceRate ?? 1) < 0.08;
  const gpa = gpaOnFour(state);
  const sat = parseNum(state.testing.sat?.total ?? "");
  const rigor = state.courses.filter((c) => ["AP", "IB", "Dual Enrollment", "College"].includes(c.level)).length;
  const leadership = state.activities.filter((a) => a.hasLeadership).length;
  const extras = state.activities.length;
  const hs = highSchoolRigorContext(state);

  if (outOfRange) {
    return {
      likelihood: Math.min(8, Math.max(2, Math.round(admissionsScore * 0.18))),
      outlook: "Very Unlikely",
    };
  }

  let base =
    category === "Likely" ? 68 :
    category === "Target" ? 46 :
    category === "Reach" ? 22 :
    8;

  base += (admissionsScore - 50) * 0.35;

  if (selective) base -= 12;
  if (ultra) base -= 8;
  if (gpa != null && college.academics.gpaAverage && gpa < college.academics.gpaAverage - 0.35) base -= 14;
  if (sat && college.academics.sat50 && sat < college.academics.sat50 - 80) base -= 10;
  if (rigor < 3) base -= 6;
  if (leadership === 0 && extras < 2) base -= 5;

  // Peer/environment context: stronger relative rigor slightly lifts odds vs same raw GPA alone.
  if (hs.peerBand === "Above typical") base += 4;
  else if (hs.peerBand === "Below typical" && selective) base -= 3;
  base += (hs.rigorIndex - 50) * 0.06;

  const likelihood = Math.max(3, Math.min(88, Math.round(base)));

  const outlook: AdmissionOutlook =
    likelihood >= 62 ? "Strong Match" :
    likelihood >= 38 ? "Target" :
    likelihood >= 15 ? "Reach" :
    "Very Unlikely";

  return { likelihood, outlook };
}

export function likelihoodLabel(outlook: AdmissionOutlook) {
  switch (outlook) {
    case "Strong Match": return "Strong Match";
    case "Target": return "Target";
    case "Reach": return "Reach";
    case "Very Unlikely": return "Very Unlikely";
  }
}

export const LIKELIHOOD_DISCLAIMER =
  "Estimated likelihood is a conservative comparison to published admitted-student ranges and your profile. It is not a prediction, probability model, or guarantee of admission.";
