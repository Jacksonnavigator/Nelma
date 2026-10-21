import type { Content } from "../content/defaults";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Any = any;

export const PAGE_DEFS: { key: keyof Content["pages"]; label: string; path: string; note?: string }[] = [
  { key: "home", label: "Home", path: "/" },
  { key: "tanzania", label: "Why Tanzania", path: "/tanzania" },
  { key: "destinations", label: "Destinations pages", path: "/destinations", note: "Texts on the destination overview, group and detail pages. The places themselves are under “Destinations & peoples”." },
  { key: "experiences", label: "Experiences overview", path: "/experiences" },
  { key: "safari", label: "Safari", path: "/safari" },
  { key: "trekking", label: "Trekking", path: "/trekking" },
  { key: "culture", label: "Culture", path: "/culture" },
  { key: "beach", label: "Beach & Sea", path: "/beach-and-sea" },
  { key: "journeys", label: "Journeys pages", path: "/journeys", note: "Texts on the journeys list and every journey page. The journeys themselves are under “Journeys”." },
  { key: "community", label: "Community", path: "/community", note: "The partner groups themselves are under “Community partners”." },
  { key: "about", label: "About us", path: "/about-us" },
  { key: "journal", label: "Journal pages", path: "/journal" },
  { key: "planTrip", label: "Plan your trip (form)", path: "/plan-trip" },
  { key: "contact", label: "Contact", path: "/contact", note: "Phone numbers, emails and office hours are under “Settings & contacts”." },
  { key: "travelInfo", label: "Travel info & FAQ", path: "/travel-info", note: "The questions themselves are under “FAQ”." },
  { key: "terms", label: "Terms & conditions", path: "/terms" },
  { key: "privacy", label: "Privacy policy", path: "/privacy" },
  { key: "imprint", label: "Imprint", path: "/imprint" },
  { key: "notFound", label: "Page not found (404)", path: "/this-page-does-not-exist" },
  { key: "shared", label: "Buttons & shared texts", path: "/", note: "The orange call-to-action band and small labels used on many pages." },
  { key: "footer", label: "Footer & newsletter", path: "/" },
];

export type CollectionDef = {
  key: keyof Content;
  label: string;
  singular: string;
  path: (item: Any) => string;
  slug?: boolean;
  note?: string;
};

export const COLLECTION_DEFS: CollectionDef[] = [
  { key: "journeys", label: "Journeys", singular: "journey", path: (j) => `/journeys/${j.slug}`, slug: true },
  { key: "destinations", label: "Destinations & peoples", singular: "place", path: (d) => `/destinations/${d.category}/${d.slug}`, slug: true, note: "National parks, mountains, islands and the peoples & heritage sites. Tip: a photo saved as /images/destinations/<slug>.jpg is used automatically." },
  { key: "articles", label: "Journal articles", singular: "article", path: (a) => `/journal/${a.slug}`, slug: true },
  { key: "partners", label: "Community partners", singular: "partner", path: () => "/community" },
  { key: "reviews", label: "Guest reviews", singular: "review", path: () => "/" },
  { key: "faq", label: "FAQ", singular: "question", path: () => "/travel-info" },
  { key: "experiences", label: "Experience cards", singular: "experience", path: () => "/experiences" },
  { key: "values", label: "Values (home page)", singular: "value", path: () => "/" },
  { key: "stats", label: "Numbers (home page)", singular: "number", path: () => "/" },
  { key: "steps", label: "How we plan (steps)", singular: "step", path: () => "/" },
];
