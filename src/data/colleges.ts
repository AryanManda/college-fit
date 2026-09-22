import { COLLEGES as A } from "./colleges-part1";
import { COLLEGES_PUBLIC as B } from "./colleges-part2";
import { DATA_YEAR, DEFAULT_SOURCES, PUBLIC_FLAGSHIP_CDS_FACTORS, SELECTIVE_CDS_FACTORS } from "../lib/constants";
import { coordsFor, inferKind } from "../lib/geo";
import type { College, FactorImportance } from "../lib/types";

const CDS_BY_ID: Record<string, Record<string, FactorImportance>> = {
  harvard: SELECTIVE_CDS_FACTORS,
  yale: SELECTIVE_CDS_FACTORS,
  princeton: SELECTIVE_CDS_FACTORS,
  stanford: SELECTIVE_CDS_FACTORS,
  mit: { ...SELECTIVE_CDS_FACTORS, "SAT/ACT": "Very Important" },
  columbia: SELECTIVE_CDS_FACTORS,
  penn: SELECTIVE_CDS_FACTORS,
  brown: SELECTIVE_CDS_FACTORS,
  dartmouth: SELECTIVE_CDS_FACTORS,
  cornell: SELECTIVE_CDS_FACTORS,
  duke: SELECTIVE_CDS_FACTORS,
  northwestern: SELECTIVE_CDS_FACTORS,
  vanderbilt: SELECTIVE_CDS_FACTORS,
  rice: SELECTIVE_CDS_FACTORS,
  nyu: SELECTIVE_CDS_FACTORS,
  berkeley: PUBLIC_FLAGSHIP_CDS_FACTORS,
  ucla: PUBLIC_FLAGSHIP_CDS_FACTORS,
  michigan: PUBLIC_FLAGSHIP_CDS_FACTORS,
  "ut-austin": PUBLIC_FLAGSHIP_CDS_FACTORS,
  "georgia-tech": PUBLIC_FLAGSHIP_CDS_FACTORS,
  unc: PUBLIC_FLAGSHIP_CDS_FACTORS,
  virginia: PUBLIC_FLAGSHIP_CDS_FACTORS,
  wisconsin: PUBLIC_FLAGSHIP_CDS_FACTORS,
  uh: PUBLIC_FLAGSHIP_CDS_FACTORS,
  txst: PUBLIC_FLAGSHIP_CDS_FACTORS,
  ttu: PUBLIC_FLAGSHIP_CDS_FACTORS,
};

function enrich(c: College): College {
  const pt = coordsFor(c.city, c.state);
  const curated = CDS_BY_ID[c.id];
  const factors = Object.keys(c.admissionsFactors || {}).length
    ? c.admissionsFactors
    : curated ?? {};
  return {
    ...c,
    latitude: pt?.lat,
    longitude: pt?.lng,
    institutionKind: inferKind(c),
    admissionsFactors: factors,
    campus: {
      ...c.campus,
      sizeBand:
        c.undergraduateEnrollment < 1500
          ? "Very Small"
          : c.campus.sizeBand,
    },
    demographics: {
      resources: [
        "Academic support / tutoring (verify on campus site)",
        "First-generation student programs (if offered — verify)",
        "Career services",
      ],
      populationNote: "The university reports student demographic information on its Common Data Set and institutional research pages. We do not estimate unpublished breakdowns here.",
    },
  };
}

const community: College[] = [
  cc("acc", "Austin Community College", "ACC", "Austin", "TX", "austincc.edu", 33500, 2850, 11000),
  cc("hcc", "Houston Community College", "HCC", "Houston", "TX", "hccs.edu", 50000, 2700, 10800),
  cc("dallas-college", "Dallas College", "Dallas College", "Dallas", "TX", "dallascollege.edu", 70000, 2500, 9800),
  cc("lone-star", "Lone Star College", "Lone Star", "Houston", "TX", "lonestar.edu", 79000, 2700, 10500),
  cc("smc", "Santa Monica College", "SMC", "Los Angeles", "CA", "smc.edu", 25000, 1200, 9300),
  cc("novacc", "Northern Virginia Community College", "NOVA", "Fairfax", "VA", "nvcc.edu", 50000, 5700, 13700),
  cc("mdc", "Miami Dade College", "MDC", "Coral Gables", "FL", "mdc.edu", 44000, 2800, 9600),
].map(enrich);

