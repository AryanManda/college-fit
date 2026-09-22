import type { AppState, College, DistancePreset, DriveTimePreset, InstitutionKind } from "./types";

export type LatLng = { lat: number; lng: number };

const STATE_CENTROID: Record<string, LatLng> = {
  AL: { lat: 32.8, lng: -86.8 }, AK: { lat: 64.2, lng: -153.4 }, AZ: { lat: 34.3, lng: -111.6 }, AR: { lat: 34.9, lng: -92.4 },
  CA: { lat: 37.2, lng: -119.5 }, CO: { lat: 39.0, lng: -105.5 }, CT: { lat: 41.6, lng: -72.7 }, DE: { lat: 39.0, lng: -75.5 },
  FL: { lat: 28.6, lng: -82.4 }, GA: { lat: 32.7, lng: -83.4 }, HI: { lat: 20.8, lng: -156.3 }, ID: { lat: 44.4, lng: -114.6 },
  IL: { lat: 40.0, lng: -89.0 }, IN: { lat: 39.9, lng: -86.3 }, IA: { lat: 42.0, lng: -93.5 }, KS: { lat: 38.5, lng: -98.4 },
  KY: { lat: 37.8, lng: -85.7 }, LA: { lat: 31.0, lng: -92.0 }, ME: { lat: 45.3, lng: -69.2 }, MD: { lat: 39.0, lng: -76.7 },
  MA: { lat: 42.2, lng: -71.8 }, MI: { lat: 44.3, lng: -85.4 }, MN: { lat: 46.0, lng: -94.6 }, MS: { lat: 32.7, lng: -89.7 },
  MO: { lat: 38.4, lng: -92.5 }, MT: { lat: 47.0, lng: -110.0 }, NE: { lat: 41.5, lng: -99.8 }, NV: { lat: 39.3, lng: -116.6 },
  NH: { lat: 43.7, lng: -71.6 }, NJ: { lat: 40.2, lng: -74.6 }, NM: { lat: 34.4, lng: -106.1 }, NY: { lat: 42.9, lng: -75.5 },
  NC: { lat: 35.6, lng: -79.4 }, ND: { lat: 47.4, lng: -100.5 }, OH: { lat: 40.3, lng: -82.8 }, OK: { lat: 35.6, lng: -97.5 },
  OR: { lat: 43.9, lng: -120.6 }, PA: { lat: 40.9, lng: -77.8 }, RI: { lat: 41.7, lng: -71.5 }, SC: { lat: 33.9, lng: -80.9 },
  SD: { lat: 44.4, lng: -100.2 }, TN: { lat: 35.9, lng: -86.4 }, TX: { lat: 31.5, lng: -99.3 }, UT: { lat: 39.3, lng: -111.7 },
  VT: { lat: 44.0, lng: -72.7 }, VA: { lat: 37.5, lng: -78.6 }, WA: { lat: 47.4, lng: -120.5 }, WV: { lat: 38.6, lng: -80.6 },
  WI: { lat: 44.6, lng: -89.8 }, WY: { lat: 43.0, lng: -107.6 }, DC: { lat: 38.91, lng: -77.04 },
};

