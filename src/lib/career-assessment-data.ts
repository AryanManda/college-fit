export const INTEREST_OPTIONS = [
  "Building something from scratch",
  "Solving a difficult problem",
  "Leading a team",
  "Helping people directly",
  "Analyzing numbers",
  "Working with technology",
  "Working outdoors",
  "Creating something",
  "Researching a subject",
  "Selling/persuading",
  "Working with animals",
  "Working with government/public policy",
  "Working with machines",
] as const;

export const WORK_ENV_OPTIONS = [
  "Office",
  "Laboratory",
  "Outdoors",
  "Hospital/medical setting",
  "Job sites",
  "Classroom",
  "Courtroom",
  "Traveling",
  "Mostly remote",
  "A combination",
] as const;

export const WORK_STYLE_OPTIONS = [
  { id: "clearInstructions", label: "I like clear instructions." },
  { id: "figuringOut", label: "I like figuring things out myself." },
  { id: "competing", label: "I like competing against others." },
  { id: "collaborating", label: "I like collaborating." },
  { id: "independent", label: "I prefer working independently." },
  { id: "leading", label: "I enjoy leading people." },
  { id: "calculatedRisks", label: "I like taking calculated risks." },
  { id: "predictable", label: "I prefer predictable work." },
  { id: "differentEveryDay", label: "I want every day to be different." },
] as const;

export const VALUE_LABELS: Record<string, string> = {
  highIncome: "High income",
  jobSecurity: "Job security",
  workLifeBalance: "Work-life balance",
  helpingOthers: "Helping others",
  prestige: "Prestige",
  creativity: "Creativity",
  independence: "Independence",
  leadership: "Leadership",
  travel: "Travel",
  workingOutdoors: "Working outdoors",
  intellectualChallenge: "Intellectual challenge",
  entrepreneurship: "Entrepreneurship",
};

export const ACADEMIC_SUBJECTS = [
  "Math",
  "Science",
  "Business",
  "Economics",
  "History",
  "Government",
  "Writing",
  "Technology",
  "Engineering",
  "Art/design",
  "Psychology",
  "Biology",
  "Communications",
  "Foreign languages",
] as const;

export const NOT_INTERESTED_REASONS = [
  "Salary",
  "Work environment",
  "Responsibilities",
  "Education required",
  "Lifestyle",
  "I just don't think I'd enjoy it",
  "Something else",
] as const;
