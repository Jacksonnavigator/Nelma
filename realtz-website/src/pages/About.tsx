import { Link } from "react-router-dom";
import { Quote } from "lucide-react";
import { CtaBand, PageHero, useMeta } from "../components/Layout";
import { Photo } from "../components/Photo";
import { Reveal, SectionHeading } from "../components/ui";
import { team } from "../data/content";

const aboutValues = [
  { title: "Individual", text: "We don't like things \"off the rack.\" Enjoy our country to the fullest: whenever, wherever, however, and for as long as you like." },
  { title: "Personal", text: "Personal contact is the heart of our work. Only when we understand you and your wishes will your trip truly excite you." },
  { title: "Competent", text: "We grew up in Tanzania and know local conditions better than any large tour operator. That's how we turn your ideas into reality." },
];

export default function About() {
  useMeta("About us", "Meet the Tanzanian team behind Real Tanzania Discovery Adventures: personal, individual and competent travel planning from Boma Ng'ombe, Kilimanjaro.");
  return (
    <>
      <PageHero
        photo="aboutSunset"
        eyebrow="About us"
        title={<>Our heart, your dream trip: <em className="text-gold">promised</em>.</>}
        intro="We are Real Tanzania Discovery Adventures, a Tanzanian-owned travel company in Boma Ng'ombe, at the foot of Kilimanjaro."
        crumbs={[{ label: "About us" }]}
      />

      <section className="py-24 md:py-32">
        <div className="container-x">
          <div className="grid gap-px overflow-hidden rounded-[2rem] border border-line bg-line md:grid-cols-3">
          {aboutValues.map((v, i) => (
            <Reveal key={v.title} delay={i * 120} className="bg-paper p-8 md:p-10">
              <span className="font-display text-5xl text-sand-deep">0{i + 1}</span>
              <h2 className="mt-4 text-3xl">{v.title}</h2>
              <p className="mt-3 leading-relaxed text-muted">{v.text}</p>
            </Reveal>
          ))}
          </div>
        </div>

        <div className="container-x mt-28 grid gap-14 lg:grid-cols-2 lg:items-center">
          <Reveal className="relative">
            <Photo photo="aboutTradeShow" className="aspect-[4/5] rounded-[2rem]" />
            <div className="absolute -bottom-8 right-6 max-w-xs rounded-[1.5rem] bg-earth p-6 text-cream shadow-2xl md:-right-8">
              <Quote className="size-8 text-gold" />
              <p className="mt-3 font-display text-xl leading-snug">Only an individually planned trip will enchant you anew each day.</p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <p className="eyebrow">Who you're planning with</p>
            <h2 className="display-lg mt-4">Long-distance travel is a matter of trust.</h2>
            <div className="prose-travel mt-6">
              <p>Of course you want to know who you're planning your trip with. It has to fit like a tailored suit, while leaving plenty of room for your own ideas, in the planning and spontaneously on the ground.</p>
              <p>We don't offer trips "off the shelf": no catalogues of pre-made group tours, no fixed start dates and durations, no shared tours with strangers. We put everything into personal consultation and care, from planning to follow-up.</p>
              <p>That's why you won't be advised by travel agents, but by Tanzanians who grew up in this country and in its travel industry.</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-paper py-24 md:py-32">
        <div className="container-x">
          <SectionHeading eyebrow="The people behind your trip" title="Our team." />
          <div className="mt-14 grid gap-8 md:grid-cols-2">
            {team.map((m, i) => (
              <Reveal key={m.name} delay={i * 150} className="overflow-hidden rounded-[2rem] bg-cream">
                <Photo photo={m.photo} className="aspect-[4/3.4]" imgClassName="object-top" />
                <div className="p-8">
                  <p className="eyebrow">{m.role}</p>
                  <h3 className="mt-2 text-4xl">{m.name}</h3>
                  <p className="mt-4 leading-relaxed text-muted">{m.text}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="relative mt-8 overflow-hidden rounded-[2rem]">
            <Photo photo="kiliGate" className="aspect-[16/9] md:aspect-[21/8]" />
            <div className="absolute inset-0 bg-gradient-to-r from-night/90 via-night/50 to-transparent" />
            <div className="absolute inset-0 flex max-w-xl flex-col justify-center p-8 text-cream md:p-14">
              <h3 className="display-md">Our team in Tanzania</h3>
              <p className="mt-4 leading-relaxed text-cream/80">Experienced drivers, guides and organisational talents behind the scenes: the friendly backbone of your trip, who bring you safely through the country.</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="py-20">
        <div className="container-x flex flex-col items-center gap-6 text-center">
          <p className="eyebrow">Proud member of</p>
          <a href="https://real-africa.de/" target="_blank" rel="noreferrer" className="flex items-center gap-5">
            <Photo photo="realAfricaLogo" className="size-20 rounded-full !bg-paper shadow-md" imgClassName="!object-contain p-2" />
            <span className="text-left">
              <span className="block font-display text-3xl">Real Africa</span>
              <span className="text-muted">Our sister company in Germany · real-africa.de</span>
            </span>
          </a>
          <Link to="/contact" className="btn btn-ghost mt-4">Book a consultation</Link>
        </div>
      </section>

      <CtaBand title="Let us plan your dream trip." text="Contact us now for a consultation by phone, video call, or at our office in Boma Ng'ombe." />
    </>
  );
}
