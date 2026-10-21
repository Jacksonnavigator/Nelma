import { useEffect, type ReactNode } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Photo } from "./Photo";
import { WhatsApp } from "./BrandIcons";
import { whatsappHref } from "../data/site";
import type { PhotoKey } from "../data/images";
import { journeys, type Journey } from "../data/journeys";

export function Layout() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }), [pathname]);

  return (
    <>
      <a href="#main" className="sr-only z-[60] rounded-full bg-earth px-4 py-2 text-cream focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
      <a
        href={whatsappHref()}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="fixed bottom-5 right-5 z-40 grid size-14 place-items-center rounded-full bg-[#25d366] text-white shadow-xl shadow-black/25 transition-transform hover:scale-110"
      >
        <WhatsApp className="size-7" />
      </a>
    </>
  );
}

export function useMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title.includes("Real Tanzania") ? title : `${title} | Real Tanzania Discovery Adventures`;
    if (description) document.querySelector('meta[name="description"]')?.setAttribute("content", description);
  }, [title, description]);
}

export function PageHero({
  photo,
  eyebrow,
  title,
  intro,
  crumbs = [],
  children,
}: {
  photo: PhotoKey;
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  crumbs?: { label: string; to?: string }[];
  children?: ReactNode;
}) {
  return (
    <section className="grain relative flex min-h-[78vh] items-end overflow-hidden bg-night text-white md:min-h-[82vh]">
      <Photo photo={photo} eager className="absolute inset-0" imgClassName="animate-kenburns" />
      <div className="absolute inset-0 bg-gradient-to-t from-night via-night/45 to-night/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-night/60 to-transparent" />
      <div className="container-x relative pb-16 pt-40 md:pb-24">
        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="rise mb-6 flex flex-wrap items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-white/60">
            <Link to="/" className="hover:text-white">Home</Link>
            {crumbs.map((c) => (
              <span key={c.label} className="flex items-center gap-1.5">
                <ChevronRight className="size-3" />
                {c.to ? <Link to={c.to} className="hover:text-white">{c.label}</Link> : <span className="text-white/90">{c.label}</span>}
              </span>
            ))}
          </nav>
        )}
        <p className="eyebrow eyebrow-light rise" style={{ animationDelay: "80ms" }}>{eyebrow}</p>
        <h1 className="display-xl rise mt-5 max-w-5xl" style={{ animationDelay: "160ms" }}>{title}</h1>
        {intro && <p className="rise mt-6 max-w-2xl text-lg leading-relaxed text-white/80 md:text-xl" style={{ animationDelay: "260ms" }}>{intro}</p>}
        {children && <div className="rise mt-9 flex flex-wrap gap-3" style={{ animationDelay: "360ms" }}>{children}</div>}
      </div>
    </section>
  );
}

export function CtaBand({
  title = "Ready for your dream trip?",
  text = "Tell us what makes your heart beat faster. We'll craft a private journey around it, free and without obligation.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gold via-sunset to-terracotta text-night">
      <div className="pointer-events-none absolute -right-24 -top-24 size-[28rem] rounded-full bg-gold/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-10 size-[30rem] rounded-full border-[40px] border-white/10" />
      <div className="container-x relative grid gap-10 py-20 md:grid-cols-[1.4fr_1fr] md:items-center md:py-24">
        <div>
          <p className="eyebrow !text-night/70">Karibu Tanzania</p>
          <h2 className="display-lg mt-4">{title}</h2>
          <p className="mt-5 max-w-xl text-lg text-night/80">{text}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row md:flex-col md:items-end">
          <Link to="/plan-trip" className="btn btn-earth !px-8 !py-4">
            Plan my trip <ArrowRight className="size-4" />
          </Link>
          <a href={whatsappHref()} target="_blank" rel="noreferrer" className="btn border border-night/30 text-night hover:bg-night/10">
            <WhatsApp className="size-4" /> WhatsApp us
          </a>
        </div>
      </div>
    </section>
  );
}

export function JourneyCard({ journey, featured = false }: { journey: Journey; featured?: boolean }) {
  return (
    <Link to={`/journeys/${journey.slug}`} className="group block">
      <div className={`relative overflow-hidden rounded-[1.75rem] ${featured ? "aspect-[4/5] md:aspect-[16/11]" : "aspect-[4/5]"}`}>
        <Photo photo={journey.photo} className="absolute inset-0" imgClassName="transition-transform duration-[1.2s] group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-night/90 via-night/20 to-transparent" />
        <div className="absolute left-5 top-5 flex items-center gap-2">
          <span className="rounded-full bg-cream px-3.5 py-1.5 text-xs font-semibold text-earth">{journey.days} days</span>
          <span className="rounded-full bg-night/40 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur">{journey.style}</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-7">
          <h3 className={`${featured ? "text-3xl md:text-4xl" : "text-2xl"} leading-tight`}>{journey.title}</h3>
          <p className="mt-3 line-clamp-2 text-sm text-white/75">{journey.highlights.join(" · ")}</p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gold">
            View journey <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function MoreJourneys({ exclude, title = "Journeys to inspire you" }: { exclude?: string; title?: string }) {
  const list = journeys.filter((j) => j.slug !== exclude).slice(0, 3);
  return (
    <section className="bg-paper py-24">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Sample journeys</p>
            <h2 className="display-md mt-3">{title}</h2>
          </div>
          <Link to="/journeys" className="btn btn-ghost">All journeys</Link>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {list.map((j) => <JourneyCard key={j.slug} journey={j} />)}
        </div>
      </div>
    </section>
  );
}
