import { Fragment, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Photo } from "../components/Photo";

/**
 * Tiny formatting language used everywhere text is editable:
 *   *word*        accent (italic, coloured)
 *   **word**      bold
 *   [text](/url)  link (internal or external)
 * A blank line starts a new paragraph.
 */
export function Rich({ text, accent = "text-gold" }: { text?: string; accent?: string }) {
  if (!text) return null;
  return <>{inline(text, accent)}</>;
}

function inline(text: string, accent: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) out.push(<strong key={i++}>{m[1]}</strong>);
    else if (m[2] !== undefined) out.push(<em key={i++} className={accent}>{m[2]}</em>);
    else {
      const href = m[4];
      out.push(
        href.startsWith("/") ? (
          <Link key={i++} to={href} className="underline decoration-1 underline-offset-4 hover:text-terracotta">{m[3]}</Link>
        ) : (
          <a key={i++} href={href} target="_blank" rel="noreferrer" className="underline decoration-1 underline-offset-4 hover:text-terracotta">{m[3]}</a>
        ),
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export const paragraphs = (text?: string) => (text ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

/** Renders text with blank-line-separated paragraphs. */
export function Paras({ text, className = "", accent = "text-terracotta" }: { text?: string; className?: string; accent?: string }) {
  return (
    <>
      {paragraphs(text).map((p, i) => (
        <p key={i} className={className}>{inline(p, accent)}</p>
      ))}
    </>
  );
}

/**
 * Article body: a small Markdown subset.
 *   ## Heading
 *   - bullet
 *   ![caption](image)
 *   | table | row |   (first row is the header)
 */
export function Markdown({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <>
      {blocks.map((b, i) => {
        if (b.startsWith("## ")) return <h2 key={i} className="display-md pt-6">{b.slice(3)}</h2>;
        const img = b.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
        if (img)
          return (
            <figure key={i} className="-mx-5 md:-mx-16">
              <Photo photo={img[2]} alt={img[1]} className="aspect-[16/9] md:rounded-[1.75rem]" />
              {img[1] && <figcaption className="mt-3 px-5 text-center text-sm text-muted">{img[1]}</figcaption>}
            </figure>
          );
        const lines = b.split("\n");
        if (lines.every((l) => l.trim().startsWith("- ")))
          return (
            <ul key={i} className="space-y-3">
              {lines.map((l, k) => <li key={k} className="flex gap-3 text-ink/80"><span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-sunset" /><span>{inline(l.trim().slice(2), "text-terracotta")}</span></li>)}
            </ul>
          );
        if (lines.every((l) => l.trim().startsWith("|"))) {
          const rows = lines.map((l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim())).filter((r) => !r.every((c) => /^-+$/.test(c)));
          const [head, ...body] = rows;
          return (
            <div key={i} className="overflow-x-auto rounded-2xl border border-line">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead className="bg-sand/50 text-xs uppercase tracking-[0.15em] text-earth">
                  <tr>{head.map((h, k) => <th key={k} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-line bg-paper">
                  {body.map((r, k) => (
                    <tr key={k}>{r.map((c, j) => <td key={j} className={`px-4 py-3 ${j === 0 ? "font-semibold text-ink" : "text-muted"} ${c.includes("★") ? "tracking-widest text-gold" : ""}`}>{c}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return (
          <p key={i} className="text-[1.08rem] leading-[1.9] text-ink/80">
            {lines.map((l, k) => <Fragment key={k}>{k > 0 && <br />}{inline(l, "text-terracotta")}</Fragment>)}
          </p>
        );
      })}
    </>
  );
}
