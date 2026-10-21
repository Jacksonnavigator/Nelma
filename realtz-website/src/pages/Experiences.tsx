import { Link } from "react-router-dom";
import { ArrowRight, Binoculars, Footprints, Mountain, Waves } from "lucide-react";
import { CtaBand, MoreJourneys, PageHero, useMeta } from "../components/Layout";
import { Pills, Split } from "../components/Split";
import { Photo } from "../components/Photo";
import { Reveal, SectionHeading } from "../components/ui";
import { Paras, Rich } from "../content/rich";
import { useContent, useDestinations, usePage } from "../content/store";
import { DestinationCard } from "./Destinations";

export function ExperiencesOverview() {
  const p = usePage("experiences");
  const experiences = useContent().experiences;
  useMeta(p.meta.title, p.meta.description);
  return (
    <>
      <PageHero photo={p.hero.image} eyebrow={p.hero.eyebrow} title={p.hero.title} intro={p.hero.intro} crumbs={[{ label: p.meta.title }]} />
      <section className="py-24 md:py-32">
        <div className="container-x space-y-10">
          {experiences.map((e, i) => (
            <Reveal key={i}>
              <Link to={e.to} className="group grid overflow-hidden rounded-[2rem] border border-line bg-paper transition-shadow hover:shadow-2xl hover:shadow-earth/10 md:grid-cols-2">
                <Photo photo={e.photo} className={`aspect-[16/11] md:aspect-auto md:min-h-[26rem] ${i % 2 ? "md:order-2" : ""}`} imgClassName="transition-transform duration-[1.2s] group-hover:scale-105" />
                <div className="flex flex-col justify-center p-8 md:p-14">
                  <span className="font-display text-6xl text-sand-deep">{String(i + 1).padStart(2, "0")}</span>
                  <h2 className="display-md mt-2">{e.title}</h2>
                  <p className="mt-4 text-lg leading-relaxed text-muted">{e.line}</p>
                  <span className="mt-8 inline-flex items-center gap-2 font-semibold text-terracotta">
                    {p.discoverPrefix} {e.title.toLowerCase()} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
      <CtaBand />
    </>
  );
}

function Gallery({ photos }: { photos: string[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {photos.map((p, i) => (
        <Reveal key={i} delay={i * 100} className={i === 0 ? "col-span-2 row-span-2 md:col-span-2" : ""}>
          <Photo photo={p} className={`h-full rounded-[1.5rem] ${i === 0 ? "aspect-[4/3] md:aspect-auto md:min-h-full" : "aspect-square"}`} />
        </Reveal>
      ))}
    </div>
  );
}

/** Pills linking to destination pages by slug, using each place's current name. */
function DestinationLinks({ slugs, light = false }: { slugs: string[]; light?: boolean }) {
  const d = useDestinations();
  return (
    <>
      {slugs.map((slug) => {
        const x = d.find(slug);
        if (!x) return null;
        return (
          <Link
            key={slug}
            to={`/destinations/${x.category}/${x.slug}`}
            className={light ? "rounded-full border border-white/20 px-4 py-2 text-sm text-cream transition-colors hover:border-gold hover:text-gold" : "rounded-full border border-line bg-cream px-4 py-2 text-sm text-earth transition-colors hover:border-earth"}
          >
            {x.name.replace(/ (National Park|Conservation Area|Mountains National Park|Stream National Park)$/, "")}
          </Link>
        );
      })}
    </>
  );
}

export function Safari() {
  const p = usePage("safari");
  const crumb = usePage("experiences").meta.title;
  useMeta(p.meta.title, p.meta.description);
  return (
    <>
      <PageHero photo={p.hero.image} eyebrow={p.hero.eyebrow} title={p.hero.title} intro={p.hero.intro} crumbs={[{ label: crumb, to: "/experiences" }, { label: p.meta.title }]}>
        <Link to="/plan-trip" className="btn btn-sun">{p.hero.button}</Link>
      </PageHero>

      <section className="py-24 md:py-32">
        <div className="container-x">
          <Split photo={p.intro.image} eyebrow={p.intro.eyebrow} title={p.intro.title} text={p.intro.text} tall />
        </div>
      </section>

      <section className="bg-paper py-24 md:py-32">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading eyebrow={p.classics.eyebrow} title={p.classics.title} />
            <Link to="/destinations/national-parks" className="btn btn-ghost">{p.classics.button}</Link>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {p.classics.parks.map((x, i) => (
              <Reveal key={i} delay={i * 100}>
                <Link to={`/destinations/national-parks/${x.slug}`} className="group block">
                  <Photo photo={x.image} className="aspect-[3/4] rounded-[1.5rem]" imgClassName="transition-transform duration-700 group-hover:scale-105" />
                  <h3 className="mt-4 text-2xl transition-colors group-hover:text-terracotta">{x.name}</h3>
                  <p className="mt-1 text-sm text-muted">{x.note}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-night py-24 text-cream md:py-32">
        <Photo photo={p.south.image} className="absolute inset-0 opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-night via-night/90 to-night/50" />
        <div className="container-x relative grid gap-12 lg:grid-cols-2">
          <div>
            <Binoculars className="size-10 text-gold" />
            <p className="eyebrow eyebrow-light mt-6">{p.south.eyebrow}</p>
            <h2 className="display-lg mt-4"><Rich text={p.south.title} /></h2>
          </div>
          <div className="space-y-5 text-lg leading-relaxed text-cream/80 [&_strong]:text-cream">
            <Paras text={p.south.text} accent="text-gold" />
            <div className="flex flex-wrap gap-2"><DestinationLinks slugs={p.south.links} light /></div>
          </div>
        </div>
      </section>

      <MoreJourneys title={p.journeysTitle} />
      <CtaBand title={p.cta.title} text={p.cta.text} />
    </>
  );
}

const levelIcons = [Footprints, Mountain, Mountain];

export function Trekking() {
  const p = usePage("trekking");
  const crumb = usePage("experiences").meta.title;
  useMeta(p.meta.title, p.meta.description);
  return (
    <>
      <PageHero photo={p.hero.image} eyebrow={p.hero.eyebrow} title={p.hero.title} intro={p.hero.intro} crumbs={[{ label: crumb, to: "/experiences" }, { label: p.meta.title }]}>
        {p.hero.button && <Link to={p.hero.buttonLink || "/plan-trip"} className="btn btn-ghost-light">{p.hero.button}</Link>}
      </PageHero>

      <section className="py-24 md:py-32">
        <div className="container-x">
          <SectionHeading align="center" eyebrow={p.levels.eyebrow} title={p.levels.title} />
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {p.levels.items.map((l, i) => {
              const Icon = levelIcons[i % levelIcons.length];
              return (
                <Reveal key={i} delay={i * 120} className="rounded-[1.75rem] border border-line bg-paper p-8">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{p.levels.levelLabel} {i + 1}</span>
                  <Icon className="mt-4 size-9 text-terracotta" />
                  <h3 className="mt-4 text-2xl">{l.title}</h3>
                  <p className="mt-3 leading-relaxed text-muted"><Rich text={l.text} accent="text-terracotta" /></p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-paper py-24 md:py-32">
        <div className="container-x grid gap-14 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <SectionHeading eyebrow={p.tour.eyebrow} title={p.tour.title} intro={p.tour.intro} />
          <Gallery photos={p.tour.images} />
        </div>
        <div className="container-x mt-16 flex flex-wrap items-center gap-3">
          <span className="mr-2 text-sm font-semibold text-earth">{p.tour.guidesLabel}</span>
          <DestinationLinks slugs={p.tour.guides} />
        </div>
      </section>

      <CtaBand title={p.cta.title} text={p.cta.text} />
    </>
  );
}

export function Culture() {
  const p = usePage("culture");
  const crumb = usePage("experiences").meta.title;
  const d = useDestinations();
  useMeta(p.meta.title, p.meta.description);
  const cultures = d.byCategory("cultures");
  const peoples = cultures.filter((x) => x.circuit !== "Heritage sites");
  const heritage = [...cultures.filter((x) => x.circuit === "Heritage sites"), ...p.peoples.extraHeritage.map(d.find).filter((x): x is NonNullable<typeof x> => Boolean(x))];
  return (
    <>
      <PageHero photo={p.hero.image} eyebrow={p.hero.eyebrow} title={p.hero.title} intro={p.hero.intro} crumbs={[{ label: crumb, to: "/experiences" }, { label: p.meta.title }]} />

      <section className="py-24 md:py-32">
        <div className="container-x space-y-28">
          {p.stories.map((s, i) => (
            <Split key={i} photo={s.image} eyebrow={s.eyebrow} title={s.title} text={s.text} flip={i % 2 === 1} />
          ))}
        </div>
      </section>

      <section className="bg-paper py-24 md:py-32">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading eyebrow={p.peoples.eyebrow} title={p.peoples.title} intro={p.peoples.intro} />
            <Link to="/destinations/cultures" className="btn btn-ghost">{p.peoples.button}</Link>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {peoples.map((x, i) => (
              <Reveal key={x.slug} delay={(i % 4) * 60}><DestinationCard dest={x} compact /></Reveal>
            ))}
          </div>
          {heritage.length > 0 && (
            <div className="mt-16 rounded-[2rem] bg-cream p-8 md:p-10">
              <p className="eyebrow">{p.peoples.heritageTitle}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                {heritage.map((x) => (
                  <Link key={x.slug} to={`/destinations/${x.category}/${x.slug}`} className="rounded-full border border-line bg-paper px-4 py-2.5 text-sm font-medium text-earth transition-colors hover:border-earth">
                    {x.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="bg-earth py-20 text-cream">
        <div className="container-x flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <p className="eyebrow eyebrow-light">{p.community.eyebrow}</p>
            <h2 className="display-md mt-3 max-w-2xl"><Rich text={p.community.title} /></h2>
          </div>
          <Link to="/community" className="btn btn-sun">{p.community.button} <ArrowRight className="size-4" /></Link>
        </div>
      </section>

      <MoreJourneys title={p.journeysTitle} />
      <CtaBand />
    </>
  );
}

export function BeachSea() {
  const p = usePage("beach");
  const labels = usePage("shared").labels;
  const crumb = usePage("experiences").meta.title;
  useMeta(p.meta.title, p.meta.description);
  return (
    <>
      <PageHero photo={p.hero.image} eyebrow={p.hero.eyebrow} title={p.hero.title} intro={p.hero.intro} crumbs={[{ label: crumb, to: "/experiences" }, { label: p.meta.title }]} />

      <section className="py-24 md:py-32">
        <div className="container-x grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <SectionHeading eyebrow={p.intro.eyebrow} title={p.intro.title} />
            <Reveal delay={120} className="prose-travel mt-6"><Paras text={p.intro.text} /></Reveal>
            <Reveal delay={200} className="mt-8"><Pills items={p.intro.activities} /></Reveal>
          </div>
          <Reveal delay={100} className="relative">
            <Photo photo={p.intro.image} className="aspect-[4/5] rounded-[2rem]" />
            {p.intro.badgeValue && (
              <div className="absolute -bottom-6 -left-6 hidden rounded-2xl bg-paper p-5 shadow-xl md:block">
                <Waves className="size-7 text-terracotta" />
                <p className="mt-2 font-display text-2xl">{p.intro.badgeValue}</p>
                <p className="text-xs uppercase tracking-[0.18em] text-muted">{p.intro.badgeLabel}</p>
              </div>
            )}
          </Reveal>
        </div>
      </section>

      <section className="bg-paper py-24 md:py-32">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading eyebrow={p.coasts.eyebrow} title={p.coasts.title} />
            <Link to="/destinations/islands" className="btn btn-ghost">{p.coasts.button}</Link>
          </div>
          <div className="mt-14 space-y-6">
            {p.coasts.items.map((c, i) => (
              <Reveal key={i} className="grid overflow-hidden rounded-[1.75rem] bg-cream md:grid-cols-[1.1fr_1fr]">
                <Photo photo={c.image} className={`aspect-[16/10] md:aspect-auto md:min-h-[20rem] ${i % 2 ? "md:order-2" : ""}`} />
                <div className="flex flex-col justify-center p-8 md:p-12">
                  <span className="font-display text-sm text-terracotta">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-1 text-3xl md:text-4xl">{c.name}</h3>
                  <p className="mt-4 leading-relaxed text-muted"><Rich text={c.text} accent="text-terracotta" /></p>
                  {c.slug && <Link to={`/destinations/islands/${c.slug}`} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-terracotta">{labels.readGuide} <ArrowRight className="size-4" /></Link>}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container-x max-w-4xl text-center">
          <SectionHeading align="center" eyebrow={p.why.eyebrow} title={p.why.title} intro={p.why.intro} />
        </div>
      </section>

      <MoreJourneys title={p.journeysTitle} />
      <CtaBand />
    </>
  );
}
