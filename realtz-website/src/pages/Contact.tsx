import { useState, type FormEvent } from "react";
import { Clock, Mail, MapPin, Phone, Video } from "lucide-react";
import { PageHero, useMeta } from "../components/Layout";
import { WhatsApp } from "../components/BrandIcons";
import { Reveal } from "../components/ui";
import { fallbackLinks, sendForm } from "../lib/forms";
import { telHref, useContent, usePage, useWhatsapp } from "../content/store";

export default function Contact() {
  const t = usePage("contact");
  const { settings: site } = useContent();
  const wa = useWhatsapp();
  useMeta(t.meta.title, t.meta.description);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "fallback">("idle");
  const [links, setLinks] = useState<{ whatsapp: string; email: string } | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const fields = {
      Name: String(d.get("name") ?? ""),
      Email: String(d.get("email") ?? ""),
      Phone: String(d.get("phone") ?? ""),
      "Preferred contact": String(d.get("pref") ?? ""),
      Message: String(d.get("message") ?? ""),
    };
    const subject = `Website message from ${fields.Name}`;
    setStatus("sending");
    const r = await sendForm("contact", subject, fields);
    if (r === "sent") setStatus("sent");
    else {
      setLinks(fallbackLinks(subject, fields, site));
      setStatus("fallback");
    }
  }

  return (
    <>
      <PageHero photo={t.hero.image} eyebrow={t.hero.eyebrow} title={t.hero.title} intro={t.hero.intro} crumbs={[{ label: t.meta.title }]} />
      <section className="py-24 md:py-28">
        <div className="container-x grid gap-14 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <div className="space-y-4">
              {site.departments.map((d, i) => (
                <Reveal key={i} delay={i * 80} className="rounded-[1.5rem] border border-line bg-paper p-6">
                  <p className="font-display text-2xl text-ink">{d.name}</p>
                  {d.note && <p className="mt-1 text-sm text-muted">{d.note}</p>}
                  <div className="mt-4 space-y-2">
                    {d.email && <a href={`mailto:${d.email}`} className="flex items-center gap-3 text-earth hover:text-terracotta"><Mail className="size-4 text-terracotta" />{d.email}</a>}
                    {d.phones.map((ph, k) => (
                      <a key={k} href={telHref(ph)} className="flex items-center gap-3 text-earth hover:text-terracotta"><Phone className="size-4 text-terracotta" />{ph}</a>
                    ))}
                  </div>
                </Reveal>
              ))}
              <Reveal delay={260} className="grid gap-4 sm:grid-cols-2">
                <a href={wa()} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-[1.5rem] bg-[#25d366] p-5 font-semibold text-white"><WhatsApp className="size-6" /> {t.whatsappButton}</a>
                <div className="flex items-center gap-3 rounded-[1.5rem] border border-line bg-paper p-5 text-sm text-earth"><MapPin className="size-5 shrink-0 text-terracotta" />{site.address}</div>
              </Reveal>
            </div>
            {site.hours.length > 0 && (
              <Reveal delay={200} className="mt-8 rounded-[1.5rem] bg-earth p-7 text-cream">
                <p className="flex items-center gap-3 font-display text-2xl"><Clock className="size-5 text-gold" /> {t.hoursTitle}</p>
                <dl className="mt-5 space-y-2">
                  {site.hours.map((h, i) => (
                    <div key={i} className="flex justify-between gap-4 border-b border-white/10 pb-2 text-sm">
                      <dt className="text-cream/70">{h.days}</dt>
                      <dd>{h.time}</dd>
                    </div>
                  ))}
                </dl>
                {t.videoNote && <p className="mt-5 flex items-center gap-2 text-sm text-cream/70"><Video className="size-4 text-gold" /> {t.videoNote}</p>}
              </Reveal>
            )}
          </div>

          <Reveal delay={100} className="rounded-[2rem] border border-line bg-paper p-7 md:p-10">
            {status === "sent" ? (
              <div className="py-10 text-center">
                <h2 className="display-md">{t.thanksTitle}</h2>
                <p className="mt-3 text-muted">{t.thanksText}</p>
              </div>
            ) : status === "fallback" && links ? (
              <div className="py-6">
                <h2 className="display-md">{t.fallbackTitle}</h2>
                <p className="mt-3 text-muted">{t.fallbackText}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a href={links.whatsapp} target="_blank" rel="noreferrer" className="btn bg-[#25d366] text-white"><WhatsApp className="size-4" /> WhatsApp</a>
                  <a href={links.email} className="btn btn-earth"><Mail className="size-4" /> Email</a>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-5">
                <h2 className="display-md">{t.formTitle}</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div><label htmlFor="c-name" className="field-label">{t.nameLabel}</label><input id="c-name" name="name" required autoComplete="name" className="field" /></div>
                  <div><label htmlFor="c-email" className="field-label">{t.emailLabel}</label><input id="c-email" name="email" type="email" required autoComplete="email" className="field" /></div>
                  <div><label htmlFor="c-phone" className="field-label">{t.phoneLabel}</label><input id="c-phone" name="phone" type="tel" autoComplete="tel" className="field" /></div>
                  <div>
                    <label htmlFor="c-pref" className="field-label">{t.prefLabel}</label>
                    <select id="c-pref" name="pref" className="field">{t.prefOptions.map((o) => <option key={o}>{o}</option>)}</select>
                  </div>
                </div>
                <div><label htmlFor="c-msg" className="field-label">{t.messageLabel}</label><textarea id="c-msg" name="message" required rows={6} className="field resize-y" /></div>
                <button disabled={status === "sending"} className="btn btn-sun w-full sm:w-auto">{status === "sending" ? t.sending : t.button}</button>
              </form>
            )}
          </Reveal>
        </div>
      </section>
      {t.mapQuery && (
        <section className="pb-24">
          <div className="container-x">
            <div className="overflow-hidden rounded-[2rem] border border-line">
              <iframe
                title={`Map of ${t.mapQuery}`}
                src={`https://www.google.com/maps?q=${encodeURIComponent(t.mapQuery)}&output=embed`}
                className="h-[24rem] w-full grayscale-[35%]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
