import { useState } from "react";
import { photos, REMOTE_BASE, type PhotoKey } from "../data/images";

type Props = {
  photo: PhotoKey;
  className?: string;
  imgClassName?: string;
  eager?: boolean;
  alt?: string;
};

// Tries public/images first, then the copy on the current site, then shows a
// warm gradient so a missing photo never leaves a hole in the layout.
export function Photo({ photo, className = "", imgClassName = "", eager = false, alt }: Props) {
  const p = photos[photo];
  const sources = [`/images/${p.file}`, REMOTE_BASE + p.remote];
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const positioned = /(^|\s)(absolute|fixed)(\s|$)/.test(className);

  return (
    <div className={`photo-fallback overflow-hidden ${positioned ? "" : "relative"} ${className}`}>
      {attempt < sources.length && (
        <img
          src={sources[attempt]}
          alt={alt ?? p.alt}
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
