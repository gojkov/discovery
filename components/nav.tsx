import Link from "next/link";
import { AudioWaveform } from "lucide-react";

const links = [
  ["/", "Dashboard"],
  ["/tracks", "Tracks"],
  ["/candidates", "Candidates"],
  ["/import/spotify-csv", "Import"],
  ["/exports", "Exports"]
];

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-ink/75 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full border border-cyan/30 bg-cyan/10 text-cyan shadow-[0_0_28px_rgba(70,232,255,0.15)]">
            <AudioWaveform size={21} />
          </span>
          <span>
            <span className="block text-lg font-black tracking-tight">
              Steve Discovery Engine
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.26em] text-cream/35">
              Craving, not similarity
            </span>
          </span>
        </Link>
        <nav className="flex flex-wrap gap-1">
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="rounded-full px-3 py-2 text-sm font-semibold text-cream/55 transition hover:bg-white/[0.07] hover:text-cyan"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
