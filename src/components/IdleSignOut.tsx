"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { hasActiveSession, touchSession } from "../lib/auth-local";
import { useStore } from "../lib/store";

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "scroll", "touchstart"] as const;

/** FERPA mode: keeps the session alive while the student works, and signs out once it goes idle. */
export function IdleSignOut() {
  const router = useRouter();
  const { state, reset } = useStore();
  const signedIn = Boolean(state.accountEmail);

  useEffect(() => {
    if (!signedIn) return;
    let lastTouch = 0;
    const onActivity = () => {
      if (Date.now() - lastTouch < 15_000) return;
      lastTouch = Date.now();
      touchSession();
    };
    const check = () => {
      if (hasActiveSession()) return;
      reset();
      router.push("/account?expired=1");
    };
    for (const name of ACTIVITY_EVENTS) window.addEventListener(name, onActivity, { passive: true });
    const timer = window.setInterval(check, 30_000);
    document.addEventListener("visibilitychange", check);
    return () => {
      for (const name of ACTIVITY_EVENTS) window.removeEventListener(name, onActivity);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [signedIn, reset, router]);

  return null;
}
