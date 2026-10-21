import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowRight, BedDouble, Check, PlaneLanding, PlaneTakeoff, Utensils } from "lucide-react";
import { CtaBand, JourneyCard, MoreJourneys, PageHero, useMeta } from "../components/Layout";
import { Photo } from "../components/Photo";
import { Reveal } from "../components/ui";
import { Rich } from "../content/rich";
import { useJourneys, usePage } from "../content/store";

export function JourneysPage() {
  const p = usePage("journeys");
  const { list: journeys } = useJourneys();
  useMeta(p.meta.title, p.meta.description);
  const styles = useMemo(() => Array.from(new Set(journeys.map((j) => j.style).filter(Boolean))), [journeys]);
  const [filter, setFilter] = useState("");
  const list = filter ? journeys.filter((j) => j.style === filter) : journeys;

  return (
    <>
      <PageHero photo={p.hero.image} eyebrow={p.hero.eyebrow} title={p.hero.title} intro={p.hero.intro} crumbs={[{ label: p.meta.title }]} />
      <section className="py-20 md:py-28">
        <div className="container-x">
          {styles.length > 1 && (
            <div className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:px-0" role="tablist" aria-label="Filter journeys">
              {["", ...styles].map((f) => (
                <button
                  key={f || "all"}
                  type="button"
                  role="tab"
                  aria-selected={filter === f}
                  onClick={() => setFilter(f)}
                  className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${filter === f ? "bg-earth text-cream" : "border border-line bg-paper text-earth hover:border-earth"}`}
                >
                  {f || p.filterAll}
                </button>
              ))}
            </div>
          )}
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
              <h2 className="display-md"><Rich text={p.custom.title} accent="text-terracotta" /></h2>
              <p className="mt-3 max-w-xl text-muted"><Rich text={p.custom.text} accent="text-terracotta" /></p>
            </div>
            <Link to="/plan-trip" className="btn btn-earth">{p.custom.button} <ArrowRight className="size-4" /></Link>
          </Reveal>
        </div>
      </section>
      <CtaBand />
    </>
  );
}

export function JourneyDetail() {
  const { slug = "" } = useParams();
  const p = usePage("journeys");
  const labels = usePage("shared").labels;
  const t = p.detail;
  const journey = useJourneys().find(slug);
  const [open, setOpen] = useState<number | null>(0);
  useMeta(journey ? `${journey.title} · ${journey.days} ${labels.days}` : p.meta.title, journey?.summary);
  if (!journey) return <Navigate to="/journeys" replace />;

  const stays = new Set(journey.itinerary.map((d) => d.stay).filter(Boolean)).size;

  return (
    <>
      <PageHero photo={journey.photo} eyebrow={journey.kicker} title={journey.title} intro={journey.summary} crumbs={[{ label: p.meta.title, to: "/journeys" }, { label: `${journey.days} ${labels.days}` }]}>
        <Link to={`/plan-trip?journey=${journey.slug}`} className="btn btn-sun">{t.customiseButton}</Link>
      </PageHero>

      <section className="border-b border-line bg-paper">
        <div className="container-x grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
          {[
            { label: t.durationLabel, value: `${journey.days} ${labels.days}` },
            { label: t.styleLabel, value: journey.style },
            { label: t.arrivalLabel, value: journey.arrival, icon: PlaneLanding },
            { label: t.departureLabel, value: journey.departure, icon: PlaneTakeoff },
          ].filter((f) => f.value).map((f) => (
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
            <p className="eyebrow">{t.dayByDayEyebrow}</p>
            <h2 className="display-md mt-3">{t.dayByDayTitle}</h2>
            <ol className="relative mt-10 border-l border-dashed border-sand-deep pl-8 md:pl-10">
              {journey.itinerary.map((d, idx) => {
                const isOpen = open === idx;
                const hasMore = Boolean(d.text || d.photo);
                return (
                  <li key={idx} className="relative pb-6">
                    <span className={`absolute -left-[3.05rem] top-1 grid size-9 place-items-center rounded-full text-xs font-bold md:-left-[3.55rem] ${isOpen ? "bg-gradient-to-br from-gold to-sunset text-night" : "border border-sand-deep bg-cream text-earth"}`}>
                      {String(d.day).padStart(2, "0")}
                    </span>
                    <button type="button" disabled={!hasMore} onClick={() => setOpen(isOpen ? null : idx)} aria-expanded={isOpen} className="w-full text-left">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{t.dayLabel} {d.day}</span>
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
                          {d.text && <p className="leading-relaxed text-muted"><Rich text={d.text} accent="text-terracotta" /></p>}
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
              <p className="eyebrow">{t.includedEyebrow}</p>
              <h3 className="mt-2 text-2xl">{t.includedTitle}</h3>
              <ul className="mt-5 space-y-3">
                {journey.included.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-muted"><Check className="mt-0.5 size-4 shrink-0 text-terracotta" />{item}</li>
                ))}
              </ul>
              <div className="mt-6 border-t border-line pt-6">
                <p className="text-sm text-muted">{t.highlightsLabel}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {journey.highlights.map((h, i) => <span key={i} className="rounded-full bg-sand/60 px-3 py-1.5 text-xs font-medium text-earth">{h}</span>)}
                </div>
                {stays > 0 && <p className="mt-5 text-sm text-muted">{stays} {t.staysLabel}</p>}
              </div>
              <Link to={`/plan-trip?journey=${journey.slug}`} className="btn btn-earth mt-7 w-full">{t.requestButton}</Link>
              <p className="mt-3 text-center text-xs text-muted">{t.requestNote}</p>
            </div>
          </aside>
        </div>
      </section>

      <MoreJourneys exclude={journey.slug} title={t.moreTitle} />
      <CtaBand title={t.ctaTitle} text={t.ctaText} />
    </>
  );
}
