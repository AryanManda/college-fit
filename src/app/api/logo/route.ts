import { NextRequest } from "next/server";

/** FERPA mode: college logos served from this app, so Google never sees which schools a student views. */
export async function GET(req: NextRequest) {
  const domain = (req.nextUrl.searchParams.get("domain") || "").toLowerCase();
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain)) {
    return new Response("Bad domain", { status: 400 });
  }
  try {
    const res = await fetch(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`, {
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
    if (!res.ok) return new Response(null, { status: 404 });
    return new Response(await res.arrayBuffer(), {
      headers: {
        "Content-Type": res.headers.get("content-type") || "image/png",
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}
