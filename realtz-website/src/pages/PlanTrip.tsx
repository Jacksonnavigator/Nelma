import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Mail } from "lucide-react";
import { useMeta } from "../components/Layout";
import { Photo } from "../components/Photo";
import { WhatsApp } from "../components/BrandIcons";
import { fallbackLinks, sendForm, type Fields } from "../lib/forms";
import { Rich } from "../content/rich";
import { fill, telHref, useContent, useDestinations, useJourneys, usePage } from "../content/store";

type State = {
  interest: number[];
  regions: string[];
  journey: string;
  month: string;
  nights: string;
  adults: string;
  children: string;
  stay: string;
  budget: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  message: string;
};

export default function PlanTrip() {
  const t = usePage("planTrip");
  const { settings } = useContent();
  const journeys = useJourneys();
  const destinations = useDestinations();
  useMeta(t.meta.title, t.meta.description);
  const [params] = useSearchParams();
  const preset = journeys.find(params.get("journey") ?? "");
  const place = destinations.find(params.get("destination") ?? "");
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "fallback">("idle");
  const [fallback, setFallback] = useState<{ whatsapp: string; email: string } | null>(null);
  const [s, setS] = useState<State>({
    interest: t.interests.map((_, i) => (i % 2 === 0 ? 2 : 1)),
    regions: [],
    journey: preset?.slug ?? "",
    month: "",
    nights: preset ? String(preset.days) : "",
    adults: "2",
    children: "0",
    stay: "",
    budget: "",
    name: "",
    email: "",
    phone: "",
    country: "",
    message: place ? fill(t.destinationMessage, { name: place.name }) : "",
  });

  const set = <K extends keyof State>(k: K, v: State[K]) => setS((x) => ({ ...x, [k]: v }));
  const toggleRegion = (r: string) => set("regions", s.regions.includes(r) ? s.regions.filter((x) => x !== r) : [...s.regions, r]);
  const first = s.name.split(" ")[0];
  const lastStep = t.steps.length - 1;

  function fields(): Fields {
    const j = journeys.find(s.journey);
    return {
      Name: s.name,
      Email: s.email,
      Phone: s.phone,
      Country: s.country,
      Interests: t.interests.map((x, i) => `${x.label}: ${t.levels[s.interest[i]] ?? ""}`).join("; "),
      Regions: s.regions.join(", "),
      "Based on journey": j ? `${j.title} (${j.days} days)` : "",
      "Travel month": s.month,
      "Length (days)": s.nights,
      Travellers: `${s.adults} adults, ${s.children} children`,
      Accommodation: s.stay,
      "Budget per person": s.budget,
      Message: s.message,
    };
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    setStatus("sending");
    const subject = `Trip request from ${s.name}`;
    const result = await sendForm("trip", subject, fields());
    if (result === "fallback") {
      setFallback(fallbackLinks(subject, fields(), settings));
      setStatus("fallback");
    } else setStatus("sent");
  }

  const done = status === "sent" || status === "fallback";
  const chip = (on: boolean) => `rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${on ? "bg-earth text-cream" : "border border-line bg-paper text-earth hover:border-earth"}`;

  return (
    <section className="relative min-h-screen bg-cream pt-28 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:pt-0">
      <aside className="relative hidden overflow-hidden bg-night lg:block">
        <div className="sticky top-0 h-screen">
          <Photo photo={preset?.photo || t.image} eager className="absolute inset-0" imgClassName="animate-kenburns" />
          <div className="absolute inset-0 bg-gradient-to-t from-night via-night/40 to-night/10" />
          <div className="absolute inset-x-0 bottom-0 p-12 text-cream">
            <p className="eyebrow eyebrow-light">{t.eyebrow}</p>
            <p aria-hidden="true" className="display-lg mt-4 font-display"><Rich text={t.title} /></p>
            <ul className="mt-8 space-y-3 text-cream/80">
              {t.promises.map((x, i) => (
                <li key={i} className="flex items-center gap-3"><Check className="size-5 text-gold" />{x}</li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      <div className="container-x max-w-3xl py-10 lg:py-36">
        <h1 className="sr-only">{t.meta.title}</h1>
        <div className="lg:hidden">
          <p className="eyebrow">{t.eyebrow}</p>
          <p aria-hidden="true" className="display-lg mt-3 font-display"><Rich text={t.title} accent="text-terracotta" /></p>
        </div>

        {done ? (
          <div className="rise mt-10 rounded-[2rem] border border-line bg-paper p-8 md:p-12">
            <span className="grid size-16 place-items-center rounded-full bg-gradient-to-br from-gold to-sunset"><Check className="size-8 text-night" /></span>
            {status === "sent" ? (
              <>
                <h2 className="display-md mt-6">{fill(t.thanksTitle, { name: first })}</h2>
                <p className="mt-4 text-lg text-muted">{t.thanksText}</p>
              </>
            ) : (
              <>
                <h2 className="display-md mt-6">{fill(t.fallbackTitle, { name: first || "friend" })}</h2>
                <p className="mt-4 text-lg text-muted">{t.fallbackText}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a href={fallback?.whatsapp} target="_blank" rel="noreferrer" className="btn bg-[#25d366] text-white"><WhatsApp className="size-4" /> {t.fallbackWhatsapp}</a>
                  <a href={fallback?.email} className="btn btn-earth"><Mail className="size-4" /> {t.fallbackEmail}</a>
                </div>
              </>
            )}
            <Link to="/journeys" className="mt-8 inline-flex items-center gap-2 font-semibold text-terracotta">{t.browseJourneys} <ArrowRight className="size-4" /></Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-10">
            <ol className="flex gap-2">
              {t.steps.slice(0, 3).map((x, i) => (
                <li key={i} className="flex-1">
                  <span className={`block h-1 rounded-full transition-colors ${i <= step ? "bg-gradient-to-r from-gold to-sunset" : "bg-line"}`} />
                  <span className={`mt-2 block text-xs font-semibold uppercase tracking-[0.15em] ${i === step ? "text-terracotta" : "text-muted"}`}>
                    {i + 1}. <span className="max-sm:hidden">{x}</span>
                  </span>
                </li>
              ))}
            </ol>

            {step === 0 && (
              <div className="rise mt-10 space-y-10">
                <div>
                  <h2 className="display-md">{t.step1Title}</h2>
                  <p className="mt-2 text-muted">{t.step1Text}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {t.interests.map((x, i) => (
                    <div key={i} className="overflow-hidden rounded-[1.5rem] border border-line bg-paper">
                      <Photo photo={x.image} className="aspect-[16/6] sm:aspect-[16/8]" />
                      <div className="p-5">
                        <label htmlFor={`i-${i}`} className="font-display text-xl">{x.label}</label>
                        <input
                          id={`i-${i}`}
                          type="range"
                          min={0}
                          max={Math.max(t.levels.length - 1, 1)}
                          value={s.interest[i] ?? 0}
                          onChange={(e) => set("interest", s.interest.map((v, k) => (k === i ? Number(e.target.value) : v)))}
                          className="mt-4 w-full accent-[#e2662a]"
                        />
                        <p className="mt-1 text-sm font-semibold text-terracotta">{t.levels[s.interest[i] ?? 0]}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <fieldset>
                  <legend className="field-label">{t.regionsLabel}</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {t.regions.map((r) => (
                      <button type="button" key={r} onClick={() => toggleRegion(r)} aria-pressed={s.regions.includes(r)} className={chip(s.regions.includes(r))}>{r}</button>
                    ))}
                  </div>
                </fieldset>
                <div>
                  <label htmlFor="journey" className="field-label">{t.journeyLabel}</label>
                  <select id="journey" className="field" value={s.journey} onChange={(e) => set("journey", e.target.value)}>
                    <option value="">{t.journeyNone}</option>
                    {journeys.list.map((j) => <option key={j.slug} value={j.slug}>{j.days} days · {j.title}</option>)}
                  </select>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="rise mt-10 space-y-8">
                <h2 className="display-md">{t.step2Title}</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="month" className="field-label">{t.monthLabel}</label>
                    <input id="month" type="month" className="field" value={s.month} onChange={(e) => set("month", e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="nights" className="field-label">{t.daysLabel}</label>
                    <input id="nights" type="number" min={1} max={90} placeholder="e.g. 14" className="field" value={s.nights} onChange={(e) => set("nights", e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="adults" className="field-label">{t.adultsLabel}</label>
                    <input id="adults" type="number" min={1} max={50} className="field" value={s.adults} onChange={(e) => set("adults", e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="children" className="field-label">{t.childrenLabel}</label>
                    <input id="children" type="number" min={0} max={30} className="field" value={s.children} onChange={(e) => set("children", e.target.value)} />
                  </div>
                </div>
                <fieldset>
                  <legend className="field-label">{t.stayLabel}</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {t.stays.map((x) => (
                      <button type="button" key={x} onClick={() => set("stay", x)} aria-pressed={s.stay === x} className={chip(s.stay === x)}>{x}</button>
                    ))}
                  </div>
                </fieldset>
                <div>
                  <label htmlFor="budget" className="field-label">{t.budgetLabel}</label>
                  <select id="budget" className="field" value={s.budget} onChange={(e) => set("budget", e.target.value)}>
                    {t.budgets.map((b, i) => <option key={i} value={i === 0 ? "" : b}>{b}</option>)}
                  </select>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="rise mt-10 space-y-6">
                <h2 className="display-md">{t.step3Title}</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="field-label">{t.nameLabel}</label>
                    <input id="name" required autoComplete="name" className="field" value={s.name} onChange={(e) => set("name", e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="email" className="field-label">{t.emailLabel}</label>
                    <input id="email" required type="email" autoComplete="email" className="field" value={s.email} onChange={(e) => set("email", e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="phone" className="field-label">{t.phoneLabel}</label>
                    <input id="phone" type="tel" autoComplete="tel" className="field" value={s.phone} onChange={(e) => set("phone", e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="country" className="field-label">{t.countryLabel}</label>
                    <input id="country" autoComplete="country-name" className="field" value={s.country} onChange={(e) => set("country", e.target.value)} />
                  </div>
                </div>
                <div>
                  <label htmlFor="message" className="field-label">{t.messageLabel}</label>
                  <textarea id="message" rows={5} placeholder={t.messagePlaceholder} className="field resize-y" value={s.message} onChange={(e) => set("message", e.target.value)} />
                </div>
                <p className="text-xs text-muted"><Rich text={t.privacyNote} /></p>
              </div>
            )}

            <div className="mt-10 flex items-center justify-between gap-4 border-t border-line pt-6">
              {step > 0 ? (
                <button type="button" onClick={() => setStep(step - 1)} className="inline-flex items-center gap-2 font-semibold text-earth"><ArrowLeft className="size-4" /> {t.back}</button>
              ) : (
                <a href={telHref(settings.phone)} className="text-sm text-muted">{t.talkPrefix} <span className="font-semibold text-earth">{settings.phone}</span></a>
              )}
              <button type="submit" disabled={status === "sending"} className="btn btn-sun">
                {step < Math.min(lastStep, 2) ? <>{t.continue} <ArrowRight className="size-4" /></> : status === "sending" ? t.sending : <>{t.send} <ArrowRight className="size-4" /></>}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
