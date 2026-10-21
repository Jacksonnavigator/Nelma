import { Mail, MapPin, Phone } from "lucide-react";
import PageBanner from "../components/PageBanner";
import ContactForm from "../components/ContactForm";
import { photos } from "../data/images";
import { contact } from "../data/site";

export default function Contact() {
  const cards: { icon: typeof MapPin; title: string; lines: { text: string; href?: string }[] }[] = [
    { icon: MapPin, title: "Office", lines: contact.office.map((l) => ({ text: l })) },
    { icon: Phone, title: "Phone", lines: contact.phones.map((p) => ({ text: p, href: `tel:${p.replace(/\s/g, "")}` })) },
    { icon: Mail, title: "Email", lines: [contact.emailPrimary, contact.emailAlt].map((e) => ({ text: e, href: `mailto:${e}` })) },
  ];

  return (
    <>
      <PageBanner photo={photos.panel} kicker="Contact" title="Get in touch">
        For research partnerships, consultancy, speaking invitations, media requests and graduate supervision.
      </PageBanner>

      <section className="section bg-paper">
        <div className="container-site grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <ul className="space-y-5">
            {cards.map(({ icon: Icon, title, lines }) => (
              <li key={title} className="flex gap-5 rounded-3xl bg-white p-7 shadow-card">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-teal-600 text-white"><Icon size={22} aria-hidden="true" /></span>
                <div className="min-w-0">
                  <h2 className="font-sans text-lg font-semibold">{title}</h2>
                  {lines.map((l) =>
                    l.href ? (
                      <a key={l.text} href={l.href} className="mt-1 block break-all text-slate-600 hover:text-teal-600">{l.text}</a>
                    ) : (
                      <p key={l.text} className="mt-1 text-slate-600">{l.text}</p>
                    ),
                  )}
                </div>
              </li>
            ))}
          </ul>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
