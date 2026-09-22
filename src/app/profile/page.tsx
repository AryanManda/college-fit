"use client";

import { Suspense } from "react";
import ProfilePage from "./ProfileClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="text-(--muted)">Loading profile…</div>}>
      <ProfilePage />
    </Suspense>
  );
}
