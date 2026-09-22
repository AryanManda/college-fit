"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "../../../lib/store";
import { PageHeader } from "../../../components/ui";
import { answerCareerQuestion } from "../../../lib/pathway";
import { topCareers } from "../../../lib/career-matching";
import { CAREERS } from "../../../data/careers";
import { CareerFlowNav, CareerGoalsEditor } from "../../../components/CareerGoalsEditor";

const PROMPTS = [
  "What does a financial analyst do?",
  "Would I be good at engineering?",
  "What careers make over $100k?",
  "What careers let me travel?",
  "What degree do I need to become a lawyer?",
  "What careers combine business and the outdoors?",
];

export default function AskCareerPage() {
  const { state, setState } = useStore();
  const [q, setQ] = useState(PROMPTS[0]);
  const [a, setA] = useState("");
  const top = topCareers(state, 3);

  const ask = () => setA(answerCareerQuestion(q, state));

  const addFromAnswer = (id: string) => {
    setState((p) => ({
      ...p,
      savedCareerIds: p.savedCareerIds.includes(id) ? p.savedCareerIds : [...p.savedCareerIds, id],
      careerAssessment: { ...p.careerAssessment, primaryCareerId: id },
    }));
  };

  return (
    <div>
      <PageHeader title="Ask about a career" subtitle="Answers use your profile and assessment — not generic career pages." />
      <CareerFlowNav />
      <CareerGoalsEditor compact />
      <div className="card mb-5 p-5">
        <div className="flex flex-wrap gap-2">
          {PROMPTS.map((p) => (
            <button key={p} className="btn btn-ghost" onClick={() => { setQ(p); setA(answerCareerQuestion(p, state)); }}>{p}</button>
          ))}
        </div>
        <input className="field mt-3" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn btn-primary mt-2" onClick={ask}>Ask</button>
        {a ? <p className="mt-3 text-sm text-(--muted)">{a}</p> : null}
      </div>
      <section className="card p-5">
        <h2 className="font-semibold">Add to my possibilities</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {top.map(({ career }) => (
            <button key={career.id} className="btn btn-ghost" onClick={() => addFromAnswer(career.id)}>{career.title}</button>
          ))}
          {CAREERS.slice(0, 6).map((c) => (
            <button key={c.id} className="btn btn-ghost" onClick={() => addFromAnswer(c.id)}>{c.shortTitle}</button>
          ))}
        </div>
        <Link href="/career/saved" className="btn btn-primary mt-3">View saved careers</Link>
      </section>
    </div>
  );
}
