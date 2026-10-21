import { useState, type ReactNode } from "react";
import { photos, REMOTE_BASES } from "../data/images";
import { useContent } from "../content/store";

type Props = {
  /** A photo-library name (e.g. "serengeti") or an image address (/uploads/…, https://…). */
  photo?: string;
  /** Extra image paths tried first (e.g. /images/destinations/serengeti.jpg). */
  try?: string[];
  /** Shown when no image could be loaded. Defaults to a warm gradient. */
  fallback?: ReactNode;
  className?: string;
  imgClassName?: string;
  eager?: boolean;
  alt?: string;
};

const isUrl = (s: string) => /^(\/|https?:|data:)/.test(s);

/** Resolves a photo reference to the list of image addresses to try, in order. */
export function useImageSources(photo?: string): { sources: string[]; alt: string } {
  const library = useContent().images;
  if (!photo) return { sources: [], alt: "" };
  if (isUrl(photo)) return { sources: [photo], alt: "" };
  const slot = library[photo];
  const builtIn = photos[photo as keyof typeof photos];
  const sources = [
    ...(slot?.src ? [slot.src] : []),
    ...(builtIn ? [`/images/${builtIn.file}`, ...REMOTE_BASES.map((b) => b + builtIn.remote)] : []),
  ];
  return { sources, alt: slot?.alt || builtIn?.alt || "" };
}

// Tries each source in turn and finally shows the fallback, so a missing photo
// never leaves a hole in the layout.
export function Photo({ photo, try: extra = [], fallback, className = "", imgClassName = "", eager = false, alt }: Props) {
  const resolved = useImageSources(photo);
  const sources = [...extra, ...resolved.sources];
  const key = sources.join("|");
  return <PhotoInner key={key} sources={sources} alt={alt ?? resolved.alt} fallback={fallback} className={className} imgClassName={imgClassName} eager={eager} />;
}

function PhotoInner({ sources, alt, fallback, className, imgClassName, eager }: { sources: string[]; alt: string; fallback?: ReactNode; className: string; imgClassName: string; eager: boolean }) {
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
          alt={alt}
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
