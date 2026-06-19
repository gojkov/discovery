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
        "rounded-[1.75rem] border border-white/[0.08] bg-panel/90 p-6 text-cream shadow-card backdrop-blur-xl",
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
        "mb-3 text-[11px] font-black uppercase tracking-[0.24em] text-cyan",
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
    neutral: "border border-white/10 bg-white/[0.05] text-cream/60",
    good: "border border-acid/30 bg-acid/15 text-acid",
    warn: "border border-amber-300/25 bg-amber-300/10 text-amber-200",
    bad: "border border-coral/30 bg-coral/10 text-coral",
    violet: "border border-violet/30 bg-violet/15 text-violet"
  };
  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-bold",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

export const inputClass =
  "w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-cream outline-none transition duration-200 placeholder:text-cream/30 hover:border-white/20 focus:border-cyan/70 focus:bg-white/[0.07] focus:ring-4 focus:ring-cyan/10";

export const buttonClass =
  "inline-flex items-center justify-center rounded-full bg-cream px-5 py-3 text-sm font-black text-ink transition duration-200 hover:-translate-y-0.5 hover:bg-cyan hover:shadow-[0_0_30px_rgba(70,232,255,0.22)] active:translate-y-0";
