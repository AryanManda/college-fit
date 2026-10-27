# Aether — College Admissions & Career MVP

A modern web app for students 16–24 that combines a college advisor, college search/matching, resume builder, writing assistant, and student dashboard.

The product answers one question:

> Given who I am, what I have accomplished, what I want to study, what career I want, what I can afford, and what kind of college experience I want — which schools are the best fit for me, and what can I do to make myself a stronger applicant?

## Run locally

```bash
cd college-fit
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Use **Load sample student** on the dashboard or Settings to explore with a filled-in profile.

## What’s included

- Left sidebar on desktop, bottom navigation on mobile
- Dashboard with profile completion, top matches, and recommended actions
- Full student profile (academics, testing, activities, work, awards, career, college preferences)
- Matching engine: Admissions, Academic, Major, Financial, Lifestyle, Career, and Overall Fit (0–100)
- Fit labels: Excellent / Strong / Good / Possible / Reach / High Reach — not admission probabilities
- Explore + filter ~120 universities compiled from published-style CDS / IPEDS / Scorecard ranges
- College profile pages with Unavailable when a field is not in the dataset
- Compare up to 5 schools
- Resume builder: paste/upload text, versions, formatting, Improve (asks for metrics, never invents stats), resume score
- Application Strength + personalized recommendations
- Local-only storage in the browser (no backend)

University figures are labeled **Data last updated: 2024–25**. Always verify deadlines, costs, and testing policies with the university.

## FERPA mode (school deployments)

Build with `NEXT_PUBLIC_FERPA_MODE=1` to get the version for schools. Locally: `npm run dev:ferpa`. On Vercel, use a separate project with that environment variable set, and optionally `NEXT_PUBLIC_PRIVACY_CONTACT` (an email shown on the privacy page).

What changes:

- Account profiles are encrypted on the device (AES-256-GCM, key derived from the password). Nothing readable is left in `localStorage`, so the next person at a shared computer sees nothing.
- Sign-in ends when the tab closes or after 30 minutes without activity. Students who don't sign in keep their work only in that tab.
- A Content Security Policy limits the browser to this app's own origin. College logos, ZIP lookups, and the PDF reader are served by the app, so no third party sees student activity.
- Settings → **Your records**: download everything (review), edit it in the profile (amend), or delete it from the device.
- A `/privacy` page explains all of this to students and parents.

What the software can't do. These are for the school or district and whoever runs Aether:

- Sign a data-privacy agreement with each district that names Aether a "school official" with a legitimate educational interest, and check state student-privacy laws (for example California SOPIPA, Texas Education Code ch. 32, New York Ed Law 2-d).
- Keep hosting logs to a minimum. Search requests (college and high-school names, home state, ZIP) pass through the server, and the host may log request URLs.
- Have a breach-response and data-deletion process, and tell students to log out on shared devices.
- Forgotten passwords can't be recovered, because the profile is encrypted with the password. Students should download their records now and then.
