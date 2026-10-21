// The starting content of the whole website. The admin dashboard saves a copy
// of this structure on the server; the site merges the saved copy over these
// defaults, so new fields added in future versions always have a value.
import { site, nav } from "../data/site";
import { photos } from "../data/images";
import { journeys } from "../data/journeys";
import { destinations, categories } from "../data/destinations";
import { articles as articleBlocks, type Block } from "../data/journal";
import { experiences, values, stats, steps, partners, reviews, travelFaq } from "../data/content";
import { pageDefaults } from "./pages";

function toMarkdown(body: Block[]) {
  let lead = "";
  let faq: { q: string; a: string }[] = [];
  const parts: string[] = [];
  for (const b of body) {
    if (b.type === "lead") lead = b.text;
    else if (b.type === "p") parts.push(b.text);
    else if (b.type === "h2") parts.push(`## ${b.text}`);
    else if (b.type === "photo") parts.push(`![${b.caption ?? ""}](${b.photo})`);
    else if (b.type === "list") parts.push(b.items.map((i) => `- ${i}`).join("\n"));
    else if (b.type === "table") parts.push([b.head, ...b.rows].map((r) => `| ${r.join(" | ")} |`).join("\n"));
    else if (b.type === "faq") faq = b.items;
  }
  return { lead, body: parts.join("\n\n"), faq };
}

export const defaultContent = {
  version: 1,
  settings: {
    name: site.name,
    shortName: site.shortName,
    legalName: site.legalName,
    tagline: site.tagline,
    logoTop: "Real Tanzania",
    logoBottom: "Discovery Adventures",
    logo: "/brand/logo-full.png",
    logoMark: "/brand/logo-mark.png",
    email: site.email,
    phone: site.phones[0],
    whatsapp: site.whatsapp,
    whatsappMessage: "Hello! I'd like to plan a trip to Tanzania.",
    address: site.address,
    departments: site.departments.map((d) => ({ ...d })),
    hours: site.hours.map((h) => ({ ...h })),
    social: { ...site.social },
    tripadvisor: { ...site.tripadvisor },
    sister: { name: site.sister.name, url: site.sister.url, logo: "realAfricaLogo" },
    notifyEmail: site.email,
    seoTitleSuffix: "Real Tanzania Discovery Adventures",
  },
  nav: nav.map((n) => ({ label: n.label, to: n.to, children: (n.children ?? []).map((c) => ({ label: c.label, to: c.to, note: c.note ?? "" })) })),
  footerLinks: {
    explore: [
      { label: "Why Tanzania", to: "/tanzania" },
      { label: "National parks", to: "/destinations/national-parks" },
      { label: "Mountains", to: "/destinations/mountains" },
      { label: "Islands & coast", to: "/destinations/islands" },
      { label: "Peoples & culture", to: "/destinations/cultures" },
      { label: "Safari", to: "/safari" },
      { label: "Culture", to: "/culture" },
    ],
    company: [
      { label: "About us", to: "/about-us" },
      { label: "Sample journeys", to: "/journeys" },
      { label: "Community we support", to: "/community" },
      { label: "Travel trade partners", to: "/about-us#travel-trade" },
      { label: "Journal", to: "/journal" },
      { label: "Travel info & FAQ", to: "/travel-info" },
    ],
    legal: [
      { label: "Terms", to: "/terms" },
      { label: "Privacy", to: "/privacy" },
      { label: "Imprint", to: "/imprint" },
    ],
  },
  /** Photo library: each named slot can be replaced with an uploaded image. */
  images: Object.fromEntries(Object.entries(photos).map(([k, p]) => [k, { src: "", alt: p.alt as string }])) as Record<string, { src: string; alt: string }>,
  categories: Object.fromEntries(Object.entries(categories).map(([k, c]) => [k, { ...c, photo: c.photo as string }])) as Record<string, { title: string; short: string; eyebrow: string; intro: string; photo: string }>,
  experiences: experiences.map((e) => ({ ...e, photo: e.photo as string })),
  values: values.map((v) => ({ ...v })),
  stats: stats.map((s) => ({ ...s })),
  steps: steps.map((s) => ({ ...s })),
  partners: partners.map((p) => ({ ...p, photos: [...p.photos] as string[], sections: p.sections.map((s) => ({ title: s.title, text: s.text ?? "", list: s.list ?? [] })) })),
  reviews: reviews.map((r) => ({ ...r, country: "Germany" })),
  faq: travelFaq.map((f) => ({ ...f })),
  journeys: journeys.map((j) => ({
    ...j,
    photo: j.photo as string,
    highlights: [...j.highlights],
    included: [...j.included],
    itinerary: j.itinerary.map((d) => ({ day: d.day, title: d.title, stay: d.stay ?? "", meals: d.meals ?? "", photo: (d.photo ?? "") as string, text: d.text ?? "" })),
  })),
  destinations: destinations.map((d) => ({
    slug: d.slug,
    category: d.category as string,
    name: d.name,
    type: d.type,
    region: d.region,
    circuit: d.circuit ?? "",
    size: d.size ?? "",
    tagline: d.tagline,
    summary: d.summary,
    body: d.body.join("\n\n"),
    highlights: [...d.highlights],
    activities: [...d.activities],
    bestTime: d.bestTime,
    gettingThere: d.gettingThere,
    combineWith: [...d.combineWith],
    photo: (d.photo ?? "") as string,
  })),
  articles: articleBlocks.map((a) => ({ slug: a.slug, title: a.title, category: a.category, date: a.date, minutes: a.minutes, photo: a.photo as string, excerpt: a.excerpt, ...toMarkdown(a.body) })),
  pages: pageDefaults,
};

export type Content = typeof defaultContent;
export type JourneyT = Content["journeys"][number];
export type DestinationT = Content["destinations"][number];
export type ArticleT = Content["articles"][number];
export type PartnerT = Content["partners"][number];
