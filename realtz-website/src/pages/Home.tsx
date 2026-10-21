import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { Photo } from "../components/Photo";
import { FlightPath, Reveal, SectionHeading, TextLink } from "../components/ui";
import { CtaBand, JourneyCard, useMeta } from "../components/Layout";
import { experiences, partners, reviews, stats, steps, values } from "../data/content";
import { journeys } from "../data/journeys";
import { site } from "../data/site";
import { byCategory, categories, type CategoryKey } from "../data/destinations";
import type { PhotoKey } from "../data/images";

const slides: { photo: PhotoKey; label: string }[] = [
  { photo: "safariHero", label: "Safari" },
  { photo: "kiliSummit", label: "Trekking" },
  { photo: "sameWomen", label: "Culture" },
  { photo: "zanzibarWomen", label: "Beach & Sea" },
];

function Hero() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6500);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="grain relative flex min-h-[100svh] flex-col overflow-hidden bg-night text-white">
      {slides.map((s, i) => (
        <div key={s.photo} className={`absolute inset-0 transition-opacity duration-[1800ms] ${i === index ? "opacity-100" : "opacity-0"}`}>
          <Photo photo={s.photo} eager={i === 0} className="absolute inset-0" imgClassName={i === index ? "animate-kenburns" : ""} />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-night via-night/35 to-night/30" />
      <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_80%_10%,rgba(233,169,58,0.28),transparent_70%)]" />

      <div className="container-x relative flex flex-1 flex-col justify-end pb-12 pt-32 md:pb-16 lg:pt-40">
        <p className="eyebrow eyebrow-light rise">Fascination Tanzania · Since our childhood</p>
        <h1 className="display-xl rise mt-6 max-w-5xl" style={{ animationDelay: "120ms" }}>
          Our heart beats for <em className="font-light text-gold">your</em> dream trip.
        </h1>
        <p className="rise mt-6 max-w-xl text-lg leading-relaxed text-white/80 md:text-xl" style={{ animationDelay: "240ms" }}>
          Private journeys through Tanzania, planned by Tanzanians. Safari, mountains, real encounters and the turquoise sea, shaped entirely around you.
        </p>
        <div className="rise mt-9 flex flex-wrap gap-3" style={{ animationDelay: "360ms" }}>
          <Link to="/plan-trip" className="btn btn-sun !px-8 !py-4">
            Plan your trip now <ArrowRight className="size-4" />
          </Link>
          <Link to="/journeys" className="btn btn-ghost-light !px-8 !py-4">Explore journeys</Link>
        </div>

        <div className="mt-14 flex flex-wrap items-end justify-between gap-6 border-t border-white/15 pt-6">
          <div className="flex gap-4 sm:gap-6">
            {slides.map((s, i) => (
              <button
                key={s.label}
                type="button"
                onClick={() => setIndex(i)}
                className={`group text-left text-[0.62rem] font-semibold uppercase tracking-[0.12em] transition-colors sm:text-sm sm:tracking-[0.2em] ${i === index ? "text-white" : "text-white/45 hover:text-white/80"}`}
              >
                <span className="mb-3 block h-0.5 w-10 overflow-hidden rounded bg-white/20 sm:w-20">
                  <span className={`block h-full bg-gold ${i === index ? "w-full transition-[width] duration-[6500ms] ease-linear" : "w-0"}`} />
                </span>
                {s.label}
              </button>
            ))}
          </div>
          <p className="hidden text-sm text-white/60 md:block">{site.tagline}</p>
        </div>
      </div>
    </section>
  );
}

