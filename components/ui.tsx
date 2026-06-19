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
        "rounded-4xl border border-white/[0.12] bg-panel/95 p-6 shadow-card backdrop-blur-xl sm:p-7",
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
        "mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan",
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
    neutral: "border-white/20 bg-white/[0.08] text-fg",
    good: "border-lime/40 bg-lime/15 text-lime",
    warn: "border-amber/40 bg-amber/15 text-amber",
    bad: "border-coral/40 bg-coral/15 text-coral",
    violet: "border-violet/40 bg-violet/20 text-violet"
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
  "w-full rounded-2xl border border-white/20 bg-white/[0.07] px-4 py-3 text-sm text-fg outline-none transition duration-200 placeholder:text-subtle hover:border-white/30 hover:bg-white/[0.09] focus:border-cyan/80 focus:bg-white/[0.1] focus:ring-4 focus:ring-cyan/15";

export const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-full bg-fg px-5 py-3 text-sm font-semibold text-ink transition duration-200 hover:-translate-y-0.5 hover:bg-cyan hover:shadow-glow active:translate-y-0";
