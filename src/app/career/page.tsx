"use client";

import Link from "next/link";
import { useStore } from "../../lib/store";
import { PageHeader } from "../../components/ui";
import { hasCareerGoal, topCareers } from "../../lib/career-matching";
import { careerGoalLabel } from "../../lib/career-goal";
import { emptyCareerAssessment } from "../../lib/defaults";
import { CareerFlowNav } from "../../components/CareerGoalsEditor";
import { KnowYourPathCard, NotSureYetCard } from "../../components/KnowYourPath";
import { useRouter } from "next/navigation";

export default function CareerHubPage() {
  const { state, setState } = useStore();
  const router = useRouter();
  const hasGoal = hasCareerGoal(state);
  const tookAssessment = state.careerAssessment.completed;
  const top = topCareers(state, 3);
  const label = careerGoalLabel(state);

  return (
    <div>
      <PageHeader
        title="Career"
        subtitle={
          hasGoal
            ? `You're aiming for ${label || "your goal"}. Change it anytime, or explore alternatives below.`
            : "Already know your career? Enter it. Not sure? Take the assessment."
        }
      />
      <CareerFlowNav />

      <section className="card mb-6 p-5">
        <h2 className="serif text-2xl">Career &amp; Assessment Settings</h2>
        <div className="mt-4 grid gap-4">
          <div>
            <p className="text-sm text-(--muted)">
              Not feeling your current career match? Browse the full list of career options and pick a new path.
            </p>
            <Link href="/career/matches" className="btn btn-primary mt-2">Change My Career</Link>
          </div>
          <div>
            <p className="text-sm text-(--muted)">
              Have your interests changed? Start fresh and take the quiz again to update your recommended schools and careers.
            </p>
            <button
              type="button"
              className="btn btn-ghost mt-2"
              onClick={() => {
                setState((p) => ({ ...p, careerAssessment: emptyCareerAssessment() }));
                router.push("/career/assessment");
              }}
            >
              Redo the Assessment
            </button>
          </div>
          <div>
            <p className="text-sm text-(--muted)">
              Looking for a different type of test? Switch to a new assessment style to get different insights into your personality and goals.
            </p>
            <Link href="/career/assessment?style=alternate" className="btn btn-ghost mt-2">
              Change the Assessment
            </Link>
          </div>
        </div>
      </section>

      <KnowYourPathCard afterSaveHref="/path" />

      {!hasGoal ? <NotSureYetCard /> : null}

      {hasGoal ? (
        <section className="mb-8 border border-(--line) bg-white/70 p-5">
          <h2 className="serif text-2xl">Your path is set</h2>
          <p className="mt-1 text-sm text-(--muted)">
            Assessment is optional for you. Jump to colleges that support this goal, or explore other careers if you want ideas.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/path" className="btn btn-primary">Open My Path</Link>
            <Link href="/colleges/matches" className="btn btn-ghost">See college matches</Link>
            {!tookAssessment ? (
              <Link href="/career/assessment" className="btn btn-ghost">Optional: take assessment for more ideas</Link>
            ) : (
              <Link href="/career/matches" className="btn btn-ghost">View assessment matches</Link>
            )}
          </div>
        </section>
      ) : null}

      <div className="mb-10 divide-y divide-(--line) border-y border-(--line)">
        {(hasGoal
          ? [
              { href: "/path", title: "My Path", blurb: "Edit career, majors, and college roadmap." },
              { href: "/colleges/matches", title: "College matches", blurb: "Schools that fit your goal and academics." },
              { href: "/career/ask", title: "Ask about a career", blurb: "Quick questions about roles and degrees." },
              { href: "/career/assessment", title: "Career assessment (optional)", blurb: "Only if you want alternate suggestions." },
              { href: "/career/matches", title: "Browse other careers", blurb: "Compare alternatives without losing your goal." },
            ]
          : [
              { href: "/career/assessment", title: "Career assessment", blurb: "Best if you are unsure what to pursue." },
              { href: "/career/matches", title: "Career matches", blurb: "Ranked ideas after (or without) the quiz." },
              { href: "/career/ask", title: "Ask about a career", blurb: "Natural-language career questions." },
              { href: "/path", title: "My Path", blurb: "Or type a goal directly and skip the quiz." },
            ]
        ).map((l) => (
          <Link key={l.href} href={l.href} className="group flex items-baseline justify-between gap-4 py-4 transition hover:bg-white/60">
            <div>
              <div className="font-semibold group-hover:text-(--accent)">{l.title}</div>
              <p className="mt-1 text-sm text-(--muted)">{l.blurb}</p>
            </div>
            <span className="text-(--muted) transition group-hover:translate-x-0.5 group-hover:text-(--accent)">→</span>
          </Link>
        ))}
      </div>

      {tookAssessment && top.length ? (
        <section>
          <h2 className="serif text-3xl">Assessment matches</h2>
          <div className="mt-3 divide-y divide-(--line) border-y border-(--line)">
            {top.map(({ career, match }, i) => (
              <Link key={career.id} href={`/career/${career.id}`} className="flex items-center justify-between py-3 transition hover:bg-white/50">
                <span><span className="text-(--muted)">{i + 1}.</span> {career.title}</span>
                <span className="font-semibold tabular-nums text-(--accent)">{match.fit}%</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
