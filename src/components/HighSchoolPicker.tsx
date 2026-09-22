"use client";

import { useEffect, useId, useRef, useState } from "react";

export type HighSchoolChoice = {
  id: string;
  name: string;
  city: string;
  state: string;
  zip: string;
  latitude: number | null;
  longitude: number | null;
};

type Props = {
  stateCode: string;
  value: string;
  onChange: (name: string) => void;
  onSelectSchool?: (school: HighSchoolChoice) => void;
  className?: string;
};

export function HighSchoolPicker({ stateCode, value, onChange, onSelectSchool, className }: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [options, setOptions] = useState<HighSchoolChoice[]>([]);
  const [totalInState, setTotalInState] = useState(0);
  const [highlight, setHighlight] = useState(0);

  const state = stateCode.trim().toUpperCase();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!state) {
      setOptions([]);
      setTotalInState(0);
      setError("");
      return;
    }
    if (!open) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ state, limit: "50" });
        if (value.trim()) params.set("q", value.trim());
        const res = await fetch(`/api/high-schools?${params}`, { signal: controller.signal });
        const data = (await res.json()) as {
          schools?: HighSchoolChoice[];
          totalInState?: number;
          error?: string;
        };
        if (!res.ok) throw new Error(data.error || "Could not load schools");
        setOptions(data.schools ?? []);
        setTotalInState(data.totalInState ?? 0);
        setHighlight(0);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setOptions([]);
        setError(err instanceof Error ? err.message : "Could not load schools");
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [state, value, open]);

  const pick = (school: HighSchoolChoice) => {
    onChange(school.name);
    onSelectSchool?.(school);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      <input
        className="field"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        value={value}
        placeholder={state ? "Search high schools in your state…" : "Select a state first"}
        disabled={!state}
        onFocus={() => state && setOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (!open || !options.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, options.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter" && options[highlight]) {
            e.preventDefault();
            pick(options[highlight]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && state ? (
        <div
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-[var(--radius-sm)] border border-(--line) bg-(--surface) shadow-lg"
        >
          {loading ? <p className="px-3 py-2 text-sm text-(--muted)">Loading schools…</p> : null}
          {error ? <p className="px-3 py-2 text-sm text-(--danger)">{error}</p> : null}
          {!loading && !error && options.length === 0 ? (
            <p className="px-3 py-2 text-sm text-(--muted)">
              No matches. Keep typing a private or unlisted school name.
            </p>
          ) : null}
          {options.map((school, i) => (
            <button
              key={school.id}
              type="button"
              role="option"
              aria-selected={i === highlight}
              className={`flex w-full flex-col items-start px-3 py-2 text-left text-sm ${
                i === highlight ? "bg-(--accent-soft)" : "hover:bg-(--accent-soft)/60"
              }`}
              onMouseEnter={() => setHighlight(i)}
              onClick={() => pick(school)}
            >
              <span className="font-medium text-(--ink)">{school.name}</span>
              <span className="text-xs text-(--muted)">
                {school.city}, {school.state}
                {school.zip ? ` · ${school.zip}` : ""}
              </span>
            </button>
          ))}
          {!loading && totalInState > 0 ? (
            <p className="border-t border-(--line) px-3 py-2 text-[11px] text-(--muted)">
              {totalInState.toLocaleString()} public high schools in {state}. Private schools can be typed in.
            </p>
          ) : null}
        </div>
      ) : null}
      {!state ? (
        <p className="mt-1 text-xs text-(--muted)">Choose your state so we can load that state’s high schools.</p>
      ) : null}
    </div>
  );
}
