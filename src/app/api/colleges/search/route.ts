import { NextRequest, NextResponse } from "next/server";
import { COLLEGES } from "../../../../data/colleges";
import { fetchScorecard, scorecardToCollege } from "../../../../lib/scorecard";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  const state = (req.nextUrl.searchParams.get("state") || "").trim().toUpperCase();
  const limit = Math.min(40, Math.max(1, Number(req.nextUrl.searchParams.get("limit") || 20)));

  if (!q && !state) {
    return NextResponse.json({ error: "Provide q and/or state" }, { status: 400 });
  }

  const curated = COLLEGES.filter((c) => {
    const hay = `${c.name} ${c.shortName} ${c.city}`.toLowerCase();
    const okQ = !q || hay.includes(q.toLowerCase());
    const okState = !state || c.state === state;
    return okQ && okState;
  }).slice(0, limit);

  let remote: ReturnType<typeof scorecardToCollege>[] = [];
  let totalRemote = 0;
  try {
    const params: Record<string, string> = {
      per_page: String(Math.min(40, limit)),
      "school.degrees_awarded.predominant": "2,3",
    };
    if (q) params["school.name"] = q;
    if (state) params["school.state"] = state;
    const data = await fetchScorecard(params);
    totalRemote = data.metadata?.total ?? 0;
    remote = (data.results ?? [])
      .map(scorecardToCollege)
      .filter((c): c is NonNullable<typeof c> => Boolean(c));
  } catch {
    remote = [];
  }

  const seen = new Set(curated.map((c) => c.name.toLowerCase()));
  const merged = [
    ...curated,
    ...remote.filter((c) => !seen.has(c!.name.toLowerCase())),
  ].slice(0, limit);

  return NextResponse.json({
    count: merged.length,
    curatedCount: curated.length,
    scorecardTotal: totalRemote,
    schools: merged,
  });
}
