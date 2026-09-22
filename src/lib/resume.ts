import type { AppState, ResumeLength, ResumeScore, ResumeSection, ResumeTone, ResumeVersion } from "./types";
import { uid } from "./id";
import { ACTION_VERBS, WEAK_VERBS } from "./constants";

const HEADING_MAP: Record<string, ResumeSection["type"]> = {
  education: "education",
  experience: "experience",
  work: "experience",
  employment: "experience",
  internship: "experience",
  internships: "experience",
  activities: "activities",
  extracurricular: "activities",
  leadership: "leadership",
  skills: "skills",
  awards: "awards",
  honors: "awards",
  achievements: "awards",
};

export function parseResumeText(text: string): ResumeSection[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const sections: ResumeSection[] = [];
  let current: ResumeSection | null = null;
  let currentItem: ResumeSection["items"][0] | null = null;

  const flushItem = () => {
    if (current && currentItem) {
      current.items.push(currentItem);
      currentItem = null;
    }
  };

  for (const line of lines) {
    if (!line) continue;
    const key = line.toLowerCase().replace(/[:]/g, "");
    const mapped = Object.entries(HEADING_MAP).find(([k]) => key === k || key.startsWith(k));
    if (mapped && line.length < 40) {
      flushItem();
      if (current) sections.push(current);
      current = {
        id: uid(),
        type: mapped[1],
        heading: line.replace(/:$/, ""),
        items: [],
      };
      continue;
    }
    if (!current) {
      current = { id: uid(), type: "custom", heading: "Profile", items: [] };
    }
    const isBullet = /^[-•●*]/.test(line);
    if (isBullet) {
      if (!currentItem) {
        currentItem = {
          id: uid(),
          title: "Role",
          subtitle: "",
          location: "",
          dates: "",
          bullets: [],
        };
      }
      currentItem.bullets.push({ id: uid(), text: line.replace(/^[-•●*]\s*/, "") });
    } else {
      flushItem();
      currentItem = {
        id: uid(),
        title: line,
        subtitle: "",
        location: "",
        dates: "",
        bullets: [],
      };
    }
  }
  flushItem();
  if (current) sections.push(current);
  return sections.length
    ? sections
    : [
        {
          id: uid(),
          type: "experience",
          heading: "Experience",
          items: [
            {
              id: uid(),
              title: "Role",
              subtitle: "Organization",
              location: "",
              dates: "",
              bullets: [{ id: uid(), text: "Describe what you did, using a strong verb and a result you can verify." }],
            },
          ],
        },
      ];
}

export function resumeFromProfile(state: AppState): ResumeVersion {
  const name = `${state.student.firstName} ${state.student.lastName}`.trim() || "Your Name";
  const contact = [state.student.email, state.student.city && state.student.state ? `${state.student.city}, ${state.student.state}` : ""]
    .filter(Boolean)
    .join(" · ");

  const education: ResumeSection = {
    id: uid(),
    type: "education",
    heading: "Education",
    items: [
      {
        id: uid(),
        title: state.student.highSchool || "High School",
        subtitle: [
          state.academic.unweightedGpa && `Unweighted GPA: ${state.academic.unweightedGpa}`,
          state.academic.weightedGpa && `Weighted GPA: ${state.academic.weightedGpa}`,
        ]
          .filter(Boolean)
          .join(" · "),
        location: [state.student.city, state.student.state].filter(Boolean).join(", "),
        dates: state.student.graduationYear ? `Class of ${state.student.graduationYear}` : "",
        bullets: state.courses.slice(0, 6).map((c) => ({
          id: uid(),
          text: `${c.level} ${c.name}${c.grade ? ` (${c.grade})` : ""}`,
        })),
      },
    ],
  };

  const experience: ResumeSection = {
    id: uid(),
    type: "experience",
    heading: "Experience",
    items: state.work.map((w) => ({
      id: uid(),
      title: w.position || "Role",
      subtitle: w.employer,
      location: "",
      dates: [w.startDate, w.endDate || "Present"].filter(Boolean).join(" – "),
      bullets: [w.accomplishments, w.quantifiableResults, w.description]
        .filter(Boolean)
        .map((t) => ({ id: uid(), text: t })),
    })),
  };

  const activities: ResumeSection = {
    id: uid(),
    type: "activities",
    heading: "Activities & Leadership",
    items: state.activities.map((a) => ({
      id: uid(),
      title: a.position || a.name,
      subtitle: a.organization || a.name,
      location: "",
      dates: [a.startDate, a.endDate || "Present"].filter(Boolean).join(" – "),
      bullets: [
        a.accomplishments,
        a.hasLeadership && a.peopleLed ? `Led a team of ${a.peopleLed}.` : "",
        a.peopleImpacted ? `Reached ${a.peopleImpacted} people through this work.` : "",
      ]
        .filter(Boolean)
        .map((t) => ({ id: uid(), text: t as string })),
    })),
  };

  const awards: ResumeSection = {
    id: uid(),
    type: "awards",
    heading: "Awards",
    items: state.awards.map((a) => ({
      id: uid(),
      title: a.name,
      subtitle: [a.organization, a.level].filter(Boolean).join(" · "),
      location: "",
      dates: a.date,
      bullets: a.description ? [{ id: uid(), text: a.description }] : [],
    })),
  };

  const sections = [education, experience, activities, awards].filter((s) => s.items.length);

  return {
    id: uid(),
    name: "College Resume",
    updatedAt: new Date().toISOString(),
    font: "Arial",
    fontSize: 11,
    alignment: "left",
    margin: 0.7,
    lineSpacing: 1.15,
    bulletStyle: "disc",
    headerName: name,
    headerContact: contact,
    sections,
  };
}

