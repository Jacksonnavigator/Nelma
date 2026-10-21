import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { defaultContent, type Content } from "./defaults";

export const API = "/api";
const DRAFT_KEY = "realtz-preview-draft";

/** Deep-merge saved content over defaults: objects merge, arrays and values replace. */
export function mergeContent<T>(base: T, saved: unknown): T {
  if (Array.isArray(base) || typeof base !== "object" || base === null) return (saved === undefined ? base : saved) as T;
  if (typeof saved !== "object" || saved === null || Array.isArray(saved)) return base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(saved as Record<string, unknown>)) {
    out[k] = k in out ? mergeContent(out[k], v) : v;
  }
  return out as T;
}

const Ctx = createContext<Content>(defaultContent);

export function useContent() {
  return useContext(Ctx);
}

export function usePage<K extends keyof Content["pages"]>(key: K): Content["pages"][K] {
  return useContext(Ctx).pages[key];
}

function readPreviewDraft(): Content | null {
  try {
    if (!new URLSearchParams(location.search).has("preview")) return null;
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? mergeContent(defaultContent, JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function savePreviewDraft(content: Content) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(content));
  } catch {
    /* storage full or blocked: preview just shows the saved version */
  }
}

/** Loads the live content from the server once, before showing the site. */
export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<Content | null>(() => readPreviewDraft());

  useEffect(() => {
    if (content) return;
    let done = false;
    const finish = (c: Content) => {
      if (!done) {
        done = true;
        setContent(c);
      }
    };
    // If the server is slow or unreachable, show the built-in content.
    const timer = setTimeout(() => finish(defaultContent), 5000);
    fetch(`${API}/content.php`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => finish(j && j.content ? mergeContent(defaultContent, j.content) : defaultContent))
      .catch(() => finish(defaultContent))
      .finally(() => clearTimeout(timer));
    return () => clearTimeout(timer);
  }, [content]);

  if (!content) {
    return (
      <div className="grid min-h-screen place-items-center bg-cream">
        <img src="/brand/logo-mark.png" alt="" className="h-20 w-auto animate-pulse" />
      </div>
    );
  }
  const preview = typeof location !== "undefined" && new URLSearchParams(location.search).has("preview");
  return (
    <Ctx.Provider value={content}>
      {children}
      {preview && (
        <div className="fixed left-1/2 top-3 z-[70] -translate-x-1/2 rounded-full bg-night/90 px-5 py-2 text-xs font-semibold text-cream shadow-xl backdrop-blur">
          Preview of unsaved changes · only you can see this
        </div>
      )}
    </Ctx.Provider>
  );
}

/** For the admin dashboard: provide a given (draft) content object. */
export function StaticContent({ value, children }: { value: Content; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// ---------- helpers ----------

export const fill = (text: string, vars: Record<string, string>) => text.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

export function useWhatsapp() {
  const s = useContent().settings;
  return (text = s.whatsappMessage) => `https://wa.me/${s.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

export const categoryOrder = ["national-parks", "mountains", "islands", "cultures"];

export function useDestinations() {
  const c = useContent();
  return {
    all: c.destinations,
    categories: c.categories,
    order: categoryOrder.filter((k) => c.categories[k]),
    byCategory: (k: string) => c.destinations.filter((d) => d.category === k),
    find: (slug: string) => c.destinations.find((d) => d.slug === slug),
  };
}

export function useJourneys() {
  const list = useContent().journeys;
  return { list, find: (slug: string) => list.find((j) => j.slug === slug) };
}
