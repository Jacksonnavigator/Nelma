import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { CtaBand, PageHero, useMeta } from "../components/Layout";
import { Faq, Reveal, SectionHeading } from "../components/ui";
import { Markdown } from "../content/rich";
import { useContent, usePage } from "../content/store";

export function TravelInfo() {
  const p = usePage("travelInfo");
  const faq = useContent().faq;
  useMeta(p.meta.title, p.meta.description);
  return (
    <>
      <PageHero photo={p.hero.image} eyebrow={p.hero.eyebrow} title={p.hero.title} intro={p.hero.intro} crumbs={[{ label: p.meta.title }]} />
      <section className="py-24 md:py-28">
        <div className="container-x grid gap-14 lg:grid-cols-[1fr_2fr]">
          <SectionHeading eyebrow={p.eyebrow} title={p.title} />
          <Reveal delay={100}><Faq items={faq} /></Reveal>
        </div>
      </section>
      <CtaBand />
    </>
  );
}

function LegalShell({ title, body, children }: { title: string; body: string; children?: ReactNode }) {
  useMeta(title);
  return (
    <section className="pb-24 pt-40">
      <div className="container-x max-w-3xl">
        <p className="eyebrow">Legal</p>
        <h1 className="display-lg mt-3">{title}</h1>
        <div className="mt-10 space-y-6">
          {children}
          <Markdown text={body} />
        </div>
      </div>
    </section>
  );
}

export function Imprint() {
  const p = usePage("imprint");
  const s = useContent().settings;
  return (
    <LegalShell title={p.title} body={p.body}>
      <h2 className="display-md">Company</h2>
      <p className="text-[1.08rem] leading-[1.9] text-ink/80">{s.legalName}<br />{s.address}</p>
      <h2 className="display-md pt-4">Contact</h2>
      {s.departments.map((d, i) => (
        <p key={i} className="text-[1.08rem] leading-[1.9] text-ink/80">
          <strong>{d.name}</strong>: <a className="underline" href={`mailto:${d.email}`}>{d.email}</a>{d.phones.length ? `, ${d.phones.join(" / ")}` : ""}
        </p>
      ))}
    </LegalShell>
  );
}

export function Privacy() {
  const p = usePage("privacy");
  return <LegalShell title={p.title} body={p.body} />;
}

export function Terms() {
  const p = usePage("terms");
  return <LegalShell title={p.title} body={p.body} />;
}

export function NotFound() {
  const p = usePage("notFound");
  useMeta(p.title);
  return (
    <section className="grid min-h-[80vh] place-items-center bg-cream px-5 pt-24 text-center">
      <div>
        <p className="font-display text-[8rem] leading-none text-sand-deep">{p.code}</p>
        <h1 className="display-md mt-2">{p.title}</h1>
        <p className="mt-3 text-muted">{p.text}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/" className="btn btn-earth">{p.homeButton}</Link>
          <Link to="/plan-trip" className="btn btn-ghost">{p.planButton}</Link>
        </div>
      </div>
    </section>
  );
}
