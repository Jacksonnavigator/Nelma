import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ChevronDown, Menu, Phone, X } from "lucide-react";
import { telHref, useContent } from "../content/store";

// Pages without a dark photo hero at the top need a solid header from the start.
const lightTopPages = ["/plan-trip", "/terms", "/privacy", "/imprint"];
const knownPrefixes = ["/", "/tanzania", "/destinations", "/experiences", "/safari", "/trekking", "/culture", "/beach-and-sea", "/journeys", "/community", "/about-us", "/journal", "/contact", "/travel-info"];
const hasDarkHero = (path: string) =>
  !lightTopPages.includes(path) && knownPrefixes.some((p) => path === p || (p !== "/" && path.startsWith(p + "/")));

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { settings: site, nav, pages } = useContent();
  const planLabel = pages.shared.labels.planYourTrip;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const solid = scrolled || open || !hasDarkHero(pathname);
  const linkTone = solid ? "text-ink hover:text-terracotta" : "text-white/90 hover:text-white";

  return (
    <>
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        solid ? "bg-cream/92 shadow-[0_8px_30px_-18px_rgba(43,29,18,0.45)] backdrop-blur-md" : "bg-gradient-to-b from-night/55 to-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 w-full max-w-[1440px] items-center justify-between gap-6 px-5 md:px-8 xl:h-24">
        <Link to="/" aria-label={`${site.name}, home`} className="flex shrink-0 items-center gap-3">
          {/* The illustrated mark sits on cream: its dark-brown animals disappear on dark photos. */}
          <span
            className={`grid shrink-0 place-items-center rounded-2xl bg-cream p-1.5 transition-all duration-500 ${
              solid ? "size-14 shadow-none" : "size-16 shadow-[0_10px_28px_-12px_rgba(0,0,0,0.6)] xl:size-[4.5rem]"
            }`}
          >
            <img src={site.logoMark || "/brand/logo-mark.png"} alt="" width={658} height={524} className="h-auto w-full max-w-none" />
          </span>
          <span className={`hidden leading-none max-xl:block min-[1400px]:block ${solid ? "text-earth" : "text-white"}`}>
            <span className={`block text-[0.62rem] font-bold uppercase tracking-[0.32em] ${solid ? "text-terracotta" : "text-gold"}`}>{site.logoTop}</span>
            <span className="mt-1.5 block font-display text-lg tracking-tight sm:text-xl">{site.logoBottom}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 whitespace-nowrap xl:flex" aria-label="Main">
          {nav.map((item) =>
            item.children.length ? (
              <div key={item.to} className="group relative">
                <NavLink to={item.to} className={`flex items-center gap-1 rounded-full px-3 py-2 text-[0.92rem] font-medium 2xl:px-3.5 transition-colors ${linkTone}`}>
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
                  `rounded-full px-3 py-2 text-[0.92rem] font-medium 2xl:px-3.5 transition-colors ${linkTone} ${isActive ? (solid ? "text-terracotta" : "text-gold") : ""}`
                }
              >
                {item.label}
              </NavLink>
            ),
          )}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={telHref(site.phone)}
            className={`hidden items-center gap-2 whitespace-nowrap text-sm font-medium min-[1700px]:flex ${solid ? "text-earth" : "text-white/90"}`}
          >
            <Phone className="size-4" /> {site.phone}
          </a>
          <Link to="/plan-trip" className="btn btn-sun hidden !px-5 !py-3 sm:inline-flex">
            {planLabel}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className={`grid size-11 place-items-center rounded-full xl:hidden ${solid ? "bg-earth text-cream" : "bg-white/15 text-white backdrop-blur"}`}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
    </header>

      {/* Mobile menu. It lives outside <header>: the header's backdrop blur would
          otherwise turn it into the containing block and squash this panel to 0px. */}
      <div
        id="mobile-menu"
        className={`fixed inset-x-0 bottom-0 top-20 z-[45] overflow-y-auto bg-cream transition-all duration-500 xl:hidden ${
          open ? "visible opacity-100" : "invisible -translate-y-4 opacity-0"
        }`}
      >
        <nav className="container-x flex flex-col py-8" aria-label="Mobile">
          {nav.map((item) => (
            <div key={item.to} className="border-b border-line py-3">
              <Link to={item.to} className="font-display text-3xl text-ink">
                {item.label}
              </Link>
              {item.children.length > 0 && (
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
            {planLabel}
          </Link>
          <a href={telHref(site.phone)} className="btn btn-ghost mt-3">
            <Phone className="size-4" /> {site.phone}
          </a>
        </nav>
      </div>
    </>
  );
}
