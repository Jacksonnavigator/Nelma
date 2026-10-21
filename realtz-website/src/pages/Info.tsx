import { Link } from "react-router-dom";
import { CtaBand, PageHero, useMeta } from "../components/Layout";
import { Faq, Reveal, SectionHeading } from "../components/ui";
import { travelFaq } from "../data/content";
import { site } from "../data/site";

export function TravelInfo() {
  useMeta("Travel info & FAQ", "Practical answers about travelling in Tanzania with us: seasons, safety, accommodation, climate and how planning works.");
  return (
    <>
      <PageHero photo="ngorongoro" eyebrow="Information about your trip" title={<>Good to <em className="text-gold">know</em>.</>} intro="The questions we hear most often. If yours isn't here, just ask." crumbs={[{ label: "Travel info" }]} />
      <section className="py-24 md:py-28">
        <div className="container-x grid gap-14 lg:grid-cols-[1fr_2fr]">
          <SectionHeading eyebrow="FAQ" title="Your questions, answered." />
          <Reveal delay={100}><Faq items={travelFaq} /></Reveal>
        </div>
      </section>
      <CtaBand />
    </>
  );
}

function LegalShell({ title, children }: { title: string; children: React.ReactNode }) {
  useMeta(title);
  return (
    <section className="pb-24 pt-40">
      <div className="container-x max-w-3xl">
        <p className="eyebrow">Legal</p>
        <h1 className="display-lg mt-3">{title}</h1>
        <div className="prose-travel mt-10 space-y-6 [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-ink">{children}</div>
      </div>
    </section>
  );
}

export function Imprint() {
  return (
    <LegalShell title="Imprint">
      <h2>Company</h2>
      <p>{site.legalName}<br />{site.address}</p>
      <h2>Contact</h2>
      {site.departments.map((d) => (
        <p key={d.name}>
          <strong>{d.name}</strong>: <a className="underline" href={`mailto:${d.email}`}>{d.email}</a>, {d.phones.join(" / ")}
        </p>
      ))}
      <h2>Sister company</h2>
      <p>Real Africa, Germany: <a className="underline" href={site.sister.url} target="_blank" rel="noreferrer">real-africa.de</a></p>
    </LegalShell>
  );
}

export function Privacy() {
  return (
    <LegalShell title="Privacy policy">
      <p>We respect your privacy. This page explains what happens to the information you share with us through this website.</p>
      <h2>What we collect</h2>
      <p>Only what you choose to send us through the trip planner, contact form or newsletter sign-up: typically your name, email, phone number and your travel wishes.</p>
      <h2>Why we use it</h2>
      <p>To answer your enquiry, plan and organise your trip, and, if you signed up, to send you our newsletter. We never sell your data.</p>
      <h2>Who receives it</h2>
      <p>Our team in Tanzania, the form service that delivers messages to us, and, once you book, the lodges, guides and partners needed to run your journey. If you message us on WhatsApp, WhatsApp's own privacy terms apply.</p>
      <h2>Your rights</h2>
      <p>You can ask us at any time what we hold about you, or ask us to correct or delete it, by writing to <a className="underline" href={`mailto:${site.email}`}>{site.email}</a>. You can unsubscribe from the newsletter with one click.</p>
      <h2>Cookies</h2>
      <p>This website does not use tracking or advertising cookies. Embedded maps are provided by Google and load only on the contact page.</p>
    </LegalShell>
  );
}

export function Terms() {
  return (
    <LegalShell title="Terms & conditions">
      <p>These are the key points of how we work. Your personal offer includes the full booking conditions for your journey.</p>
      <h2>Offers and booking</h2>
      <p>Planning and offers are free and without obligation. A booking becomes binding once you confirm your offer in writing and we confirm it back to you.</p>
      <h2>Prices and payment</h2>
      <p>Prices are individual to your journey and dates. The payment schedule (deposit and final payment) is stated in your offer.</p>
      <h2>Changes and cancellations</h2>
      <p>We'll always try to accommodate changes. Cancellation terms depend on the lodges and services booked and are set out in your offer before you confirm.</p>
      <h2>Travel insurance and documents</h2>
      <p>We strongly recommend comprehensive travel and medical insurance. You are responsible for a valid passport, visa and any required vaccinations; we're happy to advise.</p>
      <h2>Questions</h2>
      <p>Write to <a className="underline" href={`mailto:${site.email}`}>{site.email}</a> or <Link className="underline" to="/contact">contact us</Link>.</p>
    </LegalShell>
  );
}

export function NotFound() {
  useMeta("Page not found");
  return (
    <section className="grid min-h-[80vh] place-items-center bg-cream px-5 pt-24 text-center">
      <div>
        <p className="font-display text-[8rem] leading-none text-sand-deep">404</p>
        <h1 className="display-md mt-2">This trail leads nowhere.</h1>
        <p className="mt-3 text-muted">Even the best guides take a wrong turn sometimes.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/" className="btn btn-earth">Back to home</Link>
          <Link to="/plan-trip" className="btn btn-ghost">Plan a trip</Link>
        </div>
      </div>
    </section>
  );
}
