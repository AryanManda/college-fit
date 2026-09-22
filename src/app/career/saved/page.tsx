"use client";

import Link from "next/link";
import { getCareer } from "../../../data/careers";
import { useStore } from "../../../lib/store";
import { PageHeader } from "../../../components/ui";
import { matchCareer } from "../../../lib/career-matching";
import { CareerFlowNav, CareerGoalsEditor } from "../../../components/CareerGoalsEditor";

export default function SavedCareersPage() {
  const { state } = useStore();
  const items = state.savedCareerIds.map((id) => getCareer(id)).filter(Boolean);

  return (
    <div>
      <PageHeader title="Saved careers" subtitle="Careers you're exploring as part of your pathway." />
      <CareerFlowNav />
      <CareerGoalsEditor compact />
      {!items.length ? (
        <div className="card p-6 text-(--muted)">
          No saved careers yet. <Link href="/career/matches" className="font-semibold text-(--accent)">Browse matches</Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((c) => {
            const m = matchCareer(state, c!);
            return (
              <Link key={c!.id} href={`/career/${c!.id}`} className="card block p-4 hover:border-(--accent)">
                <div className="font-semibold">{c!.title}</div>
                <div className="text-sm text-(--muted)">Fit {m.fit}%</div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
