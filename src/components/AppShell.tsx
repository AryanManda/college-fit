"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Briefcase,
  FileText,
  Gauge,
  GraduationCap,
  Home,
  Menu,
  Route,
  Settings,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { isFullOnlyPath, readAccess } from "../lib/access";
import { APP_NAME, APP_TAGLINE } from "../lib/constants";
import { logoutAccount } from "../lib/auth-local";
import { studentName } from "../lib/defaults";
import { useStore } from "../lib/store";
import { PageBackButton } from "./PageBackButton";
import { SampleLock } from "./SampleLock";

const ITEMS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/career", label: "Career", icon: Briefcase },
  { href: "/colleges", label: "Colleges", icon: GraduationCap },
  { href: "/path", label: "My Path", icon: Route },
  { href: "/strength", label: "Strength", icon: Gauge },
  { href: "/resume", label: "Resume", icon: FileText },
  { href: "/profile", label: "Profile", icon: UserRound },
] as const;

/** Phone tab bar stays at five destinations so each one stays a full thumb target. */
const PHONE_TABS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/career", label: "Career", icon: Briefcase },
  { href: "/colleges", label: "Colleges", icon: GraduationCap },
  { href: "/path", label: "Path", icon: Route },
  { href: "/profile", label: "Profile", icon: UserRound },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/home") return pathname === "/home";
  if (href === "/colleges") {
    return (
      pathname.startsWith("/colleges") ||
      pathname === "/find" ||
      pathname === "/match" ||
      pathname === "/list" ||
      pathname === "/saved" ||
      pathname === "/banished" ||
      pathname === "/admitted" ||
      pathname === "/odds" ||
      pathname === "/nearby" ||
      pathname === "/compare"
    );
  }
  if (href === "/career") return pathname.startsWith("/career");
  if (href === "/path") return pathname === "/path";
  if (href === "/strength") return pathname === "/strength";
  if (href === "/resume") return pathname === "/resume";
  if (href === "/profile") {
    return (
      pathname.startsWith("/profile") ||
      pathname === "/settings" ||
      pathname === "/account" ||
      pathname === "/upload"
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function phoneTabActive(pathname: string, href: string) {
  if (href === "/profile") return pathname.startsWith("/profile");
  return isActive(pathname, href);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, reset, access, hydrated, canRestoreFull, enterFull } = useStore();
  const name = studentName(state);
  const signedIn = Boolean(state.accountEmail);
  const hasProfile = name !== "Student";
  const resolvedAccess = access ?? (hydrated ? readAccess() : null);
  const sample = resolvedAccess?.mode === "sample";
  const publicPage = pathname === "/" || pathname === "/subscribe";
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!hydrated || publicPage || resolvedAccess) return;
    router.replace("/");
  }, [hydrated, publicPage, resolvedAccess, router]);

  const menuActive =
    pathname === "/strength" ||
    pathname === "/resume" ||
    pathname === "/upload" ||
    pathname === "/settings" ||
    pathname === "/account" ||
    pathname.startsWith("/strength/") ||
    pathname.startsWith("/resume/");

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const onLogout = () => {
    logoutAccount();
    reset();
    setMenuOpen(false);
    router.push("/account");
  };

  if (publicPage) return <>{children}</>;

  if (!hydrated || !resolvedAccess) {
    return <div className="page-pad py-10 text-(--muted)">Loading your workspace…</div>;
  }

  const locked = sample && isFullOnlyPath(pathname);

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-(--line) bg-(--bg-warm)/80 px-3 py-5 md:flex">
        <Link href="/home" className="block px-2">
          <div className="serif text-[1.85rem] leading-none tracking-tight text-(--ink)">{APP_NAME}</div>
          <p className="mt-2 text-[11px] leading-snug tracking-wide text-(--muted)">{APP_TAGLINE}</p>
        </Link>

        <nav className="mt-8 flex flex-1 flex-col gap-1 overflow-y-auto">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-11 items-center gap-2.5 rounded-full px-3 py-2.5 text-[15px] font-semibold transition ${
                  active
                    ? "bg-(--accent-soft) text-(--accent)"
                    : "text-(--ink)/75 hover:bg-white/60 hover:text-(--ink)"
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.25 : 1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="rounded-2xl border border-(--line) bg-(--surface) px-3 py-3 text-sm">
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-(--muted)">
            {sample ? "Sample" : signedIn ? "Signed in" : "Your profile"}
          </div>
          <div className="mt-1 truncate font-semibold text-(--ink)">
            {sample ? "Alex Rivera" : signedIn ? state.accountEmail : hasProfile ? name : "Not set up yet"}
          </div>
          {sample ? (
            <div className="mt-2 flex flex-col gap-1">
              <Link href="/subscribe" className="inline-flex min-h-11 items-center text-sm font-semibold text-(--accent)">
                Get full access
              </Link>
              {canRestoreFull ? (
                <button
                  type="button"
                  onClick={() => enterFull()}
                  className="inline-flex min-h-11 items-center text-left text-sm font-semibold text-(--muted) hover:text-(--ink)"
                >
                  Return to my profile
                </button>
              ) : null}
            </div>
          ) : !hasProfile && !signedIn ? (
            <div className="mt-2 flex flex-col gap-1">
              <Link href="/onboarding" className="inline-flex min-h-11 items-center text-sm font-semibold text-(--accent)">
                Create your profile
              </Link>
              <Link href="/account" className="inline-flex min-h-11 items-center text-sm font-semibold text-(--muted) hover:text-(--ink)">
                Log in
              </Link>
            </div>
          ) : (
            <div className="mt-2 flex flex-col gap-1">
              <Link href="/profile" className="inline-flex min-h-11 items-center text-sm font-semibold text-(--accent)">
                Edit profile
              </Link>
              <Link href="/upload" className="inline-flex min-h-11 items-center text-sm font-semibold text-(--muted) hover:text-(--ink)">
                Upload
              </Link>
              <Link href="/account" className="inline-flex min-h-11 items-center text-sm font-semibold text-(--muted) hover:text-(--ink)">
                Account
              </Link>
              <Link href="/settings" className="inline-flex min-h-11 items-center text-sm font-semibold text-(--muted) hover:text-(--ink)">
                Settings
              </Link>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex min-h-11 items-center text-left text-sm font-semibold text-(--danger)"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className="min-w-0 pb-[calc(5.25rem+env(safe-area-inset-bottom))] md:pb-0">
        <header
          className="sticky top-0 z-20 border-b border-(--line) bg-(--bg)/95 backdrop-blur md:hidden"
          style={{
            paddingTop: "env(safe-area-inset-top)",
            paddingLeft: "env(safe-area-inset-left)",
            paddingRight: "env(safe-area-inset-right)",
          }}
        >
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <Link href="/home" className="serif min-w-0 truncate text-xl">
              {APP_NAME}
            </Link>
            <div className="flex shrink-0 items-center gap-2">
              {sample ? (
                <Link href="/subscribe" className="btn btn-primary px-3">
                  Full access
                </Link>
              ) : (
                <Link href="/upload" className="btn btn-primary px-3">
                  <Upload size={16} />
                  Upload
                </Link>
              )}
              <button
                type="button"
                className={`btn px-3 ${menuActive || menuOpen ? "btn-primary" : "btn-ghost"}`}
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                onClick={() => setMenuOpen((open) => !open)}
              >
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
                Menu
              </button>
            </div>
          </div>
        </header>
        <main className="page-enter page-pad mx-auto w-full max-w-6xl py-6 md:py-8">
          {pathname !== "/home" ? <PageBackButton /> : null}
          {sample ? (
            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-(--line) bg-(--accent-soft) px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-(--ink)">You’re viewing the sample student, Alex Rivera.</p>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                {canRestoreFull ? (
                  <button type="button" className="btn btn-ghost" onClick={() => enterFull()}>
                    Return to my profile
                  </button>
                ) : null}
                <Link href="/subscribe" className="btn btn-primary">
                  Get full access
                </Link>
              </div>
            </div>
          ) : null}
          {locked ? <SampleLock /> : children}
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-(--line) bg-(--surface)/95 backdrop-blur md:hidden"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        }}
        aria-label="Primary"
      >
        <div className="flex">
          {PHONE_TABS.map((item) => {
            const Icon = item.icon;
            const active = phoneTabActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 py-1.5 text-[11px] font-semibold leading-tight ${
                  active ? "bg-(--accent-soft) text-(--accent)" : "text-(--muted)"
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.25 : 1.75} />
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 md:hidden" id="mobile-menu">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
          <div
            className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-auto rounded-t-3xl border border-(--line) bg-(--surface) p-4 shadow-lg"
            style={{
              paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
              paddingLeft: "max(1rem, env(safe-area-inset-left))",
              paddingRight: "max(1rem, env(safe-area-inset-right))",
            }}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-(--line)" />
            <div className="truncate text-sm font-semibold text-(--ink)">
              {sample ? "Sample · Alex Rivera" : signedIn ? state.accountEmail : hasProfile ? name : "Not signed in"}
            </div>
            <div className="mt-3 grid gap-2">
              {sample ? (
                <Link href="/subscribe" className="btn btn-primary w-full">
                  Get full access
                </Link>
              ) : (
                <Link href="/upload" className="btn btn-primary w-full">
                  <Upload size={16} /> Upload transcript & resume
                </Link>
              )}
              <Link href="/resume" className="btn btn-ghost w-full justify-start">
                <FileText size={16} /> Resume
              </Link>
              <Link href="/strength" className="btn btn-ghost w-full justify-start">
                <Gauge size={16} /> Strength
              </Link>
              {sample ? (
                canRestoreFull ? (
                  <button type="button" className="btn btn-ghost w-full" onClick={() => enterFull()}>
                    Return to my profile
                  </button>
                ) : null
              ) : (
                <>
                  <Link href="/settings" className="btn btn-ghost w-full justify-start">
                    <Settings size={16} /> Settings
                  </Link>
                  <Link href="/account" className="btn btn-ghost w-full justify-start">
                    <UserRound size={16} /> Account
                  </Link>
                  {!hasProfile && !signedIn ? (
                    <Link href="/onboarding" className="btn btn-primary w-full">
                      Create your profile
                    </Link>
                  ) : (
                    <button type="button" className="btn btn-ghost w-full text-(--danger)" onClick={onLogout}>
                      Log out
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