const CITY: Record<string, LatLng> = {
  "Cambridge|MA": { lat: 42.3736, lng: -71.1097 }, "New Haven|CT": { lat: 41.3083, lng: -72.9279 },
  "Princeton|NJ": { lat: 40.3573, lng: -74.6672 }, "New York|NY": { lat: 40.7128, lng: -74.006 },
  "Philadelphia|PA": { lat: 39.9526, lng: -75.1652 }, "Providence|RI": { lat: 41.824, lng: -71.4128 },
  "Hanover|NH": { lat: 43.7022, lng: -72.2896 }, "Ithaca|NY": { lat: 42.444, lng: -76.5019 },
  "Stanford|CA": { lat: 37.4241, lng: -122.1661 }, "Pasadena|CA": { lat: 34.1478, lng: -118.1445 },
  "Chicago|IL": { lat: 41.8781, lng: -87.6298 }, "Durham|NC": { lat: 35.994, lng: -78.8986 },
  "Evanston|IL": { lat: 42.0451, lng: -87.6877 }, "Baltimore|MD": { lat: 39.2904, lng: -76.6122 },
  "Nashville|TN": { lat: 36.1627, lng: -86.7816 }, "Houston|TX": { lat: 29.7604, lng: -95.3698 },
  "Notre Dame|IN": { lat: 41.7001, lng: -86.2379 }, "St. Louis|MO": { lat: 38.627, lng: -90.1994 },
  "Atlanta|GA": { lat: 33.749, lng: -84.388 }, "Pittsburgh|PA": { lat: 40.4406, lng: -79.9959 },
  "Washington|DC": { lat: 38.9072, lng: -77.0369 }, "Los Angeles|CA": { lat: 34.0522, lng: -118.2437 },
  "Medford|MA": { lat: 42.4184, lng: -71.1062 }, "Chestnut Hill|MA": { lat: 42.3307, lng: -71.1662 },
  "Boston|MA": { lat: 42.3601, lng: -71.0589 }, "Winston-Salem|NC": { lat: 36.0999, lng: -80.2442 },
  "New Orleans|LA": { lat: 29.9511, lng: -90.0715 }, "Cleveland|OH": { lat: 41.4993, lng: -81.6944 },
  "Villanova|PA": { lat: 40.037, lng: -75.3491 }, "Bethlehem|PA": { lat: 40.6259, lng: -75.3705 },
  "Troy|NY": { lat: 42.7284, lng: -73.6918 }, "Wellesley|MA": { lat: 42.2968, lng: -71.2924 },
  "Williamstown|MA": { lat: 42.712, lng: -73.2037 }, "Amherst|MA": { lat: 42.3732, lng: -72.5199 },
  "Swarthmore|PA": { lat: 39.902, lng: -75.3496 }, "Claremont|CA": { lat: 34.0967, lng: -117.7198 },
  "Brunswick|ME": { lat: 43.9145, lng: -69.9653 }, "Middlebury|VT": { lat: 44.0153, lng: -73.1673 },
  "Northfield|MN": { lat: 44.4583, lng: -93.1616 }, "Davidson|NC": { lat: 35.4993, lng: -80.8487 },
  "Lexington|VA": { lat: 37.784, lng: -79.4428 }, "Richmond|VA": { lat: 37.5407, lng: -77.436 },
  "Hamilton|NY": { lat: 42.827, lng: -75.5446 }, "Lewisburg|PA": { lat: 40.9645, lng: -76.8844 },
  "Oberlin|OH": { lat: 41.2939, lng: -82.2174 }, "Grinnell|IA": { lat: 41.743, lng: -92.7224 },
  "Saint Paul|MN": { lat: 44.9537, lng: -93.09 }, "Portland|OR": { lat: 45.5152, lng: -122.6784 },
  "Colorado Springs|CO": { lat: 38.8339, lng: -104.8214 }, "Berkeley|CA": { lat: 37.8715, lng: -122.273 },
  "La Jolla|CA": { lat: 32.8328, lng: -117.2713 }, "Santa Barbara|CA": { lat: 34.4208, lng: -119.6982 },
  "Irvine|CA": { lat: 33.6846, lng: -117.8265 }, "Davis|CA": { lat: 38.5449, lng: -121.7405 },
  "Ann Arbor|MI": { lat: 42.2808, lng: -83.743 }, "Charlottesville|VA": { lat: 38.0293, lng: -78.4767 },
  "Chapel Hill|NC": { lat: 35.9132, lng: -79.0558 }, "Austin|TX": { lat: 30.2672, lng: -97.7431 },
  "San Marcos|TX": { lat: 29.8833, lng: -97.9414 }, "Lubbock|TX": { lat: 33.5779, lng: -101.8552 },
  "Madison|WI": { lat: 43.0731, lng: -89.4012 }, "Champaign|IL": { lat: 40.1164, lng: -88.2434 },
  "Seattle|WA": { lat: 47.6062, lng: -122.3321 }, "Columbus|OH": { lat: 39.9612, lng: -82.9988 },
  "University Park|PA": { lat: 40.8148, lng: -77.865 }, "Gainesville|FL": { lat: 29.6516, lng: -82.3248 },
  "Athens|GA": { lat: 33.9519, lng: -83.3576 }, "College Station|TX": { lat: 30.628, lng: -96.3344 },
  "West Lafayette|IN": { lat: 40.4259, lng: -86.9081 }, "Blacksburg|VA": { lat: 37.2296, lng: -80.4139 },
  "College Park|MD": { lat: 38.9897, lng: -76.9378 }, "Minneapolis|MN": { lat: 44.9778, lng: -93.265 },
  "Bloomington|IN": { lat: 39.1653, lng: -86.5264 }, "Boulder|CO": { lat: 40.015, lng: -105.2705 },
  "Eugene|OR": { lat: 44.0521, lng: -123.0868 }, "Tucson|AZ": { lat: 32.2226, lng: -110.9747 },
  "Tempe|AZ": { lat: 33.4255, lng: -111.94 }, "New Brunswick|NJ": { lat: 40.4862, lng: -74.4518 },
  "Binghamton|NY": { lat: 42.0987, lng: -75.918 }, "Stony Brook|NY": { lat: 40.9257, lng: -73.1409 },
  "Storrs|CT": { lat: 41.8084, lng: -72.2495 }, "Newark|DE": { lat: 39.6837, lng: -75.7497 },
  "Clemson|SC": { lat: 34.6834, lng: -82.8374 }, "Raleigh|NC": { lat: 35.7796, lng: -78.6382 },
  "Auburn|AL": { lat: 32.6099, lng: -85.4808 }, "Tuscaloosa|AL": { lat: 33.2098, lng: -87.5692 },
  "Knoxville|TN": { lat: 35.9606, lng: -83.9207 }, "Coral Gables|FL": { lat: 25.721, lng: -80.2684 },
  "Tallahassee|FL": { lat: 30.4383, lng: -84.2807 }, "Williamsburg|VA": { lat: 37.2707, lng: -76.7075 },
  "Fairfax|VA": { lat: 38.8462, lng: -77.3064 }, "Provo|UT": { lat: 40.2338, lng: -111.6585 },
  "Salt Lake City|UT": { lat: 40.7608, lng: -111.891 }, "Hampton|VA": { lat: 37.0299, lng: -76.3452 },
  "Dallas|TX": { lat: 32.7767, lng: -96.797 }, "Fort Worth|TX": { lat: 32.7555, lng: -97.3308 },
  "Waco|TX": { lat: 31.5493, lng: -97.1467 }, "San Diego|CA": { lat: 32.7157, lng: -117.1611 },
  "San Luis Obispo|CA": { lat: 35.2828, lng: -120.6596 }, "Iowa City|IA": { lat: 41.6611, lng: -91.53 },
  "Ames|IA": { lat: 42.0308, lng: -93.6319 }, "Lawrence|KS": { lat: 38.9717, lng: -95.2353 },
  "Norman|OK": { lat: 35.2226, lng: -97.4395 }, "Baton Rouge|LA": { lat: 30.4515, lng: -91.1871 },
  "Columbia|SC": { lat: 34.0007, lng: -81.0348 }, "East Lansing|MI": { lat: 42.73698, lng: -84.4839 },
  "Syracuse|NY": { lat: 43.0481, lng: -76.1474 },
};

