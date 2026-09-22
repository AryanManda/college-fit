"use client";

import Link from "next/link";
import { missingCriticalFields, recommendedActions } from "../lib/completion";
import { useStore } from "../lib/store";

export function ProfilePromptBanner({ dense = false }: { dense?: boolean }) {
  const { state } = useStore();
  const missing = missingCriticalFields(state);
  const actions = recommendedActions(state).slice(0, dense ? 2 : 4);
  if (!missing.length && !actions.length) return null;

  return (
    <div className="mb-5 border border-(--accent-2) bg-[color-mix(in_srgb,var(--accent-2)_10%,white)] p-4">
      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-(--accent-2)">Profile incomplete</div>
      <div className="mt-1 font-semibold">
        {missing.length
          ? `Fill in ${missing.slice(0, 3).join(", ")}${missing.length > 3 ? ` +${missing.length - 3} more` : ""} for accurate odds and matches.`
          : "A few more details will sharpen your recommendations."}
      </div>
      <ul className="mt-2 space-y-1 text-sm">
        {actions.map((a) => (
          <li key={a.title}>
            <Link href={a.href} className="font-semibold text-(--accent) underline-offset-2 hover:underline">
              {a.title}
            </Link>
            <span className="text-(--muted)"> — {a.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
