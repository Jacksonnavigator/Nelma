import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Mail } from "lucide-react";
import { useMeta } from "../components/Layout";
import { Photo } from "../components/Photo";
import { WhatsApp } from "../components/BrandIcons";
import { fallbackLinks, sendForm, type Fields } from "../lib/forms";
import { findJourney, journeys } from "../data/journeys";
import { findDestination } from "../data/destinations";
import { site } from "../data/site";
import type { PhotoKey } from "../data/images";

const interests: { key: string; label: string; photo: PhotoKey }[] = [
  { key: "safari", label: "Safari & national parks", photo: "elephantZebras" },
  { key: "outdoor", label: "Hiking, trekking, kayak", photo: "kiliSummit" },
  { key: "culture", label: "Local culture & encounters", photo: "sameCooking" },
  { key: "beach", label: "Beach & sea", photo: "zanzibarBeach" },
];
const levels = ["Not really", "Maybe", "Interested", "Exactly my thing!"];
const regions = ["North", "South", "West", "Coast", "Zanzibar & islands", "Not sure yet"];
const stays = ["Tented camps", "Comfortable lodges", "Luxury (4–5★)", "Homestays", "A mix"];

type State = {
  interest: Record<string, number>;
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

const stepTitles = ["What moves you", "When & who", "Your details"];

export default function PlanTrip() {
  useMeta("Plan your trip", "Tell us about your dream trip to Tanzania. Free and without obligation, a Tanzanian travel expert will design a private itinerary for you.");
  const [params] = useSearchParams();
  const preset = findJourney(params.get("journey") ?? "");
  const place = findDestination(params.get("destination") ?? "");
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "fallback" | "error">("idle");
  const [fallback, setFallback] = useState<{ whatsapp: string; email: string } | null>(null);
  const [s, setS] = useState<State>({
    interest: { safari: 2, outdoor: 1, culture: 2, beach: 1 },
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
    message: place ? `I'd love to include ${place.name} in my trip.` : "",
  });

  const set = <K extends keyof State>(k: K, v: State[K]) => setS((x) => ({ ...x, [k]: v }));
  const toggleRegion = (r: string) => set("regions", s.regions.includes(r) ? s.regions.filter((x) => x !== r) : [...s.regions, r]);

  function fields(): Fields {
    const j = findJourney(s.journey);
    return {
      Name: s.name,
      Email: s.email,
      Phone: s.phone,
      Country: s.country,
      Interests: interests.map((i) => `${i.label}: ${levels[s.interest[i.key]]}`).join("; "),
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
    try {
      const result = await sendForm(subject, fields());
      if (result === "fallback") {
        setFallback(fallbackLinks(subject, fields()));
        setStatus("fallback");
      } else setStatus("sent");
    } catch {
      setFallback(fallbackLinks(subject, fields()));
      setStatus("error");
    }
  }

  const done = status === "sent" || status === "fallback" || status === "error";

  return (
    <section className="relative min-h-screen bg-cream pt-28 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:pt-0">
      <aside className="relative hidden overflow-hidden bg-night lg:block">
        <div className="sticky top-0 h-screen">
          <Photo photo={preset?.photo ?? "giraffes"} eager className="absolute inset-0" imgClassName="animate-kenburns" />
          <div className="absolute inset-0 bg-gradient-to-t from-night via-night/40 to-night/10" />
          <div className="absolute inset-x-0 bottom-0 p-12 text-cream">
            <p className="eyebrow eyebrow-light">Free & without obligation</p>
            <h1 className="display-lg mt-4">Let's plan your dream trip.</h1>
            <ul className="mt-8 space-y-3 text-cream/80">
              {["A Tanzanian expert replies within 24 hours", "A personal itinerary, never a template", "Adjust everything until it's perfect"].map((t) => (
                <li key={t} className="flex items-center gap-3"><Check className="size-5 text-gold" />{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      <div className="container-x max-w-3xl py-10 lg:py-36">
        <div className="lg:hidden">
          <p className="eyebrow">Free & without obligation</p>
          <h1 className="display-lg mt-3">Let's plan your dream trip.</h1>
        </div>

        {done ? (
          <div className="rise mt-10 rounded-[2rem] border border-line bg-paper p-8 md:p-12">
            <span className="grid size-16 place-items-center rounded-full bg-gradient-to-br from-gold to-sunset"><Check className="size-8 text-night" /></span>
            {status === "sent" ? (
              <>
                <h2 className="display-md mt-6">Asante, {s.name.split(" ")[0]}!</h2>
                <p className="mt-4 text-lg text-muted">Your wishes are on their way to our reservations team. You'll hear from us within 24 hours, usually much sooner.</p>
              </>
            ) : (
              <>
                <h2 className="display-md mt-6">One last tap, {s.name.split(" ")[0] || "friend"}.</h2>
                <p className="mt-4 text-lg text-muted">
                  {status === "error" ? "Our form couldn't be reached just now. " : ""}Send your trip wishes to us directly. Everything you entered is already written in the message.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a href={fallback?.whatsapp} target="_blank" rel="noreferrer" className="btn bg-[#25d366] text-white"><WhatsApp className="size-4" /> Send via WhatsApp</a>
                  <a href={fallback?.email} className="btn btn-earth"><Mail className="size-4" /> Send via email</a>
                </div>
              </>
            )}
            <Link to="/journeys" className="mt-8 inline-flex items-center gap-2 font-semibold text-terracotta">Browse journeys meanwhile <ArrowRight className="size-4" /></Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-10">
            <ol className="flex gap-2">
              {stepTitles.map((t, i) => (
                <li key={t} className="flex-1">
                  <span className={`block h-1 rounded-full transition-colors ${i <= step ? "bg-gradient-to-r from-gold to-sunset" : "bg-line"}`} />
                  <span className={`mt-2 block text-xs font-semibold uppercase tracking-[0.15em] ${i === step ? "text-terracotta" : "text-muted"}`}>
                    {i + 1}. <span className="max-sm:hidden">{t}</span>
                  </span>
                </li>
              ))}
            </ol>

            {step === 0 && (
              <div className="rise mt-10 space-y-10">
                <div>
                  <h2 className="display-md">What do you want to experience?</h2>
                  <p className="mt-2 text-muted">Slide each one to show how much it appeals to you.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {interests.map((i) => (
                    <div key={i.key} className="overflow-hidden rounded-[1.5rem] border border-line bg-paper">
                      <Photo photo={i.photo} className="aspect-[16/6] sm:aspect-[16/8]" />
                      <div className="p-5">
                        <label htmlFor={`i-${i.key}`} className="font-display text-xl">{i.label}</label>
                        <input
                          id={`i-${i.key}`}
                          type="range"
                          min={0}
                          max={3}
                          value={s.interest[i.key]}
                          onChange={(e) => set("interest", { ...s.interest, [i.key]: Number(e.target.value) })}
                          className="mt-4 w-full accent-[#e2662a]"
                        />
                        <p className="mt-1 text-sm font-semibold text-terracotta">{levels[s.interest[i.key]]}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <fieldset>
                  <legend className="field-label">Which regions appeal to you?</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {regions.map((r) => (
                      <button type="button" key={r} onClick={() => toggleRegion(r)} aria-pressed={s.regions.includes(r)} className={`rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${s.regions.includes(r) ? "bg-earth text-cream" : "border border-line bg-paper text-earth hover:border-earth"}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <div>
                  <label htmlFor="journey" className="field-label">Start from one of our sample journeys? (optional)</label>
                  <select id="journey" className="field" value={s.journey} onChange={(e) => set("journey", e.target.value)}>
                    <option value="">No, start from scratch</option>
                    {journeys.map((j) => <option key={j.slug} value={j.slug}>{j.days} days · {j.title}</option>)}
                  </select>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="rise mt-10 space-y-8">
                <h2 className="display-md">When, and who's coming?</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="month" className="field-label">When would you like to travel?</label>
                    <input id="month" type="month" className="field" value={s.month} onChange={(e) => set("month", e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="nights" className="field-label">How many days?</label>
                    <input id="nights" type="number" min={3} max={60} placeholder="e.g. 14" className="field" value={s.nights} onChange={(e) => set("nights", e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="adults" className="field-label">Adults</label>
                    <input id="adults" type="number" min={1} max={30} className="field" value={s.adults} onChange={(e) => set("adults", e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="children" className="field-label">Children</label>
                    <input id="children" type="number" min={0} max={20} className="field" value={s.children} onChange={(e) => set("children", e.target.value)} />
                  </div>
                </div>
                <fieldset>
                  <legend className="field-label">Where would you like to sleep?</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {stays.map((x) => (
                      <button type="button" key={x} onClick={() => set("stay", x)} aria-pressed={s.stay === x} className={`rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${s.stay === x ? "bg-earth text-cream" : "border border-line bg-paper text-earth hover:border-earth"}`}>
                        {x}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <div>
                  <label htmlFor="budget" className="field-label">Approximate budget per person (optional)</label>
                  <select id="budget" className="field" value={s.budget} onChange={(e) => set("budget", e.target.value)}>
                    <option value="">I'd rather discuss it</option>
                    <option>Under US$ 2,500</option>
                    <option>US$ 2,500 – 4,000</option>
                    <option>US$ 4,000 – 6,000</option>
                    <option>Over US$ 6,000</option>
                  </select>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="rise mt-10 space-y-6">
                <h2 className="display-md">How can we reach you?</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="field-label">Full name *</label>
                    <input id="name" required autoComplete="name" className="field" value={s.name} onChange={(e) => set("name", e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="email" className="field-label">Email *</label>
                    <input id="email" required type="email" autoComplete="email" className="field" value={s.email} onChange={(e) => set("email", e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="phone" className="field-label">Phone / WhatsApp</label>
                    <input id="phone" type="tel" autoComplete="tel" className="field" value={s.phone} onChange={(e) => set("phone", e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="country" className="field-label">Country</label>
                    <input id="country" autoComplete="country-name" className="field" value={s.country} onChange={(e) => set("country", e.target.value)} />
                  </div>
                </div>
                <div>
                  <label htmlFor="message" className="field-label">Anything else we should know?</label>
                  <textarea id="message" rows={5} placeholder="Special occasions, must-sees, mobility needs, dietary wishes…" className="field resize-y" value={s.message} onChange={(e) => set("message", e.target.value)} />
                </div>
                <p className="text-xs text-muted">We use your details only to plan your trip. See our <Link to="/privacy" className="underline">privacy policy</Link>.</p>
              </div>
            )}

            <div className="mt-10 flex items-center justify-between gap-4 border-t border-line pt-6">
              {step > 0 ? (
                <button type="button" onClick={() => setStep(step - 1)} className="inline-flex items-center gap-2 font-semibold text-earth"><ArrowLeft className="size-4" /> Back</button>
              ) : (
                <a href={`tel:${site.phones[0].replace(/\s/g, "")}`} className="text-sm text-muted">Prefer to talk? <span className="font-semibold text-earth">{site.phones[0]}</span></a>
              )}
              <button type="submit" disabled={status === "sending"} className="btn btn-sun">
                {step < 2 ? <>Continue <ArrowRight className="size-4" /></> : status === "sending" ? "Sending…" : <>Send my wishes <ArrowRight className="size-4" /></>}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
