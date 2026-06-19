"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AudioWaveform } from "lucide-react";
import clsx from "clsx";

const links = [
  ["/", "Dashboard"],
  ["/tracks", "Tracks"],
  ["/candidates", "Candidates"],
  ["/review", "Review"],
  ["/discover", "Discover"],
  ["/reasons", "Reasons"],
  ["/import/spotify-csv", "Import"],
  ["/exports", "Exports"]
] as const;

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-ink/70 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl border border-cyan/30 bg-cyan/10 text-cyan shadow-glow">
            <AudioWaveform size={20} />
          </span>
          <span>
            <span className="block font-display text-lg font-semibold tracking-tight text-fg">
              Steve Discovery Engine
            </span>
            <span className="block font-mono text-[10px] font-medium uppercase tracking-eyebrow text-subtle">
              Craving, not similarity
            </span>
          </span>
        </Link>
        <nav className="flex flex-wrap gap-1">
          {links.map(([href, label]) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "rounded-full px-3.5 py-2 text-sm font-medium transition",
                  active
                    ? "bg-cyan/12 text-cyan"
                    : "text-muted hover:bg-white/[0.06] hover:text-fg"
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
