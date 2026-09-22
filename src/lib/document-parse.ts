import type { Activity, AppState, Course, WorkExperience } from "./types";
import { uid } from "./id";
import { AP_COURSES, IB_COURSES, inferSubjectFromCourseName } from "../data/ap-ib-courses";
import { parseResumeText } from "./resume";

export type ParsedDocument = {
  gpaWeighted?: string;
  gpaUnweighted?: string;
  satTotal?: string;
  actComposite?: string;
  courses: Omit<Course, "id">[];
  activities: Omit<Activity, "id">[];
  work: Omit<WorkExperience, "id">[];
  notes: string[];
};

function emptyActivity(partial: Partial<Activity> & Pick<Activity, "name" | "organization" | "position">): Omit<Activity, "id"> {
  return {
    name: partial.name,
    organization: partial.organization,
    category: partial.category ?? "Clubs",
    position: partial.position,
    yearsParticipated: partial.yearsParticipated ?? "",
    startDate: partial.startDate ?? "",
    endDate: partial.endDate ?? "",
    hoursPerWeek: partial.hoursPerWeek ?? "",
    weeksPerYear: partial.weeksPerYear ?? "",
    hasLeadership: partial.hasLeadership ?? false,
    leadershipTitle: partial.leadershipTitle ?? "",
    peopleLed: partial.peopleLed ?? "",
    leadershipResponsibilities: partial.leadershipResponsibilities ?? "",
    accomplishments: partial.accomplishments ?? "",
    createdSomething: partial.createdSomething ?? false,
    grewMembership: partial.grewMembership ?? false,
    raisedMoney: partial.raisedMoney ?? false,
    generatedRevenue: partial.generatedRevenue ?? false,
    wonAward: partial.wonAward ?? false,
    organizedEvent: partial.organizedEvent ?? false,
    helpedPeople: partial.helpedPeople ?? false,
    peopleImpacted: partial.peopleImpacted ?? "",
    recognition: partial.recognition ?? "",
  };
}

function emptyWork(partial: Partial<WorkExperience> & Pick<WorkExperience, "employer" | "position">): Omit<WorkExperience, "id"> {
  return {
    employer: partial.employer,
    position: partial.position,
    startDate: partial.startDate ?? "",
    endDate: partial.endDate ?? "",
    hoursPerWeek: partial.hoursPerWeek ?? "",
    paid: partial.paid ?? "",
    description: partial.description ?? "",
    accomplishments: partial.accomplishments ?? "",
    leadershipResponsibilities: partial.leadershipResponsibilities ?? "",
    revenueGenerated: partial.revenueGenerated ?? "",
    peopleManaged: partial.peopleManaged ?? "",
    quantifiableResults: partial.quantifiableResults ?? "",
  };
}

