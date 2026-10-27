import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "../../components/ui";
import { APP_NAME } from "../../lib/constants";
import { IDLE_LIMIT_MS, PRIVACY_CONTACT } from "../../lib/ferpa";

export const metadata: Metadata = { title: `Privacy & student records — ${APP_NAME}` };

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "What we keep",
    body: (
      <>
        The profile you enter: name, email, high school, grades and courses, test scores, activities, work, awards,
        career interests, college preferences, and your home location if you choose to share it. When you upload a
        transcript or resume, the text is read on this device to fill in your profile. The file itself is not stored
        or sent anywhere.
      </>
    ),
  },
  {
    title: "Where it is kept",
    body: (
      <>
        Only in this browser, on this device. With an account, your profile is encrypted (AES-256-GCM) with a key made
        from your password, so other people using this computer cannot read it. Without an account, your work is kept
        only in this tab and is gone when you close it. {APP_NAME} has no database of student records.
      </>
    ),
  },
  {
    title: "What leaves this device",
    body: (
      <>
        Searches for colleges and high schools (the words you type and your home state), a ZIP code lookup, and college
        logos. These go only to {APP_NAME}&apos;s own server, which looks them up in public directories (U.S. Department
        of Education College Scorecard, NCES, and a ZIP code directory). They do not include your name, grades, or the
        rest of your profile. The app is blocked from contacting any other website.
      </>
    ),
  },
  {
    title: "What we never do",
    body: (
      <>
        No advertising, no tracking or analytics, and no selling or sharing of student information. Nothing you enter is
        used to train AI models.
      </>
    ),
  },
  {
    title: "Signing out",
    body: (
      <>
        You are signed out when you close the tab, after {IDLE_LIMIT_MS / 60_000} minutes without activity, or when you
        choose Log out. Always log out on a shared computer. If you forget your password, the encrypted profile cannot be
        recovered.
      </>
    ),
  },
  {
    title: "Your rights",
    body: (
      <>
        Under FERPA, students and parents can review education records, ask for corrections, and decide who sees them.
        In <Link href="/settings" className="font-semibold text-(--accent) hover:underline">Settings</Link> you can
        download everything {APP_NAME} holds about you, correct it in your profile, or delete it from this device.
        Records your school keeps elsewhere are handled by your school.
      </>
    ),
  },
];

/** FERPA mode only; next.config.ts redirects /privacy away in the regular build. */
export default function PrivacyPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Privacy"
        title="How your student records are protected"
        subtitle={`${APP_NAME} is built so your school can use it under FERPA: your records stay on this device and stay yours.`}
      />
      <div className="grid gap-4">
        {SECTIONS.map((section) => (
          <section key={section.title} className="card p-5">
            <h2 className="font-semibold text-(--ink)">{section.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-(--muted)">{section.body}</p>
          </section>
        ))}
        {PRIVACY_CONTACT ? (
          <p className="text-sm text-(--muted)">
            Questions about your records? Contact{" "}
            <a href={`mailto:${PRIVACY_CONTACT}`} className="font-semibold text-(--accent) hover:underline">
              {PRIVACY_CONTACT}
            </a>
            .
          </p>
        ) : null}
      </div>
    </div>
  );
}
