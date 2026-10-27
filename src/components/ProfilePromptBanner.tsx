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
    <div className="mb-5 rounded-[var(--radius)] border border-(--danger)/25 bg-(--banner) p-4">
      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-(--danger)">Profile incomplete</div>
      <div className="mt-1 font-semibold text-(--ink)">
        {missing.length
          ? `Fill in ${missing.slice(0, 3).join(", ")}${missing.length > 3 ? ` +${missing.length - 3} more` : ""} for accurate odds and matches.`
          : "A few more details will sharpen your recommendations."}
      </div>
      <ul className="mt-2 space-y-1 text-sm">
        {actions.map((a) => (
          <li key={a.title}>
            <Link href={a.href} className="font-semibold text-(--danger) underline-offset-2 hover:underline">
              {a.title}
            </Link>
            <span className="text-(--muted)"> — {a.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
