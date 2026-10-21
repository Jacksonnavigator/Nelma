import { Mountain, Palmtree, Trees } from "lucide-react";
import { Photo } from "./Photo";
import type { CategoryKey, Destination } from "../data/destinations";

const art: Record<CategoryKey, { bg: string; Icon: typeof Trees }> = {
  "national-parks": { bg: "from-[#c98a2e] via-[#8a4a1f] to-[#2b1d12]", Icon: Trees },
  mountains: { bg: "from-[#9fb0b8] via-[#5d5a52] to-[#2b1d12]", Icon: Mountain },
  islands: { bg: "from-[#5fc2c0] via-[#2f7f86] to-[#183b45]", Icon: Palmtree },
};

/** Illustrated panel used until a real photo of the place is added. */
export function PlaceArt({ dest, big = false }: { dest: Destination; big?: boolean }) {
  const { bg, Icon } = art[dest.category];
  return (
    <div className={`relative h-full w-full overflow-hidden bg-gradient-to-br ${bg}`}>
      <svg className="absolute inset-0 h-full w-full opacity-[0.16]" preserveAspectRatio="none" viewBox="0 0 400 300" aria-hidden="true">
        {Array.from({ length: 9 }, (_, i) => (
          <path key={i} d={`M-20 ${40 + i * 30} C 80 ${10 + i * 30}, 160 ${80 + i * 28}, 260 ${40 + i * 30} S 420 ${70 + i * 30}, 440 ${30 + i * 30}`} fill="none" stroke="white" strokeWidth="1.2" />
        ))}
      </svg>
      <div className="absolute -right-6 -top-6 size-40 rounded-full bg-gold/40 blur-2xl" />
      <Icon className={`absolute text-white/25 ${big ? "bottom-10 right-10 size-40" : "bottom-4 right-4 size-20"}`} strokeWidth={1} />
    </div>
  );
}

export function PlaceImage({ dest, className = "", imgClassName = "", eager = false, big = false }: { dest: Destination; className?: string; imgClassName?: string; eager?: boolean; big?: boolean }) {
  return (
    <Photo
      key={dest.slug}
      photo={dest.photo}
      try={[`/images/destinations/${dest.slug}.jpg`]}
      fallback={<PlaceArt dest={dest} big={big} />}
      alt={dest.name}
      className={className}
      imgClassName={imgClassName}
      eager={eager}
    />
  );
}
