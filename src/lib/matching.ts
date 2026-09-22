import type { AdmissionCategory, AppState, College, Importance, MatchBreakdown } from "./types";
import { gpaOnFour, parseNum } from "./defaults";
import { COLLEGES } from "../data/colleges";
import { estimateLikelihood } from "./admission-likelihood";
import {
  NEIGHBORS,
  distanceMiles,
  estimateDriveMinutes,
  estimateTransitMinutes,
  maxDriveMinutes,
  maxMilesFromPreset,
} from "./geo";
import { highSchoolRigorContext } from "./high-school-rigor";

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

/** Neutral = 0 so untouched preferences do not bias matching. */
function importanceWeight(v: Importance) {
  switch (v) {
    case "Very Important":
      return 1;
    case "Important":
      return 0.7;
    case "Neutral":
      return 0;
    case "Not Important":
      return 0.15;
  }
}

function anyPreferenceSet(values: Importance[]) {
  return values.some((v) => v !== "Neutral");
}

function overlapScore(student: string[], school: string[]) {
  const s = student.map((x) => x.toLowerCase().trim()).filter(Boolean);
  const h = school.map((x) => x.toLowerCase());
  if (!s.length) return 58;
  let hits = 0;
  for (const item of s) {
    if (h.some((x) => x.includes(item) || item.includes(x))) hits += 1;
  }
  return clamp(42 + (hits / s.length) * 58);
}

function satTotal(state: AppState): number | null {
  return parseNum(state.testing.sat?.total ?? "");
}

function actComposite(state: AppState): number | null {
  return parseNum(state.testing.act?.composite ?? "");
}

