"use client";

import { US_STATES } from "../lib/constants";
import { coordsFor } from "../lib/geo";
import { syncResidencePatch } from "../lib/location-prefs";
import type { AppState, AttendanceScope, DistancePreset, DriveTimePreset } from "../lib/types";

export function LocationAndDistance({
  state,
  patch,
}: {
  state: AppState;
  patch: (fn: (s: AppState) => AppState) => void;
}) {
  const s = state.student;
  const g = state.preferences.geographic;

  const useLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      patch((p) => ({
        ...p,
        student: {
          ...p.student,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          locationPermission: true,
        },
      }));
    });
  };

  const lookupZip = async () => {
    if (!/^\d{5}$/.test(s.zip)) return;
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${s.zip}`);
      if (!res.ok) return;
      const data = await res.json();
      const place = data.places?.[0];
      if (!place) return;
      patch((p) =>
        syncResidencePatch(p, {
          city: place["place name"] || p.student.city,
          state: place["state abbreviation"] || p.student.state,
          latitude: Number(place.latitude),
          longitude: Number(place.longitude),
          zip: s.zip,
        }),
      );
    } catch {
      /* optional lookup */
    }
  };

  return (
    <div className="grid gap-5">
      <div className="card grid gap-4 p-5 md:grid-cols-2">
        <h2 className="serif text-3xl md:col-span-2">Home location</h2>
        <p className="text-sm text-(--muted) md:col-span-2">Optional. No street address. Used for distance and in-state tuition context. Setting your state prioritizes that state&apos;s schools.</p>
        <label className="block"><span className="label">City</span>
          <input className="field" value={s.city} onChange={(e) => {
            const city = e.target.value;
            const pt = coordsFor(city, s.state);
            patch((p) => syncResidencePatch(p, { city, latitude: pt?.lat ?? p.student.latitude, longitude: pt?.lng ?? p.student.longitude }));
          }} />
        </label>
        <label className="block"><span className="label">State</span>
          <select className="field" value={s.state} onChange={(e) => patch((p) => syncResidencePatch(p, { state: e.target.value }))}>
            <option value="">Select</option>
            {US_STATES.map((st) => <option key={st}>{st}</option>)}
          </select>
        </label>
        <label className="block"><span className="label">ZIP code</span>
          <div className="flex gap-2">
            <input className="field" value={s.zip} onChange={(e) => patch((p) => syncResidencePatch(p, { zip: e.target.value }))} />
            <button className="btn btn-ghost" type="button" onClick={lookupZip}>Lookup</button>
          </div>
        </label>
        <label className="block"><span className="label">Country</span>
          <input className="field" value={s.country} onChange={(e) => patch((p) => syncResidencePatch(p, { country: e.target.value }))} />
        </label>
        <button className="btn btn-primary md:col-span-2" type="button" onClick={useLocation}>Use my current location</button>
      </div>

      <div className="card p-5">
        <h2 className="serif text-3xl">How far are you willing to go?</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {([
            ["25", "Within 25 miles"],
            ["50", "Within 50 miles"],
            ["100", "Within 100 miles"],
            ["250", "Within 250 miles"],
            ["500", "Within 500 miles"],
            ["state", "Anywhere in my state"],
            ["us", "Anywhere in the United States"],
            ["world", "Anywhere in the world"],
            ["custom", "Custom distance"],
          ] as [DistancePreset, string][]).map(([id, label]) => (
            <button key={id} className={`btn ${g.distancePreset === id ? "btn-primary" : "btn-ghost"}`} onClick={() => patch((p) => ({ ...p, preferences: { ...p.preferences, geographic: { ...p.preferences.geographic, distancePreset: id } } }))}>
              {label}
            </button>
          ))}
        </div>
        {g.distancePreset === "custom" ? (
          <label className="mt-3 block"><span className="label">Maximum miles</span>
            <input className="field" value={g.customMaxMiles} onChange={(e) => patch((p) => ({ ...p, preferences: { ...p.preferences, geographic: { ...p.preferences.geographic, customMaxMiles: e.target.value } } }))} />
          </label>
        ) : null}
      </div>

      <div className="card p-5">
        <h2 className="serif text-3xl">Maximum travel time from home</h2>
        <p className="text-sm text-(--muted)">Driving time is estimated. Public-transit and flight times are shown only when the method applies.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {([
            ["30", "30 minutes"],
            ["60", "1 hour"],
            ["120", "2 hours"],
            ["180", "3 hours"],
            ["240", "4 hours"],
            ["360", "6 hours"],
            ["480", "8+ hours"],
            ["none", "No preference"],
          ] as [DriveTimePreset, string][]).map(([id, label]) => (
            <button key={id} className={`btn ${g.maxDriveTime === id ? "btn-primary" : "btn-ghost"}`} onClick={() => patch((p) => ({ ...p, preferences: { ...p.preferences, geographic: { ...p.preferences.geographic, maxDriveTime: id } } }))}>
              {label}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {(["Driving", "Transit", "Flight", "No preference"] as const).map((m) => (
            <button key={m} className={`btn ${g.travelMode === m ? "btn-primary" : "btn-ghost"}`} onClick={() => patch((p) => ({ ...p, preferences: { ...p.preferences, geographic: { ...p.preferences.geographic, travelMode: m } } }))}>
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="serif text-3xl">Where are you willing to attend?</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {([
            ["only-state", "Only in my state"],
            ["primarily-state", "Primarily in my state"],
            ["state-neighbors", "My state + neighboring states"],
            ["us", "Anywhere in the United States"],
            ["world", "Anywhere in the world"],
          ] as [AttendanceScope, string][]).map(([id, label]) => (
            <button key={id} className={`btn ${g.attendanceScope === id ? "btn-primary" : "btn-ghost"}`} onClick={() => patch((p) => ({ ...p, preferences: { ...p.preferences, geographic: { ...p.preferences.geographic, attendanceScope: id } } }))}>
              {label}
            </button>
          ))}
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={g.inStateTuitionOnly} onChange={(e) => patch((p) => ({ ...p, preferences: { ...p.preferences, geographic: { ...p.preferences.geographic, inStateTuitionOnly: e.target.checked } } }))} />
          Only show schools where I am likely to qualify for in-state tuition (others still appear, ranked lower)
        </label>
      </div>
    </div>
  );
}

const RACE = [
  "Prefer not to answer",
  "American Indian or Alaska Native",
  "Asian",
  "Black or African American",
  "Native Hawaiian or Other Pacific Islander",
  "White",
  "Two or more races",
  "Other",
];

export function DemographicsForm({
  state,
  patch,
}: {
  state: AppState;
  patch: (fn: (s: AppState) => AppState) => void;
}) {
  const s = state.student;
  const toggleRace = (r: string) =>
    patch((p) => ({
      ...p,
      student: {
        ...p.student,
        raceEthnicity: p.student.raceEthnicity.includes(r)
          ? p.student.raceEthnicity.filter((x) => x !== r)
          : [...p.student.raceEthnicity, r],
      },
    }));

  return (
    <div className="card grid gap-4 p-5">
      <h2 className="serif text-3xl">Demographic information</h2>
      <p className="text-sm text-(--muted)">
        This information is optional. It may be used to provide additional context about student populations, scholarships, campus demographics, and publicly reported admissions information. It will not be used to increase or decrease your individual admissions-match score.
      </p>
      <div>
        <div className="label">Hispanic / Latino ethnicity</div>
        <div className="flex flex-wrap gap-2">
          {["Yes", "No", "Prefer not to answer"].map((v) => (
            <button key={v} className={`btn ${s.hispanicLatino === v ? "btn-primary" : "btn-ghost"}`} onClick={() => patch((p) => ({ ...p, student: { ...p.student, hispanicLatino: v as AppState["student"]["hispanicLatino"] } }))}>{v}</button>
          ))}
        </div>
      </div>
      <div>
        <div className="label">Race / ethnicity (multiple allowed)</div>
        <div className="flex flex-wrap gap-2">
          {RACE.map((r) => (
            <button key={r} className={`btn ${s.raceEthnicity.includes(r) ? "btn-primary" : "btn-ghost"}`} onClick={() => toggleRace(r)}>{r}</button>
          ))}
        </div>
      </div>
      <label className="block"><span className="label">First-generation college student</span>
        <select className="field" value={s.firstGeneration} onChange={(e) => patch((p) => ({ ...p, student: { ...p.student, firstGeneration: e.target.value as AppState["student"]["firstGeneration"] } }))}>
          <option value=""></option><option>Yes</option><option>No</option><option>Prefer not to answer</option>
        </select>
      </label>
      <label className="block"><span className="label">International student</span>
        <select className="field" value={s.internationalStudent} onChange={(e) => patch((p) => ({ ...p, student: { ...p.student, internationalStudent: e.target.value as AppState["student"]["internationalStudent"] } }))}>
          <option value=""></option><option>Yes</option><option>No</option>
        </select>
      </label>
      <label className="block"><span className="label">Citizenship status</span>
        <input className="field" value={s.citizenship} onChange={(e) => patch((p) => ({ ...p, student: { ...p.student, citizenship: e.target.value } }))} />
      </label>
      <label className="block"><span className="label">State residency</span>
        <select className="field" value={s.residencyStatus} onChange={(e) => patch((p) => ({ ...p, student: { ...p.student, residencyStatus: e.target.value as AppState["student"]["residencyStatus"] } }))}>
          <option value=""></option><option>In-state</option><option>Out-of-state</option><option>International</option>
        </select>
      </label>
      <label className="block"><span className="label">Rural / suburban / urban background</span>
        <select className="field" value={s.backgroundSetting} onChange={(e) => patch((p) => ({ ...p, student: { ...p.student, backgroundSetting: e.target.value as AppState["student"]["backgroundSetting"] } }))}>
          <option value=""></option><option>Rural</option><option>Suburban</option><option>Urban</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={s.militaryFamily} onChange={(e) => patch((p) => ({ ...p, student: { ...p.student, militaryFamily: e.target.checked } }))} />
        Military family
      </label>
      <label className="block"><span className="label">Legacy relationship</span>
        <input className="field" value={s.legacy} onChange={(e) => patch((p) => ({ ...p, student: { ...p.student, legacy: e.target.value } }))} />
      </label>
      <label className="block"><span className="label">Parent / guardian education</span>
        <input className="field" value={s.parentEducation} onChange={(e) => patch((p) => ({ ...p, student: { ...p.student, parentEducation: e.target.value } }))} />
      </label>
      <label className="block"><span className="label">Household notes relevant to financial aid</span>
        <textarea className="field min-h-20" value={s.householdAidNotes} onChange={(e) => patch((p) => ({ ...p, student: { ...p.student, householdAidNotes: e.target.value } }))} />
      </label>
    </div>
  );
}
