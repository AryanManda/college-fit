"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "../../lib/store";
import { matchCollege } from "../../lib/matching";
import {
  banishCollege,
  collegesFeed,
  feedRangeMeta,
  saveAndLikeCollege,
} from "../../lib/college-feed";
import { collegeFeedUnlock } from "../../lib/completion";
import { rememberCollege } from "../../data/colleges";
import { FeedSchoolCard } from "../../components/FeedSchoolCard";
import { CollegesTopTabs } from "../../components/CollegesTopTabs";
import { PageHeader } from "../../components/ui";
import { NaturalSearch } from "../../components/NaturalSearch";
import type { College } from "../../lib/types";

export default function CollegesFeedPage() {
  const { state, setState } = useStore();
  const [toast, setToast] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [remote, setRemote] = useState<College[]>([]);
  const [loadingRemote, setLoadingRemote] = useState(false);
  const meta = feedRangeMeta(state);
  const unlock = collegeFeedUnlock(state);

  useEffect(() => {
    if (unlock.level === "locked" || !meta.active || !state.student.state) {
      setRemote([]);
      return;
    }
    let cancelled = false;
    setLoadingRemote(true);
    const params = new URLSearchParams({
      state: state.student.state,
      limit: unlock.level === "starter" ? "15" : "40",
    });
    fetch(`/api/colleges/search?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        const schools = (data?.schools as College[] | undefined) ?? [];
        schools.forEach(rememberCollege);
        setRemote(schools);
      })
      .catch(() => {
        if (!cancelled) setRemote([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingRemote(false);
      });
    return () => {
      cancelled = true;
    };
  }, [meta.active, state.student.state, unlock.level]);

  const feed = useMemo(() => collegesFeed(state, remote), [state, remote]);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  return (
    <div>
      <PageHeader
        title="Colleges"
        subtitle="Recommendations unlock as your profile fills in — incomplete profiles see none until basics are set."
      />
      <CollegesTopTabs />
      {toast ? (
        <div className="card mb-4 border-(--accent) bg-(--accent-soft) p-3 text-sm font-semibold text-(--accent)">
          {toast}
        </div>
      ) : null}

      <div className="card mb-4 border-(--accent)/25 bg-(--accent-soft)/50 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-(--muted)">
              Profile {unlock.percent}% · {unlock.level === "locked" ? "locked" : unlock.level} feed
            </div>
            <h2 className="serif mt-1 text-2xl text-(--ink)">{unlock.title}</h2>
            <p className="mt-2 max-w-2xl text-sm text-(--muted)">{unlock.message}</p>
            {meta.active && unlock.level !== "locked" ? (
              <p className="mt-2 text-sm text-(--accent)">{meta.label}</p>
            ) : null}
          </div>
          <Link href={unlock.ctaHref} className="btn btn-primary shrink-0">
            {unlock.ctaLabel}
          </Link>
        </div>
      </div>

      {unlock.level === "locked" ? (
        <div className="card p-8 text-center">
          <p className="text-(--muted)">
            No colleges yet — complete your profile to unlock matches tailored to your preferences.
          </p>
          <Link href="/profile" className="btn btn-primary mt-4">
            Complete profile
          </Link>
          <Link href="/onboarding" className="btn btn-ghost mt-3 ml-2">
            Start onboarding
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <button type="button" className="btn btn-ghost" onClick={() => setShowSearch((v) => !v)}>
              {showSearch ? "Hide search" : "Search schools"}
            </button>
          </div>
          {showSearch ? <NaturalSearch /> : null}
          <p className="mb-3 text-sm text-(--muted)">
            {loadingRemote ? "Loading more schools in your area… · " : null}
            {feed.length} school{feed.length === 1 ? "" : "s"}
            {Number.isFinite(unlock.limit)
              ? ` (up to ${unlock.limit} at ${unlock.percent}% complete)`
              : " · full feed"}
            {meta.active ? " · in your range" : ""}
          </p>
          {!feed.length ? (
            <div className="card p-5 text-sm text-(--muted)">
              No schools match your current preferences and range. Widen distance in Profile → Location, or
              add more preference details.
            </div>
          ) : (
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
          )}
        </>
      )}
    </div>
  );
}
