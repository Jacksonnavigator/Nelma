import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowRight, CalendarDays, Check, Compass, MapPin, Navigation, Ruler } from "lucide-react";
import { CtaBand, PageHero, useMeta } from "../components/Layout";
import { PlaceImage } from "../components/PlaceImage";
import { Reveal, SectionHeading } from "../components/ui";
import { byCategory, categories, findDestination, isCategory, type CategoryKey, type Destination } from "../data/destinations";

const order: CategoryKey[] = ["national-parks", "mountains", "islands"];

export function DestinationCard({ dest, compact = false }: { dest: Destination; compact?: boolean }) {
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
          Discover <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

export function DestinationsOverview() {
  useMeta("Destinations", "Tanzania's national parks, mountains and islands: Serengeti, Ngorongoro, Ruaha, Nyerere, Katavi, Mahale, Kilimanjaro, Meru, Zanzibar, Mafia and more.");
  return (
    <>
      <PageHero
        photo="safariPlains"
        eyebrow="Destinations"
        title={<>Where will Tanzania <em className="text-gold">take you</em>?</>}
        intro="From the famous northern circuit to remote parks in the south and west, from Africa's highest summit to spice islands and coral atolls. Explore our destination guide."
        crumbs={[{ label: "Destinations" }]}
      >
        {order.map((c) => (
          <a key={c} href={`#${c}`} className="btn btn-ghost-light">{categories[c].short}</a>
        ))}
      </PageHero>

      {order.map((c, i) => {
        const list = byCategory(c);
        return (
          <section key={c} id={c} className={`scroll-mt-24 py-24 md:py-28 ${i % 2 ? "bg-paper" : ""}`}>
            <div className="container-x">
              <div className="flex flex-wrap items-end justify-between gap-6">
                <SectionHeading eyebrow={categories[c].eyebrow} title={categories[c].title} intro={categories[c].intro} />
                <Link to={`/destinations/${c}`} className="btn btn-ghost">All {list.length} {categories[c].short.toLowerCase()}</Link>
              </div>
              <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {list.slice(0, 4).map((d, k) => (
                  <Reveal key={d.slug} delay={k * 80}><DestinationCard dest={d} compact /></Reveal>
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
            <h2 className="display-md">Beyond the familiar routes</h2>
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-cream/75">
              Some of Africa's most remarkable experiences begin where the usual itinerary ends. We don't promise that every remote place is easy to reach or right for every traveller. We bring honest advice, realistic planning and a willingness to explore the right options for your journey.
            </p>
          </div>
        </div>
      </section>
      <CtaBand title="Not sure where to start?" text="Tell us what you'd love to see and experience, and we'll suggest the destinations, route and season that fit you best." />
    </>
  );
}

export function DestinationCategory() {
  const { category = "" } = useParams();
  return <CategoryList key={category} category={category} />;
}

function CategoryList({ category }: { category: string }) {
  const valid = isCategory(category);
  const list = useMemo(() => (valid ? byCategory(category) : []), [category, valid]);
  const regions = useMemo(() => (category === "national-parks" ? ["All", ...Array.from(new Set(list.map((d) => d.circuit ?? "Other")))] : []), [list, category]);
  const [region, setRegion] = useState("All");
  const cat = valid ? categories[category] : undefined;
  useMeta(cat?.title ?? "Destinations", cat?.intro);
  if (!valid || !cat) return <Navigate to="/destinations" replace />;

  const shown = region === "All" ? list : list.filter((d) => (d.circuit ?? "Other") === region);

  return (
    <>
      <PageHero photo={cat.photo} eyebrow={cat.eyebrow} title={cat.title} intro={cat.intro} crumbs={[{ label: "Destinations", to: "/destinations" }, { label: cat.short }]} />
      <section className="py-20 md:py-28">
        <div className="container-x">
          {regions.length > 2 && (
            <div className="scrollbar-none -mx-5 mb-12 flex gap-2 overflow-x-auto px-5 md:mx-0 md:px-0">
              {regions.map((r) => (
                <button key={r} type="button" onClick={() => setRegion(r)} aria-pressed={region === r} className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${region === r ? "bg-earth text-cream" : "border border-line bg-paper text-earth hover:border-earth"}`}>
                  {r}
                </button>
              ))}
            </div>
          )}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((d, i) => (
              <Reveal key={d.slug} delay={(i % 3) * 80}><DestinationCard dest={d} /></Reveal>
            ))}
          </div>
          <div className="mt-20 flex flex-wrap gap-3">
            {order.filter((c) => c !== category).map((c) => (
              <Link key={c} to={`/destinations/${c}`} className="btn btn-ghost">Explore {categories[c].short.toLowerCase()} <ArrowRight className="size-4" /></Link>
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
  const dest = findDestination(slug);
  useMeta(dest ? `${dest.name}` : "Destination", dest?.summary);
  if (!dest) return <Navigate to={isCategory(category) ? `/destinations/${category}` : "/destinations"} replace />;
  if (dest.category !== category) return <Navigate to={`/destinations/${dest.category}/${dest.slug}`} replace />;
  const cat = categories[dest.category];
  const combine = dest.combineWith.map(findDestination).filter((d): d is Destination => Boolean(d));

  const facts = [
    { icon: MapPin, label: "Region", value: dest.region },
    { icon: Compass, label: "Type", value: dest.type },
    ...(dest.size ? [{ icon: Ruler, label: dest.category === "mountains" ? "Height" : "Size", value: dest.size }] : []),
    { icon: CalendarDays, label: "Best time", value: dest.bestTime.split(".")[0] },
  ];

  return (
    <>
      <PageHero
        background={<PlaceImage dest={dest} eager big className="absolute inset-0" imgClassName="animate-kenburns" />}
        eyebrow={cat.short}
        title={dest.name}
        intro={dest.tagline}
        crumbs={[{ label: "Destinations", to: "/destinations" }, { label: cat.short, to: `/destinations/${dest.category}` }, { label: dest.name }]}
      >
        <Link to={`/plan-trip?destination=${dest.slug}`} className="btn btn-sun">Plan a trip here</Link>
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
              <p className="font-display text-2xl leading-relaxed text-earth md:text-[1.7rem]">{dest.summary}</p>
            </Reveal>
            <Reveal delay={100} className="prose-travel mt-10">
              {dest.body.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
            </Reveal>

            <Reveal delay={100} className="mt-14 grid gap-6 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-line bg-paper p-7">
                <h2 className="text-2xl">Highlights</h2>
                <ul className="mt-4 space-y-2.5">
                  {dest.highlights.map((h) => <li key={h} className="flex gap-3 text-muted"><Check className="mt-0.5 size-4 shrink-0 text-terracotta" />{h}</li>)}
                </ul>
              </div>
              <div className="rounded-[1.5rem] border border-line bg-paper p-7">
                <h2 className="text-2xl">Things to do</h2>
                <ul className="mt-4 space-y-2.5">
                  {dest.activities.map((h) => <li key={h} className="flex gap-3 text-muted"><Check className="mt-0.5 size-4 shrink-0 text-terracotta" />{h}</li>)}
                </ul>
              </div>
            </Reveal>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-[1.75rem] bg-earth p-7 text-cream">
              <p className="flex items-center gap-2 eyebrow eyebrow-light"><CalendarDays className="size-4" /> Best time to visit</p>
              <p className="mt-3 leading-relaxed text-cream/85">{dest.bestTime}</p>
              <p className="mt-6 flex items-center gap-2 eyebrow eyebrow-light"><Navigation className="size-4" /> Getting there</p>
              <p className="mt-3 leading-relaxed text-cream/85">{dest.gettingThere}</p>
              <Link to={`/plan-trip?destination=${dest.slug}`} className="btn btn-sun mt-7 w-full">Plan a trip here</Link>
            </div>
            <p className="px-2 text-xs leading-relaxed text-muted">Conditions, access and seasons can change. We always give you honest, up-to-date advice when planning.</p>
          </aside>
        </div>
      </section>

      {combine.length > 0 && (
        <section className="bg-paper py-20 md:py-24">
          <div className="container-x">
            <p className="eyebrow">Combine it with</p>
            <h2 className="display-md mt-3">Pairs perfectly with</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {combine.map((d) => <DestinationCard key={d.slug} dest={d} compact />)}
            </div>
          </div>
        </section>
      )}
      <CtaBand title={`Dreaming of ${dest.name.split(" (")[0]}?`} text="Tell us when you'd like to travel and what matters to you. We'll build a route that makes sense, with honest advice on logistics and seasons." />
    </>
  );
}
