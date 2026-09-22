import { scoreBg, scoreTone } from "../lib/format";

export function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium text-(--muted)">{label}</span>
        <span className={`font-semibold tabular-nums ${scoreTone(value)}`}>{value}/100</span>
      </div>
      <div className="h-1 overflow-hidden rounded-[2px] bg-(--bg-warm)">
        <div
          className={`score-fill h-full rounded-[2px] ${scoreBg(value)}`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

export function Ring({ value, size = 88 }: { value: number; size?: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <svg width={size} height={size} viewBox="0 0 88 88">
      <circle cx="44" cy="44" r={r} fill="none" stroke="var(--bg-warm)" strokeWidth="7" />
      <circle
        cx="44"
        cy="44"
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="7"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 44 44)"
      />
      <text x="44" y="49" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--ink)">
        {value}%
      </text>
    </svg>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-5 border-b border-(--line) pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-(--accent)">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="serif text-[2.35rem] leading-[1.05] text-(--ink) md:text-[3.1rem]">{title}</h1>
        {subtitle ? <p className="mt-3 max-w-2xl text-[0.98rem] leading-relaxed text-(--muted)">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
