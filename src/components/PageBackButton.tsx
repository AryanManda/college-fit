"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/** Always-available control to return to the previous screen without using the left nav. */
export function PageBackButton({ label = "Back" }: { label?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn btn-ghost mb-4 inline-flex items-center gap-1.5"
      onClick={() => router.back()}
    >
      <ArrowLeft size={16} />
      {label}
    </button>
  );
}
