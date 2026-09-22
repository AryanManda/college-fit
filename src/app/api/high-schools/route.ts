import { NextRequest } from "next/server";
import { stateToFips } from "../../../lib/us-state-fips";

export type HighSchoolResult = {
  id: string;
  name: string;
  city: string;
  state: string;
  zip: string;
  latitude: number | null;
  longitude: number | null;
};

type CcdRow = {
  ncessch?: string;
  school_name?: string;
  city_location?: string;
  state_location?: string;
  zip_location?: string;
  latitude?: number | null;
  longitude?: number | null;
  school_level?: number | null;
  school_status?: number | null;
  high_cedp?: number | null;
  lowest_grade_offered?: number | null;
  highest_grade_offered?: number | null;
};

type CacheEntry = { at: number; schools: HighSchoolResult[] };

const CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const YEAR = 2024;
const UPSTREAM = `https://nces-api.io.gofmx.com/api/v1/schools/ccd/directory/${YEAR}`;

const stateCache = new Map<string, CacheEntry>();

const ACRONYMS = new Set(["HS", "MS", "EL", "ISD", "CISD", "USD", "JHS", "STEM", "A&M", "II", "III", "IV"]);

function titleCaseSchool(raw: string): string {
  return raw
    .trim()
    .split(/\s+/)
    .map((part) => {
      const upper = part.toUpperCase();
      if (ACRONYMS.has(upper)) return upper;
      if (/^[A-Z]\.[A-Z]\.?$/i.test(part)) return upper;
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(" ")
    .replace(/\bH S\b/g, "HS");
}

function isHighSchool(row: CcdRow): boolean {
  if (row.school_status !== 1) return false;
  const level = row.school_level ?? -1;
  if (level === 3 || level === 7) return true;
  const high = row.highest_grade_offered ?? -1;
  const low = row.lowest_grade_offered ?? 99;
  if (level === 4 && row.high_cedp === 1 && high >= 12 && low <= 9) return true;
  return false;
}

function toResult(row: CcdRow): HighSchoolResult | null {
  const name = row.school_name?.trim();
  const state = row.state_location?.trim().toUpperCase();
  if (!name || !state) return null;
  const lat = typeof row.latitude === "number" && Number.isFinite(row.latitude) ? row.latitude : null;
  const lon = typeof row.longitude === "number" && Number.isFinite(row.longitude) ? row.longitude : null;
  return {
    id: String(row.ncessch ?? `${state}-${name}`),
    name: titleCaseSchool(name),
    city: titleCaseSchool(row.city_location?.trim() || ""),
    state,
    zip: String(row.zip_location ?? "").slice(0, 5),
    latitude: lat,
    longitude: lon,
  };
}

async function loadStateSchools(fips: string): Promise<HighSchoolResult[]> {
  const cached = stateCache.get(fips);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.schools;

  const url = `${UPSTREAM}?fips=${encodeURIComponent(fips)}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "CollegeFit/1.0" },
    next: { revalidate: 60 * 60 * 12 },
  });
  if (!res.ok) {
    throw new Error(`Upstream high-school directory failed (${res.status})`);
  }
  const data = (await res.json()) as { results?: CcdRow[] };
  const schools = (data.results ?? [])
    .filter(isHighSchool)
    .map(toResult)
    .filter((s): s is HighSchoolResult => Boolean(s))
    .sort((a, b) => a.name.localeCompare(b.name) || a.city.localeCompare(b.city));

  stateCache.set(fips, { at: Date.now(), schools });
  return schools;
}

function scoreMatch(school: HighSchoolResult, q: string): number {
  const name = school.name.toLowerCase();
  const city = school.city.toLowerCase();
  const hay = `${name} ${city}`;
  if (name === q) return 100;
  if (name.startsWith(q)) return 90;
  if (hay.startsWith(q)) return 80;
  if (name.includes(q)) return 70;
  if (city.startsWith(q)) return 60;
  if (hay.includes(q)) return 50;
  return 0;
}

export async function GET(request: NextRequest) {
  const state = (request.nextUrl.searchParams.get("state") ?? "").trim().toUpperCase();
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();
  const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? "40");
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 40;

  if (!state) {
    return Response.json({ error: "state is required (2-letter USPS code)" }, { status: 400 });
  }
  const fips = stateToFips(state);
  if (!fips) {
    return Response.json({ error: "Unknown state code" }, { status: 400 });
  }

  try {
    const all = await loadStateSchools(fips);
    let results = all;
    if (q) {
      results = all
        .map((s) => ({ s, score: scoreMatch(s, q) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score || a.s.name.localeCompare(b.s.name))
        .map((x) => x.s);
    }
    return Response.json({
      state,
      count: results.length,
      totalInState: all.length,
      schools: results.slice(0, limit),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load high schools";
    return Response.json({ error: message }, { status: 502 });
  }
}
