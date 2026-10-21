import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { CtaBand, PageHero, useMeta } from "../components/Layout";
import { Photo } from "../components/Photo";
import { Faq, Reveal } from "../components/ui";
import { articles, findArticle, type Block } from "../data/journal";

export function JournalPage() {
  useMeta("Journal", "Travel tips and guides for Tanzania: the best time for a safari, Kilimanjaro routes compared, and choosing your beach.");
  const [lead, ...rest] = articles;
  return (
    <>
      <PageHero photo="kiliRidge" eyebrow="Journal" title={<>Stories & <em className="text-gold">travel wisdom</em>.</>} intro="Practical guides from people who live here, to help you plan with confidence." crumbs={[{ label: "Journal" }]} />
      <section className="py-24 md:py-28">
        <div className="container-x">
          <Reveal>
            <Link to={`/journal/${lead.slug}`} className="group grid overflow-hidden rounded-[2rem] border border-line bg-paper md:grid-cols-2">
              <Photo photo={lead.photo} className="aspect-[16/11] md:aspect-auto md:min-h-[24rem]" imgClassName="transition-transform duration-[1.2s] group-hover:scale-105" />
              <div className="flex flex-col justify-center p-8 md:p-12">
                <p className="eyebrow">{lead.category} · Featured</p>
                <h2 className="display-md mt-3">{lead.title}</h2>
                <p className="mt-4 text-lg text-muted">{lead.excerpt}</p>
                <p className="mt-6 flex items-center gap-2 text-sm text-muted"><Clock className="size-4" />{lead.minutes} min read · {lead.date}</p>
              </div>
            </Link>
          </Reveal>
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            {rest.map((a, i) => (
              <Reveal key={a.slug} delay={i * 120}>
                <Link to={`/journal/${a.slug}`} className="group block">
                  <Photo photo={a.photo} className="aspect-[16/10] rounded-[1.75rem]" imgClassName="transition-transform duration-[1.2s] group-hover:scale-105" />
                  <p className="eyebrow mt-6">{a.category}</p>
                  <h2 className="mt-2 text-3xl leading-tight transition-colors group-hover:text-terracotta">{a.title}</h2>
                  <p className="mt-3 text-muted">{a.excerpt}</p>
                  <p className="mt-4 flex items-center gap-2 text-sm text-muted"><Clock className="size-4" />{a.minutes} min read</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <CtaBand />
    </>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "lead":
      return <p className="font-display text-2xl italic leading-relaxed text-earth">{block.text}</p>;
    case "p":
      return <p className="text-[1.08rem] leading-[1.9] text-ink/80">{block.text}</p>;
    case "h2":
      return <h2 className="display-md pt-6">{block.text}</h2>;
    case "photo":
      return (
        <figure className="-mx-5 md:-mx-16">
          <Photo photo={block.photo} className="aspect-[16/9] md:rounded-[1.75rem]" />
          {block.caption && <figcaption className="mt-3 px-5 text-center text-sm text-muted">{block.caption}</figcaption>}
        </figure>
      );
    case "list":
      return (
        <ul className="space-y-3">
          {block.items.map((i) => <li key={i} className="flex gap-3 text-ink/80"><span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-sunset" />{i}</li>)}
        </ul>
      );
    case "table":
      return (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="bg-sand/50 text-xs uppercase tracking-[0.15em] text-earth">
              <tr>{block.head.map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-line bg-paper">
              {block.rows.map((r) => (
                <tr key={r[0]}>{r.map((c, i) => <td key={i} className={`px-4 py-3 ${i === 0 ? "font-semibold text-ink" : "text-muted"} ${c.includes("★") ? "tracking-widest text-gold" : ""}`}>{c}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "faq":
      return (
        <div className="pt-6">
          <h2 className="display-md mb-6">Frequently asked questions</h2>
          <Faq items={block.items} />
        </div>
      );
  }
}

export function ArticlePage() {
  const { slug = "" } = useParams();
  const article = findArticle(slug);
  useMeta(article?.title ?? "Journal", article?.excerpt);
  if (!article) return <Navigate to="/journal" replace />;
  const next = articles[(articles.indexOf(article) + 1) % articles.length];

  return (
    <>
      <PageHero photo={article.photo} eyebrow={`${article.category} · ${article.minutes} min read`} title={article.title} intro={`Real Tanzania Discovery team · ${article.date}`} crumbs={[{ label: "Journal", to: "/journal" }, { label: article.category }]} />
      <article className="py-20 md:py-28">
        <div className="container-x max-w-3xl space-y-7">
          {article.body.map((b, i) => <BlockView key={i} block={b} />)}
          <div className="mt-12 rounded-[1.75rem] bg-sand/50 p-8 text-center md:p-10">
            <h2 className="display-md">Ready to plan?</h2>
            <p className="mx-auto mt-3 max-w-md text-muted">Our team will craft a personal itinerary around the best season for your interests and budget.</p>
            <Link to="/plan-trip" className="btn btn-earth mt-6">Plan my trip</Link>
          </div>
          <div className="flex items-center justify-between border-t border-line pt-8">
            <Link to="/journal" className="inline-flex items-center gap-2 text-sm font-semibold text-terracotta"><ArrowLeft className="size-4" /> All articles</Link>
            <Link to={`/journal/${next.slug}`} className="inline-flex items-center gap-2 text-right text-sm font-semibold text-terracotta">Next: {next.title} <ArrowRight className="size-4 shrink-0" /></Link>
          </div>
        </div>
      </article>
    </>
  );
}