export const NEIGHBORS: Record<string, string[]> = {
  TX: ["OK", "AR", "LA", "NM"], CA: ["OR", "NV", "AZ"], NY: ["NJ", "PA", "CT", "MA", "VT"],
  MA: ["NH", "VT", "CT", "NY", "RI"], PA: ["NY", "NJ", "DE", "MD", "WV", "OH"],
  IL: ["WI", "IN", "IA", "MO", "KY"], OH: ["PA", "WV", "KY", "IN", "MI"],
  GA: ["FL", "AL", "TN", "NC", "SC"], NC: ["VA", "TN", "SC", "GA"],
  VA: ["MD", "WV", "KY", "TN", "NC", "DC"], FL: ["GA", "AL"],
  MI: ["OH", "IN", "WI"], WA: ["OR", "ID"], OR: ["WA", "ID", "CA", "NV"],
  CO: ["WY", "NE", "KS", "OK", "NM", "UT"], AZ: ["CA", "NV", "UT", "NM"],
  TN: ["KY", "VA", "NC", "GA", "AL", "MS", "AR", "MO"], IN: ["MI", "OH", "KY", "IL"],
  WI: ["MN", "MI", "IL", "IA"], MN: ["WI", "IA", "SD", "ND"], NJ: ["NY", "PA", "DE"],
  MD: ["PA", "DE", "VA", "WV", "DC"], CT: ["NY", "MA", "RI"],
  AL: ["TN", "GA", "FL", "MS"], LA: ["TX", "AR", "MS"], MO: ["IA", "IL", "KY", "TN", "AR", "OK", "KS", "NE"],
  SC: ["NC", "GA"], KY: ["OH", "WV", "VA", "TN", "MO", "IL", "IN"], DC: ["MD", "VA"],
  UT: ["ID", "WY", "CO", "AZ", "NV"], IA: ["MN", "WI", "IL", "MO", "NE", "SD"],
  KS: ["NE", "MO", "OK", "CO"], OK: ["KS", "MO", "AR", "TX", "NM", "CO"],
  DE: ["MD", "PA", "NJ"], RI: ["MA", "CT"], ME: ["NH"], NH: ["ME", "VT", "MA"],
  VT: ["NH", "MA", "NY"], WV: ["PA", "MD", "VA", "KY", "OH"],
};

