import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowRight, CalendarDays, Check, Compass, Languages, MapPin, Navigation, Ruler } from "lucide-react";
import { CtaBand, PageHero, useMeta } from "../components/Layout";
import { PlaceImage } from "../components/PlaceImage";
import { Reveal, SectionHeading } from "../components/ui";
import { Paras, Rich } from "../content/rich";
import { fill, useDestinations, usePage } from "../content/store";
import type { DestinationT as Destination } from "../content/defaults";

export function DestinationCard({ dest, compact = false }: { dest: Destination; compact?: boolean }) {
  const discover = usePage("shared").labels.discover;
  return (
    <Link to={`/destinations/${dest.category}/${dest.slug}`} className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-line bg-paper transition-shadow hover:shadow-2xl hover:shadow-earth/10">
      <div className="relative">
        <PlaceImage dest={dest} className={compact ? "aspect-[16/10]" : "aspect-[4/3]"} imgClassName="transition-transform duration-[1.2s] group-hover:scale-105" />
        {dest.circuit && <span className="absolute bottom-4 left-4 rounded-full bg-cream/95 px-3 py-1 text-xs font-semibold text-earth">{dest.circuit}</span>}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{dest.region}</p>
        <h3 className="mt-2 text-2xl leading-tight">{dest.name}</h3>
        <p className="mt-2 font-display italic text-terracotta">{dest.tagline}</p>
        {!compact && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{dest.summary}</p>}
        <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-terracotta">
          {discover} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

export function DestinationsOverview() {
  const p = usePage("destinations");
  const d = useDestinations();
  useMeta(p.meta.title, p.meta.description);
  return (
    <>
      <PageHero photo={p.hero.image} eyebrow={p.hero.eyebrow} title={p.hero.title} intro={p.hero.intro} crumbs={[{ label: p.meta.title }]}>
        {d.order.map((c) => (
          <a key={c} href={`#${c}`} className="btn btn-ghost-light">{d.categories[c].short}</a>
        ))}
      </PageHero>

      {d.order.map((c, i) => {
        const list = d.byCategory(c);
        const cat = d.categories[c];
        return (
          <section key={c} id={c} className={`scroll-mt-24 py-24 md:py-28 ${i % 2 ? "bg-paper" : ""}`}>
            <div className="container-x">
              <div className="flex flex-wrap items-end justify-between gap-6">
                <SectionHeading eyebrow={cat.eyebrow} title={cat.title} intro={cat.intro} />
                <Link to={`/destinations/${c}`} className="btn btn-ghost">{p.allPrefix} {list.length} {cat.short.toLowerCase()}</Link>
              </div>
              <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {list.slice(0, 4).map((x, k) => (
                  <Reveal key={x.slug} delay={k * 80}><DestinationCard dest={x} compact /></Reveal>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      <section className="bg-night py-24 text-cream">
        <div className="container-x grid gap-10 md:grid-cols-[auto_1fr] md:items-center">
          <Compass className="size-14 text-gold" />
          <div>
            <h2 className="display-md"><Rich text={p.beyond.title} /></h2>
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-cream/75"><Rich text={p.beyond.text} /></p>
          </div>
        </div>
      </section>
      <CtaBand title={p.cta.title} text={p.cta.text} />
    </>
  );
}

export function DestinationCategory() {
  const { category = "" } = useParams();
  return <CategoryList key={category} category={category} />;
}

function CategoryList({ category }: { category: string }) {
  const p = usePage("destinations");
  const d = useDestinations();
  const cat = d.categories[category];
  const list = useMemo(() => d.byCategory(category), [d, category]);
  const groups = useMemo(() => Array.from(new Set(list.map((x) => x.circuit).filter(Boolean))), [list]);
  const [group, setGroup] = useState("");
  useMeta(cat?.title ?? p.meta.title, cat?.intro);
  if (!cat) return <Navigate to="/destinations" replace />;

  const shown = group ? list.filter((x) => x.circuit === group) : list;

  return (
    <>
      <PageHero photo={cat.photo} eyebrow={cat.eyebrow} title={cat.title} intro={cat.intro} crumbs={[{ label: p.meta.title, to: "/destinations" }, { label: cat.short }]} />
      <section className="py-20 md:py-28">
        <div className="container-x">
          {groups.length > 1 && (
            <div className="scrollbar-none -mx-5 mb-12 flex gap-2 overflow-x-auto px-5 md:mx-0 md:px-0">
              {["", ...groups].map((r) => (
                <button key={r || "all"} type="button" onClick={() => setGroup(r)} aria-pressed={group === r} className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${group === r ? "bg-earth text-cream" : "border border-line bg-paper text-earth hover:border-earth"}`}>
                  {r || p.filterAll}
                </button>
              ))}
            </div>
          )}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((x, i) => (
              <Reveal key={x.slug} delay={(i % 3) * 80}><DestinationCard dest={x} /></Reveal>
            ))}
          </div>
          <div className="mt-20 flex flex-wrap gap-3">
            {d.order.filter((c) => c !== category).map((c) => (
              <Link key={c} to={`/destinations/${c}`} className="btn btn-ghost">{p.explorePrefix} {d.categories[c].short.toLowerCase()} <ArrowRight className="size-4" /></Link>
            ))}
          </div>
        </div>
      </section>
      <CtaBand />
    </>
  );
}

export function DestinationDetail() {
  const { category = "", slug = "" } = useParams();
  const p = usePage("destinations");
  const labels = usePage("shared").labels;
  const d = useDestinations();
  const dest = d.find(slug);
  useMeta(dest ? dest.name : p.meta.title, dest?.summary);
  if (!dest) return <Navigate to={d.categories[category] ? `/destinations/${category}` : "/destinations"} replace />;
  if (dest.category !== category) return <Navigate to={`/destinations/${dest.category}/${dest.slug}`} replace />;
  const cat = d.categories[dest.category] ?? { short: dest.category };
  const t = p.detail;
  const combine = dest.combineWith.map(d.find).filter((x): x is Destination => Boolean(x));

  const facts = [
    { icon: MapPin, label: t.regionLabel, value: dest.region },
    { icon: Compass, label: t.typeLabel, value: dest.type },
    ...(dest.size ? [{ icon: dest.category === "cultures" ? Languages : Ruler, label: dest.category === "mountains" ? t.heightLabel : dest.category === "cultures" ? t.languageLabel : t.sizeLabel, value: dest.size }] : []),
    { icon: CalendarDays, label: t.bestTimeLabel, value: dest.bestTime.split(".")[0] },
  ].filter((f) => f.value);

  return (
    <>
      <PageHero
        background={<PlaceImage dest={dest} eager big className="absolute inset-0" imgClassName="animate-kenburns" />}
        eyebrow={cat.short}
        title={dest.name}
        intro={dest.tagline}
        crumbs={[{ label: p.meta.title, to: "/destinations" }, { label: cat.short, to: `/destinations/${dest.category}` }, { label: dest.name }]}
      >
        <Link to={`/plan-trip?destination=${dest.slug}`} className="btn btn-sun">{labels.planTripHere}</Link>
      </PageHero>

      <section className="border-b border-line bg-paper">
        <div className="container-x grid grid-cols-1 gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((f) => (
            <div key={f.label} className="flex gap-3">
              <f.icon className="mt-1 size-5 shrink-0 text-terracotta" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{f.label}</p>
                <p className="mt-1 text-ink">{f.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="container-x grid gap-16 lg:grid-cols-[1fr_22rem]">
          <div>
            <Reveal>
              <p className="font-display text-2xl leading-relaxed text-earth md:text-[1.7rem]"><Rich text={dest.summary} accent="text-terracotta" /></p>
            </Reveal>
            <Reveal delay={100} className="prose-travel mt-10">
              <Paras text={dest.body} />
            </Reveal>

            <Reveal delay={100} className="mt-14 grid gap-6 sm:grid-cols-2">
              {[{ title: t.highlightsTitle, items: dest.highlights }, { title: t.activitiesTitle, items: dest.activities }].filter((b) => b.items.length).map((b) => (
                <div key={b.title} className="rounded-[1.5rem] border border-line bg-paper p-7">
                  <h2 className="text-2xl">{b.title}</h2>
                  <ul className="mt-4 space-y-2.5">
                    {b.items.map((h, i) => <li key={i} className="flex gap-3 text-muted"><Check className="mt-0.5 size-4 shrink-0 text-terracotta" />{h}</li>)}
                  </ul>
                </div>
              ))}
            </Reveal>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-[1.75rem] bg-earth p-7 text-cream">
              {dest.bestTime && (
                <>
                  <p className="flex items-center gap-2 eyebrow eyebrow-light"><CalendarDays className="size-4" /> {t.bestTimeTitle}</p>
                  <p className="mb-6 mt-3 leading-relaxed text-cream/85">{dest.bestTime}</p>
                </>
              )}
              {dest.gettingThere && (
                <>
                  <p className="flex items-center gap-2 eyebrow eyebrow-light"><Navigation className="size-4" /> {t.gettingThereTitle}</p>
                  <p className="mt-3 leading-relaxed text-cream/85">{dest.gettingThere}</p>
                </>
              )}
              <Link to={`/plan-trip?destination=${dest.slug}`} className="btn btn-sun mt-7 w-full">{labels.planTripHere}</Link>
            </div>
            <p className="px-2 text-xs leading-relaxed text-muted">{t.disclaimer}</p>
          </aside>
        </div>
      </section>

      {combine.length > 0 && (
        <section className="bg-paper py-20 md:py-24">
          <div className="container-x">
            <p className="eyebrow">{t.combineEyebrow}</p>
            <h2 className="display-md mt-3">{t.combineTitle}</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {combine.map((x) => <DestinationCard key={x.slug} dest={x} compact />)}
            </div>
          </div>
        </section>
      )}
      <CtaBand title={fill(t.ctaTitle, { name: dest.name.split(" (")[0] })} text={t.ctaText} />
    </>
  );
}
