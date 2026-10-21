import { Link } from "react-router-dom";
import { BedDouble, CloudSun, House, ShieldCheck, Tent } from "lucide-react";
import { CtaBand, MoreJourneys, PageHero, useMeta } from "../components/Layout";
import { Split } from "../components/Split";
import { Photo } from "../components/Photo";
import { Reveal, SectionHeading } from "../components/ui";
import { experiences } from "../data/content";

const months = [
  { m: "Jan", ok: 3 }, { m: "Feb", ok: 3 }, { m: "Mar", ok: 2 }, { m: "Apr", ok: 1 }, { m: "May", ok: 1 }, { m: "Jun", ok: 3 },
  { m: "Jul", ok: 3 }, { m: "Aug", ok: 3 }, { m: "Sep", ok: 3 }, { m: "Oct", ok: 3 }, { m: "Nov", ok: 2 }, { m: "Dec", ok: 3 },
];

export default function Tanzania() {
  useMeta("Why Tanzania", "Breathtaking safaris, dreamlike beaches, fascinating treks and living cultures: why Tanzania is one of Africa's most diverse and peaceful destinations.");
  return (
    <>
      <PageHero
        photo="lionsSunset"
        eyebrow="Breathtaking safaris · Dreamlike beaches · Fascinating treks · Living cultures"
        title={<>Why <em className="text-gold">Tanzania</em>?</>}
        intro="Of course we love our country. Let us tell you why you will, too."
        crumbs={[{ label: "Tanzania" }]}
      />

      <section className="py-24 md:py-32">
        <div className="container-x space-y-28">
          <Split photo="sameWomen" eyebrow="Our home" title="A land of warm, hospitable people.">
            <p>Warm, hospitable people full of zest for life. Indigenous peoples who have kept their customs and languages while living peacefully together as Tanzanians. Impressive nature and an incredible variety of wildlife in vast national parks, some among the largest in Africa. Magnificent mountains for short walks or long expeditions. And dreamlike beaches far from the crowds, where you can relax at the end of an eventful journey.</p>
            <p>The world-famous highlights are all here, and we're happy to guide you to them: the Ngorongoro Crater, the Serengeti and its Great Migration, Kilimanjaro at 5,895 metres, and Zanzibar with its coral reefs.</p>
          </Split>
          <Split photo="safariPlains" eyebrow="Beyond the brochure" title="Where few tourists go." flip>
            <p>Even more, we love taking you where few visitors go, especially to the south, where our roots lie. We buy grilled corn and fresh fruit at roadside stands with you, take you to a traditional "Kitimoto" restaurant, or explore the vast Nyerere National Park together.</p>
            <p>We visit villages where people lead simple, happy lives, and show you colourful markets and a hospitality you won't forget.</p>
          </Split>
        </div>
      </section>

      <section className="bg-night py-24 text-cream md:py-28">
        <div className="container-x grid gap-12 lg:grid-cols-3">
          <Reveal className="lg:col-span-1">
            <ShieldCheck className="size-10 text-gold" />
            <h2 className="display-md mt-6">One of Africa's safest countries.</h2>
            <p className="mt-5 leading-relaxed text-cream/70">Tanzania has been led by democratically elected governments for decades. There are no conflicts between its peoples, and Christians and Muslims live peacefully side by side.</p>
          </Reveal>
          <Reveal delay={120} className="lg:col-span-2">
            <div className="flex items-center gap-3"><CloudSun className="size-6 text-gold" /><p className="eyebrow eyebrow-light">The ideal travel time</p></div>
            <p className="mt-5 text-lg leading-relaxed text-cream/80">Good news first: you can travel to Tanzania all year round. December to February and June to October offer the most comfortable conditions. The long rains (April–May) and short rains (November) are pronounced in some regions and barely noticeable in others.</p>
            <div className="mt-8 grid grid-cols-6 gap-2 sm:grid-cols-12">
              {months.map(({ m, ok }) => (
                <div key={m} className="text-center">
                  <div className={`h-16 rounded-xl ${ok === 3 ? "bg-gradient-to-t from-sunset to-gold" : ok === 2 ? "bg-gold/40" : "bg-white/10"}`} />
                  <p className="mt-2 text-xs text-cream/60">{m}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-5 text-xs text-cream/60">
              <span className="flex items-center gap-2"><span className="size-3 rounded bg-gold" /> Ideal</span>
              <span className="flex items-center gap-2"><span className="size-3 rounded bg-gold/40" /> Good, some rain</span>
              <span className="flex items-center gap-2"><span className="size-3 rounded bg-white/10" /> Main rainy season</span>
            </div>
            <p className="mt-6 text-sm text-cream/60">Coast: 27–35°C, 70–80% humidity. Highlands: 22–30°C by day with cool nights. Kilimanjaro can be climbed year round; the Usambara Mountains are best avoided in April and May.</p>
          </Reveal>
        </div>
      </section>

      <section className="py-24 md:py-32">
        <div className="container-x">
          <SectionHeading eyebrow="Your accommodation" title="Stay exactly the way you like." />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { icon: Tent, title: "Tented camps", text: "Fixed tent camps where you experience nature up close, falling asleep to the sounds of the bush." },
              { icon: BedDouble, title: "Lodges & hotels", text: "Classic local lodges with great value, or hotels of the very highest standard, equal to 4 or 5 stars." },
              { icon: House, title: "Homestays", text: "On request, nights with Tanzanian families, for the deepest possible insight into real life here." },
            ].map((a, i) => (
              <Reveal key={a.title} delay={i * 120} className="rounded-[1.75rem] border border-line bg-paper p-8">
                <a.icon className="size-8 text-terracotta" />
                <h3 className="mt-5 text-2xl">{a.title}</h3>
                <p className="mt-3 leading-relaxed text-muted">{a.text}</p>
              </Reveal>
            ))}
          </div>

          <div className="mt-24 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {experiences.map((e, i) => (
              <Reveal key={e.slug} delay={i * 80}>
                <Link to={e.to} className="group relative block aspect-[4/3] overflow-hidden rounded-[1.5rem]">
                  <Photo photo={e.photo} className="absolute inset-0" imgClassName="transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-night/85 to-transparent" />
                  <span className="absolute bottom-5 left-5 font-display text-2xl text-white">{e.title}</span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <MoreJourneys />
      <CtaBand />
    </>
  );
}
