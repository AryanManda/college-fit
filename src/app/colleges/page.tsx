"use client";

import { useMemo, useState } from "react";
import { useStore } from "../../lib/store";
import { matchCollege } from "../../lib/matching";
import {
  banishCollege,
  collegesFeed,
  saveAndLikeCollege,
} from "../../lib/college-feed";
import { FeedSchoolCard } from "../../components/FeedSchoolCard";
import { CollegesTopTabs } from "../../components/CollegesTopTabs";
import { PageHeader } from "../../components/ui";
import { NaturalSearch } from "../../components/NaturalSearch";

export default function CollegesFeedPage() {
  const { state, setState } = useStore();
  const [toast, setToast] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  const feed = useMemo(() => collegesFeed(state), [state]);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  return (
    <div>
      <PageHeader
        title="Colleges"
        subtitle="Browse unique schools for you. Save ones you like to get similar recommendations — or mark Not Interested to hide them from your feed."
      />
      <CollegesTopTabs />
      {toast ? (
        <div className="card mb-4 border-(--accent) bg-(--accent-soft) p-3 text-sm font-semibold text-(--accent)">
          {toast}
        </div>
      ) : null}
      <div className="mb-4">
        <button type="button" className="btn btn-ghost" onClick={() => setShowSearch((v) => !v)}>
          {showSearch ? "Hide search" : "Search schools"}
        </button>
      </div>
      {showSearch ? <NaturalSearch /> : null}
      <p className="mb-3 text-sm text-(--muted)">{feed.length} unique schools · duplicates removed</p>
      <div className="grid gap-4">
        {feed.map((c) => (
          <FeedSchoolCard
            key={c.id}
            college={c}
            match={matchCollege(state, c)}
            saved={state.savedCollegeIds.includes(c.id)}
            onSaveLike={() => {
              setState((s) => saveAndLikeCollege(s, c.id));
              flash(`Liked ${c.shortName || c.name}. We'll recommend more schools like this.`);
            }}
            onNotInterested={() => {
              setState((s) => banishCollege(s, c.id));
              flash(`${c.shortName || c.name} hidden from recommendations.`);
            }}
          />
        ))}
      </div>
    </div>
  );
}