function cc(
  id: string,
  name: string,
  short: string,
  city: string,
  state: "TX" | "CA" | "VA" | "FL",
  domain: string,
  ug: number,
  inT: number,
  outT: number,
): College {
  const region = state === "CA" ? "West" : state === "VA" ? "South" : "South";
  return {
    id,
    name,
    shortName: short,
    city,
    state,
    region,
    type: "Community",
    religiousAffiliation: null,
    campusSetting: "Urban",
    undergraduateEnrollment: ug,
    domain,
    majors: ["Business", "Computer Science", "Nursing", "General Studies", "Engineering transfer"],
    academicStrengths: ["Transfer pathways", "Affordable tuition", "Workforce programs"],
    careerStrengths: ["Healthcare", "Business", "Skilled trades"],
    lifestyle: ["Commuter campus"],
    admissions: { acceptanceRate: 1, testPolicy: "Test-optional", regularDeadline: "Rolling" },
    academics: {},
    cost: {
      tuitionInState: inT,
      tuitionOutOfState: outT,
      estimatedTotalInState: inT + 4000,
      estimatedTotalOutOfState: outT + 4000,
    },
    outcomes: {},
    campus: {
      greekLife: "Low",
      athletics: "Other",
      schoolSpirit: "Low",
      socialScene: "Quiet",
      politicalEnvironment: "Mixed",
      outdoorRecreation: "Low",
      sizeBand: "Very Large",
      climate: state === "CA" || state === "TX" || state === "FL" ? "Warm" : "Temperate",
    },
    admissionsFactors: {},
    dataUpdated: DATA_YEAR,
    dataSources: DEFAULT_SOURCES,
    institutionKind: "Community college",
    demographics: { resources: ["Academic support", "Transfer advising"] },
  };
}

const extras: College[] = [
  extraPublic("uh", "University of Houston", "UH", "Houston", "TX", "uh.edu", 38000, 0.66, [1160, 1330], 3.5, 10700, 26800, 11800),
  extraPublic("txst", "Texas State University", "Texas State", "San Marcos", "TX", "txst.edu", 34000, 0.88, [1020, 1200], 3.4, 11400, 24200, 11600),
  extraPublic("ttu", "Texas Tech University", "Texas Tech", "Lubbock", "TX", "ttu.edu", 33000, 0.68, [1100, 1260], 3.6, 12000, 24200, 11200),
];

function extraPublic(
  id: string,
  name: string,
  short: string,
  city: string,
  state: "TX",
  domain: string,
  ug: number,
  acc: number,
  sat: [number, number],
  gpa: number,
  inT: number,
  outT: number,
  room: number,
): College {
  return {
    id,
    name,
    shortName: short,
    city,
    state,
    region: "South",
    type: "Public",
    religiousAffiliation: null,
    campusSetting: city === "Houston" ? "Urban" : "Suburban",
    undergraduateEnrollment: ug,
    domain,
    majors: ["Business", "Computer Science", "Engineering", "Biology", "Communications"],
    academicStrengths: ["Undergraduate business", "Large public campus"],
    careerStrengths: ["Business", "Energy", "Healthcare"],
    lifestyle: ["Major sports"],
    admissions: { acceptanceRate: acc, testPolicy: "Test-optional", earlyAction: true, regularDeadline: "May 1" },
    academics: { gpaAverage: gpa, sat25: sat[0], sat75: sat[1] },
    cost: {
      tuitionInState: inT,
      tuitionOutOfState: outT,
      roomAndBoard: room,
      estimatedTotalInState: inT + room,
      estimatedTotalOutOfState: outT + room,
    },
    outcomes: { graduationRate: 0.62 },
    campus: {
      greekLife: "High",
      athletics: "NCAA D1",
      schoolSpirit: "High",
      socialScene: "Active",
      politicalEnvironment: "Mixed",
      outdoorRecreation: "Moderate",
      sizeBand: "Very Large",
      climate: "Hot",
    },
    admissionsFactors: {},
    dataUpdated: DATA_YEAR,
    dataSources: DEFAULT_SOURCES,
    institutionKind: "Research university",
    demographics: { resources: [] },
  };
}

export const COLLEGES: College[] = (() => {
  const merged = [...A, ...B, ...community, ...extras].map(enrich);
  const byId = new Map<string, College>();
  const byName = new Set<string>();
  for (const c of merged) {
    if (byId.has(c.id)) continue;
    const nameKey = c.name.trim().toLowerCase();
    if (byName.has(nameKey)) continue;
    byId.set(c.id, c);
    byName.add(nameKey);
  }
  return [...byId.values()];
})();

export function getCollege(id: string) {
  return COLLEGES.find((c) => c.id === id);
}

export function logoUrl(college: College) {
  return `https://www.google.com/s2/favicons?domain=${college.domain}&sz=128`;
}
