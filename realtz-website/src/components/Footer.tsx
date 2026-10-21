import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Mail, MapPin, Phone, Star } from "lucide-react";
import { Facebook, Instagram } from "./BrandIcons";
import { Photo } from "./Photo";
import { fallbackLinks, sendForm } from "../lib/forms";
import { telHref, useContent } from "../content/store";

function Newsletter() {
  const { settings, pages } = useContent();
  const f = pages.footer;
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [fallback, setFallback] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const fields = { Name: String(data.get("name") ?? ""), Email: String(data.get("email") ?? "") };
    setState("sending");
    const result = await sendForm("newsletter", "Newsletter sign-up", fields);
    if (result === "fallback") setFallback(fallbackLinks("Newsletter sign-up", fields, settings).email);
    setState("done");
  }

  if (state === "done") {
    return fallback ? (
      <p className="text-cream/80">
        Almost there: <a className="text-gold underline" href={fallback}>send us a quick email</a> to join the list.
      </p>
    ) : (
      <p className="text-gold">{f.newsletterThanks}</p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
      <label className="sr-only" htmlFor="nl-name">Your name</label>
      <input id="nl-name" name="name" required placeholder="Your name" className="w-full rounded-full border border-white/15 bg-white/5 px-5 py-3.5 text-cream placeholder:text-cream/45 focus:border-gold focus:outline-none sm:w-44" />
      <label className="sr-only" htmlFor="nl-email">Email address</label>
      <input id="nl-email" name="email" type="email" required placeholder="Email address" className="w-full flex-1 rounded-full border border-white/15 bg-white/5 px-5 py-3.5 text-cream placeholder:text-cream/45 focus:border-gold focus:outline-none" />
      <button disabled={state === "sending"} className="btn btn-sun">
        {state === "sending" ? "Sending…" : f.newsletterButton}
      </button>
    </form>
  );
}

export function Footer() {
  const { settings: site, pages, footerLinks } = useContent();
  const f = pages.footer;
  const columns = [
    { title: f.exploreTitle, links: footerLinks.explore },
    { title: f.companyTitle, links: footerLinks.company },
  ];

  return (
    <footer className="relative overflow-hidden bg-night text-cream">
      <div className="relative">
        <Photo photo={f.newsletterImage} className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-r from-night via-night/85 to-night/40" />
        <div className="container-x relative grid gap-8 py-16 md:grid-cols-2 md:items-center md:py-20">
          <div>
            <p className="eyebrow eyebrow-light">{f.newsletterEyebrow}</p>
            <h2 className="display-md mt-3">{f.newsletterTitle}</h2>
            <p className="mt-3 max-w-md text-cream/70">{f.newsletterText}</p>
          </div>
          <Newsletter />
        </div>
      </div>

      <div className="container-x grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-4">
          <Link to="/" className="inline-block rounded-2xl bg-cream p-3">
            <img src={site.logo || "/brand/logo-full.png"} alt={site.name} width={802} height={652} loading="lazy" className="h-24 w-auto" />
          </Link>
          <p className="mt-6 max-w-sm leading-relaxed text-cream/65">{f.about}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {site.social.instagram && (
              <a href={site.social.instagram} aria-label="Instagram" className="grid size-10 place-items-center rounded-full border border-white/15 hover:border-gold hover:text-gold">
                <Instagram className="size-4" />
              </a>
            )}
            {site.social.facebook && (
              <a href={site.social.facebook} aria-label="Facebook" className="grid size-10 place-items-center rounded-full border border-white/15 hover:border-gold hover:text-gold">
                <Facebook className="size-4" />
              </a>
            )}
            {site.tripadvisor.profile && (
              <a href={site.tripadvisor.profile} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm hover:border-[#00aa6c]">
                <span className="flex text-[#00aa6c]">
                  {Array.from({ length: 5 }, (_, i) => <Star key={i} className="size-3.5 fill-current" />)}
                </span>
                {site.tripadvisor.rating} on Tripadvisor
              </a>
            )}
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title} className="md:col-span-2">
            <p className="eyebrow eyebrow-light">{col.title}</p>
            <ul className="mt-5 space-y-3">
              {col.links.map((l, i) => (
                <li key={i}>
                  <Link to={l.to} className="link-underline text-cream/75 hover:text-cream">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="md:col-span-4">
          <p className="eyebrow eyebrow-light">{f.contactTitle}</p>
          <div className="mt-5 space-y-5 text-sm text-cream/75">
            {site.departments.map((d, k) => (
              <div key={k}>
                <p className="font-display text-lg text-cream">{d.name}</p>
                {d.email && <a href={`mailto:${d.email}`} className="mt-1 flex items-center gap-2.5 hover:text-cream"><Mail className="size-3.5 text-gold" />{d.email}</a>}
                {d.phones.length > 0 && (
                  <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <Phone className="size-3.5 text-gold" />
                    {d.phones.map((p, i) => (
                      <span key={i}>{i > 0 && <span className="mr-2.5 text-cream/30">/</span>}<a href={telHref(p)} className="hover:text-cream">{p}</a></span>
                    ))}
                  </p>
                )}
              </div>
            ))}
            <p className="flex items-center gap-2.5"><MapPin className="size-3.5 text-gold" />{site.address}</p>
          </div>
          {site.sister.url && (
            <a href={site.sister.url} target="_blank" rel="noreferrer" className="mt-8 flex items-center gap-4 rounded-2xl border border-white/10 p-4 hover:border-gold/60">
              <Photo photo={site.sister.logo} className="size-14 shrink-0 rounded-full !bg-cream" imgClassName="!object-contain p-1.5" />
              <span>
                <span className="block text-xs uppercase tracking-[0.2em] text-cream/50">{f.memberOf}</span>
                <span className="font-display text-xl">{site.sister.name}</span>
                <span className="block text-sm text-cream/60">{f.sisterNote}</span>
              </span>
              <ArrowRight className="ml-auto size-4 text-gold" />
            </a>
          )}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-3 py-6 text-xs text-cream/50 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {site.legalName}. {site.tagline}.</p>
          <div className="flex gap-5">
            {footerLinks.legal.map((l, i) => (
              <Link key={i} to={l.to} className="hover:text-cream">{l.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
