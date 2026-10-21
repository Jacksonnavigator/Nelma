import { Link } from "react-router-dom";
import { BedDouble, CloudSun, House, ShieldCheck, Tent } from "lucide-react";
import { CtaBand, MoreJourneys, PageHero, useMeta } from "../components/Layout";
import { Split } from "../components/Split";
import { Photo } from "../components/Photo";
import { Reveal, SectionHeading } from "../components/ui";
import { Rich } from "../content/rich";
import { useContent, usePage } from "../content/store";

const stayIcons = [Tent, BedDouble, House];

export default function Tanzania() {
  const p = usePage("tanzania");
  const experiences = useContent().experiences;
  useMeta(p.meta.title, p.meta.description);
  return (
    <>
      <PageHero photo={p.hero.image} eyebrow={p.hero.eyebrow} title={p.hero.title} intro={p.hero.intro} crumbs={[{ label: p.meta.title }]} />

      <section className="py-24 md:py-32">
        <div className="container-x space-y-28">
          <Split photo={p.home.image} eyebrow={p.home.eyebrow} title={p.home.title} text={p.home.text} />
          <Split photo={p.beyond.image} eyebrow={p.beyond.eyebrow} title={p.beyond.title} text={p.beyond.text} flip />
        </div>
      </section>

      <section className="bg-night py-24 text-cream md:py-28">
        <div className="container-x grid gap-12 lg:grid-cols-3">
          <Reveal className="lg:col-span-1">
            <ShieldCheck className="size-10 text-gold" />
            <h2 className="display-md mt-6"><Rich text={p.safety.title} /></h2>
            <p className="mt-5 leading-relaxed text-cream/70"><Rich text={p.safety.text} /></p>
          </Reveal>
          <Reveal delay={120} className="lg:col-span-2">
            <div className="flex items-center gap-3"><CloudSun className="size-6 text-gold" /><p className="eyebrow eyebrow-light">{p.climate.eyebrow}</p></div>
            <p className="mt-5 text-lg leading-relaxed text-cream/80"><Rich text={p.climate.text} /></p>
            <div className="mt-8 grid grid-cols-6 gap-2 sm:grid-cols-12">
              {p.climate.months.map(({ month, rating }, i) => (
                <div key={i} className="text-center">
                  <div className={`h-16 rounded-xl ${rating >= 3 ? "bg-gradient-to-t from-sunset to-gold" : rating === 2 ? "bg-gold/40" : "bg-white/10"}`} />
                  <p className="mt-2 text-xs text-cream/60">{month}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-5 text-xs text-cream/60">
              <span className="flex items-center gap-2"><span className="size-3 rounded bg-gold" /> {p.climate.legendIdeal}</span>
              <span className="flex items-center gap-2"><span className="size-3 rounded bg-gold/40" /> {p.climate.legendGood}</span>
              <span className="flex items-center gap-2"><span className="size-3 rounded bg-white/10" /> {p.climate.legendRain}</span>
            </div>
            <p className="mt-6 text-sm text-cream/60"><Rich text={p.climate.note} /></p>
          </Reveal>
        </div>
      </section>

      <section className="py-24 md:py-32">
        <div className="container-x">
          <SectionHeading eyebrow={p.stay.eyebrow} title={p.stay.title} />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {p.stay.options.map((a, i) => {
              const Icon = stayIcons[i % stayIcons.length];
              return (
                <Reveal key={i} delay={i * 120} className="rounded-[1.75rem] border border-line bg-paper p-8">
                  <Icon className="size-8 text-terracotta" />
                  <h3 className="mt-5 text-2xl">{a.title}</h3>
                  <p className="mt-3 leading-relaxed text-muted"><Rich text={a.text} accent="text-terracotta" /></p>
                </Reveal>
              );
            })}
          </div>

          <div className="mt-24 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {experiences.map((e, i) => (
              <Reveal key={i} delay={i * 80}>
                <Link to={e.to} className="group relative block aspect-[4/3] overflow-hidden rounded-[1.5rem]">
                  <Photo photo={e.photo} className="absolute inset-0" imgClassName="transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-night/85 to-transparent" />
                  <span className="absolute bottom-5 left-5 font-display text-2xl text-white">{e.title}</span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <MoreJourneys />
      <CtaBand />
    </>
  );
}
