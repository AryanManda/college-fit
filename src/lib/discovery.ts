import type { AdmissionCategory, AppState, College, MatchBreakdown } from "./types";
import { COLLEGES, getCollege } from "../data/colleges";
import { matchAll, matchCollege, recommendationScore, studentAcademicStrength } from "./matching";
import { gpaOnFour, parseNum } from "./defaults";
import { cityCoordsByName, collegeCoords, estimateDriveMinutes, haversineMiles } from "./geo";

export function byCategory(all: MatchBreakdown[], cat: AdmissionCategory) {
  return all.filter((m) => m.category === cat);
}

export function recommendedList(state: AppState) {
  const all = matchAll(state);
  const strength = studentAcademicStrength(state);
  const ranked = (list: MatchBreakdown[]) =>
    [...list].sort((a, b) => {
      const ca = getCollege(a.collegeId);
      const cb = getCollege(b.collegeId);
      if (!ca || !cb) return 0;
      return recommendationScore(state, b, cb, strength) - recommendationScore(state, a, ca, strength);
    });

  const take = (cat: AdmissionCategory, n: number) =>
    ranked(byCategory(all, cat).filter((m) => !m.outOfRange || cat === "High Reach")).slice(0, n);

  const achievable = ranked(
    all.filter((m) => !m.outOfRange && (m.category === "Likely" || m.category === "Target")),
  ).slice(0, 10);

  return {
    all,
    likely: take("Likely", 5),
    target: take("Target", 8),
    reach: take("Reach", 4),
    highReach: take("High Reach", 3),
    inState: ranked(
      all.filter((m) => m.inStateForStudent && !m.outOfRange && (m.category === "Likely" || m.category === "Target")),
    ),
    outState: ranked(
      all.filter((m) => !m.inStateForStudent && !m.outOfRange && (m.category === "Likely" || m.category === "Target")),
    ),
    achievable,
  };
}

export function similarMoreAchievable(state: AppState, college: College, limit = 4) {
  const focus = matchCollege(state, college);
  return matchAll(state)
    .filter((m) => m.collegeId !== college.id)
    .filter((m) => m.admissions >= focus.admissions + 8 || (m.category === "Likely" || m.category === "Target") && focus.category !== "Likely")
    .map((m) => ({ match: m, college: getCollege(m.collegeId)! }))
    .filter((x) => x.college)
    .map((x) => {
      const c = x.college;
      let sim = 0;
      if (c.type === college.type) sim += 2;
      if (c.campus.sizeBand === college.campus.sizeBand) sim += 2;
      if (c.campusSetting === college.campusSetting) sim += 1;
      if (c.institutionKind === college.institutionKind) sim += 2;
      const majors = college.majors.filter((m) => c.majors.some((y) => y.toLowerCase().includes(m.toLowerCase()) || m.toLowerCase().includes(y.toLowerCase())));
      sim += Math.min(3, majors.length);
      return { ...x, similarity: sim, shared: majors.slice(0, 3) };
    })
    .sort((a, b) => b.similarity - a.similarity || b.match.admissions - a.match.admissions)
    .slice(0, limit);
}

export function listHealth(state: AppState) {
  const counts = { Likely: 0, Target: 0, Reach: 0, "High Reach": 0 };
  const items = state.savedCollegeIds.map((id) => {
    const college = getCollege(id);
    if (!college) return null;
    const match = matchCollege(state, college);
    counts[match.category] += 1;
    return { college, match };
  }).filter(Boolean) as { college: College; match: MatchBreakdown }[];
  const total = items.length;
  const reachHeavy = total >= 4 && counts.Reach + counts["High Reach"] >= total * 0.6;
  const tooSafe = total >= 4 && counts.Likely >= total * 0.7;
  const warnings: string[] = [];
  const recs: string[] = [];
  if (reachHeavy) {
    warnings.push("Your list is heavily weighted toward reach schools.");
    recs.push("Add 3–4 schools where your admissions profile is more competitive (Likely / Target).");
  }
  if (tooSafe) {
    warnings.push("Your list is very safe.");
    recs.push("Consider adding 1–2 target schools that better stretch your academic profile.");
  }
  if (total === 0) recs.push("Save schools from Find My Colleges to build a balanced list.");
  if (!reachHeavy && !tooSafe && total) recs.push("Keep a mix of Likely, Target, and a few Reach schools — not only the most selective names.");
  return { counts, items, warnings, recs, total };
}