function admissionsScore(state: AppState, college: College, why: string[], concerns: string[]) {
  const gpa = gpaOnFour(state);
  const sat = satTotal(state);
  const act = actComposite(state);
  const rigor =
    state.courses.filter((c) => ["AP", "IB", "Dual Enrollment", "College"].includes(c.level)).length;
  let parts: number[] = [];

  if (gpa !== null && college.academics.gpaAverage) {
    const diff = gpa - college.academics.gpaAverage;
    let g = clamp(72 + diff * 55);
    if (diff < -0.55) {
      g = clamp(12 + Math.max(0, diff + 1.1) * 28);
      concerns.push(
        `OUT OF RANGE: Your GPA (${gpa.toFixed(2)}) is substantially below this school's published typical GPA (~${college.academics.gpaAverage.toFixed(2)}). Treating this as a realistic primary option is not reasonable on academics alone.`,
      );
    } else if (diff < -0.3) {
      g = clamp(28 + (diff + 0.55) * 60);
      concerns.push(
        `Your GPA is meaningfully below the school's published typical GPA (~${college.academics.gpaAverage.toFixed(2)}). This is a steep climb, not a mild reach.`,
      );
    } else if (diff < -0.1) {
      concerns.push("Your GPA is below the school's published typical GPA, which makes admission more competitive.");
    } else if (diff >= 0.1) {
      why.push("Your GPA is at or above the school's published typical academic profile.");
    }
    parts.push(g);
  } else if (gpa !== null) {
    parts.push(clamp(50 + (gpa - 3.3) * 40));
  } else {
    concerns.push("Add your GPA to improve admissions-match accuracy.");
    parts.push(52);
  }

  const testBlind = college.admissions.testPolicy === "Test-blind";
  const schoolTestOptional = college.admissions.testPolicy === "Test-optional";
  const hasTest = sat !== null || act !== null;

  if (testBlind) {
    why.push("This university is test-blind, so SAT/ACT scores are not used in this admissions match.");
  } else if (!hasTest && schoolTestOptional) {
    why.push("No test score is required here; your admissions match is based on academics and coursework, not missing tests.");
  } else if (!hasTest && college.admissions.testPolicy === "Required") {
    concerns.push("This school lists tests as required in our dataset, and you have not entered SAT/ACT scores.");
    parts.push(38);
  } else if (!hasTest && state.testing.testOptional) {
    why.push("You marked tests as optional for your applications; schools that still require scores are scored more cautiously.");
    parts.push(48);
  } else if (hasTest) {
    const testParts: number[] = [];
    if (sat !== null && college.academics.sat25 && college.academics.sat75) {
      const { sat25, sat75 } = college.academics;
      let s = 50;
      if (sat < sat25 - 120) {
        s = 8 + Math.max(0, (sat - (sat25 - 280)) / 160) * 18;
        concerns.push(
          `OUT OF RANGE: Your SAT (${sat}) is well below this school's published 25th percentile (${sat25}). On testing alone, this is not a reasonable target right now.`,
        );
      } else if (sat < sat25) {
        s = 18 + ((sat - (sat25 - 120)) / 120) * 22;
        concerns.push(`Your SAT (${sat}) is below the school's published 25th percentile (${sat25}).`);
      } else if (sat <= sat75) s = 58 + ((sat - sat25) / Math.max(sat75 - sat25, 1)) * 28;
      else s = 88 + Math.min(10, (sat - sat75) / 20);
      testParts.push(clamp(s));
      if (sat >= sat75) why.push("Your SAT is at or above the school's published 75th percentile.");
      else if (sat >= sat25) why.push("Your SAT falls within the school's published middle range.");
    }
    if (act !== null && college.academics.act25 && college.academics.act75) {
      const { act25, act75 } = college.academics;
      let s = 50;
      if (act < act25 - 4) {
        s = 10 + Math.max(0, act - (act25 - 8)) * 4;
        concerns.push(
          `OUT OF RANGE: Your ACT (${act}) is well below this school's published 25th percentile (${act25}).`,
        );
      } else if (act < act25) s = 22 + (act - (act25 - 4)) * 5;
      else if (act <= act75) s = 60 + ((act - act25) / Math.max(act75 - act25, 1)) * 26;
      else s = 88;
      testParts.push(clamp(s));
    }
    if (testParts.length) parts.push(Math.max(...testParts));
  }

  const hsRigor = highSchoolRigorContext(state);
  const effectiveRigor = rigor + hsRigor.bonusCourses;
  parts.push(clamp(48 + Math.min(effectiveRigor, 12) * 3.5));
  if (rigor >= 5) why.push("Your advanced coursework supports a competitive academic profile.");
  if (hsRigor.note) why.push(hsRigor.note);

  // Contextual rigor: same GPA is stronger from a more demanding high school environment.
  if (gpa !== null && hsRigor.rigorIndex > 0) {
    const gpaAdj = (hsRigor.rigorIndex - 50) * 0.12;
    parts.push(clamp(50 + gpaAdj + (gpa - 3.3) * 8));
  }

  let avg = parts.reduce((a, b) => a + b, 0) / Math.max(parts.length, 1);
  const rate = college.admissions.acceptanceRate;
  if (rate !== undefined && rate < 0.12) {
    avg = Math.min(avg, 58);
    if (gpa !== null && college.academics.gpaAverage && gpa + 0.05 < college.academics.gpaAverage)
      concerns.push(
        "This is a highly selective university. Being below the published academic range makes admission improbable — not merely competitive.",
      );
    if (rate < 0.08 && avg < 70) {
      avg = Math.min(avg, 42);
      concerns.push(
        `Acceptance rate is about ${Math.round(rate * 100)}%. Even strong applicants are frequently denied. Do not treat this as a reasonable primary plan.`,
      );
    }
  }
  if (concerns.some((c) => c.startsWith("OUT OF RANGE"))) {
    avg = Math.min(avg, 34);
  }

  return clamp(avg);
}

