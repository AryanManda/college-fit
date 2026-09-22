export function money(n?: number | null) {
  if (n === undefined || n === null) return "Unavailable";
  return `$${Math.round(n).toLocaleString()}`;
}

export function pct(n?: number | null, digits = 1) {
  if (n === undefined || n === null) return "Unavailable";
  return `${(n * 100).toFixed(digits)}%`;
}

export function unavailable(v: unknown, fallback = "Unavailable") {
  if (v === undefined || v === null || v === "") return fallback;
  return String(v);
}

export function scoreTone(score: number) {
  if (score >= 80) return "text-(--score-high)";
  if (score >= 60) return "text-(--score-mid)";
  return "text-(--score-low)";
}

export function scoreBg(score: number) {
  if (score >= 80) return "bg-(--score-high)";
  if (score >= 60) return "bg-(--score-mid)";
  return "bg-(--score-low)";
}
