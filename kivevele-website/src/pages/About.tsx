import { Link } from "react-router-dom";
import { Award, BadgeCheck, Mic } from "lucide-react";
import PageBanner from "../components/PageBanner";
import Photo from "../components/Photo";
import SectionHeading from "../components/SectionHeading";
import { photos } from "../data/images";
import { awards, career, education, service, talks } from "../data/site";

export default function About() {
  return (
    <>
      <PageBanner photo={photos.campus} kicker="About" title="Prof. Thomas T. Kivevele">
        Associate Professor of Sustainable Energy Engineering and Director of Research and Innovation at the Nelson Mandela
        African Institution of Science and Technology in Arusha, Tanzania.
      </PageBanner>

      <section className="section bg-white">
        <div className="container-site grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <div className="overflow-hidden rounded-[2rem] bg-teal-600 shadow-lift">
              <Photo photo={photos.portrait} width={700} className="aspect-[4/5] w-full object-[50%_20%]" />
            </div>
            <ul className="mt-6 space-y-3">
              {["Registered Professional Engineer, ERB PE10185", "ARISE Fellow, African Academy of Sciences", "Member, Tanzania Renewable Energy Association", "Editorial board, Journal of Automotive Experiences"].map((c) => (
                <li key={c} className="flex gap-3 text-[15px]">
                  <BadgeCheck size={20} className="shrink-0 text-teal-600" aria-hidden="true" /> {c}
                </li>
              ))}
            </ul>
          </div>

          <div className="max-w-2xl space-y-5 text-lg leading-relaxed text-slate-600">
            <SectionHeading kicker="Biography" title="Academic excellence with a practical edge" />
            <p>
              Thomas Kivevele holds a PhD and an M.Tech (cum laude) in Mechanical Engineering, focused on sustainable energy, from
              Tshwane University of Technology in Pretoria, and a B.Sc. (Hons) in Electro-Mechanical Engineering from the University
              of Dar es Salaam. In 2018 he received the Fulbright African Senior Research Scholar Award to research biofuels at
              Baylor University in Texas.
            </p>
            <p>
              He joined NM-AIST as a Lecturer in 2015 and became Associate Professor in 2023. He teaches renewable energy
              technologies, passive solar energy systems, refrigeration and air conditioning, and energy auditing and management.
              He leads the Clean Energy Technologies Research Group and the Sustainable Energy Lab, and served six years on the
              University Tender Board.
            </p>
            <p>
              He has secured more than seven energy research projects worth over USD 5 million from donors such as the World Bank,
              the European Union and USAID, authored or co-authored 120+ peer-reviewed articles, and holds patents for solar dryers,
              a solar vaccine cooler and a biogas burner assembly. He was named NM-AIST's Best Innovator of the Year in 2020 and
              Best Worker of 2019/2020 among academic staff.
            </p>
            <p>
              His consultancies include energy-efficient irrigation for the Tanzania Horticultural Association, a bio-digester and
              wetland for the Lake Victoria Environmental Management Programme, the 2024 Africa Energy Market Place for the African
              Development Bank, and waste-to-energy and rice husk valorisation projects for UNIDO.
            </p>
          </div>
        </div>
      </section>

      <section className="section bg-paper">
        <div className="container-site grid gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading kicker="Education" title="Qualifications" />
            <ol className="mt-10 space-y-5">
              {education.map((e) => (
                <li key={e.degree} className="rounded-2xl border border-slate-200 bg-white p-6">
                  <p className="font-display text-2xl font-semibold text-solar-600">{e.year}</p>
                  <h3 className="mt-2 font-sans text-lg font-semibold text-ink">{e.degree}</h3>
                  <p className="mt-1 text-slate-600">{e.school}</p>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <SectionHeading kicker="Career" title="Professional experience" />
            <ol className="relative mt-10 space-y-7 border-l-2 border-teal-100 pl-8">
              {career.map((c) => (
                <li key={c.period + c.role} className="relative">
                  <span className="absolute -left-[41px] top-1 h-4 w-4 rounded-full border-4 border-paper bg-teal-600" aria-hidden="true" />
                  <p className="text-sm font-semibold text-teal-600">{c.period}</p>
                  <h3 className="mt-1 font-sans text-lg font-semibold text-ink">{c.role}</h3>
                  <p className="text-slate-600">{c.org}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-site">
          <SectionHeading kicker="National service" title="Advising government and development partners" />
          <ul className="mt-12 grid gap-5 md:grid-cols-2">
            {service.map((s) => (
              <li key={s.text} className="flex gap-5 rounded-2xl border border-slate-200 p-6">
                <span className="shrink-0 font-display text-xl font-semibold text-teal-600">{s.year}</span>
                <p className="leading-relaxed text-slate-600">{s.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section bg-ink text-white">
        <div className="container-site grid gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading kicker="Speaking" title="Keynotes and invited lectures" light />
            <ul className="mt-10 space-y-5">
              {talks.map((t) => (
                <li key={t.title} className="flex gap-4 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
                  <Mic size={22} className="mt-1 shrink-0 text-solar" aria-hidden="true" />
                  <div>
                    <p className="font-display text-xl leading-snug">“{t.title}”</p>
                    <p className="mt-2 text-sm text-white/65">{t.where}, {t.year}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionHeading kicker="Awards" title="Recognition" light />
            <ul className="mt-10 space-y-5">
              {awards.map((a) => (
                <li key={a.title} className="flex gap-4 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
                  <Award size={22} className="mt-1 shrink-0 text-solar" aria-hidden="true" />
                  <div>
                    <p className="text-lg font-semibold">{a.title}</p>
                    <p className="mt-1 text-sm text-white/65">{a.by}, {a.year}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link to="/contact" className="btn-solar mt-10">Invite him to speak</Link>
          </div>
        </div>
      </section>
    </>
  );
}