function academicScore(state: AppState, college: College, why: string[]) {
  const prefs = state.preferences.academic;
  const sliders = state.preferences.campusSliders;
  const prefsActive = anyPreferenceSet([
    prefs.classSize,
    prefs.research,
    prefs.internships,
    prefs.professors,
    prefs.careerPlacement,
    prefs.graduatePrep,
    prefs.honorsPrograms,
    prefs.studyAbroad,
    prefs.entrepreneurship,
    prefs.coop,
    prefs.doubleMajors,
    prefs.majorStrength,
  ]);
  const slidersTouched = Math.abs(sliders.schoolSize - 50) > 6 || Math.abs(sliders.classSize - 50) > 6;
  if (!prefsActive && !slidersTouched) return 55;

  const sizeScore =
    college.campus.sizeBand === "Small"
      ? 18
      : college.campus.sizeBand === "Medium"
        ? 45
        : college.campus.sizeBand === "Large"
          ? 72
          : 92;
  const classFit = 100 - Math.abs(sliders.schoolSize - sizeScore);
  const ratio = college.studentFacultyRatio;
  const smallClassFit = ratio ? clamp(100 - Math.abs((100 - sliders.classSize) / 4 - (20 - Math.min(ratio, 25)))) : 60;

  const researchBoost = college.academicStrengths.some((s) => /research/i.test(s)) || college.undergraduateEnrollment > 15000 ? 82 : 58;
  const internBoost =
    college.campusSetting === "Urban" || college.academicStrengths.some((s) => /intern|co-op|experiential/i.test(s))
      ? 86
      : 62;
  const honors = /honor/i.test(college.academicStrengths.join(" ")) ? 80 : 64;
  const entre = college.academicStrengths.concat(college.careerStrengths).some((s) => /entrepreneur/i.test(s)) ? 88 : 60;
  const coop = college.academicStrengths.some((s) => /co-op/i.test(s)) ? 92 : 55;

  const weighted =
    (slidersTouched ? classFit * 0.45 + smallClassFit * 0.25 : 0) +
    classFit * importanceWeight(prefs.classSize) +
    researchBoost * importanceWeight(prefs.research) +
    internBoost * importanceWeight(prefs.internships) +
    78 * importanceWeight(prefs.professors) +
    80 * importanceWeight(prefs.careerPlacement) +
    researchBoost * importanceWeight(prefs.graduatePrep) +
    honors * importanceWeight(prefs.honorsPrograms) +
    70 * importanceWeight(prefs.studyAbroad) +
    entre * importanceWeight(prefs.entrepreneurship) +
    coop * importanceWeight(prefs.coop) +
    75 * importanceWeight(prefs.doubleMajors);

  const denom =
    (slidersTouched ? 0.7 : 0) +
    importanceWeight(prefs.classSize) +
    importanceWeight(prefs.research) +
    importanceWeight(prefs.internships) +
    importanceWeight(prefs.professors) +
    importanceWeight(prefs.careerPlacement) +
    importanceWeight(prefs.graduatePrep) +
    importanceWeight(prefs.honorsPrograms) +
    importanceWeight(prefs.studyAbroad) +
    importanceWeight(prefs.entrepreneurship) +
    importanceWeight(prefs.coop) +
    importanceWeight(prefs.doubleMajors);

  if (denom < 0.05) return 55;

  if (college.studentFacultyRatio && college.studentFacultyRatio <= 10 && prefs.classSize !== "Not Important" && prefs.classSize !== "Neutral")
    why.push("Published student-faculty ratio is relatively small, which aligns with a preference for closer teaching.");
  if (internBoost > 80 && prefs.internships === "Very Important")
    why.push("The campus setting and program mix support internship access.");

  return clamp(weighted / denom);
}

function majorScore(state: AppState, college: College, why: string[], concerns: string[]) {
  const majors = state.career.intendedMajors;
  if (!majors.length) {
    concerns.push("Add an intended major to improve major-match accuracy.");
    return 55;
  }
  const pool = [...college.majors, ...college.academicStrengths];
  const score = overlapScore(majors, pool);
  if (score >= 80) why.push("Your intended major is strongly represented in this university's listed programs.");
  else if (score < 55)
    concerns.push("Your intended major is not clearly listed among this school's highlighted undergraduate programs in our dataset.");
  return score;
}

