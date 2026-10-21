import { useState } from "react";
import { ChevronLeft, ChevronRight, HeartHandshake } from "lucide-react";
import { CtaBand, PageHero, useMeta } from "../components/Layout";
import { Photo } from "../components/Photo";
import { Reveal } from "../components/ui";
import { partners, type Partner } from "../data/content";

function Slider({ partner }: { partner: Partner }) {
  const [i, setI] = useState(0);
  const n = partner.photos.length;
  return (
    <div className="relative">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem]">
        {partner.photos.map((p, k) => (
          <div key={p} className={`absolute inset-0 transition-opacity duration-700 ${k === i ? "opacity-100" : "opacity-0"}`}>
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
        {partner.photos.map((p, k) => <span key={p} className={`h-1.5 rounded-full transition-all ${k === i ? "w-6 bg-gold" : "w-1.5 bg-white/60"}`} />)}
      </div>
    </div>
  );
}

export default function Community() {
  useMeta("Community we support", "We partner with women-led groups across Tanzania: the Mama na Mwana Foundation, the Same women's groups and the Machame Nkweshoo women's group.");
  return (
    <>
      <PageHero
        photo="machame2"
        eyebrow="Empowering women, preserving heritage"
        title={<>Travel that leaves <em className="text-gold">something good</em> behind.</>}
        intro="We partner with women-led groups who empower their families and protect the traditions that shape our culture. Meet the three communities we work with."
        crumbs={[{ label: "Community" }]}
      />

      <section className="py-24 md:py-32">
        <div className="container-x space-y-32">
          {partners.map((p, idx) => (
            <article key={p.name} className="grid gap-12 lg:grid-cols-2 lg:items-start">
              <Reveal className={`lg:sticky lg:top-28 ${idx % 2 ? "lg:order-2" : ""}`}>
                <Slider partner={p} />
              </Reveal>
              <Reveal delay={120}>
                <p className="eyebrow">{p.place}</p>
                <h2 className="display-lg mt-4">{p.name}</h2>
                <p className="mt-6 text-lg leading-relaxed text-muted">{p.intro}</p>
                <div className="mt-10 space-y-8">
                  {p.sections.map((s) => (
                    <div key={s.title} className="rounded-[1.5rem] border border-line bg-paper p-7">
                      <h3 className="text-2xl">{s.title}</h3>
                      {s.text && <p className="mt-3 leading-relaxed text-muted">{s.text}</p>}
                      {s.list && (
                        <ul className="mt-4 space-y-2.5">
                          {s.list.map((li) => (
                            <li key={li} className="flex gap-3 text-muted"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-sunset" />{li}</li>
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
          <p className="max-w-3xl font-display text-2xl leading-snug md:text-3xl">
            Proceeds from guest participation and handmade products go directly to the women, helping to sustain their livelihoods and independence.
          </p>
        </div>
      </section>

      <CtaBand title="Add a community visit to your journey." text="Cook in a Machame kitchen, farm with the women of Same or stay with families in Vikindu. We'll weave it into your route." />
    </>
  );
}
