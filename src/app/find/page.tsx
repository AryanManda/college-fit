"use client";

import Link from "next/link";
import { getCollege } from "../../data/colleges";
import { MATCH_DISCLAIMER } from "../../lib/constants";
import { recommendedList, similarMoreAchievable } from "../../lib/discovery";
import { useStore } from "../../lib/store";
import { MatchCard } from "../../components/Cards";
import { PageHeader } from "../../components/ui";
import { CollegesTopTabs } from "../../components/CollegesTopTabs";
import { NaturalSearch } from "../../components/NaturalSearch";
import { ProfilePromptBanner } from "../../components/ProfilePromptBanner";
import type { AdmissionCategory } from "../../lib/types";

const GROUPS: { key: AdmissionCategory; title: string; blurb: string }[] = [
  { key: "Likely", title: "3–5 Likely schools", blurb: "Strong chance of admission relative to published ranges, plus a reason to attend." },
  { key: "Target", title: "5–8 Target schools", blurb: "Reasonably competitive. Admission remains uncertain." },
  { key: "Reach", title: "2–4 Reach schools", blurb: "Difficult but potentially worth applying to if you strongly prefer them." },
  { key: "High Reach", title: "2–3 High Reach schools", blurb: "Particularly difficult relative to your profile. Optional, not the core of your list." },
];

export default function FindPage() {
  const { state } = useStore();
  const rec = recommendedList(state);
  const map = { Likely: rec.likely, Target: rec.target, Reach: rec.reach, "High Reach": rec.highReach };

  return (
    <div>
      <PageHeader
        title="Find my colleges"
        subtitle="Here are schools where you have a realistic path to admission and a strong reason to attend. Prestige is not the ranking."
      />
      <CollegesTopTabs />
      <p className="mb-5 text-sm text-(--muted)">
        We found {rec.inState.length} strong in-state matches and {rec.outState.length} strong out-of-state matches.
        {state.student.state
          ? ` Your home state (${state.student.state}) is prioritized in ranking.`
          : " Set your home state in Profile to prioritize in-state schools."}
      </p>
      <ProfilePromptBanner dense />
      <NaturalSearch />
      {GROUPS.map((g) => (
        <section key={g.key} className="mb-8">
          <h2 className="serif text-3xl">{g.title}</h2>
          <p className="mb-3 text-sm text-(--muted)">{g.blurb}</p>
          <div className="grid gap-4 md:grid-cols-2">
            {map[g.key].map((m) => {
              const college = getCollege(m.collegeId);
              if (!college) return null;
              return (
                <div key={m.collegeId}>
                  {m.outOfRange ? (
                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-(--danger)">
                      Out of range — not a reasonable primary choice
                    </div>
                  ) : null}
                  <MatchCard college={college} match={m} />
                </div>
              );
            })}
          </div>
          {g.key === "High Reach" && map[g.key][0] ? (
            <HighReachNote id={map[g.key][0].collegeId} />
          ) : null}
        </section>
      ))}
      <p className="text-xs text-(--muted)">{MATCH_DISCLAIMER}</p>
    </div>
  );
}

function HighReachNote({ id }: { id: string }) {
  const { state } = useStore();
  const college = getCollege(id);
  if (!college) return null;
  const alts = similarMoreAchievable(state, college, 3);
  if (!alts.length) return null;
  return (
    <div className="card mt-4 p-4 text-sm">
      <div className="font-semibold">Similar schools you have a stronger chance of getting into</div>
      <p className="mt-1 text-(--muted)">
        {college.shortName} may be an excellent academic fit, but your admissions profile is less competitive there. These campuses share size, type, or program overlap with a better admissions alignment.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {alts.map((a) => (
          <Link key={a.college.id} href={`/colleges/${a.college.id}`} className="btn btn-ghost">
            {a.college.shortName} · {a.match.category}
          </Link>
        ))}
      </div>
    </div>
  );
}
