import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ChevronDown, Menu, Phone, X } from "lucide-react";
import { nav, site, telHref } from "../data/site";

// Pages without a dark photo hero at the top need a solid header from the start.
const lightTopPages = ["/plan-trip", "/terms", "/privacy", "/imprint"];
const knownPrefixes = ["/", "/tanzania", "/experiences", "/safari", "/trekking", "/culture", "/beach-and-sea", "/journeys", "/community", "/about-us", "/journal", "/contact", "/travel-info"];
const hasDarkHero = (path: string) =>
  !lightTopPages.includes(path) && knownPrefixes.some((p) => path === p || (p !== "/" && path.startsWith(p + "/")));

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const solid = scrolled || open || !hasDarkHero(pathname);
  const linkTone = solid ? "text-ink hover:text-terracotta" : "text-white/90 hover:text-white";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        solid ? "bg-cream/92 shadow-[0_8px_30px_-18px_rgba(43,29,18,0.45)] backdrop-blur-md" : "bg-gradient-to-b from-night/55 to-transparent"
      }`}
    >
      <div className="container-x flex h-20 items-center justify-between gap-6 lg:h-24">
        <Link
          to="/"
          aria-label={`${site.name}, home`}
          className={`relative z-10 -mb-6 self-start rounded-b-2xl bg-cream px-3 pb-2 pt-3 shadow-[0_12px_30px_-14px_rgba(43,29,18,0.55)] transition-all duration-500 ${
            solid ? "mb-0 scale-[0.82] origin-top-left shadow-none" : ""
          }`}
        >
          <img src="/brand/logo-full.png" alt={site.name} width={802} height={652} className="h-[72px] w-auto lg:h-[92px]" />
        </Link>

        <nav className="hidden items-center gap-0.5 whitespace-nowrap lg:flex" aria-label="Main">
          {nav.map((item) =>
            item.children ? (
              <div key={item.to} className="group relative">
                <NavLink to={item.to} className={`flex items-center gap-1 rounded-full px-3 py-2 text-[0.92rem] font-medium xl:px-3.5 transition-colors ${linkTone}`}>
                  {item.label}
                  <ChevronDown className="size-4 transition-transform group-hover:rotate-180" />
                </NavLink>
                <div className="invisible absolute left-1/2 top-full w-[22rem] -translate-x-1/2 translate-y-2 pt-3 opacity-0 transition-all duration-300 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="rounded-3xl border border-line bg-paper p-3 shadow-2xl shadow-night/15">
                    {item.children.map((c) => (
                      <Link key={c.to} to={c.to} className="block rounded-2xl px-4 py-3 transition-colors hover:bg-sand/60">
                        <span className="font-display text-lg text-ink">{c.label}</span>
                        <span className="block text-sm text-muted">{c.note}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-3 py-2 text-[0.92rem] font-medium xl:px-3.5 transition-colors ${linkTone} ${isActive ? (solid ? "text-terracotta" : "text-gold") : ""}`
                }
              >
                {item.label}
              </NavLink>
            ),
          )}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={telHref(site.phones[0])}
            className={`hidden items-center gap-2 whitespace-nowrap text-sm font-medium 2xl:flex ${solid ? "text-earth" : "text-white/90"}`}
          >
            <Phone className="size-4" /> {site.phones[0]}
          </a>
          <Link to="/plan-trip" className="btn btn-sun hidden !px-5 !py-3 sm:inline-flex">
            Plan your trip
          </Link>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className={`grid size-11 place-items-center rounded-full lg:hidden ${solid ? "bg-earth text-cream" : "bg-white/15 text-white backdrop-blur"}`}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`fixed inset-x-0 bottom-0 top-20 overflow-y-auto bg-cream transition-all duration-500 lg:hidden ${
          open ? "visible opacity-100" : "invisible -translate-y-4 opacity-0"
        }`}
      >
        <nav className="container-x flex flex-col py-8" aria-label="Mobile">
          {nav.map((item) => (
            <div key={item.to} className="border-b border-line py-3">
              <Link to={item.to} className="font-display text-3xl text-ink">
                {item.label}
              </Link>
              {item.children && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {item.children.map((c) => (
                    <Link key={c.to} to={c.to} className="rounded-2xl bg-sand/50 px-4 py-3 text-sm font-medium text-earth">
                      {c.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <Link to="/plan-trip" className="btn btn-sun mt-8">
            Plan your trip
          </Link>
          <a href={telHref(site.phones[0])} className="btn btn-ghost mt-3">
            <Phone className="size-4" /> {site.phones[0]}
          </a>
        </nav>
      </div>
    </header>
  );
}
