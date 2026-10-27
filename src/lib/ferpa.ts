/**
 * FERPA mode: the build for school deployments. Turn it on with NEXT_PUBLIC_FERPA_MODE=1.
 *
 * - Account profiles are encrypted on the device with a key derived from the student's password.
 * - Sign-in lasts until the tab closes or IDLE_LIMIT_MS of inactivity.
 * - Guests (no account) keep their work only in this tab's sessionStorage.
 * - The browser may only talk to this app's own origin (see the CSP in next.config.ts).
 */
export const FERPA_MODE = process.env.NEXT_PUBLIC_FERPA_MODE === "1";

export const IDLE_LIMIT_MS = 30 * 60 * 1000;

/** Optional contact shown on the privacy page, e.g. privacy@district.edu. */
export const PRIVACY_CONTACT = process.env.NEXT_PUBLIC_PRIVACY_CONTACT || "";
