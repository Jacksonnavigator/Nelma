import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import Photo from "./Photo";
import { heroRoles, heroSlides } from "../data/site";

const SLIDE_MS = 7000;

export default function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [role, setRole] = useState(0);
  const reduced = useRef(
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  const go = useCallback((i: number) => setIndex((i + heroSlides.length) % heroSlides.length), []);

  useEffect(() => {
    if (paused || reduced.current) return;
    const t = window.setTimeout(() => go(index + 1), SLIDE_MS);
    return () => window.clearTimeout(t);
  }, [index, paused, go]);

  useEffect(() => {
    if (reduced.current) return;
    const t = window.setInterval(() => setRole((r) => (r + 1) % heroRoles.length), 2600);
    return () => window.clearInterval(t);
  }, []);

  const slide = heroSlides[index];

  return (
    <section
      className="relative isolate flex min-h-[100svh] items-end overflow-hidden bg-ink pb-16 pt-32 md:items-center md:pb-24"
      aria-roledescription="carousel"
      aria-label="Highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {heroSlides.map((s, i) => (
        <div
          key={s.title}
          aria-hidden={i !== index}
          className={`absolute inset-0 -z-20 transition-opacity duration-[1400ms] ${i === index ? "opacity-100" : "opacity-0"}`}
        >
          <Photo
            photo={s.photo}
            width={1920}
            priority={i === 0}
            className={`h-full w-full ${i === index ? "animate-kenburns" : ""}`}
          />
        </div>
      ))}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/70 to-ink/30 md:bg-gradient-to-r md:from-ink md:via-ink/75 md:to-ink/10" />

      <div className="container-site">
        <div className="max-w-3xl">
          <p className="animate-rise text-base font-semibold text-solar-400 md:text-lg">Prof. Thomas T. Kivevele, PhD, PE</p>

          <h1 className="mt-5 animate-rise font-display text-[2.5rem] font-semibold leading-[1.02] tracking-tight text-white [animation-delay:120ms] sm:text-6xl lg:text-7xl">
            <span className="block">Powering Africa as</span>
            <span className="relative block h-[1.1em] overflow-hidden" aria-live="polite">
              {heroRoles.map((r, i) => (
                <span
                  key={r}
                  className={`absolute inset-x-0 top-0 text-solar transition-[transform,opacity] duration-700 ${
                    i === role ? "translate-y-0 opacity-100" : i < role ? "-translate-y-full opacity-0" : "translate-y-full opacity-0"
                  }`}
                  aria-hidden={i !== role}
                >
                  {r}
                </span>
              ))}
            </span>
          </h1>

          <p className="mt-7 max-w-2xl animate-rise text-lg leading-relaxed text-white/85 [animation-delay:240ms] md:text-xl">
            An award-winning engineer, innovator and research leader with over 16 years of experience. He has secured more than
            USD 5 million in research funding, published 120+ peer-reviewed articles and patented six clean energy technologies
            that serve farmers, clinics and industry across Africa.
          </p>

          <div className="mt-9 flex animate-rise flex-wrap gap-3 [animation-delay:360ms]">
            <Link to="/projects" className="btn-solar">
              Explore research projects
            </Link>
            <Link to="/about" className="btn-ghost-light">
              Read his story
            </Link>
          </div>
        </div>
      </div>

      {/* Slide caption and controls */}
      <div className="absolute inset-x-0 bottom-0 hidden md:block">
        <div className="container-site flex items-end justify-between gap-6 pb-8">
          <div className="flex gap-2" role="group" aria-label="Choose a slide">
            {heroSlides.map((s, i) => (
              <button
                key={s.title}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show slide ${i + 1}: ${s.title}`}
                aria-current={i === index}
                className="group flex h-11 w-14 items-center"
              >
                <span className="relative block h-1.5 w-full overflow-hidden rounded-full bg-white/25 group-hover:bg-white/40">
                <span
                  key={`${index}-${paused}`}
                  className={`absolute inset-0 origin-left rounded-full bg-solar ${
                    i === index ? (paused ? "scale-x-100" : "animate-progress") : i < index ? "scale-x-100" : "scale-x-0"
                  }`}
                />
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="max-w-xs rounded-2xl border border-white/15 bg-ink/90 px-5 py-4 text-right">
              <p className="font-display text-lg font-semibold text-white">{slide.title}</p>
              <p className="mt-1 text-sm text-white/70">{slide.caption}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => go(index - 1)} aria-label="Previous slide" className="grid h-11 w-11 place-items-center rounded-full border border-white/30 text-white hover:bg-white hover:text-ink">
                <ChevronLeft size={20} />
              </button>
              <button type="button" onClick={() => setPaused((p) => !p)} aria-label={paused ? "Play slideshow" : "Pause slideshow"} className="grid h-11 w-11 place-items-center rounded-full border border-white/30 text-white hover:bg-white hover:text-ink">
                {paused ? <Play size={18} /> : <Pause size={18} />}
              </button>
              <button type="button" onClick={() => go(index + 1)} aria-label="Next slide" className="grid h-11 w-11 place-items-center rounded-full border border-white/30 text-white hover:bg-white hover:text-ink">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