export function coordsFor(city: string, state: string): LatLng | null {
  return CITY[`${city}|${state}`] ?? STATE_CENTROID[state] ?? null;
}

export function cityCoordsByName(name: string): LatLng | null {
  const n = name.toLowerCase().trim();
  if (!n) return null;
  for (const [key, pt] of Object.entries(CITY)) {
    const city = key.split("|")[0].toLowerCase();
    if (city === n || city.includes(n) || n.includes(city)) return pt;
  }
  return null;
}

export function haversineMiles(a: LatLng, b: LatLng) {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Straight-line × 1.3 road factor ÷ 50 mph. Not live traffic. */
export function estimateDriveMinutes(miles: number) {
  return Math.round((miles * 1.3) / 50 * 60);
}

/** Urban campuses only; otherwise unavailable. Miles × 1.3 ÷ 22 mph. */
export function estimateTransitMinutes(miles: number, urban: boolean) {
  if (!urban || miles > 80) return null;
  return Math.round((miles * 1.3) / 22 * 60);
}

export function studentCoords(state: AppState): LatLng | null {
  if (state.student.latitude != null && state.student.longitude != null) {
    return { lat: state.student.latitude, lng: state.student.longitude };
  }
  if (state.student.city && state.student.state) return coordsFor(state.student.city, state.student.state);
  if (state.student.state) return STATE_CENTROID[state.student.state] ?? null;
  return null;
}

export function collegeCoords(college: College): LatLng | null {
  if (college.latitude != null && college.longitude != null) return { lat: college.latitude, lng: college.longitude };
  return coordsFor(college.city, college.state);
}

export function distanceMiles(state: AppState, college: College): number | null {
  const a = studentCoords(state);
  const b = collegeCoords(college);
  if (!a || !b) return null;
  return Math.round(haversineMiles(a, b));
}

export function maxMilesFromPreset(preset: DistancePreset, custom: string, homeState: string, collegeState: string): number | null {
  if (preset === "world") return null;
  if (preset === "us") return 4000;
  if (preset === "state") return homeState && homeState === collegeState ? 4000 : 0;
  if (preset === "custom") {
    const n = Number(custom);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return Number(preset);
}

export function maxDriveMinutes(preset: DriveTimePreset): number | null {
  if (preset === "none") return null;
  return Number(preset);
}

export function inferKind(college: Pick<College, "name" | "type" | "undergraduateEnrollment" | "religiousAffiliation">): InstitutionKind {
  if (college.type === "Community") return "Community college";
  const n = college.name.toLowerCase();
  if (/institute of technology|polytechnic|school of mines/.test(n) || n.includes("georgia institute")) return "Technical university";
  if (college.undergraduateEnrollment < 3500 && college.type === "Private") return "Liberal arts";
  if (college.undergraduateEnrollment >= 12000) return "Research university";
  return "Regional university";
}

export const TRAVEL_NOTE =
  "Travel times are estimates from straight-line distance, a 1.3 road-distance factor, and 50 mph average driving speed. They are not live traffic or transit-agency times. Verify with a mapping app before you visit.";
