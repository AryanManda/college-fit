"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { APP_NAME } from "../lib/constants";
import { useStore } from "../lib/store";

const AUDIENCES = ["School districts", "ISDs", "Counselors", "College & career centers", "Schools and colleges"];

const STEPS = [
  {
    step: "01",
    title: "A direction with their name on it",
    detail:
      "Interests, strengths, and the kind of day they want to live. A student can say what they are aiming at before the room starts arguing about a famous campus.",
  },
  {
    step: "02",
    title: "A plan that can leave the office",
    detail:
      "Colleges ordered by whether they can get in, then by how close they are. Next steps for this year. A resume that tells the same story they just chose.",
  },
];

export function LandingPage() {
  const router = useRouter();
  const { access, enterSample, hydrated } = useStore();

  const openSample = () => {
    enterSample();
    router.push("/home");
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 py-6 md:px-6 md:py-10">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="serif text-[1.85rem] leading-none tracking-tight text-(--ink)">{APP_NAME}</div>
          <p className="mt-2 text-[11px] font-semibold tracking-[0.14em] text-(--muted) uppercase">
            An introduction
          </p>
        </div>
        {hydrated && access ? (
          <Link href="/home" className="btn btn-ghost shrink-0">
            {access.mode === "full" ? "Open the workspace" : "Continue sample"}
          </Link>
        ) : null}
      </header>

      <main className="py-8 md:py-14">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-(--accent)">
          For the student ready to choose
        </p>
        <h1 className="serif mt-4 max-w-4xl text-[2.7rem] leading-[0.98] text-(--ink) md:text-[4.4rem]">
          Find the future that fits.
          <span className="mt-1 block text-(--accent)">Then build the way there.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-[1.08rem] leading-relaxed text-(--muted)">
          Aether helps students figure out their future, then achieve it. A hunch becomes a direction.
          That direction becomes colleges they can reach, a path for this year, and a resume that keeps
          the story straight.
        </p>

        <div className="mt-7 flex flex-col gap-2 sm:flex-row">
          <button type="button" className="btn btn-primary" onClick={openSample}>
            See it with a sample student
            <ArrowRight size={16} />
          </button>
          <Link href="/subscribe" className="btn btn-ghost">
            Get full access
            <ArrowRight size={16} />
          </Link>
        </div>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-(--muted)">
          First time here? Start with Alex Rivera, a junior in Austin whose future is already named. You
          will know what we do in one sitting.
        </p>

        <section className="mt-14 border-t border-(--line) pt-10">
          <h2 className="serif text-[2rem] leading-tight text-(--ink) md:text-[2.4rem]">
            Two moves. That is the whole company.
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {STEPS.map((item) => (
              <article key={item.step} className="card p-6 md:p-8">
                <div className="serif text-[2.4rem] leading-none text-(--accent)">{item.step}</div>
                <h3 className="serif mt-4 text-[1.85rem] leading-tight text-(--ink)">{item.title}</h3>
                <p className="mt-3 text-[0.98rem] leading-relaxed text-(--muted)">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="serif text-[2rem] leading-tight text-(--ink)">
            Built for the room where the future gets decided
          </h2>
          <p className="mt-3 max-w-2xl text-[1.02rem] leading-relaxed text-(--muted)">
            Counselors, districts, and schools sit with a student who is still guessing. Aether gives that
            meeting a direction and something the family can take home.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {AUDIENCES.map((name) => (
              <span key={name} className="chip">
                {name}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
          <article className="card flex flex-col p-6 md:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-(--accent)">Look first</p>
            <h2 className="serif mt-3 text-[2.15rem] leading-[1.05] text-(--ink)">
              A finished student, ready to walk through
            </h2>
            <p className="mt-3 text-[0.98rem] leading-relaxed text-(--muted)">
              Alex already has a career direction, college matches, a path, and a resume. Open that
              workspace the way you would in a staff meeting or a family conference. Nothing to set up.
            </p>
            <button type="button" className="btn btn-ghost mt-6 self-start" onClick={openSample}>
              Open Alex’s workspace
              <ArrowRight size={16} />
            </button>
          </article>

          <article className="card flex flex-col border-(--accent)/30 bg-(--accent-soft)/50 p-6 md:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-(--accent)">
              When a real student is in the chair
            </p>
            <h2 className="serif mt-3 text-[2.15rem] leading-[1.05] text-(--ink)">Full access</h2>
            <p className="mt-3 text-[0.98rem] leading-relaxed text-(--muted)">
              Their academics. Their activities. Colleges sorted for them. A path and a resume they can
              keep working on after they leave.
            </p>
            <Link href="/subscribe" className="btn btn-primary mt-6 self-start">
              Get the subscription
              <ArrowRight size={16} />
            </Link>
          </article>
        </section>

        <p className="mt-10 max-w-3xl text-xs leading-relaxed text-(--muted)">
          College labels are estimates from published ranges and the profile on screen. They are not
          promises of admission. Deadlines, testing rules, and cost still get confirmed with each school.
        </p>
      </main>
    </div>
  );
}
