import Link from "next/link";

export function SampleLock() {
  return (
    <section className="card mx-auto max-w-xl p-6 md:p-8">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-(--muted)">Sample</div>
      <h1 className="serif mt-2 text-[2rem] leading-tight text-(--ink)">This opens with full access</h1>
      <p className="mt-3 text-sm leading-relaxed text-(--muted)">
        The sample is Alex Rivera’s workspace, so you can see careers, colleges, the path, strength, and
        the resume. Your own profile, uploads, and account come with the subscription.
      </p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Link href="/subscribe" className="btn btn-primary">
          Get the subscription
        </Link>
        <Link href="/home" className="btn btn-ghost">
          Back to the sample
        </Link>
      </div>
    </section>
  );
}
