import type { AppState } from "./types";

/** When a student sets home state, prioritize in-state schools and sync geo prefs. */
export function withHomeState(state: AppState, homeState: string): AppState {
  const trimmed = homeState.trim();
  const geo = state.preferences.geographic;
  const preferred = trimmed
    ? [...new Set([trimmed, ...geo.preferredStates.filter((s) => s !== trimmed)])]
    : geo.preferredStates;

  const shouldBiasLocal =
    trimmed &&
    (geo.attendanceScope === "us" || geo.attendanceScope === "world") &&
    geo.preferredStates.length === 0;

  return {
    ...state,
    student: { ...state.student, state: trimmed },
    preferences: {
      ...state.preferences,
      geographic: {
        ...geo,
        preferredStates: preferred,
        attendanceScope: shouldBiasLocal ? "primarily-state" : geo.attendanceScope,
        distancePreset:
          shouldBiasLocal && (geo.distancePreset === "us" || geo.distancePreset === "world")
            ? "state"
            : geo.distancePreset,
      },
    },
  };
}

export function syncResidencePatch(
  state: AppState,
  patch: Partial<AppState["student"]>,
): AppState {
  const nextStudent = { ...state.student, ...patch };
  if (patch.state !== undefined && patch.state !== state.student.state) {
    return withHomeState({ ...state, student: nextStudent }, String(patch.state ?? ""));
  }
  return { ...state, student: nextStudent };
}
