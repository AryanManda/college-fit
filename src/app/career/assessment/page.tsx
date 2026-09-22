import { Suspense } from "react";
import AssessmentClient from "./AssessmentClient";

export default function CareerAssessmentPage() {
  return (
    <Suspense fallback={<div className="text-(--muted)">Loading assessment…</div>}>
      <AssessmentClient />
    </Suspense>
  );
}