function Intro() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <div className="container-x grid gap-16 lg:grid-cols-2 lg:items-center">
        <div>
          <Reveal>
            <p className="eyebrow">Tanzania and its natural wealth</p>
            <h2 className="display-lg mt-4">
              We are <em className="text-terracotta">Real</em> Tanzania.
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="mt-7 text-lg leading-relaxed text-muted">
              Our hearts beat for Tanzania, and that's a good thing, because it lets us do everything we can to win you over to our wonderful country. As native Tanzanians we know it like the back of our hand, we know the people and the paths, and of course we speak Swahili, which opens many doors along the way.
            </p>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              Is Tanzania only for safari fans? Quite the opposite. From Africa's highest mountain in ice and snow to the finest dives along the coast, from vast parks full of wildlife to the treasures of our peaceful peoples, a land awaits that will electrify your senses.
            </p>
          </Reveal>
          <Reveal delay={200} className="mt-9 flex flex-wrap items-center gap-6">
            <Link to="/about-us" className="btn btn-earth">Get to know us</Link>
            <TextLink to="/tanzania">Why Tanzania?</TextLink>
          </Reveal>
        </div>

        <Reveal delay={150} className="relative mx-auto w-full max-w-xl">
          <Photo photo="culturalBuffet" className="aspect-[4/5] w-[78%] rounded-[2rem] shadow-2xl shadow-earth/25" />
          <Photo photo="kiliGroup" className="absolute -bottom-10 right-0 aspect-square w-[52%] rounded-[2rem] border-8 border-cream shadow-2xl shadow-earth/25" />
          <div className="animate-float absolute -left-4 top-10 rounded-2xl bg-paper px-5 py-4 shadow-xl shadow-earth/15 md:-left-10">
            <p className="font-display text-3xl text-terracotta">100%</p>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Tanzanian team</p>
          </div>
        </Reveal>
      </div>

      <div className="container-x mt-28">
        <div className="grid gap-px overflow-hidden rounded-[2rem] border border-line bg-line md:grid-cols-3">
        {values.map((v, i) => (
          <Reveal key={v.title} delay={i * 120} className="bg-paper p-8 md:p-10">
            <span className="font-display text-5xl text-sand-deep">0{i + 1}</span>
            <h3 className="mt-4 text-3xl">{v.title}</h3>
            <p className="mt-3 leading-relaxed text-muted">{v.text}</p>
          </Reveal>
        ))}
        </div>
      </div>
    </section>
  );
}

