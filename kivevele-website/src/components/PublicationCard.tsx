import { ArrowUpRight } from "lucide-react";
import { splitCitation, type Publication } from "../data/publications";

export function Authors({ text }: { text: string }) {
  // Bold his name in the author list
  const parts = text.split(/(KIVEVELE,?\s*T\.?(?:\s*T\.)?)/);
  return (
    <>
      {parts.map((p, i) => (/KIVEVELE/.test(p) ? <strong key={i} className="font-semibold text-ink">{p}</strong> : <span key={i}>{p}</span>))}
    </>
  );
}

export default function PublicationCard({ pub }: { pub: Publication }) {
  const { authors, title, rest } = splitCitation(pub.text);
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-card">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-teal-600">{pub.type}</span>
        <span className="font-semibold text-slate-500">{pub.year}</span>
      </div>
      <h3 className="mt-4 font-display text-xl font-semibold leading-snug text-ink">{title}</h3>
      {rest && <p className="mt-2 text-sm italic text-slate-600">{rest}</p>}
      <p className="mt-3 line-clamp-2 text-sm text-slate-500"><Authors text={authors} /></p>
      {pub.doi && (
        <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-semibold text-teal-600 hover:text-solar-600">
          Read the paper <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      )}
    </article>
  );
}
