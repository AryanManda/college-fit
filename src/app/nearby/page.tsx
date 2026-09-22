"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { COLLEGES, logoUrl } from "../../data/colleges";
import { matchCollege } from "../../lib/matching";
import { useStore } from "../../lib/store";
import { PageHeader } from "../../components/ui";
import { CollegesTopTabs } from "../../components/CollegesTopTabs";
import { TRAVEL_NOTE, collegeCoords, studentCoords } from "../../lib/geo";
import { MATCH_DISCLAIMER } from "../../lib/constants";
import { money, pct, scoreTone } from "../../lib/format";
import type { AdmissionCategory } from "../../lib/types";

export default function NearbyPage() {
  const { state } = useStore();
  const origin = studentCoords(state);
  const [miles, setMiles] = useState(100);
  const [minutes, setMinutes] = useState(0);
  const [kind, setKind] = useState("");
  const [type, setType] = useState("");
  const [size, setSize] = useState("");
  const [cat, setCat] = useState<AdmissionCategory | "">("");
  const [maxCost, setMaxCost] = useState("");
  const [inStateOnly, setInStateOnly] = useState(false);
  const [customMin, setCustomMin] = useState("");
  const [religious, setReligious] = useState(false);

  const rows = useMemo(() => {
    return COLLEGES.map((c) => ({ college: c, match: matchCollege(state, c) }))
      .filter(({ college, match }) => {
        if (match.miles == null) return false;
        if (match.miles > miles) return false;
        const driveCap = customMin ? Number(customMin) : minutes;
        if (driveCap && (match.driveMinutes == null || match.driveMinutes > driveCap)) return false;
        if (type && college.type !== type) return false;
        if (kind && college.institutionKind !== kind) return false;
        if (religious && !college.religiousAffiliation) return false;
        if (size && college.campus.sizeBand !== size) return false;
        if (cat && match.category !== cat) return false;
        if (inStateOnly && !(match.inStateForStudent && (college.type === "Public" || college.type === "Community"))) return false;
        if (maxCost) {
          const cost = match.inStateForStudent ? college.cost.estimatedTotalInState : college.cost.estimatedTotalOutOfState;
          if (cost && cost > Number(maxCost)) return false;
        }
        return true;
      })
      .sort((a, b) => (a.match.miles ?? 9999) - (b.match.miles ?? 9999));
  }, [state, miles, minutes, kind, type, size, cat, maxCost, inStateOnly, customMin, religious]);

  const pts = rows
    .map((r) => ({ ...r, pt: collegeCoords(r.college) }))
    .filter((r) => r.pt);
  const lats = pts.map((p) => p.pt!.lat);
  const lngs = pts.map((p) => p.pt!.lng);
  const minLat = Math.min(...lats, origin?.lat ?? 30);
  const maxLat = Math.max(...lats, origin?.lat ?? 31);
  const minLng = Math.min(...lngs, origin?.lng ?? -98);
  const maxLng = Math.max(...lngs, origin?.lng ?? -97);

  const xy = (lat: number, lng: number) => ({
    left: `${((lng - minLng) / Math.max(maxLng - minLng, 0.01)) * 100}%`,
    top: `${((maxLat - lat) / Math.max(maxLat - minLat, 0.01)) * 100}%`,
  });

  return (
    <div>
      <PageHeader
        title="Colleges near me"
        subtitle={
          origin
            ? `Using ${state.student.city || "your coordinates"}, ${state.student.state || ""}`.trim()
            : "Add a city and state (or use current location in Profile) to measure distance."
        }
      />
      <CollegesTopTabs />
      <div className="card mb-4 grid gap-3 p-4 md:grid-cols-4">
        <label className="text-sm">Distance
          <select className="field mt-1" value={miles} onChange={(e) => setMiles(Number(e.target.value))}>
            {[10, 25, 50, 100, 250].map((n) => <option key={n} value={n}>{n} miles</option>)}
          </select>
        </label>
        <label className="text-sm">Max drive
          <select className="field mt-1" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
            <option value={0}>Any</option>
            <option value={30}>30 min</option>
            <option value={60}>1 hour</option>
            <option value={120}>2 hours</option>
            <option value={180}>3 hours</option>
          </select>
        </label>
        <label className="text-sm">Custom travel (min)
          <input className="field mt-1" value={customMin} onChange={(e) => setCustomMin(e.target.value)} placeholder="e.g. 90" />
        </label>
        <label className="text-sm">Type
          <select className="field mt-1" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Any</option>
            <option>Public</option><option>Private</option><option>Community</option>
          </select>
        </label>
        <label className="text-sm">Kind
          <select className="field mt-1" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="">Any</option>
            <option>Research university</option>
            <option>Liberal arts</option>
            <option>Technical university</option>
            <option>Community college</option>
            <option>Regional university</option>
          </select>
        </label>
        <label className="text-sm">Size
          <select className="field mt-1" value={size} onChange={(e) => setSize(e.target.value)}>
            <option value="">Any</option>
            <option>Very Small</option><option>Small</option><option>Medium</option><option>Large</option><option>Very Large</option>
          </select>
        </label>
        <label className="text-sm">Admissions
          <select className="field mt-1" value={cat} onChange={(e) => setCat(e.target.value as AdmissionCategory | "")}>
            <option value="">Any</option>
            <option>Likely</option><option>Target</option><option>Reach</option><option>High Reach</option>
          </select>
        </label>
        <label className="text-sm">Max annual cost
          <input className="field mt-1" value={maxCost} onChange={(e) => setMaxCost(e.target.value)} placeholder="e.g. 35000" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={inStateOnly} onChange={(e) => setInStateOnly(e.target.checked)} />
          Only in-state tuition likely
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={religious} onChange={(e) => setReligious(e.target.checked)} />
          Religious affiliation listed
        </label>
      </div>

      <div className="card relative mb-5 h-72 overflow-hidden bg-(--bg-warm)">
        {origin ? <span className="absolute z-10 h-3 w-3 rounded-full bg-(--accent-2)" style={xy(origin.lat, origin.lng)} title="You" /> : null}
        {pts.slice(0, 40).map((p) => (
          <Link
            key={p.college.id}
            href={`/colleges/${p.college.id}`}
            className="absolute h-2.5 w-2.5 rounded-full bg-(--accent)"
            style={xy(p.pt!.lat, p.pt!.lng)}
            title={p.college.shortName}
          />
        ))}
        <div className="absolute bottom-2 left-3 text-xs text-(--muted)">Map is a geographic sketch, not live GIS. Orange = home. Teal = schools.</div>
      </div>

      <div className="grid gap-3">
        {rows.map(({ college, match }) => (
          <article key={college.id} className="card flex flex-wrap items-start gap-4 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl(college)} alt="" className="h-10 w-10 rounded-xl border border-(--line) bg-white" />
            <div className="min-w-0 flex-1">
              <Link href={`/colleges/${college.id}`} className="font-semibold hover:underline">{college.name}</Link>
              <div className="text-sm text-(--muted)">
                {match.miles} miles away · {match.driveMinutes != null ? `${match.driveMinutes}-minute estimated drive` : "drive time unavailable"}
                {match.transitMinutes != null ? ` · ~${match.transitMinutes} min transit estimate` : ""} · {college.type}
              </div>
              <div className="mt-1 flex flex-wrap gap-2 text-xs">
                <span className="chip">{match.category}</span>
                <span>Enrollment {college.undergraduateEnrollment.toLocaleString()}</span>
                <span>Accept {pct(college.admissions.acceptanceRate)}</span>
                <span>Cost {money(match.inStateForStudent ? college.cost.estimatedTotalInState : college.cost.estimatedTotalOutOfState)}</span>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-xl font-semibold ${scoreTone(match.admissions)}`}>{match.admissions}</div>
              <div className="text-[11px] uppercase text-(--muted)">Admissions</div>
              <div className="text-sm">Fit {match.overall}</div>
              <Link href={`/colleges/${college.id}`} className="btn btn-primary mt-2">View School</Link>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-4 text-xs text-(--muted)">{TRAVEL_NOTE} {MATCH_DISCLAIMER}</p>
    </div>
  );
}
