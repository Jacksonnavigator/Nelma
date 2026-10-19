import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export type LegalSection = { id?: string; heading: string; paragraphs: ReactNode[] };

// A plain, readable page for the privacy policy and terms, in the same colours as the home page.
export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <main className="legal-page">
      <header className="legal-top">
        <div className="site-width legal-top-inner">
          <Link to="/" className="legal-logo" aria-label="NELMA home">
            <img src="/brand/nelma-logo.png" alt="NELMA" />
          </Link>
          <Link to="/" className="legal-back">
            <ArrowLeft /> Back to website
          </Link>
        </div>
      </header>
      <article className="legal-body">
        <h1>{title}</h1>
        <p className="legal-updated">Last updated {updated}</p>
        <p className="legal-intro">{intro}</p>
        {sections.map((section, index) => (
          <section key={section.heading} id={section.id}>
            <h2>
              {index + 1}. {section.heading}
            </h2>
            {section.paragraphs.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </section>
        ))}
        <p className="legal-links">
          <Link to="/privacy">Privacy Policy</Link> ·{" "}
          <Link to="/terms">Terms &amp; Conditions</Link> · <Link to="/">Home</Link>
        </p>
      </article>
    </main>
  );
}
