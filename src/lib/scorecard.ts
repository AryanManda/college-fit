import type { CampusSetting, College, Region, SchoolType } from "./types";
import { DATA_YEAR, DEFAULT_SOURCES } from "./constants";

const REGION_BY_STATE: Record<string, Region> = {
  CT: "Northeast", MA: "Northeast", ME: "Northeast", NH: "Northeast", NJ: "Northeast",
  NY: "Northeast", PA: "Northeast", RI: "Northeast", VT: "Northeast",
  IL: "Midwest", IN: "Midwest", IA: "Midwest", KS: "Midwest", MI: "Midwest",
  MN: "Midwest", MO: "Midwest", NE: "Midwest", ND: "Midwest", OH: "Midwest",
  SD: "Midwest", WI: "Midwest",
  AL: "South", AR: "South", DC: "South", DE: "South", FL: "South", GA: "South",
  KY: "South", LA: "South", MD: "South", MS: "South", NC: "South", OK: "South",
  SC: "South", TN: "South", TX: "South", VA: "South", WV: "South",
  AK: "West", AZ: "West", CA: "West", CO: "West", HI: "West", ID: "West",
  MT: "West", NM: "West", NV: "West", OR: "West", UT: "West", WA: "West", WY: "West",
};

export const SCORECARD_FIELDS = [
  "id",
  "school.name",
  "school.city",
  "school.state",
  "school.school_url",
  "school.ownership",
  "school.locale",
  "location.lat",
  "location.lon",
  "latest.admissions.admission_rate.overall",
  "latest.student.size",
  "latest.cost.tuition.in_state",
  "latest.cost.tuition.out_of_state",
  "latest.cost.roomboard.oncampus",
  "latest.completion.rate_suppressed.overall",
  "latest.admissions.sat_scores.25th_percentile.critical_reading",
  "latest.admissions.sat_scores.75th_percentile.critical_reading",
  "latest.admissions.sat_scores.25th_percentile.math",
  "latest.admissions.sat_scores.75th_percentile.math",
  "latest.admissions.act_scores.25th_percentile.cumulative",
  "latest.admissions.act_scores.75th_percentile.cumulative",
].join(",");

export type ScorecardRow = Record<string, string | number | null | undefined>;

export function scorecardId(unitId: number | string) {
  return `sc-${unitId}`;
}

export function parseScorecardUnitId(id: string): string | null {
  const m = /^sc-(\d+)$/.exec(id);
  return m ? m[1] : null;
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function ownershipType(ownership: number | null): SchoolType {
  if (ownership === 1) return "Public";
  return "Private";
}

function localeSetting(locale: number | null): CampusSetting {
  if (locale == null) return "Suburban";
  if (locale <= 13) return "Urban";
  if (locale <= 23) return "Suburban";
  return "Rural";
}

function domainFromUrl(url?: string | null) {
  if (!url) return "edu";
  return url.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "") || "edu";
}

export function scorecardToCollege(row: ScorecardRow): College | null {
  const unitId = row.id;
  const name = String(row["school.name"] ?? "").trim();
  const state = String(row["school.state"] ?? "").trim().toUpperCase();
  if (!unitId || !name || !state) return null;

  const satRead25 = num(row["latest.admissions.sat_scores.25th_percentile.critical_reading"]);
  const satRead75 = num(row["latest.admissions.sat_scores.75th_percentile.critical_reading"]);
  const satMath25 = num(row["latest.admissions.sat_scores.25th_percentile.math"]);
  const satMath75 = num(row["latest.admissions.sat_scores.75th_percentile.math"]);
  const sat25 =
    satRead25 != null && satMath25 != null ? Math.round(satRead25 + satMath25) : null;
  const sat75 =
    satRead75 != null && satMath75 != null ? Math.round(satRead75 + satMath75) : null;

  const inT = num(row["latest.cost.tuition.in_state"]) ?? 0;
  const outT = num(row["latest.cost.tuition.out_of_state"]) ?? inT;
  const room = num(row["latest.cost.roomboard.oncampus"]) ?? 0;
  const size = num(row["latest.student.size"]) ?? 0;
  const ownership = num(row["school.ownership"]);
  const locale = num(row["school.locale"]);
  const city = String(row["school.city"] ?? "").trim() || "Unknown";
  const short = name.split(/[,(]/)[0]!.trim().slice(0, 40);

  return {
    id: scorecardId(unitId),
    name,
    shortName: short,
    city,
    state,
    region: REGION_BY_STATE[state] ?? "South",
    type: ownershipType(ownership),
    religiousAffiliation: null,
    campusSetting: localeSetting(locale),
    undergraduateEnrollment: size,
    domain: domainFromUrl(String(row["school.school_url"] ?? "")),
    majors: [],
    academicStrengths: [],
    careerStrengths: [],
    lifestyle: [],
    admissions: {
      acceptanceRate: num(row["latest.admissions.admission_rate.overall"]) ?? undefined,
      testPolicy: "Test-optional",
      earlyAction: false,
      regularDeadline: "Verify on school site",
    },
    academics: {
      sat25: sat25 ?? undefined,
      sat75: sat75 ?? undefined,
      sat50: sat25 != null && sat75 != null ? Math.round((sat25 + sat75) / 2) : undefined,
      act25: num(row["latest.admissions.act_scores.25th_percentile.cumulative"]) ?? undefined,
      act75: num(row["latest.admissions.act_scores.75th_percentile.cumulative"]) ?? undefined,
    },
    cost: {
      tuitionInState: inT,
      tuitionOutOfState: outT,
      roomAndBoard: room,
      estimatedTotalInState: inT + room,
      estimatedTotalOutOfState: outT + room,
    },
    outcomes: {
      graduationRate: num(row["latest.completion.rate_suppressed.overall"]) ?? undefined,
    },
    campus: {
      greekLife: "Unknown",
      athletics: "Unknown",
      schoolSpirit: "Unknown",
      socialScene: "Unknown",
      politicalEnvironment: "Unknown",
      outdoorRecreation: "Unknown",
      sizeBand:
        size < 1500
          ? "Very Small"
          : size < 5000
            ? "Small"
            : size < 15000
              ? "Medium"
              : size < 30000
                ? "Large"
                : "Very Large",
      climate: "Variable",
    },
    admissionsFactors: {},
    dataUpdated: DATA_YEAR,
    dataSources: [...DEFAULT_SOURCES, "College Scorecard (U.S. Dept. of Education)"],
    latitude: num(row["location.lat"]) ?? undefined,
    longitude: num(row["location.lon"]) ?? undefined,
    institutionKind: ownership === 1 && size > 20000 ? "Research university" : "Regional university",
    demographics: {
      resources: ["Verify programs and deadlines on the official campus site"],
      populationNote: "Figures from College Scorecard / IPEDS. Always confirm on the school website.",
    },
  };
}

export function scorecardApiKey() {
  return process.env.COLLEGE_SCORECARD_API_KEY || process.env.DATA_GOV_API_KEY || "DEMO_KEY";
}

export async function fetchScorecard(params: Record<string, string>) {
  const url = new URL("https://api.data.gov/ed/collegescorecard/v1/schools");
  url.searchParams.set("api_key", scorecardApiKey());
  url.searchParams.set("fields", SCORECARD_FIELDS);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`Scorecard ${res.status}`);
  }
  return (await res.json()) as { results?: ScorecardRow[]; metadata?: { total?: number } };
}