function financialScore(state: AppState, college: College, why: string[], concerns: string[]) {
  const max = parseNum(state.preferences.financial.maxAnnualCost);
  const inState = state.student.state === college.state;
  const cost = inState
    ? college.cost.estimatedTotalInState ?? college.cost.estimatedTotalOutOfState
    : college.cost.estimatedTotalOutOfState ?? college.cost.estimatedTotalInState;
  const aid = college.cost.averageAid ?? 0;
  let score = 60;

  if (!state.preferences.financial.willingOutOfState && !inState && college.type === "Public") {
    score -= 28;
    concerns.push("This is an out-of-state public university and you indicated limited willingness to attend out of state.");
  }

  if (max && cost) {
    const net = Math.max(0, cost - (state.preferences.financial.needBasedAid ? aid * 0.45 : 0));
    if (net <= max) {
      score = 90 - (net / max) * 12;
      why.push("Estimated cost is within your stated annual budget range.");
    } else {
      const over = (net - max) / max;
      score = clamp(78 - over * 55);
      concerns.push("Estimated total cost exceeds your preferred annual budget.");
    }
  } else if (!max) {
    concerns.push("Add a maximum annual cost to improve financial matching.");
  } else {
    concerns.push("Full cost data is unavailable for this school in our dataset.");
    score = 58;
  }

  if (state.preferences.financial.meritScholarships && college.id === "alabama")
    why.push("This university is widely known for published merit-aid programs; verify current awards with the school.");
  if (inState && college.type === "Public") why.push("In-state public tuition applies based on your listed home state.");
  if (state.preferences.geographic.inStateTuitionOnly && !(inState && college.type === "Public") && college.type !== "Community") {
    score -= 22;
    concerns.push("You asked to prioritize schools where in-state tuition is likely.");
  }

  return clamp(score);
}

function locationScore(state: AppState, college: College, why: string[], concerns: string[]) {
  const geo = state.preferences.geographic;
  const home = state.student.state;
  const inState = Boolean(home && home === college.state);
  const neighbor = Boolean(home && NEIGHBORS[home]?.includes(college.state));
  const miles = distanceMiles(state, college);
  const drive = miles != null ? estimateDriveMinutes(miles) : null;
  let score = 70;

  if (geo.unwillingStates.includes(college.state)) {
    concerns.push("This school is in a state you marked as unwilling to attend.");
    return { score: 8, miles, drive };
  }

  if (geo.attendanceScope === "only-state") {
    score = inState ? 96 : 42;
    if (inState) why.push("In-state option, matching your request to stay in-state.");
    else concerns.push("Outside your state — still shown, but ranked lower because you asked to stay in-state.");
  } else if (geo.attendanceScope === "primarily-state") {
    score = inState ? 94 : neighbor ? 72 : 50;
    if (inState) why.push("In-state, which you said you primarily want.");
  } else if (geo.attendanceScope === "state-neighbors") {
    score = inState ? 94 : neighbor ? 86 : 55;
    if (inState || neighbor) why.push("Location is in your state or a neighboring state.");
  } else if (geo.attendanceScope === "us" || geo.attendanceScope === "world") {
    score = 70;
    if (home) {
      if (inState) {
        score = 92;
        why.push(`In your home state (${home}) — prioritized because you listed residence there.`);
      } else if (neighbor) {
        score = 78;
        why.push("In a neighboring state relative to your residence.");
      } else {
        score = 58;
      }
    }
  }

  const cap = maxMilesFromPreset(geo.distancePreset, geo.customMaxMiles || geo.maxDistanceMiles, home, college.state);
  if (cap === 0) {
    score -= 30;
    concerns.push("Outside the distance range you selected.");
  } else if (cap != null && miles != null) {
    if (miles <= cap) {
      score += 10;
      why.push(`About ${miles} miles from home, within your distance preference.`);
    } else {
      score -= 22;
      concerns.push(`About ${miles} miles away, farther than your preferred maximum.`);
    }
  }

  const driveCap = maxDriveMinutes(geo.maxDriveTime);
  if (driveCap != null && drive != null) {
    if (drive <= driveCap) {
      score += 8;
      why.push(`Estimated drive is about ${drive} minutes (not live traffic).`);
    } else {
      score -= 16;
      concerns.push(`Estimated drive (${drive} min) is longer than your preferred maximum.`);
    }
  }

  if (geo.preferredStates.includes(college.state)) score += 6;
  return { score: clamp(score), miles, drive };
}

