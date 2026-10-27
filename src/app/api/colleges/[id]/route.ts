import { NextResponse } from "next/server";
import { getCollege } from "../../../../data/colleges";
import { fetchScorecard, parseScorecardUnitId, scorecardToCollege } from "../../../../lib/scorecard";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const local = getCollege(id);
  if (local) return NextResponse.json({ school: local, source: "curated" });

  const unitId = parseScorecardUnitId(id);
  if (!unitId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const data = await fetchScorecard({ id: unitId, per_page: "1" });
    const school = data.results?.[0] ? scorecardToCollege(data.results[0]) : null;
    if (!school) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ school, source: "scorecard" });
  } catch {
    return NextResponse.json({ error: "Upstream failed" }, { status: 502 });
  }
}
