import type { ActivityCategory, FactorImportance, Importance } from "./types";

export const APP_NAME = "CollegeMatch AI";
export const APP_TAGLINE = "Don't just find your dream school. Find the school that can actually get you where you want to go.";

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/profile", label: "My Profile", icon: "UserRound" },
  { href: "/match", label: "College Match", icon: "Sparkles" },
  { href: "/colleges", label: "Explore Colleges", icon: "GraduationCap" },
  { href: "/compare", label: "Compare Colleges", icon: "Columns3" },
  { href: "/resume", label: "Resume Builder", icon: "FileText" },
  { href: "/strength", label: "Application Strength", icon: "Gauge" },
  { href: "/settings", label: "Settings", icon: "Settings" },
] as const;

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
];

export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  "Academic",
  "Athletics",
  "Arts",
  "Business",
  "Entrepreneurship",
  "Community Service",
  "Research",
  "Employment",
  "Internship",
  "Political/Civic",
  "Student Government",
  "Clubs",
  "Technology",
  "Family Responsibilities",
  "Other",
];

export const ACADEMIC_PREF_KEYS = [
  ["majorStrength", "Major strength"],
  ["classSize", "Class size"],
  ["research", "Research"],
  ["professors", "Professors / teaching quality"],
  ["internships", "Internship opportunities"],
  ["careerPlacement", "Career placement"],
  ["graduatePrep", "Graduate school preparation"],
  ["honorsPrograms", "Honors programs"],
  ["studyAbroad", "Study abroad"],
  ["entrepreneurship", "Entrepreneurship"],
  ["coop", "Co-op opportunities"],
  ["doubleMajors", "Double majors"],
  ["minors", "Minors"],
] as const;

export const CAMPUS_PREF_KEYS = [
  ["greekLife", "Greek life"],
  ["athletics", "Athletics"],
  ["schoolSpirit", "School spirit"],
  ["clubs", "Clubs"],
  ["socialScene", "Social scene"],
  ["diversityOfActivities", "Diversity of activities"],
  ["religiousEnvironment", "Religious environment"],
  ["politicalEnvironment", "Political environment"],
  ["outdoorRecreation", "Outdoor recreation"],
] as const;

export const IMPORTANCE_OPTIONS: Importance[] = [
  "Very Important",
  "Important",
  "Neutral",
  "Not Important",
];

export const LIFESTYLE_TAGS = [
  "Mountains",
  "Beaches",
  "Lakes",
  "Forests",
  "Hiking",
  "Camping",
  "Hunting",
  "Fishing",
  "Skiing",
  "Major sports",
  "Concerts",
  "Nightlife",
  "Restaurants",
  "Cultural activities",
];

export const INDUSTRIES = [
  "Technology",
  "Finance",
  "Consulting",
  "Healthcare",
  "Biotech",
  "Education",
  "Government",
  "Nonprofit",
  "Media",
  "Law",
  "Energy",
  "Manufacturing",
  "Arts",
  "Entrepreneurship",
  "Research",
];

export const ADMISSIONS_FACTOR_KEYS = [
  "GPA",
  "Course rigor",
  "Class rank",
  "SAT/ACT",
  "Essay",
  "Recommendations",
  "Extracurricular activities",
  "Leadership",
  "Talent/ability",
  "Character/personal qualities",
  "Volunteer work",
  "Work experience",
  "Demonstrated interest",
  "Geographic considerations",
  "Alumni relationship",
] as const;

/** Empty map — only published CDS factors should be stored; UI hides missing keys. */
export function unknownFactors(): Record<string, FactorImportance> {
  return {};
}

/** Typical CDS weights for highly selective privates (GPA/rigor/essay heavy). */
export const SELECTIVE_CDS_FACTORS: Record<string, FactorImportance> = {
  GPA: "Very Important",
  "Course rigor": "Very Important",
  Essay: "Very Important",
  Recommendations: "Very Important",
  "Extracurricular activities": "Important",
  "Character/personal qualities": "Very Important",
  "SAT/ACT": "Considered",
  "Class rank": "Considered",
  "Talent/ability": "Important",
  Leadership: "Important",
  "Volunteer work": "Considered",
  "Work experience": "Considered",
  "Demonstrated interest": "Not Considered",
  "Geographic considerations": "Considered",
  "Alumni relationship": "Considered",
};

/** Typical CDS weights for large public flagships. */
export const PUBLIC_FLAGSHIP_CDS_FACTORS: Record<string, FactorImportance> = {
  GPA: "Very Important",
  "Course rigor": "Very Important",
  "SAT/ACT": "Important",
  "Class rank": "Important",
  Essay: "Important",
  Recommendations: "Considered",
  "Extracurricular activities": "Important",
  Leadership: "Considered",
  "Talent/ability": "Considered",
  "Character/personal qualities": "Considered",
  "Volunteer work": "Considered",
  "Work experience": "Considered",
  "Demonstrated interest": "Considered",
  "Geographic considerations": "Important",
  "Alumni relationship": "Not Considered",
};

export const DEFAULT_SOURCES = [
  "Common Data Set",
  "IPEDS",
  "College Scorecard",
  "University admissions and financial aid pages",
];

export const DATA_YEAR = "2024–25";

export const MATCH_DISCLAIMER =
  "Match scores and Likely / Target / Reach / High Reach labels are estimates from published ranges and your profile. They are not probabilities of admission and are not guarantees. Race and other protected characteristics are not used in the individual admissions-match score. Always verify deadlines, testing policies, and costs with the university.";

export const ACTION_VERBS = [
  "Led",
  "Built",
  "Created",
  "Launched",
  "Managed",
  "Directed",
  "Designed",
  "Developed",
  "Implemented",
  "Increased",
  "Grew",
  "Organized",
  "Coordinated",
  "Analyzed",
  "Researched",
  "Taught",
  "Mentored",
  "Fundraised",
  "Negotiated",
  "Improved",
  "Streamlined",
  "Presented",
  "Wrote",
  "Published",
  "Won",
];

export const WEAK_VERBS = [
  "helped",
  "worked",
  "did",
  "made",
  "was",
  "were",
  "responsible",
  "assisted",
  "participated",
  "handled",
];
