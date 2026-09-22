import type { AppState, College } from "./types";
import { COLLEGES } from "../data/colleges";
import { getCollege } from "../data/colleges";
import { matchCollege, recommendationScore, studentAcademicStrength } from "./matching";

/** Show unique schools only (by id, then by normalized name). */
export function uniqueColleges(list: College[] = COLLEGES): College[] {
  const byId = new Map<string, College>();
  const byName = new Set<string>();
  for (const c of list) {
    if (byId.has(c.id)) continue;
    const nameKey = c.name.trim().toLowerCase();
    if (byName.has(nameKey)) continue;
    byId.set(c.id, c);
    byName.add(nameKey);
  }
  return [...byId.values()];
}

export function schoolDescription(college: College): string {
  const bits = [
    `${college.type} · ${college.campusSetting} · ${college.campus.sizeBand}`,
    college.academicStrengths.slice(0, 2).join(", ") || college.majors.slice(0, 2).join(", "),
    college.city && college.state ? `${college.city}, ${college.state}` : null,
  ].filter(Boolean);
  return bits.join(" — ");
}

/** Boost feed ranking when student liked schools sharing traits. */
export function likedTraitBoost(state: AppState, college: College): number {
  const liked = state.savedCollegeIds
    .map((id) => getCollege(id))
    .filter((c): c is College => Boolean(c));
  if (!liked.length) return 0;
  let score = 0;
  for (const s of liked) {
    if (s.id === college.id) continue;
    if (s.campusSetting === college.campusSetting) score += 6;
    if (s.campus.sizeBand === college.campus.sizeBand) score += 5;
    if (s.region === college.region) score += 4;
    if (s.state === college.state) score += 5;
    if (s.type === college.type) score += 3;
    if (s.institutionKind === college.institutionKind) score += 4;
    const majorOverlap = s.majors.filter((m) =>
      college.majors.some((x) => x.toLowerCase() === m.toLowerCase()),
    ).length;
    score += Math.min(6, majorOverlap * 2);
  }
  return Math.min(28, score);
}

export function collegesFeed(state: AppState): College[] {
  const banished = new Set(state.banishedCollegeIds ?? []);
  const strength = studentAcademicStrength(state);
  return uniqueColleges()
    .filter((c) => !banished.has(c.id))
    .map((c) => {
      const match = matchCollege(state, c);
      const base = recommendationScore(state, match, c, strength);
      const boost = likedTraitBoost(state, c);
      // Liked schools still appear but sink slightly so new similar picks surface
      const savedPenalty = state.savedCollegeIds.includes(c.id) ? 8 : 0;
      return { c, score: base + boost - savedPenalty };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.c);
}

export function saveAndLikeCollege(state: AppState, id: string): AppState {
  const banished = (state.banishedCollegeIds ?? []).filter((x) => x !== id);
  const saved = state.savedCollegeIds.includes(id)
    ? state.savedCollegeIds
    : [...state.savedCollegeIds, id];
  return { ...state, savedCollegeIds: saved, banishedCollegeIds: banished };
}

export function banishCollege(state: AppState, id: string): AppState {
  const banished = state.banishedCollegeIds ?? [];
  return {
    ...state,
    savedCollegeIds: state.savedCollegeIds.filter((x) => x !== id),
    banishedCollegeIds: banished.includes(id) ? banished : [...banished, id],
  };
}

export function restoreBanishedCollege(state: AppState, id: string): AppState {
  return {
    ...state,
    banishedCollegeIds: (state.banishedCollegeIds ?? []).filter((x) => x !== id),
  };
}
