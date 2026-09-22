"use client";

import { useState } from "react";
import { getCollege } from "../data/colleges";
import { runNaturalSearch } from "../lib/discovery";
import { useStore } from "../lib/store";
import { MatchCard } from "./Cards";
import type { NlFilters } from "../lib/discovery";

function summarize(f: NlFilters) {
  const bits = [
    f.size,
    f.type,
    f.kind,
    f.major,
    f.hours ? `within ${f.hours} hours${f.city ? ` of ${f.city}` : ""}` : null,
    f.miles ? `${f.miles} miles` : null,
    f.maxCost ? `under $${f.maxCost.toLocaleString()}` : null,
    f.likelyOnly ? "Likely / Target admissions match" : null,
    f.similarTo ? `similar to ${f.similarTo}` : null,
    f.nearHome ? "near home" : null,
  ].filter(Boolean);
  return bits.length ? bits.join(" · ") : "plain-language search of the catalog";
}

export function NaturalSearch({ placeholder }: { placeholder?: string }) {
  const { state } = useStore();
  const [q, setQ] = useState("");
  const [submitted, setSubmitted] = useState("");
  const run = submitted.trim() ? runNaturalSearch(state, submitted) : null;

  return (
    <div className="card mb-5 p-5">
      <h2 className="serif text-2xl">Describe the colleges you want</h2>
      <p className="mt-1 text-sm text-(--muted)">
        Example: Find me a large public university within 3 hours of Houston with a strong business program where I have a good chance of getting in and tuition under $35,000.
      </p>
      <form
        className="mt-3 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(q);
        }}
      >
        <input
          className="field min-w-60 flex-1"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder ?? "Find schools similar to Texas A&M but easier for me to get into."}
        />
        <button className="btn btn-primary" type="submit">
          Search
        </button>
      </form>
      {run ? (
        <>
          <p className="mt-3 text-xs text-(--muted)">Converted into filters: {summarize(run.filters)}</p>
          {run.results.length ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {run.results.map((m) => {
                const college = getCollege(m.collegeId);
                if (!college) return null;
                return <MatchCard key={m.collegeId} college={college} match={m} />;
              })}
            </div>
          ) : (
            <p className="mt-3 text-sm text-(--muted)">No catalog matches for that request. Try fewer constraints.</p>
          )}
        </>
      ) : null}
    </div>
  );
}