function lifestyleScore(state: AppState, college: College, why: string[]) {
  const sliders = state.preferences.campusSliders;
  const campus = state.preferences.campus;
  const tags = state.preferences.lifestyle.tags;
  const campusPrefs = [
    campus.greekLife,
    campus.athletics,
    campus.schoolSpirit,
    campus.clubs,
    campus.socialScene,
    campus.diversityOfActivities,
    campus.religiousEnvironment,
    campus.politicalEnvironment,
    campus.outdoorRecreation,
  ];
  const slidersTouched =
    Math.abs(sliders.urbanRural - 50) > 6 ||
    Math.abs(sliders.schoolSize - 50) > 6 ||
    Math.abs(sliders.traditionalModern - 50) > 6;
  const prefsTouched = anyPreferenceSet(campusPrefs) || tags.length > 0 || slidersTouched;
  if (!prefsTouched) return 55;

  let score = 62;
  if (slidersTouched) {
    const settingTarget =
      sliders.urbanRural < 34 ? "Urban" : sliders.urbanRural > 66 ? "Rural" : "Suburban";
    if (college.campusSetting === settingTarget) {
      score += 10;
      why.push("The campus setting matches your urban/suburban/rural preference.");
    } else score -= 6;

    const sizeTarget =
      sliders.schoolSize < 22
        ? "Very Small"
        : sliders.schoolSize < 40
          ? "Small"
          : sliders.schoolSize < 58
            ? "Medium"
            : sliders.schoolSize < 80
              ? "Large"
              : "Very Large";
    if (college.campus.sizeBand === sizeTarget) {
      score += 10;
      why.push("The school's size matches your preference.");
    }
  }

  const lifeHits = tags.filter((t) =>
    college.lifestyle.some((x) => x.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(x.toLowerCase())),
  );
  score += Math.min(12, lifeHits.length * 4);
  if (lifeHits.length) why.push(`Lifestyle overlap: ${lifeHits.slice(0, 3).join(", ")}.`);

  if (campus.athletics === "Very Important" && college.campus.athletics === "NCAA D1") score += 6;
  if (campus.greekLife === "Very Important" && college.campus.greekLife === "High") score += 5;
  if (campus.greekLife === "Not Important" && college.campus.greekLife === "High") score -= 4;
  return clamp(score);
}

function careerScore(state: AppState, college: College, why: string[], concerns: string[]) {
  const careers = [...state.career.intendedCareers, ...state.career.industries];
  if (!careers.length) {
    concerns.push("Add career goals to improve career matching.");
    return 55;
  }
  const score = overlapScore(careers, [...college.careerStrengths, ...college.academicStrengths, ...college.majors]);
  if (score >= 78) why.push("Career opportunities at this school align with your stated goals.");
  if (state.career.graduateSchoolInterest.toLowerCase().includes("yes") && college.outcomes.graduationRate && college.outcomes.graduationRate > 0.9)
    why.push("Strong published graduation outcomes can support later graduate study — verify program-level data with the school.");
  return score;
}

function admissionCategory(admissions: number, college: College): AdmissionCategory {
  const selective = (college.admissions.acceptanceRate ?? 1) < 0.12;
  const ultra = (college.admissions.acceptanceRate ?? 1) < 0.08;
  if (admissions < 42 || (selective && admissions < 58) || (ultra && admissions < 65)) return "High Reach";
  if (admissions < 58) return "Reach";
  if (admissions < 76) return "Target";
  return "Likely";
}

/** 0–100 academic profile strength from GPA, tests, and rigor. */
export function studentAcademicStrength(state: AppState): number {
  const gpa = gpaOnFour(state);
  const sat = satTotal(state);
  const act = actComposite(state);
  const rigor = state.courses.filter((c) =>
    ["AP", "IB", "Dual Enrollment", "College"].includes(c.level),
  ).length;

  const parts: number[] = [];
  if (gpa != null) {
    // 2.5 → ~35, 3.5 → ~70, 4.0 → ~92
    parts.push(clamp(20 + (gpa - 2.0) * 36));
  }
  if (sat != null) {
    // 1000 → ~40, 1200 → ~60, 1400 → ~80, 1550 → ~95
    parts.push(clamp(((sat - 800) / 800) * 100));
  }
  if (act != null) {
    parts.push(clamp(((act - 14) / 22) * 100));
  }
  parts.push(clamp(40 + Math.min(rigor, 10) * 5));

  if (!parts.length) return 50;
  // Weight GPA/tests more than rigor when available
  if (parts.length >= 2) {
    const academic = parts.slice(0, -1);
    const avgA = academic.reduce((a, b) => a + b, 0) / academic.length;
    const rigorPart = parts[parts.length - 1];
    return clamp(avgA * 0.85 + rigorPart * 0.15);
  }
  return clamp(parts[0]);
}

