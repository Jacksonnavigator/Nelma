import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ChevronDown } from "lucide-react";
import PageBanner from "../components/PageBanner";
import { photos } from "../data/images";
import { projects, type Project } from "../data/site";

const filters = [
  { id: "all", label: "All projects", test: () => true },
  { id: "running", label: "Running now", test: (p: Project) => p.running },
  { id: "done", label: "Completed", test: (p: Project) => !p.running },
] as const;

function ProjectCard({ p }: { p: Project }) {
  const [open, setOpen] = useState(false);
  const id = `proj-${p.years}-${p.title.slice(0, 12).replace(/\W/g, "")}`;
  return (
    <article className="flex flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${p.running ? "bg-solar-100 text-solar-600" : "bg-teal-50 text-teal-600"}`}>
          {p.running ? "Running now" : "Completed"}
        </span>
        <span className="text-sm font-semibold text-slate-500">{p.years}</span>
      </div>
      <h2 className="mt-4 text-2xl font-semibold leading-snug text-ink">{p.title}</h2>
      <dl className="mt-5 grid gap-3 text-[15px] sm:grid-cols-2">
        <div><dt className="text-slate-500">Funder</dt><dd className="font-semibold text-ink">{p.funder}</dd></div>
        <div><dt className="text-slate-500">Value</dt><dd className="font-semibold text-ink">{p.value}</dd></div>
        <div className="sm:col-span-2"><dt className="text-slate-500">Role</dt><dd className="font-semibold text-ink">{p.role}</dd></div>
      </dl>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="mt-4 inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold text-teal-600 hover:text-solar-600"
      >
        {open ? "Hide results" : "Show results"}
        <ChevronDown size={18} className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      <ul id={id} hidden={!open} className="mt-4 space-y-2 border-t border-slate-200 pt-4">
        {p.outcomes.map((o) => (
          <li key={o} className="flex gap-3 text-[15px] text-slate-600">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-teal-500" aria-hidden="true" /> {o}
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function Projects() {
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");
  const active = filters.find((f) => f.id === filter)!;
  const shown = projects.filter(active.test);

  return (
    <>
      <PageBanner photo={photos.solarFarm} kicker="Research projects" title="Funded research and innovation">
        {projects.length} projects led as principal investigator, co-investigator or lead consultant, with funders including the
        European Union, the World Bank, the US National Academies, EPFL, the IAEA and UNIDO.
      </PageBanner>

      <section className="section bg-paper">
        <div className="container-site">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter projects">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={`min-h-11 rounded-full px-5 text-sm font-semibold transition-colors ${
                  filter === f.id ? "bg-ink text-white" : "border border-slate-200 bg-white text-ink hover:border-teal-500"
                }`}
              >
                {f.label} <span className="opacity-60">{projects.filter(f.test).length}</span>
              </button>
            ))}
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {shown.map((p) => <ProjectCard key={p.title} p={p} />)}
          </div>

          <div className="mt-16 flex flex-col items-start gap-5 rounded-3xl bg-ink p-8 text-white md:flex-row md:items-center md:justify-between md:p-12">
            <div>
              <h2 className="text-3xl font-semibold">Have a project in mind?</h2>
              <p className="mt-2 text-white/75">He welcomes partners for joint proposals, consultancies and student placements.</p>
            </div>
            <Link to="/contact" className="btn-solar shrink-0">Propose a collaboration</Link>
          </div>
        </div>
      </section>
    </>
  );
}
