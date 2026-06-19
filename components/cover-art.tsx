import { Music2 } from "lucide-react";
import clsx from "clsx";

/**
 * Album cover with a graceful fallback. Uses a plain <img> (Spotify CDN) so no
 * next/image remote-pattern config is needed; decorative, so it lazy-loads.
 */
export function CoverArt({
  src,
  alt,
  size = 56,
  className
}: {
  src?: string | null;
  alt: string;
  size?: number;
  className?: string;
}) {
  const box = { width: size, height: size };
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        loading="lazy"
        style={box}
        className={clsx("shrink-0 rounded-xl object-cover", className)}
      />
    );
  }
  return (
    <div
      aria-hidden
      style={box}
      className={clsx(
        "grid shrink-0 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.04] text-subtle",
        className
      )}
    >
      <Music2 size={Math.round(size * 0.38)} />
    </div>
  );
}
