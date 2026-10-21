import { Link } from "react-router-dom";
import { ArrowRight, Bird, Compass, Footprints, Handshake, Heart, Mail, Mountain, Palmtree, Phone, Quote, Shuffle, Sparkles, Users } from "lucide-react";
import { CtaBand, PageHero, useMeta } from "../components/Layout";
import { Photo } from "../components/Photo";
import { Reveal, SectionHeading } from "../components/ui";
import { site, telHref } from "../data/site";

const offerings = [
  { icon: Compass, text: "Private and tailor-made wildlife safaris" },
  { icon: Footprints, text: "Remote and off-the-beaten-path expeditions" },
  { icon: Mountain, text: "Mount Kilimanjaro and Mount Meru trekking" },
  { icon: Users, text: "Cultural tours and community experiences" },
  { icon: Palmtree, text: "Tanzania safari and Zanzibar beach combinations" },
  { icon: Palmtree, text: "Zanzibar and Mafia Island holidays" },
  { icon: Bird, text: "Birdwatching, walking safaris, boat safaris and other nature-based experiences" },
  { icon: Heart, text: "Special-interest journeys, family holidays, honeymoons and group travel" },
];

const remote = [
  { name: "Ruaha", to: "/destinations/national-parks/ruaha" },
  { name: "Nyerere", to: "/destinations/national-parks/nyerere" },
  { name: "Katavi", to: "/destinations/national-parks/katavi" },
  { name: "Mahale Mountains", to: "/destinations/national-parks/mahale" },
  { name: "Gombe", to: "/destinations/national-parks/gombe" },
  { name: "Lake Natron", to: "/destinations/national-parks/lake-natron" },
];

const partnerPoints = [
  "Responsive, personal communication",
  "Carefully prepared itineraries",
  "Transparent quotations",
  "Practical, honest destination advice",
  "Coordinated ground arrangements",
  "Flexibility when plans need to change",
];