function matchOfficialCourse(line: string): { name: string; level: Course["level"] } | null {
  const upper = line.trim();
  const lower = upper.toLowerCase();
  for (const name of AP_COURSES) {
    if (lower.includes(name.toLowerCase())) return { name, level: "AP" };
  }
  const apHit = AP_COURSES.find((name) => {
    const core = name.replace(/^AP\s+/i, "").toLowerCase();
    return new RegExp(`\\bap\\b[\\s\\S]{0,24}${core.slice(0, 16).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(upper);
  });
  if (apHit) return { name: apHit, level: "AP" };
  for (const name of IB_COURSES) {
    if (lower.includes(name.toLowerCase())) return { name, level: "IB" };
  }
  return null;
}

function gradeFromLine(line: string): string {
  const m = line.match(/\b([ABCDF][+-]?|100|9\d|8\d|7\d|Pass|P)\b/i);
  return m ? m[1].toUpperCase() : "";
}

/** Heuristic parse of unofficial transcript text (OCR/paste). */
export function parseTranscriptText(text: string): ParsedDocument {
  const notes: string[] = [];
  const courses: Omit<Course, "id">[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  let gpaWeighted: string | undefined;
  let gpaUnweighted: string | undefined;
  let satTotal: string | undefined;
  let actComposite: string | undefined;

  const gpaWeightedMatch = text.match(/weighted\s*(?:gpa)?\s*[:=]?\s*(\d\.\d{1,3})/i);
  const gpaUnweightedMatch = text.match(/unweighted\s*(?:gpa)?\s*[:=]?\s*(\d\.\d{1,3})/i);
  const gpaBare = text.match(/\bgpa\s*[:=]?\s*(\d\.\d{1,3})/i);
  if (gpaWeightedMatch) gpaWeighted = gpaWeightedMatch[1];
  if (gpaUnweightedMatch) gpaUnweighted = gpaUnweightedMatch[1];
  if (!gpaUnweighted && gpaBare) gpaUnweighted = gpaBare[1];

  const sat = text.match(/\bSAT\b[^0-9]{0,12}(\d{3,4})\b/i);
  if (sat) satTotal = sat[1];
  const act = text.match(/\bACT\b[^0-9]{0,12}(\d{1,2})\b/i);
  if (act) actComposite = act[1];

  const seen = new Set<string>();
  for (const line of lines) {
    const hit = matchOfficialCourse(line);
    if (!hit) continue;
    const key = hit.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    courses.push({
      name: hit.name,
      subject: inferSubjectFromCourseName(hit.name),
      level: hit.level,
      grade: gradeFromLine(line),
      year: (line.match(/\b(20\d{2})\b/) || [])[1] || "",
    });
  }

  if (!courses.length) notes.push("No standard AP/IB course titles detected — add coursework with the dropdown.");
  else notes.push(`Detected ${courses.length} advanced course(s).`);
  if (gpaUnweighted || gpaWeighted) notes.push("GPA fields extracted when present.");
  if (satTotal || actComposite) notes.push("Test scores extracted when present.");

  return {
    gpaWeighted,
    gpaUnweighted,
    satTotal,
    actComposite,
    courses,
    activities: [],
    work: [],
    notes,
  };
}

export function parseResumeToProfileBits(text: string): ParsedDocument {
  const sections = parseResumeText(text);
  const activities: Omit<Activity, "id">[] = [];
  const work: Omit<WorkExperience, "id">[] = [];

  for (const sec of sections) {
    for (const item of sec.items) {
      const bullets = item.bullets.map((b) => b.text).join(" ");
      if (sec.type === "experience" || /work|employment|intern/i.test(sec.heading)) {
        work.push(
          emptyWork({
            employer: item.subtitle || "Organization",
            position: item.title || "Role",
            startDate: item.dates,
            description: bullets,
            accomplishments: bullets,
          }),
        );
      } else if (sec.type === "activities" || /activit|club|leader|volunteer|extracurricular/i.test(sec.heading)) {
        activities.push(
          emptyActivity({
            name: item.title || "Activity",
            organization: item.subtitle || "",
            position: item.title || "",
            yearsParticipated: item.dates,
            accomplishments: bullets,
            hasLeadership: /president|captain|founder|lead|officer|chair/i.test(`${item.title} ${item.subtitle}`),
          }),
        );
      }
    }
  }

  return {
    courses: [],
    activities,
    work,
    notes: [
      activities.length || work.length
        ? `Mapped ${activities.length} activities and ${work.length} work items from resume text.`
        : "Could not confidently map resume sections — paste clearer headings (Experience, Activities).",
    ],
  };
}

/** Merge parsed document into profile without wiping existing history. */
export function applyParsedDocument(state: AppState, parsed: ParsedDocument, source: "transcript" | "resume"): AppState {
  const courses = [...state.courses];
  for (const c of parsed.courses) {
    const exists = courses.some((x) => x.name.toLowerCase() === c.name.toLowerCase() && x.level === c.level);
    if (!exists) courses.push({ ...c, id: uid() });
  }

  const activities = [...state.activities];
  for (const a of parsed.activities) {
    const exists = activities.some(
      (x) => x.name.toLowerCase() === a.name.toLowerCase() && x.organization.toLowerCase() === a.organization.toLowerCase(),
    );
    if (!exists) activities.push({ ...a, id: uid() });
  }

  const work = [...state.work];
  for (const w of parsed.work) {
    const exists = work.some(
      (x) => x.employer.toLowerCase() === w.employer.toLowerCase() && x.position.toLowerCase() === w.position.toLowerCase(),
    );
    if (!exists) work.push({ ...w, id: uid() });
  }

  const academic = { ...state.academic };
  if (parsed.gpaWeighted) academic.weightedGpa = parsed.gpaWeighted;
  if (parsed.gpaUnweighted) academic.unweightedGpa = parsed.gpaUnweighted;

  const testing = { ...state.testing };
  if (parsed.satTotal) {
    testing.sat = {
      total: parsed.satTotal,
      readingWriting: testing.sat?.readingWriting ?? "",
      math: testing.sat?.math ?? "",
      date: testing.sat?.date ?? "",
    };
  }
  if (parsed.actComposite) {
    testing.act = {
      composite: parsed.actComposite,
      english: testing.act?.english ?? "",
      math: testing.act?.math ?? "",
      reading: testing.act?.reading ?? "",
      science: testing.act?.science ?? "",
      date: testing.act?.date ?? "",
    };
  }

  const summary = parsed.notes.join(" ") || `Applied ${source} update`;

  return {
    ...state,
    academic,
    testing,
    courses,
    activities,
    work,
    onboardingComplete: true,
    profileRevisions: [
      ...(state.profileRevisions ?? []),
      { id: uid(), at: new Date().toISOString(), source, summary },
    ],
  };
}
