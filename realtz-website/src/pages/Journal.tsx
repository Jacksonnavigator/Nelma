import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { CtaBand, PageHero, useMeta } from "../components/Layout";
import { Photo } from "../components/Photo";
import { Faq, Reveal } from "../components/ui";
import { Markdown } from "../content/rich";
import { useContent, usePage } from "../content/store";

export function JournalPage() {
  const p = usePage("journal");
  const articles = useContent().articles;
  useMeta(p.meta.title, p.meta.description);
  const [lead, ...rest] = articles;
  return (
    <>
      <PageHero photo={p.hero.image} eyebrow={p.hero.eyebrow} title={p.hero.title} intro={p.hero.intro} crumbs={[{ label: p.meta.title }]} />
      <section className="py-24 md:py-28">
        <div className="container-x">
          {lead && (
            <Reveal>
              <Link to={`/journal/${lead.slug}`} className="group grid overflow-hidden rounded-[2rem] border border-line bg-paper md:grid-cols-2">
                <Photo photo={lead.photo} className="aspect-[16/11] md:aspect-auto md:min-h-[24rem]" imgClassName="transition-transform duration-[1.2s] group-hover:scale-105" />
                <div className="flex flex-col justify-center p-8 md:p-12">
                  <p className="eyebrow">{lead.category} · {p.featured}</p>
                  <h2 className="display-md mt-3">{lead.title}</h2>
                  <p className="mt-4 text-lg text-muted">{lead.excerpt}</p>
                  <p className="mt-6 flex items-center gap-2 text-sm text-muted"><Clock className="size-4" />{lead.minutes} {p.minRead} · {lead.date}</p>
                </div>
              </Link>
            </Reveal>
          )}
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            {rest.map((a, i) => (
              <Reveal key={a.slug} delay={(i % 2) * 120}>
                <Link to={`/journal/${a.slug}`} className="group block">
                  <Photo photo={a.photo} className="aspect-[16/10] rounded-[1.75rem]" imgClassName="transition-transform duration-[1.2s] group-hover:scale-105" />
                  <p className="eyebrow mt-6">{a.category}</p>
                  <h2 className="mt-2 text-3xl leading-tight transition-colors group-hover:text-terracotta">{a.title}</h2>
                  <p className="mt-3 text-muted">{a.excerpt}</p>
                  <p className="mt-4 flex items-center gap-2 text-sm text-muted"><Clock className="size-4" />{a.minutes} {p.minRead}</p>
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

export function ArticlePage() {
  const { slug = "" } = useParams();
  const p = usePage("journal");
  const articles = useContent().articles;
  const article = articles.find((a) => a.slug === slug);
  useMeta(article?.title ?? p.meta.title, article?.excerpt);
  if (!article) return <Navigate to="/journal" replace />;
  const next = articles[(articles.indexOf(article) + 1) % articles.length];

  return (
    <>
      <PageHero photo={article.photo} eyebrow={`${article.category} · ${article.minutes} ${p.minRead}`} title={article.title} intro={`${p.byline} · ${article.date}`} crumbs={[{ label: p.meta.title, to: "/journal" }, { label: article.category }]} />
      <article className="py-20 md:py-28">
        <div className="container-x max-w-3xl space-y-7">
          {article.lead && <p className="font-display text-2xl italic leading-relaxed text-earth">{article.lead}</p>}
          <Markdown text={article.body} />
          {article.faq.length > 0 && (
            <div className="pt-6">
              <h2 className="display-md mb-6">{p.faqTitle}</h2>
              <Faq items={article.faq} />
            </div>
          )}
          <div className="mt-12 rounded-[1.75rem] bg-sand/50 p-8 text-center md:p-10">
            <h2 className="display-md">{p.planTitle}</h2>
            <p className="mx-auto mt-3 max-w-md text-muted">{p.planText}</p>
            <Link to="/plan-trip" className="btn btn-earth mt-6">{p.planButton}</Link>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-line pt-8">
            <Link to="/journal" className="inline-flex items-center gap-2 text-sm font-semibold text-terracotta"><ArrowLeft className="size-4" /> {p.allArticles}</Link>
            {next && next !== article && (
              <Link to={`/journal/${next.slug}`} className="inline-flex items-center gap-2 text-right text-sm font-semibold text-terracotta">{p.next} {next.title} <ArrowRight className="size-4 shrink-0" /></Link>
            )}
          </div>
        </div>
      </article>
    </>
  );
}
