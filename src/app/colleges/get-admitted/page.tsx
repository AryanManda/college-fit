import Link from "next/link";
import { CollegesTopTabs } from "../../../components/CollegesTopTabs";
import { PageHeader } from "../../../components/ui";

export default function GetAdmittedPage() {
  return (
    <div>
      <PageHeader
        title="How to get admitted"
        subtitle="There is more than one path into a selective school. Explore transfer and freshman strategies — including routes that can raise odds for even highly selective universities."
      />
      <CollegesTopTabs />

      <section className="card mb-5 p-5">
        <h2 className="serif text-2xl">Path 1: Transfer strategy</h2>
        <p className="mt-1 text-sm text-(--muted)">Often a high-success route into selective 4-years.</p>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed">
          <li>Enroll in a local community college — ideally one with transfer agreements to universities you care about.</li>
          <li>Maintain roughly a 3.8–4.0 GPA for two years, focusing on prerequisites for your intended major.</li>
          <li>Join Phi Theta Kappa and take leadership roles in clubs or campus organizations.</li>
          <li>
            Apply as a junior transfer. Transfer acceptance rates at many selective schools are often higher than freshman rates — verify current numbers with each school.
          </li>
        </ol>
        <Link href="/colleges" className="btn btn-ghost mt-4">
          Find community colleges
        </Link>
      </section>

      <section className="card p-5">
        <h2 className="serif text-2xl">Path 2: Direct freshman entry</h2>
        <p className="mt-1 text-sm text-(--muted)">Competitive path straight from high school.</p>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed">
          <li>Challenge yourself with AP, IB, or dual-credit classes to strengthen academic rigor and weighted GPA.</li>
          <li>Aim for test scores near the top of that school&apos;s published admitted range when tests are used (e.g. 1500+ SAT or 34+ ACT for ultra-selective schools).</li>
          <li>
            Build a spike: deep achievement in one area you care about (state/national recognition) often matters more than a long list of shallow activities.
          </li>
        </ol>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/profile?tab=academics" className="btn btn-ghost">Update coursework</Link>
          <Link href="/odds" className="btn btn-primary">Check odds for a school</Link>
        </div>
      </section>
    </div>
  );
}
