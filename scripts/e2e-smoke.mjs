/**
 * End-to-end smoke suite for Aether / college-fit.
 * Usage: node scripts/e2e-smoke.mjs [baseUrl]
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const BASE = process.argv[2] || process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
const startedLocal = !process.argv[2] && !process.env.E2E_BASE_URL;

const results = [];
let failed = 0;

function ok(name, detail = "") {
  results.push({ name, pass: true, detail });
  console.log(`PASS  ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail) {
  failed += 1;
  results.push({ name, pass: false, detail });
  console.error(`FAIL  ${name} — ${detail}`);
}

async function get(p) {
  const res = await fetch(`${BASE}${p}`);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* html */
  }
  return { res, text, json };
}

async function waitForServer(maxMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const r = await fetch(BASE);
      if (r.ok || r.status === 404 || r.status === 500) return;
    } catch {
      /* retry */
    }
    await sleep(1000);
  }
  throw new Error(`Server not ready at ${BASE}`);
}

let child;
if (startedLocal) {
  child = spawn("npm", ["run", "dev", "--", "-p", "3000"], {
    cwd: ROOT,
    stdio: "ignore",
    shell: true,
  });
}

try {
  await waitForServer();

  const pages = [
    "/",
    "/career",
    "/career/assessment",
    "/career/matches",
    "/colleges",
    "/colleges/matches",
    "/colleges/saved",
    "/colleges/not-interested",
    "/colleges/get-admitted",
    "/colleges/harvard",
    "/colleges/acc",
    "/colleges/ut-austin",
    "/find",
    "/match",
    "/nearby",
    "/odds",
    "/compare",
    "/resume",
    "/strength",
    "/path",
    "/profile",
    "/settings",
    "/account",
    "/upload",
    "/onboarding",
  ];
  for (const p of pages) {
    const { res } = await get(p);
    if (res.status >= 200 && res.status < 400) ok(`page ${p}`, String(res.status));
    else fail(`page ${p}`, `status ${res.status}`);
  }

  {
    const { res, text } = await get("/colleges/this-school-does-not-exist-xyz");
    if (res.status === 200 || res.status === 404) ok("outlier unknown college page", String(res.status));
    else fail("outlier unknown college page", `status ${res.status} ${text.slice(0, 80)}`);
  }

  {
    const { res, json } = await get("/api/high-schools?state=TX&q=westlake&limit=10");
    if (res.ok && Array.isArray(json?.schools) && json.schools.length > 0) {
      ok("HS TX westlake", `${json.schools.length} hits, totalInState=${json.totalInState}`);
    } else fail("HS TX westlake", JSON.stringify(json)?.slice(0, 200) || String(res.status));
  }
  {
    const { res, json } = await get("/api/high-schools?state=CA&limit=5");
    if (res.ok && json?.totalInState > 100) ok("HS CA coverage", `totalInState=${json.totalInState}`);
    else fail("HS CA coverage", JSON.stringify(json)?.slice(0, 200) || String(res.status));
  }
  {
    const { res, json } = await get("/api/high-schools?state=AK&q=anchorage&limit=20");
    if (res.ok && Array.isArray(json?.schools)) ok("HS AK outlier state", `${json.schools.length} hits`);
    else fail("HS AK outlier state", String(res.status));
  }
  {
    const { res } = await get("/api/high-schools");
    if (res.status === 400) ok("HS missing state → 400");
    else fail("HS missing state → 400", String(res.status));
  }
  {
    const { res } = await get("/api/high-schools?state=ZZ");
    if (res.status === 400) ok("HS invalid state → 400");
    else fail("HS invalid state → 400", String(res.status));
  }
  {
    const { res, json } = await get(`/api/high-schools?state=TX&q=${"z".repeat(80)}&limit=5`);
    if (res.ok && Array.isArray(json?.schools)) ok("HS extreme long query", `${json.schools.length} hits`);
    else fail("HS extreme long query", String(res.status));
  }
  {
    const { res, json } = await get("/api/high-schools?state=TX&limit=9999");
    if (res.ok && json?.schools?.length <= 100) ok("HS limit clamp", `returned ${json.schools.length}`);
    else fail("HS limit clamp", String(res.status));
  }

  {
    const { res, json } = await get("/api/colleges/search?q=harvard&limit=5");
    if (res.ok && json?.schools?.some((s) => /harvard/i.test(s.name))) {
      ok("college search harvard", `${json.count} results, scorecardTotal=${json.scorecardTotal}`);
    } else fail("college search harvard", JSON.stringify(json)?.slice(0, 300) || String(res.status));
  }
  {
    const { res, json } = await get("/api/colleges/search?state=WY&limit=10");
    if (res.ok && (json?.schools?.length > 0 || json?.scorecardTotal > 0)) {
      ok("college search WY gap fill", `count=${json.count} scorecardTotal=${json.scorecardTotal}`);
    } else fail("college search WY gap fill", JSON.stringify(json)?.slice(0, 300) || String(res.status));
  }
  {
    const { res } = await get("/api/colleges/search");
    if (res.status === 400) ok("college search missing params → 400");
    else fail("college search missing params → 400", String(res.status));
  }
  {
    const { res, json } = await get("/api/colleges/search?q=%27%3BDROP%20TABLE%3B--&limit=5");
    if (res.ok && Array.isArray(json?.schools)) ok("college search injection-ish query");
    else fail("college search injection-ish query", String(res.status));
  }

  {
    const { res, json } = await get("/api/colleges/harvard");
    if (res.ok && json?.school?.id === "harvard") ok("college id curated harvard", json.source);
    else fail("college id curated harvard", String(res.status));
  }
  {
    const { res, json } = await get("/api/colleges/sc-166027");
    if (res.ok && /harvard/i.test(json?.school?.name || "")) ok("college id scorecard harvard", json.school.id);
    else fail("college id scorecard harvard", JSON.stringify(json)?.slice(0, 200) || String(res.status));
  }
  {
    const { res } = await get("/api/colleges/sc-000000");
    if (res.status === 404) ok("college id scorecard missing → 404");
    else fail("college id scorecard missing → 404", String(res.status));
  }

  {
    const { res, text } = await get("/");
    if (res.ok && /Aether/i.test(text)) ok("brand Aether in HTML");
    else fail("brand Aether in HTML", "Aether string missing");
  }
} catch (e) {
  fail("suite crashed", e instanceof Error ? e.message : String(e));
} finally {
  if (child) {
    try {
      child.kill();
    } catch {
      /* ignore */
    }
  }
}

console.log("\n———");
console.log(`${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
