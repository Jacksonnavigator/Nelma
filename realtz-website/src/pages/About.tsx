import { Link } from "react-router-dom";
import { ArrowRight, Bird, Compass, Footprints, Handshake, Heart, Mail, Mountain, Palmtree, Phone, Quote, Shuffle, Sparkles, Users } from "lucide-react";
import { CtaBand, PageHero, useMeta } from "../components/Layout";
import { Photo } from "../components/Photo";
import { Reveal, SectionHeading } from "../components/ui";
import { Paras, Rich } from "../content/rich";
import { telHref, useContent, useDestinations, usePage } from "../content/store";

const offeringIcons = [Compass, Footprints, Mountain, Users, Palmtree, Palmtree, Bird, Heart];

export default function About() {
  const p = usePage("about");
  const { settings } = useContent();
  const d = useDestinations();
  useMeta(p.meta.title, p.meta.description);
  const sales = settings.departments.find((x) => /sales/i.test(x.name)) ?? settings.departments[0];
  const mailto = sales ? `mailto:${sales.email}?subject=${encodeURIComponent(p.trade.emailSubject)}` : "/contact";

  return (
    <>
      <PageHero photo={p.hero.image} eyebrow={p.hero.eyebrow} title={p.hero.title} intro={p.hero.intro} crumbs={[{ label: p.meta.title }]}>
        <Link to="/plan-trip" className="btn btn-sun">{p.hero.button}</Link>
        <a href="#travel-trade" className="btn btn-ghost-light">{p.hero.agentsButton}</a>
      </PageHero>

      <section className="py-24 md:py-32">
        <div className="container-x grid gap-14 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading eyebrow={p.who.eyebrow} title={p.who.title} />
            <Reveal delay={120} className="prose-travel mt-7"><Paras text={p.who.text} /></Reveal>
          </div>
          <Reveal delay={100} className="relative">
            <Photo photo={p.who.image} className="aspect-[4/5] rounded-[2rem]" />
            {p.who.quote && (
              <div className="absolute -bottom-8 left-6 max-w-xs rounded-[1.5rem] bg-earth p-6 text-cream shadow-2xl md:-left-8">
                <Quote className="size-8 text-gold" />
                <p className="mt-3 font-display text-xl leading-snug">{p.who.quote}</p>
              </div>
            )}
          </Reveal>
        </div>
      </section>

      <section className="bg-paper py-24 md:py-32">
        <div className="container-x grid gap-8 lg:grid-cols-2">
          {[
            { icon: Heart, ...p.personal, note: "" },
            { icon: Shuffle, ...p.flexible },
          ].map((b, i) => (
            <Reveal key={i} delay={i * 120} className="rounded-[2rem] border border-line bg-cream p-8 md:p-12">
              <b.icon className="size-9 text-terracotta" />
              <h2 className="display-md mt-6"><Rich text={b.title} accent="text-terracotta" /></h2>
              <div className="prose-travel mt-5">
                <Paras text={b.text} />
                {b.note && <p className="text-sm"><Rich text={b.note} /></p>}
              </div>
              <p className="mt-6 font-display text-xl text-earth"><Rich text={b.closing} accent="text-terracotta" /></p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-night py-24 text-cream md:py-32">
        <Photo photo={p.beyond.image} className="absolute inset-0 opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-r from-night via-night/90 to-night/60" />
        <div className="container-x relative grid gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <SectionHeading light eyebrow={p.beyond.eyebrow} title={p.beyond.title} />
            <Reveal delay={120} className="mt-7 space-y-5 text-lg leading-relaxed text-cream/80">
              <Paras text={p.beyond.text} accent="text-gold" />
              {p.beyond.note && <p className="text-base text-cream/65"><Rich text={p.beyond.note} /></p>}
            </Reveal>
          </div>
          <Reveal delay={200} className="self-end">
            <p className="eyebrow eyebrow-light">{p.beyond.linksTitle}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {p.beyond.links.map(d.find).filter((x): x is NonNullable<typeof x> => Boolean(x)).map((x) => (
                <Link key={x.slug} to={`/destinations/${x.category}/${x.slug}`} className="group flex items-center justify-between rounded-2xl border border-white/15 px-5 py-4 transition-colors hover:border-gold">
                  <span className="font-display text-xl">{x.name.replace(/ (National Park|Mountains National Park|Stream National Park)$/, "")}</span>
                  <ArrowRight className="size-4 text-gold transition-transform group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
            <Link to="/destinations" className="btn btn-sun mt-6">{p.beyond.button}</Link>
          </Reveal>
        </div>
      </section>

      <section id="travel-trade" className="scroll-mt-24 py-24 md:py-32">
        <div className="container-x grid gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow={p.trade.eyebrow} title={p.trade.title} />
            <Reveal delay={120} className="prose-travel mt-7"><Paras text={p.trade.text} /></Reveal>
          </div>
          <Reveal delay={100} className="rounded-[2rem] bg-earth p-8 text-cream md:p-12">
            <Handshake className="size-10 text-gold" />
            <h3 className="mt-6 text-3xl">{p.trade.boxTitle}</h3>
            <ul className="mt-6 space-y-3">
              {p.trade.points.map((pt, i) => (
                <li key={i} className="flex items-center gap-3 text-cream/85"><Sparkles className="size-4 shrink-0 text-gold" />{pt}</li>
              ))}
            </ul>
            {sales && (
              <div className="mt-8 border-t border-white/15 pt-6">
                <p className="text-sm text-cream/60">{p.trade.contactNote}</p>
                <a href={mailto} className="mt-3 flex items-center gap-3 font-display text-xl hover:text-gold"><Mail className="size-5 text-gold" />{sales.email}</a>
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Phone className="size-5 text-gold" />
                  {sales.phones.map((ph, i) => <a key={i} href={telHref(ph)} className="hover:text-gold">{ph}</a>)}
                </p>
                <a href={mailto} className="btn btn-sun mt-7">{p.trade.button}</a>
              </div>
            )}
          </Reveal>
        </div>
      </section>

      <section className="bg-sand/45 py-24 md:py-32">
        <div className="container-x grid gap-14 lg:grid-cols-2 lg:items-center">
          <Reveal className="grid grid-cols-2 gap-4">
            {p.local.images.slice(0, 2).map((img, i) => (
              <Photo key={i} photo={img} className={`aspect-[3/4] rounded-[1.5rem] ${i === 1 ? "mt-10" : ""}`} />
            ))}
          </Reveal>
          <div>
            <SectionHeading eyebrow={p.local.eyebrow} title={p.local.title} />
            <Reveal delay={120} className="prose-travel mt-7"><Paras text={p.local.text} /></Reveal>
            <Reveal delay={200} className="mt-8">
              <Link to="/community" className="btn btn-earth">{p.local.button}</Link>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32">
        <div className="container-x">
          <SectionHeading align="center" eyebrow={p.offerings.eyebrow} title={p.offerings.title} intro={p.offerings.intro} />
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {p.offerings.items.map((text, i) => {
              const Icon = offeringIcons[i % offeringIcons.length];
              return (
                <Reveal key={i} delay={(i % 4) * 80} className="rounded-[1.5rem] border border-line bg-paper p-6">
                  <Icon className="size-7 text-terracotta" />
                  <p className="mt-4 leading-relaxed text-ink">{text}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-earth py-24 text-cream md:py-32">
        <div className="container-x max-w-4xl text-center">
          <p className="eyebrow eyebrow-light">{p.promise.eyebrow}</p>
          <Reveal>
            <p className="mt-6 font-display text-3xl leading-snug md:text-[2.6rem]"><Rich text={p.promise.text} /></p>
          </Reveal>
          <Reveal delay={150} className="mx-auto mt-10 grid max-w-3xl gap-6 text-cream/80 sm:grid-cols-3 [&_strong]:text-gold">
            {p.promise.points.map((pt, i) => <p key={i}><Rich text={pt} /></p>)}
          </Reveal>
          <p className="mt-12 text-sm text-cream/60">{p.promise.closing}</p>
        </div>
      </section>

      {settings.sister.url && (
        <section className="py-20">
          <div className="container-x flex flex-col items-center gap-6 text-center">
            <p className="eyebrow">{p.sister.eyebrow}</p>
            <a href={settings.sister.url} target="_blank" rel="noreferrer" className="flex items-center gap-5">
              <Photo photo={settings.sister.logo} className="size-20 rounded-full !bg-paper shadow-md" imgClassName="!object-contain p-2" />
              <span className="text-left">
                <span className="block font-display text-3xl">{settings.sister.name}</span>
                <span className="text-muted">{p.sister.note}</span>
              </span>
            </a>
          </div>
        </section>
      )}

      <CtaBand title={p.cta.title} text={p.cta.text} />
    </>
  );
}
