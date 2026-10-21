import type { ReactNode } from "react";
import Photo from "./Photo";
import type { Photo as PhotoData } from "../data/images";

type Props = { photo: PhotoData; kicker: string; title: string; children?: ReactNode };

export default function PageBanner({ photo, kicker, title, children }: Props) {
  return (
    <section className="relative isolate overflow-hidden bg-ink pb-20 pt-40 md:pb-28 md:pt-48">
      <Photo photo={photo} width={1800} priority className="absolute inset-0 -z-20 h-full w-full" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />
      <div className="container-site">
        <p className="kicker text-solar-400">{kicker}</p>
        <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight text-white md:text-6xl">{title}</h1>
        {children && <div className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80 md:text-xl">{children}</div>}
      </div>
    </section>
  );
}