export type NlFilters = {
  text: string;
  size?: string;
  type?: string;
  kind?: string;
  hours?: number;
  miles?: number;
  major?: string;
  maxCost?: number;
  likelyOnly?: boolean;
  similarTo?: string;
  nearHome?: boolean;
  city?: string;
};

export function parseNaturalQuery(q: string): NlFilters {
  const t = q.toLowerCase();
  const filters: NlFilters = { text: q };
  if (/\blarge\b/.test(t)) filters.size = "Large";
  if (/\bvery large\b/.test(t)) filters.size = "Very Large";
  if (/\bsmall\b/.test(t)) filters.size = "Small";
  if (/\bmedium\b/.test(t)) filters.size = "Medium";
  if (/\bpublic\b/.test(t)) filters.type = "Public";
  if (/\bprivate\b/.test(t)) filters.type = "Private";
  if (/community/.test(t)) filters.type = "Community";
  if (/liberal arts/.test(t)) filters.kind = "Liberal arts";
  if (/technical|engineering school/.test(t)) filters.kind = "Technical university";
  const hour = t.match(/(\d+(?:\.\d+)?)\s*hours?/);
  if (hour) filters.hours = Number(hour[1]);
  if (!filters.hours && /\b(an|one)\s+hour\b/.test(t)) filters.hours = 1;
  const mile = t.match(/(\d+)\s*miles?/);
  if (mile) filters.miles = Number(mile[1]);
  const cost = t.match(/\$?\s*(\d{2,3})\s*,?\s*000/) || t.match(/under\s*\$?(\d+)/);
  if (cost) filters.maxCost = Number(cost[1]) < 1000 ? Number(cost[1]) * 1000 : Number(cost[1]);
  if (/business/.test(t)) filters.major = "Business";
  if (/computer science|\bcs\b/.test(t)) filters.major = "Computer Science";
  if (/engineering/.test(t) && !filters.kind) filters.major = "Engineering";
  if (/nursing/.test(t)) filters.major = "Nursing";
  if (/good chance|likely|easier to get|realistic|can get in/.test(t)) filters.likelyOnly = true;
  if (/near (me|home)|from home/.test(t)) filters.nearHome = true;
  const similar = t.match(/similar to ([a-z0-9 &.'-]+?)(?:\s+but|\s*$)/i);
  if (similar) filters.similarTo = similar[1].trim();
  const city = t.match(/(?:of|near|around)\s+([a-z .]+?)(?:\s+with|\s+where|\s+and|,|$)/i);
  if (city) {
    const name = city[1].trim();
    if (cityCoordsByName(name)) filters.city = name;
  }
  return filters;
}

export function runNaturalSearch(state: AppState, q: string) {
  const f = parseNaturalQuery(q);
  let all = matchAll(state);
  if (f.similarTo) {
    const target = COLLEGES.find((c) => c.name.toLowerCase().includes(f.similarTo!) || c.shortName.toLowerCase().includes(f.similarTo!));
    if (target) return { filters: f, results: similarMoreAchievable(state, target, 8).map((s) => s.match) };
  }
  all = all.filter((m) => {
    const c = getCollege(m.collegeId);
    if (!c) return false;
    if (f.size && c.campus.sizeBand !== f.size && !(f.size === "Large" && (c.campus.sizeBand === "Large" || c.campus.sizeBand === "Very Large"))) return false;
    if (f.type && c.type !== f.type) return false;
    if (f.kind && c.institutionKind !== f.kind) return false;
    if (f.major && ![...c.majors, ...c.academicStrengths].some((x) => x.toLowerCase().includes(f.major!.toLowerCase()))) return false;
    if (f.maxCost) {
      const cost = m.inStateForStudent ? c.cost.estimatedTotalInState ?? c.cost.estimatedTotalOutOfState : c.cost.estimatedTotalOutOfState;
      if (cost && cost > f.maxCost) return false;
    }
    if (f.likelyOnly && m.category !== "Likely" && m.category !== "Target") return false;
    if (f.hours) {
      if (f.city) {
        const origin = cityCoordsByName(f.city);
        const dest = collegeCoords(c);
        if (origin && dest) {
          const drive = estimateDriveMinutes(haversineMiles(origin, dest));
          if (drive > f.hours * 60) return false;
        } else if (m.driveMinutes == null || m.driveMinutes > f.hours * 60) return false;
      } else if (m.driveMinutes == null || m.driveMinutes > f.hours * 60) return false;
    }
    if (f.miles && (m.miles == null || m.miles > f.miles)) return false;
    if (f.nearHome && m.miles != null && m.miles > 80) return false;
    return true;
  });
  return { filters: f, results: all.slice(0, 15) };
}

export function rangeStatus(student: number | null, low?: number, high?: number) {
  if (student == null || low == null || high == null) return { label: "Unavailable", detail: "Published range is unavailable, so this factor is not scored as a guarantee." };
  if (student >= high) return { label: "Above range", detail: "Your number is at or above the published 75th percentile / typical figure." };
  if (student >= low) return { label: "Competitive", detail: "Your number falls inside the school's published middle range." };
  return { label: "Below range", detail: "Your number is below the school's published 25th percentile / typical figure." };
}

export function admissionsBreakdown(state: AppState, college: College) {
  const gpa = gpaOnFour(state);
  const sat = parseNum(state.testing.sat?.total ?? "");
  const ap = state.courses.filter((c) => c.level === "AP").length;
  const honors = state.courses.filter((c) => c.level === "Honors").length;
  const dual = state.courses.filter((c) => c.level === "Dual Enrollment" || c.level === "College").length;
  const leadership = state.activities.filter((a) => a.hasLeadership).length;
  const extras = state.activities.length;
  const match = matchCollege(state, college);
  return {
    match,
    gpa: { student: gpa, typical: college.academics.gpaAverage, ...rangeStatus(gpa, college.academics.gpaAverage ? college.academics.gpaAverage - 0.2 : undefined, college.academics.gpaAverage) },
    sat: { student: sat, low: college.academics.sat25, high: college.academics.sat75, ...rangeStatus(sat, college.academics.sat25, college.academics.sat75) },
    rigor: { ap, honors, dual, label: ap + dual >= 5 ? "Strong" : ap + dual >= 2 ? "Moderate" : "Limited" },
    extras: { extras, label: extras >= 3 ? "Strong" : extras >= 1 ? "Moderate" : "Limited" },
    leadership: { leadership, label: leadership >= 2 ? "Strong" : leadership === 1 ? "Moderate" : "Limited" },
    work: { n: state.work.length, label: state.work.length ? "Strong" : "Limited" },
    major: { label: match.major >= 75 ? "Strong match" : match.major >= 55 ? "Partial match" : "Unclear" },
  };
}

export type ImproveOddsTip = {
  priority: "critical" | "high" | "medium";
  title: string;
  detail: string;
  whyItMatters: string;
  href?: string;
  cta?: string;
  metric?: { current: string; target: string };
};

export function improveOdds(state: AppState, college: College): ImproveOddsTip[] {
  const tips: ImproveOddsTip[] = [];
  const gpa = gpaOnFour(state);
  const sat = parseNum(state.testing.sat?.total ?? "");
  const act = parseNum(state.testing.act?.composite ?? "");
  const rigor = state.courses.filter((c) => ["AP", "IB", "Dual Enrollment", "College"].includes(c.level)).length;
  const leadership = state.activities.filter((a) => a.hasLeadership).length;
  const quantified = state.activities.filter((a) => a.accomplishments && /\d/.test(a.accomplishments)).length;

  if (gpa != null && college.academics.gpaAverage) {
    const gap = college.academics.gpaAverage - gpa;
    if (gap > 0.35) {
      tips.push({
        priority: "critical",
        title: "Your GPA is substantially below this school's published typical range",
        detail: `Published typical GPA is about ${college.academics.gpaAverage.toFixed(2)}; yours is ${gpa.toFixed(2)}. Prioritize senior-year grades in core academic courses and document upward trends you can verify.`,
        whyItMatters: "GPA is usually the strongest academic filter. A large deficit makes this school an unreasonable primary plan until the gap closes or you add transfer pathways.",
        href: "/profile?tab=academics",
        cta: "Update academics",
        metric: { current: gpa.toFixed(2), target: `~${college.academics.gpaAverage.toFixed(2)}` },
      });
    } else if (gap > 0.1) {
      tips.push({
        priority: "high",
        title: "Close the GPA gap with strong senior-year grades",
        detail: `You are about ${gap.toFixed(2)} points below the published typical GPA (~${college.academics.gpaAverage.toFixed(2)}). Sustained A-range grades in remaining terms matter more than stacking weak electives.`,
        whyItMatters: "Even a modest GPA deficit compounds at selective schools.",
        href: "/profile?tab=academics",
        metric: { current: gpa.toFixed(2), target: `~${college.academics.gpaAverage.toFixed(2)}` },
      });
    }
  } else if (gpa == null) {
    tips.push({
      priority: "critical",
      title: "Add your GPA before trusting any odds estimate",
      detail: "Without GPA, admissions matching cannot compare you to published admitted-student academics.",
      whyItMatters: "Missing academics inflate uncertainty and hide true reach schools.",
      href: "/profile?tab=academics",
      cta: "Add GPA",
    });
  }

  if (sat && college.academics.sat25 && sat < college.academics.sat25 - 80) {
    tips.push({
      priority: "critical",
      title: "SAT is well below this school's published 25th percentile",
      detail: `School 25th–75th SAT is roughly ${college.academics.sat25}–${college.academics.sat75}. Yours is ${sat}. A retake only helps if you can prepare seriously; otherwise treat this school as a stretch, not a plan.`,
      whyItMatters: "Testing below the published floor is a hard academic signal for many selective programs.",
      href: "/profile?tab=academics",
      cta: "Update testing",
      metric: { current: String(sat), target: String(college.academics.sat50 ?? college.academics.sat25) },
    });
  } else if (sat && college.academics.sat75 && sat < college.academics.sat75) {
    tips.push({
      priority: "high",
      title: "Move SAT toward the school's published 75th percentile",
      detail: `Published SAT middle/upper range runs to ${college.academics.sat75}. Improving toward that band strengthens the academic comparison if you plan to submit scores.`,
      whyItMatters: "Sitting in the lower half of the published range is still competitive — but not comfortable.",
      href: "/profile?tab=academics",
      metric: { current: String(sat), target: String(college.academics.sat75) },
    });
  } else if (!sat && !act && !state.testing.testOptional && college.admissions.testPolicy !== "Test-blind") {
    tips.push({
      priority: "high",
      title: "Add SAT/ACT or mark test-optional",
      detail: "This school still uses testing context in our dataset. Enter scores or mark that you are applying test-optional.",
      whyItMatters: "Missing tests make odds estimates noisier and can under-rank schools that require scores.",
      href: "/profile?tab=academics",
      cta: "Fix testing profile",
    });
  }

  if (rigor < 4) {
    tips.push({
      priority: rigor < 2 ? "high" : "medium",
      title: rigor < 2 ? "Build course rigor before senior applications" : "Add sustainable advanced coursework",
      detail: `You currently have ${rigor} AP/IB/dual/college courses on file. Aim for a senior schedule that shows challenge without collapse — especially in subjects tied to your intended major.`,
      whyItMatters: "Selective schools weigh rigor heavily alongside GPA.",
      href: "/profile?tab=academics",
      metric: { current: String(rigor), target: "4+" },
    });
  }

  if (leadership < 2) {
    tips.push({
      priority: leadership === 0 ? "high" : "medium",
      title: leadership === 0 ? "Develop real leadership in one primary activity" : "Deepen leadership impact (not more titles)",
      detail: "Leadership means responsibility you can verify — people led, projects owned, outcomes delivered. Do not invent titles.",
      whyItMatters: "Extracurriculars differentiate applicants who look similar on paper.",
      href: "/profile?tab=activities",
      cta: "Edit activities",
    });
  }

  if (state.activities.length && quantified < Math.max(1, Math.ceil(state.activities.length / 2))) {
    tips.push({
      priority: "medium",
      title: "Quantify extracurricular impact with real numbers",
      detail: "Add hours, people reached, funds raised, or measurable outcomes you can defend in an interview.",
      whyItMatters: "Vague activities read as filler; quantified impact reads as evidence.",
      href: "/profile?tab=activities",
    });
  }

  if (!state.career.intendedMajors.length) {
    tips.push({
      priority: "high",
      title: "Name an intended major that this school actually offers",
      detail: `List a major that appears in ${college.shortName}'s published programs so major-fit scoring and essays stay aligned.`,
      whyItMatters: "Major clarity shapes both matching and application narrative.",
      href: "/profile?tab=career",
      cta: "Add majors",
    });
  }

  tips.push({
    priority: "medium",
    title: "Write a school-specific essay grounded in your real experience",
    detail: `Connect a concrete story from your activities or academics to something distinctive about ${college.shortName} — a program, lab, city, or community — that you can verify on the school's site.`,
    whyItMatters: "Essay quality is not scored in this app, but generic essays waste the one place you control the narrative.",
  });

  tips.push({
    priority: "medium",
    title: "None of these steps guarantee admission",
    detail: "Improving your profile improves your comparison to published ranges. Selective schools still deny strong applicants every year.",
    whyItMatters: "Treat this as a planning tool, not a prediction.",
  });

  const order = { critical: 0, high: 1, medium: 2 } as const;
  return tips.sort((a, b) => order[a.priority] - order[b.priority]).slice(0, 8);
}

/** Back-compat string list for Ask / older callers. */
export function improveOddsLines(state: AppState, college: College) {
  return improveOdds(state, college).map((t) => `${t.title}: ${t.detail}`);
}

export function applyWhatIf(state: AppState, patch: {
  sat?: number;
  gpa?: number;
  apExtra?: number;
  leadershipExtra?: boolean;
  extraImpact?: boolean;
  major?: string;
  maxDriveMinutes?: number;
}): AppState {
  const next: AppState = JSON.parse(JSON.stringify(state));
  if (patch.sat != null) {
    next.testing.sat = {
      total: String(patch.sat),
      readingWriting: next.testing.sat?.readingWriting ?? "",
      math: next.testing.sat?.math ?? "",
      date: next.testing.sat?.date ?? "",
    };
  }
  if (patch.gpa != null) next.academic.unweightedGpa = String(patch.gpa);
  if (patch.apExtra) {
    for (let i = 0; i < patch.apExtra; i += 1) {
      next.courses.push({
        id: `sim-ap-${i}`,
        name: `Additional AP ${i + 1} (simulated)`,
        subject: "Elective",
        level: "AP",
        grade: "",
        year: "12",
      });
    }
  }
  if (patch.leadershipExtra) {
    if (next.activities.length) {
      next.activities = next.activities.map((a, i) => (i === 0 ? { ...a, hasLeadership: true, peopleLed: a.peopleLed || "8" } : a));
    } else {
      next.activities = [{
        id: "sim-leadership",
        name: "Simulated leadership role",
        organization: "School club",
        category: "Clubs",
        position: "President",
        yearsParticipated: "1",
        startDate: "",
        endDate: "",
        hoursPerWeek: "5",
        weeksPerYear: "36",
        hasLeadership: true,
        leadershipTitle: "President",
        peopleLed: "12",
        leadershipResponsibilities: "Led meetings and coordinated events (simulated).",
        accomplishments: "Grew membership and organized 3 events (simulated).",
        createdSomething: false,
        grewMembership: true,
        raisedMoney: false,
        generatedRevenue: false,
        wonAward: false,
        organizedEvent: true,
        helpedPeople: false,
        peopleImpacted: "12",
        recognition: "None",
      }];
    }
  }
  if (patch.extraImpact) {
    next.activities = next.activities.map((a) =>
      a.accomplishments && /\d/.test(a.accomplishments)
        ? a
        : { ...a, accomplishments: `${a.accomplishments || "Impact"} — 40 people, 120 hours (simulated)`.trim() },
    );
  }
  if (patch.major) next.career.intendedMajors = [patch.major];
  if (patch.maxDriveMinutes != null) {
    const map: Record<number, AppState["preferences"]["geographic"]["maxDriveTime"]> = {
      30: "30",
      60: "60",
      120: "120",
      180: "180",
      240: "240",
      360: "360",
      480: "480",
    };
    next.preferences.geographic.maxDriveTime = map[patch.maxDriveMinutes] ?? "none";
  }
  return next;
}

export function whatIfShifts(current: MatchBreakdown[], simulated: MatchBreakdown[]) {
  const order: AdmissionCategory[] = ["High Reach", "Reach", "Target", "Likely"];
  const moved: { id: string; from: AdmissionCategory; to: AdmissionCategory }[] = [];
  for (const s of simulated) {
    const c = current.find((x) => x.collegeId === s.collegeId);
    if (!c || c.category === s.category) continue;
    if (order.indexOf(s.category) > order.indexOf(c.category)) moved.push({ id: s.collegeId, from: c.category, to: s.category });
  }
  return moved.slice(0, 8);
}

export function applicationStrategy(college: College, match: MatchBreakdown) {
  const testNote =
    college.admissions.testPolicy === "Test-blind"
      ? "Tests are not considered at this school in our dataset."
      : college.admissions.testPolicy === "Test-optional"
        ? "Test-optional: submitting scores is a personal choice. We do not claim it will raise or lower your chance."
        : "Tests are listed as required in our dataset — verify on the admissions site.";
  return {
    category: match.category,
    round:
      college.admissions.earlyAction
        ? "Early Action is offered according to our dataset. We do not claim EA improves an individual student's odds."
        : college.admissions.earlyDecision
          ? "Early Decision is listed. ED is binding if offered and accepted — we do not claim it improves odds."
          : "Regular Decision timing is listed. Confirm current rounds with the university.",
    tests: testNote,
    major: match.major >= 75 ? "Your intended major appears in this school's listed programs." : "Confirm major availability on the university site.",
  };
}

export function answerSchoolQuestion(q: string, state: AppState, college: College) {
  const m = matchCollege(state, college);
  const t = q.toLowerCase();
  const similar = similarMoreAchievable(state, college, 3);
  const miles = m.miles != null ? `${m.miles} miles (straight-line)` : "Distance unavailable until you add a home city/state.";
  const cost = m.inStateForStudent ? college.cost.estimatedTotalInState : college.cost.estimatedTotalOutOfState;
  if (/good school for me|would this be/.test(t)) {
    return `${college.name} has overall fit ${m.overall}/100 and admissions category ${m.category}. The best college for you is not necessarily the hardest to get into. ${m.why[0] ?? ""} ${m.concerns[0] ?? ""}`;
  }
  if (/competitive|chances|odds|how competitive/.test(t)) {
    return `Estimated category: ${m.category} (admissions match ${m.admissions}/100). This is an estimate from published ranges and your profile — not a prediction or guarantee.`;
  }
  if (/major/.test(t)) {
    return `Listed undergraduate programs include: ${college.majors.join(", ") || "Unavailable"}. Academic strengths on file: ${college.academicStrengths.join("; ") || "Unavailable"}.`;
  }
  if (/cost|tuition|afford/.test(t)) {
    return cost
      ? `Estimated total (${m.inStateForStudent ? "in-state" : "out-of-state / private"}): $${Math.round(cost).toLocaleString()}. Verify with the university. Data last updated ${college.dataUpdated}.`
      : "Cost data unavailable in this catalog.";
  }
  if (/far|distance|drive/.test(t)) {
    return `${miles}. Estimated drive ${m.driveMinutes != null ? `${m.driveMinutes} minutes` : "unavailable"}. Travel times are modeled, not live traffic.`;
  }
  if (/similar/.test(t)) {
    return similar.length
      ? `Schools that share characteristics but where your profile is more competitive: ${similar.map((s) => s.college.shortName).join(", ")}.`
      : "Add more of your profile so we can suggest more achievable similar schools.";
  }
  if (/improve|weakness/.test(t)) {
    return improveOddsLines(state, college).slice(0, 4).join(" ");
  }
  if (/early action|early decision/.test(t)) {
    return applicationStrategy(college, m).round;
  }
  return `Admissions category ${m.category}, overall fit ${m.overall}/100. Ask about chances, cost, distance, majors, similar schools, or what to improve. Nothing here is a guarantee of admission.`;
}