/** 0–100 how selective / academically demanding the school is. */
export function schoolAcademicBar(college: College): number {
  const rate = college.admissions.acceptanceRate;
  const gpa = college.academics.gpaAverage;
  const sat =
    college.academics.sat50 ??
    (college.academics.sat25 != null && college.academics.sat75 != null
      ? (college.academics.sat25 + college.academics.sat75) / 2
      : null);
  const act =
    college.academics.act50 ??
    (college.academics.act25 != null && college.academics.act75 != null
      ? (college.academics.act25 + college.academics.act75) / 2
      : null);

  const parts: number[] = [];
  if (rate != null) {
    // 80% accept → ~25, 30% → ~55, 15% → ~72, 5% → ~92
    parts.push(clamp(100 - rate * 95));
  }
  if (gpa != null) parts.push(clamp(20 + (gpa - 2.0) * 36));
  if (sat != null) parts.push(clamp(((sat - 800) / 800) * 100));
  if (act != null) parts.push(clamp(((act - 14) / 22) * 100));
  if (college.type === "Community") parts.push(28);
  if (!parts.length) return 55;
  return clamp(parts.reduce((a, b) => a + b, 0) / parts.length);
}

/**
 * How well this school's difficulty matches the student's stats.
 * Peaks when the school is near the student's level (slight stretch OK).
 * Strong students get weak scores for very easy schools; weak students get weak scores for elite bars.
 */
export function statsAlignment(studentStrength: number, schoolBar: number): number {
  const diff = studentStrength - schoolBar;
  // Ideal band: school is from ~8 points harder to ~15 points easier than the student
  if (diff >= -8 && diff <= 15) {
    // Prefer slight stretch (diff near 0 to -5) for ambitious but realistic picks
    const ideal = -2;
    return clamp(96 - Math.abs(diff - ideal) * 2.2);
  }
  if (diff > 15) {
    // Too easy for this student — still usable as Likely, but not a top "for you" pick
    return clamp(72 - (diff - 15) * 2.4);
  }
  // Too hard
  const shortfall = -diff;
  if (shortfall <= 18) return clamp(70 - shortfall * 1.8);
  return clamp(42 - (shortfall - 18) * 2.2);
}

/** Prefer competitive Target/Likely bands over trivial safeties or hopeless reaches. */
function admissionsBandScore(admissions: number, category: AdmissionCategory): number {
  if (category === "Target") return clamp(70 + (admissions - 58) * 0.9);
  if (category === "Likely") {
    // Soften ultra-safeties (98) so they don't dominate over peer Targets
    if (admissions >= 90) return clamp(78 - (admissions - 90) * 1.5);
    return clamp(74 + (admissions - 76) * 0.6);
  }
  if (category === "Reach") return clamp(58 + (admissions - 42) * 0.7);
  return clamp(28 + admissions * 0.35);
}

