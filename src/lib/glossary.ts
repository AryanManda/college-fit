export const GLOSSARY: Record<string, string> = {
  "Class Rank":
    "Your position compared with other students in your graduating class, often expressed as a number or percentile.",
  "Dual Enrollment":
    "College-level courses taken while you're still in high school that may earn college credit.",
  "GPA":
    "Grade Point Average — a summary of your academic performance, usually on a 4.0 scale.",
  "Weighted GPA":
    "A GPA that gives extra credit for advanced courses like AP, IB, or Honors.",
  "Unweighted GPA":
    "A GPA calculated without extra points for advanced courses — all courses count equally.",
  "Course Rigor":
    "The difficulty level of your coursework, including AP, IB, Honors, and dual enrollment.",
  "Acceptance Rate":
    "The percentage of applicants a college admits. A lower rate usually means more selective admissions.",
  "Reach School":
    "A school where admission is possible but significantly less likely based on your current profile.",
  "Target School":
    "A school where your academic profile is reasonably competitive, but admission is not guaranteed.",
  "Likely School":
    "A school where your profile is stronger than the typical admitted student, although admission is never guaranteed.",
  "High Reach":
    "A highly selective school where admission is particularly difficult relative to your current profile.",
  "Yield Rate":
    "The percentage of admitted students who choose to enroll. Higher yield can mean a school is more popular among admitted students.",
  "Test Optional":
    "A policy where submitting SAT/ACT scores is optional. Policies vary by school and may differ by residency or major.",
  "Need-Based Aid":
    "Financial aid based on your family's financial need, often determined by FAFSA or similar forms.",
  "Merit Aid":
    "Scholarships based on academic achievement, talents, or other merit — not solely financial need.",
  "Major Selectivity":
    "Some majors at a university are more competitive than the overall school acceptance rate suggests.",
  "Early Action":
    "A non-binding early application deadline. You can apply early and still compare offers from other schools.",
  "Early Decision":
    "A binding early application. If admitted, you typically agree to enroll. Verify current rules with each school.",
  "Admission Outlook":
    "An estimated position based on published admissions data and your profile. It is not a guarantee of admission.",
  "Out of Range":
    "Your academics sit substantially below this school's published admitted-student ranges. Treating it as a primary or safety option is not reasonable right now.",
  "Estimated Likelihood":
    "A conservative estimate of how competitive your profile appears relative to published admitted-student ranges. Not a prediction or guarantee.",
  "Career Fit":
    "How well a career aligns with your interests, values, work style, and academic strengths based on your assessment answers.",
  "College Fit":
    "How well a school matches your academic profile, career goals, preferences, location, cost, and lifestyle.",
  "Bachelor's Degree":
    "A four-year undergraduate degree typically required for many professional careers.",
  "Job Growth":
    "Projected change in employment for an occupation. 'Above average' means faster growth than the overall job market.",
  "Typical Salary":
    "Published salary ranges for an occupation. Actual pay varies by employer, location, and experience.",
};

export function glossaryText(term: string) {
  return GLOSSARY[term] ?? "Definition unavailable in this MVP catalog.";
}
