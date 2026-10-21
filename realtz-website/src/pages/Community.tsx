import { useState } from "react";
import { ChevronLeft, ChevronRight, HeartHandshake } from "lucide-react";
import { CtaBand, PageHero, useMeta } from "../components/Layout";
import { Photo } from "../components/Photo";
import { Reveal } from "../components/ui";
import { Paras, Rich } from "../content/rich";
import { useContent, usePage } from "../content/store";
import type { PartnerT } from "../content/defaults";

function Slider({ partner }: { partner: PartnerT }) {
  const [i, setI] = useState(0);
  const photos = partner.photos.length ? partner.photos : [""];
  const n = photos.length;
  return (
    <div className="relative">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem]">
        {photos.map((p, k) => (
          <div key={k} className={`absolute inset-0 transition-opacity duration-700 ${k === i ? "opacity-100" : "opacity-0"}`}>
            <Photo photo={p} className="absolute inset-0" />
          </div>
        ))}
      </div>
      {n > 1 && (
        <div className="absolute bottom-4 right-4 flex gap-2">
          <button type="button" aria-label="Previous photo" onClick={() => setI((i - 1 + n) % n)} className="grid size-11 place-items-center rounded-full bg-cream/90 text-earth backdrop-blur hover:bg-cream"><ChevronLeft className="size-5" /></button>
          <button type="button" aria-label="Next photo" onClick={() => setI((i + 1) % n)} className="grid size-11 place-items-center rounded-full bg-cream/90 text-earth backdrop-blur hover:bg-cream"><ChevronRight className="size-5" /></button>
        </div>
      )}
      <div className="absolute bottom-6 left-6 flex gap-1.5">
        {photos.map((_, k) => <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? "w-6 bg-gold" : "w-1.5 bg-white/60"}`} />)}
      </div>
    </div>
  );
}

export default function Community() {
  const p = usePage("community");
  const partners = useContent().partners;
  useMeta(p.meta.title, p.meta.description);
  return (
    <>
      <PageHero photo={p.hero.image} eyebrow={p.hero.eyebrow} title={p.hero.title} intro={p.hero.intro} crumbs={[{ label: p.meta.title }]} />

      <section className="py-24 md:py-32">
        <div className="container-x space-y-32">
          {partners.map((x, idx) => (
            <article key={idx} className="grid gap-12 lg:grid-cols-2 lg:items-start">
              <Reveal className={`lg:sticky lg:top-28 ${idx % 2 ? "lg:order-2" : ""}`}>
                <Slider partner={x} />
              </Reveal>
              <Reveal delay={120}>
                <p className="eyebrow">{x.place}</p>
                <h2 className="display-lg mt-4">{x.name}</h2>
                <div className="mt-6 space-y-4"><Paras text={x.intro} className="text-lg leading-relaxed text-muted" /></div>
                <div className="mt-10 space-y-8">
                  {x.sections.map((s, k) => (
                    <div key={k} className="rounded-[1.5rem] border border-line bg-paper p-7">
                      <h3 className="text-2xl">{s.title}</h3>
                      {s.text && <p className="mt-3 leading-relaxed text-muted"><Rich text={s.text} accent="text-terracotta" /></p>}
                      {s.list.length > 0 && (
                        <ul className="mt-4 space-y-2.5">
                          {s.list.map((li, j) => (
                            <li key={j} className="flex gap-3 text-muted"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-sunset" />{li}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </Reveal>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-earth py-20 text-cream">
        <div className="container-x grid gap-8 md:grid-cols-[auto_1fr] md:items-center">
          <HeartHandshake className="size-14 text-gold" />
          <p className="max-w-3xl font-display text-2xl leading-snug md:text-3xl"><Rich text={p.proceeds} /></p>
        </div>
      </section>

      <CtaBand title={p.cta.title} text={p.cta.text} />
    </>
  );
}
