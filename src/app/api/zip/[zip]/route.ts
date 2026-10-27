import { NextRequest, NextResponse } from "next/server";

/** ZIP → city/state/coordinates, looked up server-side so the browser only talks to this app. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ zip: string }> }) {
  const { zip } = await params;
  if (!/^\d{5}$/.test(zip)) {
    return NextResponse.json({ error: "Provide a 5-digit ZIP" }, { status: 400 });
  }
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`, { next: { revalidate: 60 * 60 * 24 * 30 } });
    if (!res.ok) return NextResponse.json({ error: "ZIP not found" }, { status: 404 });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: "ZIP lookup failed" }, { status: 502 });
  }
}
