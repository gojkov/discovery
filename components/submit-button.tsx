"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import clsx from "clsx";

export function SubmitButton({
  children,
  className,
  pendingLabel
}: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={clsx(
        "inline-flex items-center justify-center gap-2 transition disabled:cursor-not-allowed disabled:opacity-70",
        className
      )}
    >
      {pending && <Loader2 size={15} className="animate-spin" />}
      {pending ? (pendingLabel ?? "Working…") : children}
    </button>
  );
}
