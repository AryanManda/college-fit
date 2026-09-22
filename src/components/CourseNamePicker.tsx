"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { courseCatalogForLevel } from "../data/ap-ib-courses";

type Props = {
  level: string;
  value: string;
  onChange: (name: string) => void;
  placeholder?: string;
};

export function CourseNamePicker({ level, value, onChange, placeholder }: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const catalog = courseCatalogForLevel(level);
  const locked = catalog.length > 0;

  const options = useMemo(() => {
    if (!locked) return [];
    const q = value.trim().toLowerCase();
    const list = !q
      ? [...catalog]
      : catalog.filter((c) => c.toLowerCase().includes(q));
    return list.slice(0, 40);
  }, [catalog, locked, value]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!locked) {
    return (
      <input
        className="field"
        placeholder={placeholder ?? "Course name"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        className="field"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder={placeholder ?? `Search ${level} courses…`}
        value={value}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlight(0);
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
            onChange(options[highlight]);
            setOpen(false);
          } else if (e.key === "Escape") setOpen(false);
        }}
      />
      {open ? (
        <div
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-[var(--radius-sm)] border border-(--line) bg-(--surface) shadow-lg"
        >
          {options.length === 0 ? (
            <p className="px-3 py-2 text-sm text-(--muted)">No matching {level} course. Pick from the official list.</p>
          ) : (
            options.map((name, i) => (
              <button
                key={name}
                type="button"
                role="option"
                aria-selected={i === highlight}
                className={`block w-full px-3 py-2 text-left text-sm ${
                  i === highlight ? "bg-(--accent-soft)" : "hover:bg-(--accent-soft)/60"
                }`}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                }}
              >
                {name}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