export type ImproveResult = {
  original: string;
  impact: string;
  quantified: string | null;
  questions: string[];
  explanation: string;
};

function toneLead(tone: ResumeTone) {
  switch (tone) {
    case "Finance":
      return "Analyzed";
    case "Consulting":
      return "Structured";
    case "Government":
      return "Coordinated";
    case "Academic":
      return "Researched";
    case "Technical":
      return "Built";
    case "Entrepreneurial":
      return "Launched";
    default:
      return "Led";
  }
}

export function improveBullet(text: string, tone: ResumeTone, length: ResumeLength): ImproveResult {
  const clean = text.replace(/^[-•]\s*/, "").trim();
  const hasNumber = /\d/.test(clean);
  const weak = WEAK_VERBS.some((w) => clean.toLowerCase().startsWith(w) || clean.toLowerCase().includes(` ${w} `));
  const verb = ACTION_VERBS.find((v) => clean.toLowerCase().startsWith(v.toLowerCase())) ?? toneLead(tone);
  const rest = clean.replace(/^[A-Za-z]+\s/, "");
  const core = rest || clean;

  let impact = `${verb} ${core.replace(/\.$/, "")}`;
  if (!hasNumber) {
    impact = `${verb} ${core.replace(/\.$/, "")} by focusing on a clear process and a result you can verify`;
  }
  if (length === "Concise") impact = `${verb} ${core.replace(/\.$/, "")}`;
  if (length === "Detailed")
    impact = `${verb} ${core.replace(/\.$/, "")}${hasNumber ? "" : ", documenting methods and outcomes for teammates"}`;
  impact = impact.replace(/by focusing on a clear process and a result you can verify/g, "with a defined process and a measurable outcome").replace(/\s+/g, " ").trim();
  if (!impact.endsWith(".")) impact += ".";

  const questions: string[] = [];
  if (!hasNumber) {
    questions.push("How many people did this affect?");
    questions.push("Did a number go up, down, or stay the same?");
    questions.push("How often did you do this (hours, events, posts, sessions)?");
    questions.push("Did you manage a budget, a team, or a timeline?");
  }

  const quantified = hasNumber
    ? `${verb} ${core.replace(/\.$/, "")}${length === "Concise" ? "." : " — using only the figures already in your original bullet."}`
    : null;

  const explanation = [
    weak ? "Replaced a weak/non-action opening with a stronger verb." : "Kept your original verb where it was already strong.",
    hasNumber
      ? "Kept your existing numbers. No statistics were added."
      : "Did not invent metrics. Add real numbers if you have them, then Improve again.",
    `Tone set to ${tone}; length set to ${length}.`,
  ].join(" ");

  return { original: clean, impact, quantified, questions, explanation };
}

export function scoreResume(resume: ResumeVersion, state: AppState): ResumeScore {
  const bullets = resume.sections.flatMap((s) => s.items.flatMap((i) => i.bullets.map((b) => b.text)));
  const all = bullets.filter(Boolean);
  const n = Math.max(all.length, 1);
  const quantified = all.filter((t) => /\d/.test(t)).length;
  const action = all.filter((t) => ACTION_VERBS.some((v) => t.trim().toLowerCase().startsWith(v.toLowerCase()))).length;
  const weak = all.filter((t) => WEAK_VERBS.some((v) => t.trim().toLowerCase().startsWith(v))).length;
  const long = all.filter((t) => t.split(/\s+/).length > 32).length;
  const short = all.filter((t) => t.split(/\s+/).length < 8).length;

  const formatting = resume.font && resume.margin >= 0.5 && resume.margin <= 1 ? 90 : 70;
  const readability = clamp(92 - long * 8 - short * 4);
  const actionVerbs = clamp((action / n) * 100);
  const quantification = clamp((quantified / n) * 100);
  const conciseness = clamp(90 - long * 10);
  const consistency = resume.sections.every((s) => s.heading) ? 86 : 70;
  const impact = clamp((quantified / n) * 55 + (action / n) * 40);
  const relevantExperience = clamp(
    40 +
      Math.min(state.work.length * 12, 30) +
      Math.min(state.activities.filter((a) => a.hasLeadership).length * 10, 30),
  );
  const overall = clamp(
    formatting * 0.1 +
      readability * 0.1 +
      actionVerbs * 0.15 +
      quantification * 0.18 +
      conciseness * 0.1 +
      consistency * 0.1 +
      impact * 0.17 +
      relevantExperience * 0.1,
  );

  const recommendations: string[] = [];
  const strengths: string[] = [];
  const unquant = n - quantified;
  if (unquant > 0) recommendations.push(`${unquant} bullet${unquant === 1 ? "" : "s"} could be quantified with real numbers you already know.`);
  if (weak > 0) recommendations.push(`${weak} bullet${weak === 1 ? "" : "s"} begin with weak/non-action verbs.`);
  const edu = resume.sections.find((s) => s.type === "education");
  if (edu && edu.items.some((i) => i.bullets.length > 6))
    recommendations.push("Your education section could be condensed.");
  if (state.activities.filter((a) => a.hasLeadership).length >= 2)
    strengths.push("Your leadership experience is a major strength.");
  if (quantified / n >= 0.5) strengths.push("Many bullets already include numbers, which helps credibility.");

  return {
    overall,
    formatting,
    readability,
    actionVerbs,
    quantification,
    conciseness,
    consistency,
    impact,
    relevantExperience,
    recommendations,
    strengths,
  };
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}
