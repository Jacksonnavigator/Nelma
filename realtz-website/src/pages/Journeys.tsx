import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowRight, BedDouble, Check, PlaneLanding, PlaneTakeoff, Utensils } from "lucide-react";
import { CtaBand, JourneyCard, MoreJourneys, PageHero, useMeta } from "../components/Layout";
import { Photo } from "../components/Photo";
import { Reveal } from "../components/ui";
import { findJourney, journeys } from "../data/journeys";

const filters = ["All", "Safari", "Culture", "Honeymoon", "Culture & Beach"] as const;

export function JourneysPage() {
  useMeta("Sample journeys", "Private Tanzania itineraries from 8 to 15 days: safaris, cultural journeys, honeymoons and off-the-beaten-track routes, all fully customisable.");
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const list = useMemo(() => (filter === "All" ? journeys : journeys.filter((j) => j.style === filter)), [filter]);

  return (
    <>
      <PageHero
        photo="safariPlains"
        eyebrow="Tailor-made itineraries"
        title={<>Journeys to <em className="text-gold">inspire</em> you.</>}
        intro="No catalogues, no fixed dates, no shared groups. These are starting points; every one can be reshaped around your dates, pace and budget."
        crumbs={[{ label: "Journeys" }]}
      />
      <section className="py-20 md:py-28">
        <div className="container-x">
          <div className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:px-0" role="tablist" aria-label="Filter journeys">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={filter === f}
                onClick={() => setFilter(f)}
                className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${filter === f ? "bg-earth text-cream" : "border border-line bg-paper text-earth hover:border-earth"}`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((j, i) => (
              <Reveal key={j.slug} delay={(i % 3) * 100}>
                <JourneyCard journey={j} />
                <p className="mt-4 px-1 leading-relaxed text-muted">{j.summary}</p>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-20 flex flex-col items-start justify-between gap-6 rounded-[2rem] bg-sand/50 p-8 md:flex-row md:items-center md:p-12">
            <div>
              <h2 className="display-md">Nothing quite right?</h2>
              <p className="mt-3 max-w-xl text-muted">That's the point. Tell us what you dream of and we'll design a journey that exists only for you.</p>
            </div>
            <Link to="/plan-trip" className="btn btn-earth">Design my own journey <ArrowRight className="size-4" /></Link>
          </Reveal>
        </div>
      </section>
      <CtaBand />
    </>
  );
}

export function JourneyDetail() {
  const { slug = "" } = useParams();
  const journey = findJourney(slug);
  const [open, setOpen] = useState<number | null>(1);
  useMeta(journey ? `${journey.title} · ${journey.days} days` : "Journey", journey?.summary);
  if (!journey) return <Navigate to="/journeys" replace />;

  const stays = new Set(journey.itinerary.map((d) => d.stay).filter(Boolean)).size;

  return (
    <>
      <PageHero
        photo={journey.photo}
        eyebrow={journey.kicker}
        title={journey.title}
        intro={journey.summary}
        crumbs={[{ label: "Journeys", to: "/journeys" }, { label: `${journey.days} days` }]}
      >
        <Link to={`/plan-trip?journey=${journey.slug}`} className="btn btn-sun">Customise this journey</Link>
      </PageHero>

      <section className="border-b border-line bg-paper">
        <div className="container-x grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
          {[
            { label: "Duration", value: `${journey.days} days` },
            { label: "Style", value: journey.style },
            { label: "Arrival", value: journey.arrival, icon: PlaneLanding },
            { label: "Departure", value: journey.departure, icon: PlaneTakeoff },
          ].map((f) => (
            <div key={f.label}>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">{f.icon && <f.icon className="size-4 text-terracotta" />}{f.label}</p>
              <p className="mt-1 font-display text-xl text-ink">{f.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="container-x grid gap-16 lg:grid-cols-[1fr_22rem]">
          <div>
            <p className="eyebrow">Your journey</p>
            <h2 className="display-md mt-3">Day by day</h2>
            <ol className="relative mt-10 border-l border-dashed border-sand-deep pl-8 md:pl-10">
              {journey.itinerary.map((d) => {
                const isOpen = open === d.day;
                const hasMore = Boolean(d.text || d.photo);
                return (
                  <li key={d.day} className="relative pb-6">
                    <span className={`absolute -left-[3.05rem] top-1 grid size-9 place-items-center rounded-full text-xs font-bold md:-left-[3.55rem] ${isOpen ? "bg-gradient-to-br from-gold to-sunset text-night" : "border border-sand-deep bg-cream text-earth"}`}>
                      {String(d.day).padStart(2, "0")}
                    </span>
                    <button
                      type="button"
                      disabled={!hasMore}
                      onClick={() => setOpen(isOpen ? null : d.day)}
                      aria-expanded={isOpen}
                      className="w-full text-left"
                    >
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Day {d.day}</span>
                      <span className="mt-1 flex items-center justify-between gap-4">
                        <span className={`font-display text-2xl transition-colors ${isOpen ? "text-terracotta" : "text-ink"}`}>{d.title}</span>
                        {hasMore && <span className={`text-2xl text-terracotta transition-transform ${isOpen ? "rotate-45" : ""}`}>+</span>}
                      </span>
                    </button>
                    <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
                      {d.stay && <span className="flex items-center gap-2"><BedDouble className="size-4 text-terracotta" />{d.stay}</span>}
                      {d.meals && <span className="flex items-center gap-2"><Utensils className="size-4 text-terracotta" />{d.meals}</span>}
                    </div>
                    <div className={`grid transition-all duration-500 ${isOpen && hasMore ? "mt-5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                      <div className="overflow-hidden">
                        <div className="flex flex-col gap-5 md:flex-row">
                          {d.photo && <Photo photo={d.photo} className="aspect-[16/10] w-full shrink-0 rounded-2xl md:w-64" />}
                          {d.text && <p className="leading-relaxed text-muted">{d.text}</p>}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-[1.75rem] border border-line bg-paper p-7">
              <p className="eyebrow">Everything taken care of</p>
              <h3 className="mt-2 text-2xl">What's included</h3>
              <ul className="mt-5 space-y-3">
                {journey.included.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-muted"><Check className="mt-0.5 size-4 shrink-0 text-terracotta" />{item}</li>
                ))}
              </ul>
              <div className="mt-6 border-t border-line pt-6">
                <p className="text-sm text-muted">Highlights</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {journey.highlights.map((h) => <span key={h} className="rounded-full bg-sand/60 px-3 py-1.5 text-xs font-medium text-earth">{h}</span>)}
                </div>
                <p className="mt-5 text-sm text-muted">{stays} hand-picked places to stay</p>
              </div>
              <Link to={`/plan-trip?journey=${journey.slug}`} className="btn btn-earth mt-7 w-full">Request this journey</Link>
              <p className="mt-3 text-center text-xs text-muted">Free and without obligation. Prices on request, tailored to your dates.</p>
            </div>
          </aside>
        </div>
      </section>

      <MoreJourneys exclude={journey.slug} title="You might also love" />
      <CtaBand title="Make it yours." text="Change the pace, add a beach, swap a lodge for a homestay. Every detail can be adjusted." />
    </>
  );
}
