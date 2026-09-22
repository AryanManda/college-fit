"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  FileText,
  GraduationCap,
  Home,
  Route,
  UserRound,
} from "lucide-react";
import { APP_NAME, APP_TAGLINE } from "../lib/constants";
import { studentName } from "../lib/defaults";
import { useStore } from "../lib/store";
import { PageBackButton } from "./PageBackButton";

const ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/career", label: "Career", icon: Briefcase },
  { href: "/colleges", label: "Colleges", icon: GraduationCap },
  { href: "/path", label: "My Path", icon: Route },
  { href: "/resume", label: "Resume", icon: FileText },
  { href: "/profile", label: "Profile", icon: UserRound },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
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
  if (href === "/resume") return pathname === "/resume";
  if (href === "/profile") return pathname.startsWith("/profile") || pathname === "/settings" || pathname === "/account" || pathname === "/upload";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state } = useStore();
  const name = studentName(state);
  const inColleges = isActive(pathname, "/colleges");

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-(--line) bg-(--surface)/80 px-4 py-6 backdrop-blur-md lg:flex">
        <Link href="/" className="group block px-2">
          <div className="serif text-[1.65rem] leading-[1.1] tracking-tight text-(--ink) transition group-hover:text-(--accent)">
            CollegeMatch
          </div>
          <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-(--accent)">AI</div>
          <p className="mt-3 text-[12px] leading-relaxed text-(--muted)">{APP_TAGLINE}</p>
        </Link>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                data-active={active}
                className={`nav-link flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2.5 text-[13px] font-semibold transition ${
                  active
                    ? "bg-(--accent-soft) text-(--accent)"
                    : "text-(--muted) hover:bg-white/70 hover:text-(--ink)"
                }`}
              >
                <Icon size={16} strokeWidth={active ? 2.25 : 1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-(--line) pt-4 text-sm">
          <div className="px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-(--muted)">Your profile</div>
          <div className="mt-1 px-2 font-semibold text-(--ink)">{name === "Student" ? "Not set up yet" : name}</div>
          {name === "Student" ? (
            <Link href="/onboarding" className="mt-2 block px-2 text-xs font-semibold text-(--accent) hover:underline">
              Create your profile
            </Link>
          ) : (
            <div className="mt-2 flex flex-col gap-1 px-2">
              <Link href="/profile" className="text-xs font-semibold text-(--accent) hover:underline">Edit profile</Link>
              <Link href="/upload" className="text-xs font-semibold text-(--muted) hover:text-(--ink)">Upload</Link>
              <Link href="/account" className="text-xs font-semibold text-(--muted) hover:text-(--ink)">Account</Link>
              <Link href="/settings" className="text-xs font-semibold text-(--muted) hover:text-(--ink)">Settings</Link>
            </div>
          )}
        </div>
      </aside>

      <div className="pb-24 lg:pb-0">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-(--line) bg-(--surface)/80 px-4 py-3 backdrop-blur-md lg:hidden">
          <div>
            <div className="serif text-xl leading-none">{APP_NAME.replace(" AI", "")}</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-(--accent)">AI</div>
          </div>
          {name === "Student" ? (
            <Link href="/onboarding" className="text-sm font-semibold text-(--accent)">Create profile</Link>
          ) : (
            <span className="text-sm text-(--muted)">{name}</span>
          )}
        </header>
        <main className="page-enter mx-auto w-full max-w-6xl px-4 py-7 lg:px-10 lg:py-10">
          {pathname !== "/" ? <PageBackButton /> : null}
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex gap-1 border-t border-(--line) bg-(--surface)/95 px-2 py-2 backdrop-blur-md lg:hidden">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 rounded-[var(--radius-sm)] px-1 py-1.5 text-[10px] font-semibold ${
                active || (item.href === "/colleges" && inColleges)
                  ? "bg-(--accent-soft) text-(--accent)"
                  : "text-(--muted)"
              }`}
            >
              <Icon size={16} strokeWidth={active ? 2.25 : 1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