export function recommendationScore(
  state: AppState,
  match: MatchBreakdown,
  college: College,
  studentStrength?: number,
): number {
  const strength = studentStrength ?? studentAcademicStrength(state);
  const bar = schoolAcademicBar(college);
  const align = statsAlignment(strength, bar);
  const band = admissionsBandScore(match.admissions, match.category);
  const majorCareer = (match.major + match.career) / 2;

  let loc = match.location;
  if (match.inStateForStudent) loc = Math.min(100, loc + 8);
  else if (state.student.state) {
    const neighbors = NEIGHBORS[state.student.state] ?? [];
    if (neighbors.includes(college.state)) loc = Math.min(100, loc + 4);
  }
  // Prefer nearer schools when distance is known
  if (match.miles != null) {
    if (match.miles <= 100) loc = Math.min(100, loc + 6);
    else if (match.miles <= 250) loc = Math.min(100, loc + 3);
    else if (match.miles > 800) loc -= 4;
  }

  let score =
    band * 0.38 +
    align * 0.28 +
    majorCareer * 0.14 +
    loc * 0.12 +
    match.overall * 0.08;

  if (match.outOfRange) score -= 35;
  // Strong students: demote open-admission / very easy schools from the top of the list
  if (strength >= 78 && bar <= strength - 22 && match.admissions >= 88) score -= 18;
  // Weak/mid students: demote ultra-selective schools even if lifestyle matches
  if (strength <= 55 && bar >= 82) score -= 14;

  return score;
}

export function matchCollege(state: AppState, college: College): MatchBreakdown {
  const why: string[] = [];
  const concerns: string[] = [];
  const admissions = admissionsScore(state, college, why, concerns);
  const academic = academicScore(state, college, why);
  const major = majorScore(state, college, why, concerns);
  const financial = financialScore(state, college, why, concerns);
  const loc = locationScore(state, college, why, concerns);
  const lifestyle = lifestyleScore(state, college, why);
  const career = careerScore(state, college, why, concerns);
  const academicMajor = (academic + major) / 2;

  // Admissions odds dominate overall match; subjective prefs only contribute after the student sets them.
  const overall = clamp(
    admissions * 0.52 +
      academicMajor * 0.14 +
      career * 0.12 +
      financial * 0.08 +
      loc.score * 0.08 +
      lifestyle * 0.06,
  );

  const outOfRange = concerns.some((c) => c.startsWith("OUT OF RANGE"));
  let category = admissionCategory(admissions, college);
  if (outOfRange) category = "High Reach";
  const { likelihood, outlook } = estimateLikelihood(admissions, category, college, state, outOfRange);
  const uniqueWhy = [...new Set(why)].slice(0, 6);
  const uniqueConcerns = [...new Set(concerns)].slice(0, 8);
  if (outOfRange) {
    uniqueConcerns.unshift(
      "Not a reasonable primary option right now — your academics are substantially below this school's published admitted-student ranges.",
    );
  }
  const inState = Boolean(state.student.state && state.student.state === college.state);
  const transit = loc.miles != null ? estimateTransitMinutes(loc.miles, college.campusSetting === "Urban") : null;

  return {
    collegeId: college.id,
    overall: outOfRange ? Math.min(overall, 42) : overall,
    admissions,
    academic,
    major,
    financial,
    lifestyle,
    career,
    location: loc.score,
    category,
    listBucket: category,
    why: uniqueWhy.length ? uniqueWhy : ["Limited profile data — complete more of your profile for a clearer explanation."],
    concerns: [...new Set(uniqueConcerns)].slice(0, 8),
    outOfRange,
    miles: loc.miles,
    driveMinutes: loc.drive,
    transitMinutes: transit,
    inStateForStudent: inState,
    estimatedLikelihood: likelihood,
    admissionOutlook: outlook,
  };
}

export function matchAll(state: AppState) {
  const strength = studentAcademicStrength(state);
  return COLLEGES.map((c) => {
    const match = matchCollege(state, c);
    return { match, college: c, rank: recommendationScore(state, match, c, strength) };
  })
    .sort((a, b) => {
      if (b.rank !== a.rank) return b.rank - a.rank;
      // Tie-break: closer academic bar to student, then nearer miles
      const barA = Math.abs(strength - schoolAcademicBar(a.college));
      const barB = Math.abs(strength - schoolAcademicBar(b.college));
      if (barA !== barB) return barA - barB;
      const milesA = a.match.miles ?? 99999;
      const milesB = b.match.miles ?? 99999;
      return milesA - milesB;
    })
    .map((x) => x.match);
}

export function achievableRank(m: MatchBreakdown) {
  return m.admissions * 0.55 + m.overall * 0.45;
}

export function scoreColor(score: number) {
  if (score >= 80) return "var(--score-high)";
  if (score >= 60) return "var(--score-mid)";
  return "var(--score-low)";
}
