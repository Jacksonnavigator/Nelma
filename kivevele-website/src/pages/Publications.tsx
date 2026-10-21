import { useMemo, useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import PageBanner from "../components/PageBanner";
import { Authors } from "../components/PublicationCard";
import { photos } from "../data/images";
import { publications, splitCitation } from "../data/publications";

const years = Array.from(new Set(publications.map((p) => p.year))).sort((a, b) => b - a);
const types = Array.from(new Set(publications.map((p) => p.type)));

export default function Publications() {
  const [q, setQ] = useState("");
  const [year, setYear] = useState("");
  const [type, setType] = useState("");

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return publications.filter(
      (p) => (!term || p.text.toLowerCase().includes(term)) && (!year || String(p.year) === year) && (!type || p.type === type),
    );
  }, [q, year, type]);

  const clear = () => { setQ(""); setYear(""); setType(""); };
  const field = "mt-2 block min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-100";

  return (
    <>
      <PageBanner photo={photos.lab} kicker="Publications" title="Research output">
        Journal articles, conference papers, a book chapter and theses on solar drying, biofuels, heat pumps, microgrids and
        sustainable materials.
      </PageBanner>

      <section className="section bg-paper">
        <div className="container-site">
          <div className="grid gap-4 rounded-3xl bg-white p-6 shadow-card md:grid-cols-[1fr_200px_220px]">
            <div>
              <label htmlFor="pub-q" className="text-sm font-semibold">Search</label>
              <div className="relative">
                <Search size={18} className="pointer-events-none absolute left-4 top-1/2 mt-1 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                <input id="pub-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Topic, co-author or journal, e.g. solar dryer" className={`${field} pl-11`} />
              </div>
            </div>
            <div>
              <label htmlFor="pub-year" className="text-sm font-semibold">Year</label>
              <select id="pub-year" value={year} onChange={(e) => setYear(e.target.value)} className={field}>
                <option value="">All years</option>
                {years.map((y) => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="pub-type" className="text-sm font-semibold">Type</label>
              <select id="pub-type" value={type} onChange={(e) => setType(e.target.value)} className={field}>
                <option value="">All types</option>
                {types.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <p className="mt-8 text-sm font-semibold text-slate-600" aria-live="polite">
            Showing {shown.length} of {publications.length} publications
          </p>

          {shown.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center">
              <p className="text-lg text-slate-600">No publications match these filters. Try a shorter search term or another year.</p>
              <button type="button" onClick={clear} className="btn-outline mt-5">Clear filters</button>
            </div>
          ) : (
            <ol className="mt-6 divide-y divide-slate-200 overflow-hidden rounded-3xl border border-slate-200 bg-white">
              {shown.map((p) => {
                const { authors, title, rest } = splitCitation(p.text);
                return (
                  <li key={p.text} className="grid gap-3 p-6 md:grid-cols-[90px_1fr_auto] md:gap-6">
                    <span className="font-display text-2xl font-semibold text-teal-600">{p.year}</span>
                    <div className="min-w-0">
                      <h2 className="font-display text-xl font-semibold leading-snug text-ink">{title}</h2>
                      {rest && <p className="mt-1 italic text-slate-600">{rest}</p>}
                      <p className="mt-2 text-sm text-slate-500"><Authors text={authors} /></p>
                      <p className="mt-3 text-sm font-semibold text-teal-600">{p.type}</p>
                    </div>
                    {p.doi && (
                      <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 self-start whitespace-nowrap text-sm font-semibold text-teal-600 hover:text-solar-600">
                        Read the paper <ArrowUpRight size={16} aria-hidden="true" />
                      </a>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>
    </>
  );
}
