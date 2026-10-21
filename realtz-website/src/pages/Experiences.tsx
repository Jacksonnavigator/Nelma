import { Link } from "react-router-dom";
import { ArrowRight, Binoculars, Footprints, Mountain, Waves } from "lucide-react";
import { CtaBand, MoreJourneys, PageHero, useMeta } from "../components/Layout";
import { Pills, Split } from "../components/Split";
import { Photo } from "../components/Photo";
import { Reveal, SectionHeading } from "../components/ui";
import { experiences } from "../data/content";
import type { PhotoKey } from "../data/images";
import { byCategory } from "../data/destinations";
import { DestinationCard } from "./Destinations";

export function ExperiencesOverview() {
  useMeta("Experiences", "Safari, trekking, culture and beach: the four faces of Tanzania, combined into one private journey.");
  return (
    <>
      <PageHero
        photo="giraffes"
        eyebrow="Enchanting and diverse"
        title={<>Four ways to fall in love with <em className="text-gold">Tanzania</em>.</>}
        intro="Mix them freely. Most of our guests combine two or three into one journey."
        crumbs={[{ label: "Experiences" }]}
      />
      <section className="py-24 md:py-32">
        <div className="container-x space-y-10">
          {experiences.map((e, i) => (
            <Reveal key={e.slug}>
              <Link to={e.to} className="group grid overflow-hidden rounded-[2rem] border border-line bg-paper transition-shadow hover:shadow-2xl hover:shadow-earth/10 md:grid-cols-2">
                <Photo photo={e.photo} className={`aspect-[16/11] md:aspect-auto md:min-h-[26rem] ${i % 2 ? "md:order-2" : ""}`} imgClassName="transition-transform duration-[1.2s] group-hover:scale-105" />
                <div className="flex flex-col justify-center p-8 md:p-14">
                  <span className="font-display text-6xl text-sand-deep">0{i + 1}</span>
                  <h2 className="display-md mt-2">{e.title}</h2>
                  <p className="mt-4 text-lg leading-relaxed text-muted">{e.line}</p>
                  <span className="mt-8 inline-flex items-center gap-2 font-semibold text-terracotta">
                    Discover {e.title.toLowerCase()} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
      <CtaBand />
    </>
  );
}

function Gallery({ photos }: { photos: PhotoKey[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {photos.map((p, i) => (
        <Reveal key={p} delay={i * 100} className={i === 0 ? "col-span-2 row-span-2 md:col-span-2" : ""}>
          <Photo photo={p} className={`h-full rounded-[1.5rem] ${i === 0 ? "aspect-[4/3] md:aspect-auto md:min-h-full" : "aspect-square"}`} />
        </Reveal>
      ))}
    </div>
  );
}

const parks = [
  { slug: "serengeti", name: "Serengeti", note: "Endless plains and the Great Migration", photo: "serengeti" as PhotoKey },
  { slug: "ngorongoro", name: "Ngorongoro Crater", note: "The world's largest intact caldera, home to the Big Five", photo: "ngorongoro" as PhotoKey },
  { slug: "tarangire", name: "Tarangire", note: "Huge elephant herds beneath ancient baobabs", photo: "tarangire" as PhotoKey },
  { slug: "lake-manyara", name: "Lake Manyara", note: "Tree-climbing lions and flamingo shores", photo: "manyara" as PhotoKey },
];

export function Safari() {
  useMeta("Safari", "Private safaris across Tanzania's national parks, from the Serengeti and Ngorongoro to the wild, uncrowded south.");
  return (
    <>
      <PageHero
        photo="elephantZebras"
        eyebrow="Safari? Absolutely!"
        title={<>The national <em className="text-gold">parks</em>.</>}
        intro="Untouched wilderness, extraordinary wildlife, and journeys crafted just for you: private, at your pace, in comfort."
        crumbs={[{ label: "Experiences", to: "/experiences" }, { label: "Safari" }]}
      >
        <Link to="/plan-trip" className="btn btn-sun">Plan my safari</Link>
      </PageHero>

      <section className="py-24 md:py-32">
        <div className="container-x">
          <Split photo="zebrasRiver" eyebrow="Even for us Tanzanians" title="Always something unique." tall>
            <p>Even for us, a safari is always something special. It's fascinating how close you get to animals you'd otherwise only see in zoos. A little bumpy and dusty, perhaps, but worth every bit of the effort.</p>
            <p>Tanzania proudly has 22 national parks, and choosing the right ones matters. Each has its own character and appeal. Tell us what you'd love to see, and we'll find the parks that will captivate you most.</p>
          </Split>
        </div>
      </section>

      <section className="bg-paper py-24 md:py-32">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading eyebrow="The northern circuit" title="The world-famous classics." />
            <Link to="/destinations/national-parks" className="btn btn-ghost">All national parks</Link>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {parks.map((p, i) => (
              <Reveal key={p.name} delay={i * 100}>
                <Link to={`/destinations/national-parks/${p.slug}`} className="group block">
                  <Photo photo={p.photo} className="aspect-[3/4] rounded-[1.5rem]" imgClassName="transition-transform duration-700 group-hover:scale-105" />
                  <h3 className="mt-4 text-2xl transition-colors group-hover:text-terracotta">{p.name}</h3>
                  <p className="mt-1 text-sm text-muted">{p.note}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-night py-24 text-cream md:py-32">
        <Photo photo="cheetah" className="absolute inset-0 opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-night via-night/90 to-night/50" />
        <div className="container-x relative grid gap-12 lg:grid-cols-2">
          <div>
            <Binoculars className="size-10 text-gold" />
            <p className="eyebrow eyebrow-light mt-6">A great trio in the south</p>
            <h2 className="display-lg mt-4">Off the beaten path, far from the crowds.</h2>
          </div>
          <div className="space-y-5 text-lg leading-relaxed text-cream/80">
            <p>Combine <strong className="text-cream">Mikumi</strong>, with elephants, lions, zebras and giraffes on the open Mkata Plains; <strong className="text-cream">Nyerere</strong>, one of Africa's largest protected areas, home to buffalo, hippos and the rare African wild dog; and the rainforest and waterfalls of <strong className="text-cream">Udzungwa</strong>, one of the richest biodiversity areas on earth.</p>
            <p>Or go further: <strong className="text-cream">Mkomazi</strong> with its black rhino project, <strong className="text-cream">Ruaha</strong> and its predators, remote <strong className="text-cream">Katavi</strong>, and the chimpanzees of <strong className="text-cream">Mahale</strong> and <strong className="text-cream">Gombe</strong> on Lake Tanganyika.</p>
            <div className="flex flex-wrap gap-2">
              {[["Mikumi", "mikumi"], ["Nyerere", "nyerere"], ["Udzungwa", "udzungwa"], ["Mkomazi", "mkomazi"], ["Ruaha", "ruaha"], ["Katavi", "katavi"], ["Mahale", "mahale"], ["Gombe", "gombe"]].map(([n, slug]) => (
                <Link key={slug} to={`/destinations/national-parks/${slug}`} className="rounded-full border border-white/20 px-4 py-2 text-sm text-cream transition-colors hover:border-gold hover:text-gold">{n}</Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <MoreJourneys title="Safari journeys" />
      <CtaBand title="Which parks are right for you?" text="Every safari is private and personalised. Tell us your dates and wishes and we'll suggest the perfect combination." />
    </>
  );
}

export function Trekking() {
  useMeta("Trekking", "Kilimanjaro, Mount Meru, the Usambara Mountains and gentle cultural walks: trekking in Tanzania with experienced local guides.");
  const levels = [
    { icon: Footprints, title: "Easy walks", text: "Cultural walks with local guides who happily explain how their life, culture and community work. They sharpen your perspective, open the world beyond your horizon, and they're fun too." },
    { icon: Mountain, title: "Multi-day treks", text: "A step up: one or more days in the Udzungwa Mountains with their forests, waterfalls and birdlife, or the Usambara Mountains with fantastic views and plenty of village culture. Very few tourists either way." },
    { icon: Mountain, title: "High peaks", text: "Kilimanjaro at 5,895 m, or the far quieter Mount Meru at 4,562 m. From Meru's summit, reached in 3 days, you watch the sun rise behind Kilimanjaro's silhouette. Unforgettable." },
  ];
  return (
    <>
      <PageHero
        photo="kiliClouds"
        eyebrow="Get intimately close to Tanzania"
        title={<>The roof of <em className="text-gold">Africa</em> awaits.</>}
        intro="Two hours, a full day or several days; leisurely or ambitious. In Tanzania there is a trail for everyone."
        crumbs={[{ label: "Experiences", to: "/experiences" }, { label: "Trekking" }]}
      >
        <Link to="/journal/kilimanjaro-routes-compared" className="btn btn-ghost-light">Compare Kilimanjaro routes</Link>
      </PageHero>

      <section className="py-24 md:py-32">
        <div className="container-x">
          <SectionHeading align="center" eyebrow="Choose your pace" title="From village paths to Uhuru Peak." />
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {levels.map((l, i) => (
              <Reveal key={l.title} delay={i * 120} className="rounded-[1.75rem] border border-line bg-paper p-8">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Level {i + 1}</span>
                <l.icon className="mt-4 size-9 text-terracotta" />
                <h3 className="mt-4 text-2xl">{l.title}</h3>
                <p className="mt-3 leading-relaxed text-muted">{l.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-paper py-24 md:py-32">
        <div className="container-x grid gap-14 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <SectionHeading
            eyebrow="Your trekking tour"
            title="Perfectly prepared, safely guided."
            intro="We'll advise you on the right tour, and for the one you choose you'll receive a tailored packing list. Our experienced guides take you safely to the summit and back."
          />
          <Gallery photos={["kiliSummit", "kiliGroup", "kiliGate"]} />
        </div>
        <div className="container-x mt-16 flex flex-wrap items-center gap-3">
          <span className="mr-2 text-sm font-semibold text-earth">Mountain guides:</span>
          {[["Kilimanjaro", "kilimanjaro"], ["Mount Meru", "mount-meru"], ["Ol Doinyo Lengai", "ol-doinyo-lengai"], ["Usambara", "usambara"], ["Uluguru", "uluguru"], ["Mount Hanang", "mount-hanang"], ["Udzungwa", "udzungwa"]].map(([n, slug]) => (
            <Link key={slug} to={slug === "udzungwa" ? "/destinations/national-parks/udzungwa" : `/destinations/mountains/${slug}`} className="rounded-full border border-line bg-cream px-4 py-2 text-sm text-earth transition-colors hover:border-earth">{n}</Link>
          ))}
        </div>
      </section>

      <CtaBand title="Ready to climb?" text="Kilimanjaro, Meru or a gentle village trail: tell us your fitness and your dream, and we'll plan the rest." />
    </>
  );
}

export function Culture() {
  useMeta("Culture", "Authentic encounters with Tanzania's more than 120 peoples: food, farming, crafts and everyday village life.");
  return (
    <>
      <PageHero
        photo="sameWomen"
        eyebrow="The heart of every trip"
        title={<>Different people, <em className="text-gold">open hearts</em>.</>}
        intro="Over 120 peoples live peacefully together in Tanzania and always welcome strangers. Experience the warmth that makes our country unique."
        crumbs={[{ label: "Experiences", to: "/experiences" }, { label: "Culture" }]}
      />

      <section className="py-24 md:py-32">
        <div className="container-x space-y-28">
          <Split photo="culturalBuffet" eyebrow="A brief word on history" title="Not staged, but truly lived.">
            <p>Tanzania is home to more than 120 peoples, each adding to the country's rich diversity and traditions. This vibrant mix shapes a way of life that goes far beyond what tourism usually shows.</p>
            <p>We give you the chance to experience genuine local life: connecting with communities, traditions and everyday moments that are not staged, but truly lived.</p>
          </Split>
          <Split photo="sameCooking" eyebrow="Food" title="The way to the heart is through the stomach." flip>
            <p>Including the love for Tanzania! Try ugali (a cornmeal dish similar to polenta) or chapati flatbread with various sauces, naturally eaten by hand. Taste fresh mangos, cashews or coconuts at the market.</p>
            <p>For souvenirs, two art forms are uniquely Tanzanian: carvings of grenadilla wood ("mpingo" or blackwood), found in the south, and the vibrantly colourful Tingatinga paintings.</p>
          </Split>
          <Split photo="sameFarming" eyebrow="Local life experience" title="Farm, cook and laugh with the community.">
            <p>Take part in daily life: farming, cattle keeping, traditional food preparation. Walk alongside local farmers, learn traditional ways of living and feel the warmth of the community.</p>
            <p>Whether you'd like a simple encounter or a deeper stay with families, every journey is personalised to your interests and comfort.</p>
          </Split>
        </div>
      </section>

      <section className="bg-paper py-24 md:py-32">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading eyebrow="More than 120 peoples" title="Meet Tanzania's peoples." intro="From Maasai herders and Hadzabe hunter-gatherers to Chagga coffee farmers, Makonde carvers and the Swahili of the coast. These are the communities we visit most often; ask us about any other." />
            <Link to="/destinations/cultures" className="btn btn-ghost">All peoples & heritage sites</Link>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {byCategory("cultures").filter((d) => d.circuit === "Peoples").map((d, i) => (
              <Reveal key={d.slug} delay={(i % 4) * 60}><DestinationCard dest={d} compact /></Reveal>
            ))}
          </div>
          <div className="mt-16 rounded-[2rem] bg-cream p-8 md:p-10">
            <p className="eyebrow">Cultural heritage sites</p>
            <div className="mt-5 flex flex-wrap gap-3">
              {byCategory("cultures").filter((d) => d.circuit === "Heritage sites").concat(byCategory("islands").filter((d) => ["zanzibar", "kilwa", "bagamoyo"].includes(d.slug))).map((d) => (
                <Link key={d.slug} to={`/destinations/${d.category}/${d.slug}`} className="rounded-full border border-line bg-paper px-4 py-2.5 text-sm font-medium text-earth transition-colors hover:border-earth">
                  {d.slug === "zanzibar" ? "Stone Town, Zanzibar" : d.slug === "kilwa" ? "Kilwa Kisiwani ruins" : d.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-earth py-20 text-cream">
        <div className="container-x flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <p className="eyebrow eyebrow-light">Travel that gives back</p>
            <h2 className="display-md mt-3 max-w-2xl">Meet the women's groups who welcome our guests.</h2>
          </div>
          <Link to="/community" className="btn btn-sun">Our community partners <ArrowRight className="size-4" /></Link>
        </div>
      </section>

      <MoreJourneys title="Journeys rich in culture" />
      <CtaBand />
    </>
  );
}

const coasts = [
  { slug: "zanzibar", name: "Zanzibar", photo: "zanzibarDhows" as PhotoKey, text: "Stunning white sand and turquoise water, but its true uniqueness is its heritage. From historic Stone Town to luxurious beach resorts, history, culture and tropical beauty in one." },
  { slug: "mafia", name: "Mafia Island", photo: "mafia" as PhotoKey, text: "For true privacy and untouched beauty. Quiet beaches, crystal-clear water and rich marine life, including whale sharks and vibrant coral reefs." },
  { slug: "kilwa", name: "Kilwa", photo: "kilwa" as PhotoKey, text: "Beach relaxation meets deep history. A calm, uncrowded coast beside the ancient ruins of a once-thriving Swahili trading port." },
  { slug: "pangani", name: "Pangani (Tanga)", photo: "pangani" as PhotoKey, text: "Long, quiet beaches lined with coconut palms. No crowds, just nature, gentle breezes and a relaxed coastal lifestyle." },
  { slug: "bagamoyo", name: "Bagamoyo", photo: "bagamoyo" as PhotoKey, text: "A peaceful coastal town infused with history and art. Once an important trading port, now a calm place to unwind." },
];

export function BeachSea() {
  useMeta("Beach & Sea", "Zanzibar, Mafia Island, Kilwa, Pangani and Bagamoyo: the perfect ending to your Tanzania journey.");
  return (
    <>
      <PageHero
        photo="zanzibarBeach"
        eyebrow="Relaxing · Refreshing · Essential"
        title={<>Let your soul <em className="text-gold">unwind</em>.</>}
        intro="Sea breeze, warm water and a hammock under a palm tree. Or a dhow, a reef and a spice tour. The perfect ending to an eventful journey."
        crumbs={[{ label: "Experiences", to: "/experiences" }, { label: "Beach & Sea" }]}
      />

      <section className="py-24 md:py-32">
        <div className="container-x grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <SectionHeading eyebrow="Beach holiday too boring?" title="An almost Caribbean feeling, in the middle of Africa." />
            <Reveal delay={120} className="prose-travel mt-6">
              <p>Don't miss the white coral beaches anyway. There's plenty to keep you active: sail on a traditional dhow, snorkel or dive off Zanzibar or, more exclusively, Mafia Island. Try kitesurfing or a sea kayak, or treat your senses to a spice tour and an evening at the Forodhani Gardens food market.</p>
            </Reveal>
            <Reveal delay={200} className="mt-8"><Pills items={["Dhow sailing", "Snorkelling & diving", "Kitesurfing", "Sea kayaking", "Spice tours", "Forodhani Gardens"]} /></Reveal>
          </div>
          <Reveal delay={100} className="relative">
            <Photo photo="zanzibarWomen" className="aspect-[4/5] rounded-[2rem]" />
            <div className="absolute -bottom-6 -left-6 hidden rounded-2xl bg-paper p-5 shadow-xl md:block">
              <Waves className="size-7 text-terracotta" />
              <p className="mt-2 font-display text-2xl">26–29°C</p>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Indian Ocean water</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-paper py-24 md:py-32">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading eyebrow="Quality by the sea" title="Five coasts, five characters." />
            <Link to="/destinations/islands" className="btn btn-ghost">All islands & coast</Link>
          </div>
          <div className="mt-14 space-y-6">
            {coasts.map((c, i) => (
              <Reveal key={c.name} className="grid overflow-hidden rounded-[1.75rem] bg-cream md:grid-cols-[1.1fr_1fr]">
                <Photo photo={c.photo} className={`aspect-[16/10] md:aspect-auto md:min-h-[20rem] ${i % 2 ? "md:order-2" : ""}`} />
                <div className="flex flex-col justify-center p-8 md:p-12">
                  <span className="font-display text-sm text-terracotta">0{i + 1}</span>
                  <h3 className="mt-1 text-3xl md:text-4xl">{c.name}</h3>
                  <p className="mt-4 leading-relaxed text-muted">{c.text}</p>
                  <Link to={`/destinations/islands/${c.slug}`} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-terracotta">Read the full guide <ArrowRight className="size-4" /></Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container-x max-w-4xl text-center">
          <SectionHeading align="center" eyebrow="Why you shouldn't skip the beaches" title="Shaped by centuries of ocean trade." intro="Tanzanian culture was shaped by influences that arrived by sea: Arab, Persian, Indian and Portuguese. We'll help you choose the places you'll love most, and book excursions on site so you can simply enjoy." />
        </div>
      </section>

      <MoreJourneys title="Journeys that end by the sea" />
      <CtaBand />
    </>
  );
}
