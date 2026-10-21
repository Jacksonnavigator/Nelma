import { useState, type ReactNode } from "react";
import { photos, REMOTE_BASE, type PhotoKey } from "../data/images";

type Props = {
  photo?: PhotoKey;
  /** Extra image paths tried before `photo` (e.g. /images/destinations/serengeti.jpg). */
  try?: string[];
  /** Shown when no image could be loaded. Defaults to a warm gradient. */
  fallback?: ReactNode;
  className?: string;
  imgClassName?: string;
  eager?: boolean;
  alt?: string;
};

// Tries the extra paths, then public/images, then the copy on the current site,
// and finally shows the fallback so a missing photo never leaves a hole.
export function Photo({ photo, try: extra = [], fallback, className = "", imgClassName = "", eager = false, alt }: Props) {
  const p = photo ? photos[photo] : undefined;
  const sources = [...extra, ...(p ? [`/images/${p.file}`, REMOTE_BASE + p.remote] : [])];
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const positioned = /(^|\s)(absolute|fixed)(\s|$)/.test(className);
  const failed = attempt >= sources.length;

  return (
    <div className={`overflow-hidden ${failed && fallback ? "" : "photo-fallback"} ${positioned ? "" : "relative"} ${className}`}>
      {failed ? (
        fallback && <div className="absolute inset-0">{fallback}</div>
      ) : (
        <img
          src={sources[attempt]}
          alt={alt ?? p?.alt ?? ""}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => {
            setLoaded(false);
            setAttempt((a) => a + 1);
          }}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"} ${imgClassName}`}
        />
      )}
    </div>
  );
}
