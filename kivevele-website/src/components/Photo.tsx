import { useState } from "react";
import type { Photo as PhotoData } from "../data/images";

type Props = {
  photo: PhotoData;
  width?: number;
  className?: string;
  priority?: boolean;
};

// Image with a branded fallback, so a missing or blocked photo never leaves a broken box.
export default function Photo({ photo, width = 1200, className = "", priority = false }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={photo.alt}
        className={`bg-gradient-to-br from-teal-600 via-ink-700 to-ink ${className}`}
        style={{ backgroundImage: "radial-gradient(circle at 75% 30%, rgba(247,147,30,.55), transparent 38%), linear-gradient(135deg, #0E6F73, #071E24)" }}
      />
    );
  }

  return (
    <img
      src={photo.src(width)}
      srcSet={`${photo.src(Math.round(width / 2))} ${Math.round(width / 2)}w, ${photo.src(width)} ${width}w, ${photo.src(width * 2)} ${width * 2}w`}
      sizes={`(max-width: 768px) 100vw, ${width}px`}
      alt={photo.alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
