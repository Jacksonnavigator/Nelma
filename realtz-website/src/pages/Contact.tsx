import { useState, type FormEvent } from "react";
import { Clock, Mail, MapPin, Phone, Video } from "lucide-react";
import { PageHero, useMeta } from "../components/Layout";
import { WhatsApp } from "../components/BrandIcons";
import { Reveal } from "../components/ui";
import { site, telHref, whatsappHref } from "../data/site";
import { fallbackLinks, sendForm } from "../lib/forms";

export default function Contact() {
  useMeta("Contact", "Call, WhatsApp, email or visit us in Boma Ng'ombe, Kilimanjaro. Consultations also by video call.");
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
    try {
      const r = await sendForm(subject, fields);
      if (r === "sent") setStatus("sent");
      else {
        setLinks(fallbackLinks(subject, fields));
        setStatus("fallback");
      }
    } catch {
      setLinks(fallbackLinks(subject, fields));
      setStatus("fallback");
    }
  }

  const channels = [
    { icon: WhatsApp, label: "WhatsApp", value: site.phones[0], href: whatsappHref() },
    { icon: Phone, label: "Phone", value: site.phones.join(" · "), href: telHref(site.phones[0]) },
    { icon: Mail, label: "Email", value: site.email, href: `mailto:${site.email}` },
    { icon: MapPin, label: "Office", value: site.address },
  ];

  return (
    <>
      <PageHero photo="kiliGroup" eyebrow="Contact" title={<>Karibu! Let's <em className="text-gold">talk</em>.</>} intro="By phone, WhatsApp, video call or at our office at the foot of Kilimanjaro. We look forward to hearing from you." crumbs={[{ label: "Contact" }]} />
      <section className="py-24 md:py-28">
        <div className="container-x grid gap-14 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {channels.map((c, i) => {
                const inner = (
                  <>
                    <span className="grid size-12 shrink-0 place-items-center rounded-full bg-sand/70 text-terracotta"><c.icon className="size-5" /></span>
                    <span>
                      <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-muted">{c.label}</span>
                      <span className="mt-1 block font-display text-xl text-ink">{c.value}</span>
                    </span>
                  </>
                );
                return (
                  <Reveal key={c.label} delay={i * 80}>
                    {c.href ? (
                      <a href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="flex items-center gap-4 rounded-[1.5rem] border border-line bg-paper p-5 transition-colors hover:border-terracotta">{inner}</a>
                    ) : (
                      <div className="flex items-center gap-4 rounded-[1.5rem] border border-line bg-paper p-5">{inner}</div>
                    )}
                  </Reveal>
                );
              })}
            </div>
            <Reveal delay={200} className="mt-8 rounded-[1.5rem] bg-earth p-7 text-cream">
              <p className="flex items-center gap-3 font-display text-2xl"><Clock className="size-5 text-gold" /> Office hours</p>
              <dl className="mt-5 space-y-2">
                {site.hours.map((h) => (
                  <div key={h.days} className="flex justify-between gap-4 border-b border-white/10 pb-2 text-sm">
                    <dt className="text-cream/70">{h.days}</dt>
                    <dd>{h.time}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-5 flex items-center gap-2 text-sm text-cream/70"><Video className="size-4 text-gold" /> Video consultations on request.</p>
            </Reveal>
          </div>

          <Reveal delay={100} className="rounded-[2rem] border border-line bg-paper p-7 md:p-10">
            {status === "sent" ? (
              <div className="py-10 text-center">
                <h2 className="display-md">Asante sana!</h2>
                <p className="mt-3 text-muted">Your message has arrived. We'll reply within 24 hours.</p>
              </div>
            ) : status === "fallback" && links ? (
              <div className="py-6">
                <h2 className="display-md">Send it your way</h2>
                <p className="mt-3 text-muted">Choose how to send your message; it's already written for you.</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a href={links.whatsapp} target="_blank" rel="noreferrer" className="btn bg-[#25d366] text-white"><WhatsApp className="size-4" /> WhatsApp</a>
                  <a href={links.email} className="btn btn-earth"><Mail className="size-4" /> Email</a>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-5">
                <h2 className="display-md">Write to us</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div><label htmlFor="c-name" className="field-label">Name *</label><input id="c-name" name="name" required autoComplete="name" className="field" /></div>
                  <div><label htmlFor="c-email" className="field-label">Email *</label><input id="c-email" name="email" type="email" required autoComplete="email" className="field" /></div>
                  <div><label htmlFor="c-phone" className="field-label">Phone / WhatsApp</label><input id="c-phone" name="phone" type="tel" autoComplete="tel" className="field" /></div>
                  <div>
                    <label htmlFor="c-pref" className="field-label">Preferred contact</label>
                    <select id="c-pref" name="pref" className="field"><option>Email</option><option>Phone call</option><option>WhatsApp</option><option>Video call</option></select>
                  </div>
                </div>
                <div><label htmlFor="c-msg" className="field-label">Your message *</label><textarea id="c-msg" name="message" required rows={6} className="field resize-y" /></div>
                <button disabled={status === "sending"} className="btn btn-sun w-full sm:w-auto">{status === "sending" ? "Sending…" : "Send message"}</button>
              </form>
            )}
          </Reveal>
        </div>
      </section>
      <section className="pb-24">
        <div className="container-x">
          <div className="overflow-hidden rounded-[2rem] border border-line">
            <iframe
              title="Map of Boma Ng'ombe, Kilimanjaro"
              src="https://www.google.com/maps?q=Boma%20Ng'ombe%2C%20Kilimanjaro%2C%20Tanzania&output=embed"
              className="h-[24rem] w-full grayscale-[35%]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </>
  );
}
