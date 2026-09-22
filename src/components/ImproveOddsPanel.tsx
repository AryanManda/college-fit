"use client";

import Link from "next/link";
import type { ImproveOddsTip } from "../lib/discovery";

export function ImproveOddsPanel({
  schoolName,
  tips,
}: {
  schoolName: string;
  tips: ImproveOddsTip[];
}) {
  const critical = tips.filter((t) => t.priority === "critical");
  const rest = tips.filter((t) => t.priority !== "critical");

  return (
    <section className="mb-5 overflow-hidden border-2 border-(--danger) bg-[color-mix(in_srgb,var(--danger)_8%,white)] p-5 shadow-[inset_4px_0_0_var(--danger)]">
      <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-(--danger)">Priority · Improve your odds</div>
      <h2 className="serif mt-1 text-3xl leading-tight text-(--ink)">
        How to strengthen your case at {schoolName}
      </h2>
      <p className="mt-2 max-w-3xl text-sm font-medium text-(--ink)/80">
        These are the highest-leverage gaps between your profile and this school&apos;s published admitted-student ranges.
        Closing a gap improves your comparison — it does not guarantee admission.
      </p>

      {critical.length ? (
        <div className="mt-4 space-y-3">
          {critical.map((t) => (
            <TipCard key={t.title} tip={t} emphasize />
          ))}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {rest.map((t) => (
          <TipCard key={t.title} tip={t} />
        ))}
      </div>
    </section>
  );
}

function TipCard({ tip, emphasize }: { tip: ImproveOddsTip; emphasize?: boolean }) {
  return (
    <div
      className={`rounded-[var(--radius)] border p-4 ${
        emphasize
          ? "border-(--danger) bg-white"
          : "border-(--line) bg-white/80"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`text-[10px] font-bold uppercase tracking-wider ${
            tip.priority === "critical"
              ? "text-(--danger)"
              : tip.priority === "high"
                ? "text-(--accent-2)"
                : "text-(--muted)"
          }`}
        >
          {tip.priority}
        </span>
        {tip.metric ? (
          <span className="text-xs text-(--muted)">
            Now {tip.metric.current} → aim {tip.metric.target}
          </span>
        ) : null}
      </div>
      <div className="mt-1 text-lg font-semibold leading-snug">{tip.title}</div>
      <p className="mt-2 text-sm text-(--ink)/85">{tip.detail}</p>
      <p className="mt-2 text-xs text-(--muted)">{tip.whyItMatters}</p>
      {tip.href ? (
        <Link href={tip.href} className="btn btn-primary mt-3">
          {tip.cta ?? "Update profile"}
        </Link>
      ) : null}
    </div>
  );
}
