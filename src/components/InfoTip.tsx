"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { glossaryText } from "../lib/glossary";

export function InfoTip({ term, className = "" }: { term: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const text = glossaryText(term);

  return (
    <span className={`relative inline-flex align-middle ${className}`}>
      <button
        type="button"
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-(--line) text-[10px] font-bold text-(--muted) hover:border-(--accent) hover:text-(--accent)"
        aria-label={`Info about ${term}`}
        onClick={() => setOpen((v) => !v)}
      >
        <Info size={10} />
      </button>
      {open ? (
        <>
          <button type="button" className="fixed inset-0 z-40" aria-label="Close" onClick={() => setOpen(false)} />
          <span
            role="tooltip"
            className="absolute left-0 top-6 z-50 w-64 rounded-xl border border-(--line) bg-(--surface) p-3 text-left text-xs leading-relaxed text-(--muted) shadow-lg"
          >
            <span className="mb-1 block font-semibold text-(--ink)">{term}</span>
            {text}
          </span>
        </>
      ) : null}
    </span>
  );
}

export function LabelWithInfo({ label, term }: { label: string; term?: string }) {
  return (
    <span className="inline-flex items-center">
      {label}
      <InfoTip term={term ?? label} />
    </span>
  );
}
