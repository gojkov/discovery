import clsx from "clsx";
import type { ReactNode } from "react";

export function Card({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={clsx(
        "rounded-4xl border border-white/[0.08] bg-panel/80 p-6 shadow-card backdrop-blur-xl sm:p-7",
        className
      )}
    >
      {children}
    </section>
  );
}

export function Eyebrow({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={clsx(
        "mb-3 font-mono text-[11px] font-medium uppercase tracking-eyebrow text-cyan",
        className
      )}
    >
      {children}
    </p>
  );
}

export function Badge({
  children,
  tone = "neutral"
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad" | "violet";
}) {
  const tones = {
    neutral: "border-white/12 bg-white/[0.05] text-muted",
    good: "border-lime/30 bg-lime/12 text-lime",
    warn: "border-amber/30 bg-amber/12 text-amber",
    bad: "border-coral/30 bg-coral/12 text-coral",
    violet: "border-violet/30 bg-violet/15 text-violet"
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

export const inputClass =
  "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-fg outline-none transition duration-200 placeholder:text-subtle hover:border-white/20 focus:border-cyan/70 focus:bg-white/[0.06] focus:ring-4 focus:ring-cyan/10";

export const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-full bg-fg px-5 py-3 text-sm font-semibold text-ink transition duration-200 hover:-translate-y-0.5 hover:bg-cyan hover:shadow-glow active:translate-y-0";