export default function About() {
  useMeta(
    "About us",
    "Real Tanzania Discovery Adventures Limited is a proudly Tanzanian-owned tour operator: personal service, local knowledge and journeys beyond the ordinary, for travellers and travel trade partners.",
  );
  const sales = site.departments.find((d) => d.name === "Sales")!;

  return (
    <>
      <PageHero
        photo="aboutSunset"
        eyebrow="Real Tanzania Discovery Adventures Limited"
        title={<>Discover the Real Tanzania. <em className="text-gold">Experience the difference.</em></>}
        intro="We don't just organise trips. We bring Tanzania closer to you."
        crumbs={[{ label: "About us" }]}
      >
        <Link to="/plan-trip" className="btn btn-sun">Plan your journey</Link>
        <a href="#travel-trade" className="btn btn-ghost-light">For travel agents</a>
      </PageHero>

      {/* Who we are */}
      <section className="py-24 md:py-32">
        <div className="container-x grid gap-14 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading eyebrow="Who we are" title="A proudly Tanzanian-owned tour operator." />
            <Reveal delay={120} className="prose-travel mt-7">
              <p>At Real Tanzania Discovery Adventures Limited, we believe that an unforgettable journey begins with understanding the people who take it. We are passionate about sharing the extraordinary wildlife, landscapes, cultures and hidden treasures of our beautiful country.</p>
              <p>For us, tourism is more than moving travellers from one destination to another. It is about understanding your expectations, listening to your ideas, solving challenges creatively, and creating experiences that feel personal, authentic and truly yours.</p>
              <p>Whether you dream of witnessing the Great Migration in the Serengeti, exploring the remote wilderness of southern and western Tanzania, climbing Mount Kilimanjaro, meeting local communities, or relaxing on the beaches of Zanzibar, we approach every journey with the same commitment: to make your experience meaningful, seamless and memorable.</p>
            </Reveal>
          </div>
          <Reveal delay={100} className="relative">
            <Photo photo="aboutTradeShow" className="aspect-[4/5] rounded-[2rem]" />
            <div className="absolute -bottom-8 left-6 max-w-xs rounded-[1.5rem] bg-earth p-6 text-cream shadow-2xl md:-left-8">
              <Quote className="size-8 text-gold" />
              <p className="mt-3 font-display text-xl leading-snug">Personal service. Local knowledge. Beyond the ordinary.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Personal & flexible */}
      <section className="bg-paper py-24 md:py-32">
        <div className="container-x grid gap-8 lg:grid-cols-2">
          <Reveal className="rounded-[2rem] border border-line bg-cream p-8 md:p-12">
            <Heart className="size-9 text-terracotta" />
            <h2 className="display-md mt-6">We are personal by nature.</h2>
            <div className="prose-travel mt-5">
              <p>Every traveller is different, and every travel partner has different expectations. That is why we do not believe in a one-size-fits-all approach.</p>
              <p>We take the time to understand your interests, travel style, budget, priorities and expectations before designing your journey. We listen, advise, suggest alternatives, and work with you to create an itinerary that makes sense.</p>
              <p>Our relationship does not end when an itinerary is confirmed. We stay involved throughout the journey, keeping in touch with our guests and partners, responding to requests, and making sure every detail is handled with care.</p>
            </div>
            <p className="mt-6 font-display text-xl text-earth">With us, you are not just another booking number. You are a valued guest, a trusted partner, and part of the experience we are committed to delivering.</p>
          </Reveal>
          <Reveal delay={120} className="rounded-[2rem] border border-line bg-cream p-8 md:p-12">
            <Shuffle className="size-9 text-terracotta" />
            <h2 className="display-md mt-6">Flexible enough to make it happen.</h2>
            <div className="prose-travel mt-5">
              <p>Travel does not always go exactly to plan. Guests discover new interests, weather changes, flights are delayed, and opportunities arise unexpectedly.</p>
              <p>We work closely with clients and travel agents to adjust itineraries where possible, explore alternative accommodation, reorganise logistics, and find practical solutions when circumstances change. An extra night in the Serengeti, a quieter destination away from the crowds, a special cultural encounter: we approach such requests with an open mind.</p>
              <p className="text-sm">Every change depends on safety, availability, permits, operating conditions and the practical realities of each destination. Within those limits, we do our best to make the journey work for you.</p>
            </div>
            <p className="mt-6 font-display text-xl text-earth">We do not simply tell you what is available. We work with you to explore what is possible.</p>
          </Reveal>
        </div>
      </section>

      {/* Beyond the familiar routes */}
      <section className="relative overflow-hidden bg-night py-24 text-cream md:py-32">
        <Photo photo="lionsSunset" className="absolute inset-0 opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-r from-night via-night/90 to-night/60" />
        <div className="container-x relative grid gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <SectionHeading light eyebrow="Beyond the familiar routes" title="Some of Africa's most remarkable experiences begin where the usual itinerary ends." />
            <Reveal delay={120} className="mt-7 space-y-5 text-lg leading-relaxed text-cream/80">
              <p>Tanzania is far more than its most famous attractions. While the Serengeti, Ngorongoro and Tarangire remain exceptional, we encourage our guests and travel partners to look further: to the vast wilderness of Ruaha and Nyerere, the remote landscapes of Katavi, the chimpanzee forests of Mahale and Gombe, the dramatic beauty of Lake Natron, and lesser-known communities rich in culture.</p>
              <p>Our local knowledge and ground-level operational understanding help us explore these possibilities, assess the logistics, and develop practical plans for destinations that need more careful preparation.</p>
              <p className="text-base text-cream/65">We do not promise that every remote location is easy to reach or suitable for every traveller. Instead, we bring honest advice, realistic planning, and a willingness to explore the right options for the right journey.</p>
            </Reveal>
          </div>
          <Reveal delay={200} className="self-end">
            <p className="eyebrow eyebrow-light">Explore beyond the circuit</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {remote.map((r) => (
                <Link key={r.to} to={r.to} className="group flex items-center justify-between rounded-2xl border border-white/15 px-5 py-4 transition-colors hover:border-gold">
                  <span className="font-display text-xl">{r.name}</span>
                  <ArrowRight className="size-4 text-gold transition-transform group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
            <Link to="/destinations" className="btn btn-sun mt-6">All destinations</Link>
          </Reveal>
        </div>
      </section>

      {/* Travel trade partners */}
      <section id="travel-trade" className="scroll-mt-24 py-24 md:py-32">
        <div className="container-x grid gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="For tour operators & travel agencies" title="A ground partner you can rely on." />
            <Reveal delay={120} className="prose-travel mt-7">
              <p>For international tour operators and travel agencies, choosing a local partner is about much more than competitive quotations. It is about trust, communication, operational reliability, and knowing that someone on the ground is taking responsibility for the experience being delivered.</p>
              <p>We understand that your reputation is attached to every journey you sell. We take that responsibility seriously and aim to represent your brand and your promises with professionalism and care.</p>
              <p>Classic northern circuit safaris, tailor-made private journeys, mountain trekking, cultural experiences, beach holidays or adventurous expeditions into remote Tanzania: we welcome the opportunity to work alongside you, and we value long-term partnerships built on honesty, mutual respect, consistent communication and a shared commitment to guest satisfaction.</p>
            </Reveal>
          </div>
          <Reveal delay={100} className="rounded-[2rem] bg-earth p-8 text-cream md:p-12">
            <Handshake className="size-10 text-gold" />
            <h3 className="mt-6 text-3xl">What our partners can expect</h3>
            <ul className="mt-6 space-y-3">
              {partnerPoints.map((p) => (
                <li key={p} className="flex items-center gap-3 text-cream/85"><Sparkles className="size-4 shrink-0 text-gold" />{p}</li>
              ))}
            </ul>
            <div className="mt-8 border-t border-white/15 pt-6">
              <p className="text-sm text-cream/60">Quotations, complex itineraries and long-term ground-handling partnerships:</p>
              <a href={`mailto:${sales.email}?subject=${encodeURIComponent("Partnership / quotation request")}`} className="mt-3 flex items-center gap-3 font-display text-xl hover:text-gold"><Mail className="size-5 text-gold" />{sales.email}</a>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <Phone className="size-5 text-gold" />
                {sales.phones.map((ph) => <a key={ph} href={telHref(ph)} className="hover:text-gold">{ph}</a>)}
              </p>
              <a href={`mailto:${sales.email}?subject=${encodeURIComponent("Partnership / quotation request")}`} className="btn btn-sun mt-7">Request a quotation</a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Local knowledge */}
      <section className="bg-sand/45 py-24 md:py-32">
        <div className="container-x grid gap-14 lg:grid-cols-2 lg:items-center">
          <Reveal className="grid grid-cols-2 gap-4">
            <Photo photo="sameCooking" className="aspect-[3/4] rounded-[1.5rem]" />
            <Photo photo="kiliGroup" className="mt-10 aspect-[3/4] rounded-[1.5rem]" />
          </Reveal>
          <div>
            <SectionHeading eyebrow="Local knowledge. Real connections." title="Tanzania is our home." />
            <Reveal delay={120} className="prose-travel mt-7">
              <p>Understanding its people, landscapes, traditions, travel conditions and everyday realities is an important part of what we bring to the table. Our local presence connects the details that turn an itinerary into a workable experience: the right route, appropriate accommodation, suitable activities, realistic travel times, and the people who help make each journey possible.</p>
              <p>We believe authentic travel should create meaningful connections with local communities and encourage respect for Tanzania's natural and cultural heritage. From wildlife encounters and mountain adventures to village visits, traditional food, local craftsmanship and island life, we help travellers experience Tanzania with curiosity, appreciation and respect.</p>
            </Reveal>
            <Reveal delay={200} className="mt-8">
              <Link to="/community" className="btn btn-earth">The communities we support</Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* What we organise */}
      <section className="py-24 md:py-32">
        <div className="container-x">
          <SectionHeading align="center" eyebrow="Different journeys. One commitment." title="What we organise." intro="For different travellers, budgets, interests and travel styles. Every journey begins with a conversation: we listen first, recommend thoughtfully, and build a plan around what matters most to you." />
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {offerings.map((o, i) => (
              <Reveal key={o.text} delay={(i % 4) * 80} className="rounded-[1.5rem] border border-line bg-paper p-6">
                <o.icon className="size-7 text-terracotta" />
                <p className="mt-4 leading-relaxed text-ink">{o.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Promise */}
      <section className="bg-earth py-24 text-cream md:py-32">
        <div className="container-x max-w-4xl text-center">
          <p className="eyebrow eyebrow-light">Our promise</p>
          <Reveal>
            <p className="mt-6 font-display text-3xl leading-snug md:text-[2.6rem]">
              We may not claim to be the biggest tour operator in Tanzania, but we believe that genuine attention, local understanding, flexibility and commitment can make a meaningful difference.
            </p>
          </Reveal>
          <Reveal delay={150} className="mx-auto mt-10 grid max-w-3xl gap-6 text-cream/80 sm:grid-cols-3">
            <p>We want our clients to <strong className="text-gold">feel heard</strong>.</p>
            <p>We want our travel partners to <strong className="text-gold">feel supported</strong>.</p>
            <p>And every traveller to leave with <strong className="text-gold">stories, connections and memories</strong>.</p>
          </Reveal>
          <p className="mt-12 text-sm text-cream/60">Real Tanzania Discovery Adventures Limited: your local partner for personal journeys, authentic discoveries and adventures beyond the ordinary.</p>
        </div>
      </section>

      <section className="py-20">
        <div className="container-x flex flex-col items-center gap-6 text-center">
          <p className="eyebrow">Proud member of</p>
          <a href={site.sister.url} target="_blank" rel="noreferrer" className="flex items-center gap-5">
            <Photo photo="realAfricaLogo" className="size-20 rounded-full !bg-paper shadow-md" imgClassName="!object-contain p-2" />
            <span className="text-left">
              <span className="block font-display text-3xl">Real Africa</span>
              <span className="text-muted">Our sister company in Germany · real-africa.de</span>
            </span>
          </a>
        </div>
      </section>

      <CtaBand
        title="Let's discover Tanzania together."
        text="Planning your first visit, or looking for a dependable ground operator for your travel business? Share your ideas, your questions, or the destinations you haven't yet figured out how to reach. Your journey. Your vision. Our Tanzania."
      />
    </>
  );
}