function Experiences() {
  return (
    <section className="bg-night py-24 text-cream md:py-32">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            light
            eyebrow="Enchanting and diverse"
            title={<>See for yourself.</>}
            intro="What does your heart beat for? Tanzania is as diverse as hardly any other destination, and one of the safest and most peaceful countries in Africa."
          />
          <Link to="/experiences" className="btn btn-ghost-light">All experiences</Link>
        </div>
      </div>
      <div className="container-x mt-14">
        <div className="scrollbar-none -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
          {experiences.map((e, i) => (
            <Reveal key={e.slug} delay={i * 100} className="w-[78%] shrink-0 snap-start sm:w-[46%] md:w-auto">
              <Link to={e.to} className="group relative block aspect-[3/4.4] overflow-hidden rounded-[1.75rem]">
                <Photo photo={e.photo} className="absolute inset-0" imgClassName="transition-transform duration-[1.2s] group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-night via-night/30 to-transparent transition-opacity duration-500 group-hover:from-terracotta/95" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <span className="font-display text-sm text-gold">0{i + 1}</span>
                  <h3 className="mt-1 text-3xl text-white">{e.title}</h3>
                  <p className="mt-3 max-h-0 overflow-hidden text-sm leading-relaxed text-white/85 opacity-0 transition-all duration-500 group-hover:max-h-32 group-hover:opacity-100 max-md:max-h-32 max-md:opacity-100">
                    {e.line}
                  </p>
                  <span className="mt-4 inline-flex size-10 items-center justify-center rounded-full border border-white/40 text-white transition-all group-hover:border-white group-hover:bg-white group-hover:text-night">
                    <ArrowRight className="size-4" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>

      <div className="container-x relative mt-24">
        <FlightPath className="pointer-events-none absolute -top-10 left-0 h-auto w-full text-gold/40" />
        <div className="relative grid grid-cols-2 gap-y-10 border-t border-white/10 pt-12 md:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 100}>
              <p className="font-display text-5xl text-gold md:text-6xl">{s.value}</p>
              <p className="mt-2 text-sm uppercase tracking-[0.2em] text-cream/60">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function DestinationsTeaser() {
  const keys: CategoryKey[] = ["national-parks", "mountains", "islands", "cultures"];
  return (
    <section className="py-24 md:py-32">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading eyebrow="Destination guide" title="Parks, peaks, islands and peoples." intro="More than fifty places and communities we know first-hand, from the Serengeti to Katavi, Kilimanjaro to Ol Doinyo Lengai, Zanzibar to Mafia, and the Maasai to the Hadzabe." />
          <Link to="/destinations" className="btn btn-ghost">Explore all destinations</Link>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {keys.map((k, i) => {
            const list = byCategory(k);
            return (
              <Reveal key={k} delay={i * 120}>
                <div className="group relative overflow-hidden rounded-[2rem]">
                  <Link to={`/destinations/${k}`} className="block">
                    <Photo photo={categories[k].photo} className="aspect-[4/5]" imgClassName="transition-transform duration-[1.2s] group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-night via-night/40 to-transparent" />
                  </Link>
                  <div className="absolute inset-x-0 bottom-0 p-7 text-white">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{list.length} {k === "cultures" ? "peoples & sites" : "places"}</p>
                    <Link to={`/destinations/${k}`} className="mt-2 block font-display text-2xl xl:text-3xl">{categories[k].title}</Link>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {list.slice(0, 4).map((d) => (
                        <Link key={d.slug} to={`/destinations/${k}/${d.slug}`} className="rounded-full bg-white/15 px-3 py-1.5 text-xs backdrop-blur transition-colors hover:bg-white hover:text-night">
                          {d.name.replace(/ (National Park|Conservation Area|Island National Park|Mountains National Park|Stream National Park)$/, "").replace(/^The /, "")}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FeaturedJourneys() {
  const [first, ...rest] = [journeys[4], journeys[1], journeys[3]];
  return (
    <section className="bg-paper py-24 md:py-32">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading eyebrow="Sample journeys" title="Ideas to start dreaming." intro="Every trip we plan is unique. These favourites show what's possible; we'll reshape any of them around you." />
          <Link to="/journeys" className="btn btn-ghost">See all journeys</Link>
        </div>
        <div className="mt-14 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <Reveal><JourneyCard journey={first} featured /></Reveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            {rest.map((j, i) => (
              <Reveal key={j.slug} delay={(i + 1) * 120}>
                <Link to={`/journeys/${j.slug}`} className="group flex h-full gap-5 rounded-[1.75rem] border border-line bg-paper p-4 transition-shadow hover:shadow-xl hover:shadow-earth/10 max-sm:flex-col">
                  <Photo photo={j.photo} className="aspect-[4/3] w-full shrink-0 rounded-2xl sm:aspect-square sm:w-40" imgClassName="transition-transform duration-700 group-hover:scale-105" />
                  <div className="flex flex-col py-1">
                    <p className="eyebrow">{j.kicker}</p>
                    <h3 className="mt-2 text-2xl leading-tight">{j.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-muted">{j.summary}</p>
                    <span className="mt-auto inline-flex items-center gap-2 pt-3 text-sm font-semibold text-terracotta">
                      View journey <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="relative overflow-hidden bg-sand/45 py-24 md:py-32">
      <div className="container-x">
        <SectionHeading align="center" eyebrow="How we plan" title="Tailor-made, like a perfectly fitted suit." intro="Long-distance travel is a matter of trust. Here's how your journey comes together." />
        <div className="relative mt-16">
          <FlightPath className="pointer-events-none absolute -top-6 left-0 hidden h-auto w-full text-terracotta/35 md:block" />
          <div className="relative grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 150} className={`rounded-[1.75rem] bg-paper p-8 shadow-sm ${["", "md:mt-10", "md:mt-20"][i]}`}>
                <span className="grid size-14 place-items-center rounded-full bg-gradient-to-br from-gold to-sunset font-display text-xl text-night">{s.n}</span>
                <h3 className="mt-6 text-2xl">{s.title}</h3>
                <p className="mt-3 leading-relaxed text-muted">{s.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
        <Reveal className="mt-14 text-center">
          <Link to="/plan-trip" className="btn btn-sun !px-8 !py-4">Start with step one <ArrowRight className="size-4" /></Link>
        </Reveal>
      </div>
    </section>
  );
}

function Community() {
  return (
    <section className="relative overflow-hidden bg-earth py-24 text-cream md:py-32">
      <div className="container-x grid gap-14 lg:grid-cols-2 lg:items-center">
        <div className="grid grid-cols-2 gap-4">
          <Reveal className="space-y-4">
            <Photo photo="sameCooking" className="aspect-[3/4] rounded-[1.5rem]" />
            <Photo photo="vikindu1" className="aspect-square rounded-[1.5rem]" />
          </Reveal>
          <Reveal delay={150} className="space-y-4 pt-12">
            <Photo photo="machame1" className="aspect-square rounded-[1.5rem]" />
            <Photo photo="sameFarming" className="aspect-[3/4] rounded-[1.5rem]" />
          </Reveal>
        </div>
        <div>
          <SectionHeading
            light
            eyebrow="Empowering women, preserving heritage"
            title="The communities we travel with."
            intro="We partner with women-led groups who support their families and protect the traditions that shape our culture. When you cook, farm or stay with them, the proceeds go directly to the women."
          />
          <Reveal delay={150} className="mt-10 space-y-4">
            {partners.map((p) => (
              <div key={p.name} className="flex items-baseline justify-between gap-6 border-b border-white/10 pb-4">
                <span className="font-display text-2xl">{p.name}</span>
                <span className="text-right text-sm text-cream/55">{p.place.split("·")[0]}</span>
              </div>
            ))}
          </Reveal>
          <Reveal delay={250} className="mt-10">
            <Link to="/community" className="btn btn-sun">Meet our partners <ArrowRight className="size-4" /></Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Reviews() {
  const [i, setI] = useState(0);
  const r = reviews[i];
  const go = (d: number) => setI((x) => (x + d + reviews.length) % reviews.length);

  return (
    <section className="py-24 md:py-32">
      <div className="container-x grid gap-14 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <SectionHeading eyebrow="Guest voices" title="Stories from completed trips." />
          <Reveal delay={120} className="mt-10 rounded-[1.75rem] border-2 border-[#00aa6c]/70 bg-paper p-7">
            <p className="text-sm font-semibold text-ink">Tripadvisor</p>
            <div className="mt-3 flex items-center gap-1 text-[#00aa6c]">
              {Array.from({ length: 5 }, (_, k) => <Star key={k} className="size-5 fill-current" />)}
            </div>
            <p className="mt-3 font-display text-4xl">
              {site.tripadvisor.rating} <span className="text-xl text-[#00aa6c]">Excellent</span>
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href={site.tripadvisor.profile} target="_blank" rel="noreferrer" className="text-sm font-semibold text-earth underline-offset-4 hover:underline">Read reviews</a>
              <a href={site.tripadvisor.review} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#00aa6c] underline-offset-4 hover:underline">Write a review</a>
            </div>
          </Reveal>
        </div>

        <Reveal delay={100} className="relative flex flex-col justify-between rounded-[2rem] bg-paper p-8 shadow-xl shadow-earth/10 md:p-14">
          <Quote className="size-14 text-sand-deep" />
          <blockquote key={i} className="rise mt-6 font-display text-2xl leading-snug text-ink md:text-[2rem]">
            “{r.quote}”
          </blockquote>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="font-semibold text-ink">{r.name}</p>
              <p className="text-sm text-muted">{r.from}, Germany</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm tabular-nums text-muted">{i + 1} / {reviews.length}</span>
              <button type="button" onClick={() => go(-1)} aria-label="Previous review" className="grid size-12 place-items-center rounded-full border border-line hover:border-earth"><ChevronLeft className="size-5" /></button>
              <button type="button" onClick={() => go(1)} aria-label="Next review" className="grid size-12 place-items-center rounded-full bg-earth text-cream hover:bg-night"><ChevronRight className="size-5" /></button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function Home() {
  useMeta("Real Tanzania Discovery Adventures | Private Safaris, Treks & Cultural Journeys");
  return (
    <>
      <Hero />
      <Intro />
      <Experiences />
      <DestinationsTeaser />
      <FeaturedJourneys />
      <HowItWorks />
      <Community />
      <Reviews />
      <CtaBand />
    </>
  );
}
