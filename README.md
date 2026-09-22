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
