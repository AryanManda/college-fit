"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/colleges", label: "For You", match: (p: string) => p === "/colleges" },
  { href: "/colleges/matches", label: "Matches", match: (p: string) => p.startsWith("/colleges/matches") },
  { href: "/colleges/saved", label: "Saved", match: (p: string) => p.startsWith("/colleges/saved") || p === "/saved" || p === "/list" },
  {
    href: "/colleges/not-interested",
    label: "Not Interested",
    match: (p: string) => p.startsWith("/colleges/not-interested") || p === "/banished",
  },
  {
    href: "/colleges/get-admitted",
    label: "How to Get Admitted",
    match: (p: string) => p.startsWith("/colleges/get-admitted") || p === "/admitted",
  },
  { href: "/find", label: "Balanced List", match: (p: string) => p === "/find" || p === "/match" },
  { href: "/nearby", label: "Near Me", match: (p: string) => p === "/nearby" },
  { href: "/odds", label: "Odds", match: (p: string) => p === "/odds" },
  { href: "/compare", label: "Compare", match: (p: string) => p === "/compare" },
] as const;

export function CollegesTopTabs() {
  const pathname = usePathname();
  return (
    <nav className="mb-6 -mx-1 flex gap-1 overflow-x-auto pb-1">
      {TABS.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold transition ${
              active
                ? "bg-(--accent) text-white"
                : "bg-white/70 text-(--muted) hover:bg-(--accent-soft) hover:text-(--accent)"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
