import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Copy, ImagePlus, Images, Plus, Trash2, Upload, X } from "lucide-react";
import { Photo } from "../components/Photo";
import { photos } from "../data/images";
import { api, ApiError } from "./api";
import type { Content } from "../content/defaults";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Any = any;

// ---------- shared admin context ----------

type AdminCtxT = {
  content: Content;
  notify: (message: string, kind?: "ok" | "error") => void;
};
export const AdminCtx = createContext<AdminCtxT>(null as unknown as AdminCtxT);
export const useAdmin = () => useContext(AdminCtx);

// ---------- naming helpers ----------

const LABELS: Record<string, string> = {
  q: "Question",
  a: "Answer",
  to: "Link (address on this site)",
  n: "Step number",
  meta: "Search engines (Google)",
  hero: "Top banner",
  cta: "Orange call-to-action band",
  intro: "Introduction",
  eyebrow: "Small label above the title",
  title: "Title",
  text: "Text",
  image: "Photo",
  photo: "Photo",
  images: "Photos",
  photos: "Photos",
  slug: "Web address name (slug)",
  combineWith: "Pairs perfectly with (linked places)",
  links: "Linked places",
  guides: "Linked places",
  extraHeritage: "Extra heritage places to link",
  featured: "Featured journeys",
  circuit: "Group / circuit (used for filters)",
  size: "Size / height / language",
  kicker: "Small label (e.g. 8 days · Northern circuit)",
  stay: "Accommodation",
  bestTime: "Best time to visit",
  gettingThere: "Getting there",
  notifyEmail: "Email that receives website messages",
  whatsapp: "WhatsApp number (digits, with country code)",
  seoTitleSuffix: "Added after every page title in Google",
  logoTop: "Logo text, top line",
  logoBottom: "Logo text, bottom line",
  logoMark: "Logo badge image (header)",
  logo: "Full logo image (footer)",
  body: "Main text",
  lead: "Opening sentence (shown large)",
  faq: "Questions & answers",
};

export function labelFor(key: string) {
  if (LABELS[key]) return LABELS[key];
  const s = key.replace(/([a-z])([A-Z0-9])/g, "$1 $2").replace(/[_-]/g, " ").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const IMAGE_KEY = /^(image|image\d|photo|logo|logoMark|newsletterImage)$/;
const IMAGE_LIST_KEY = /^(images|photos)$/;
const DEST_REF_KEY = /^(combineWith|links|guides|extraHeritage)$/;
const JOURNEY_REF_KEY = /^(featured)$/;
const MARKDOWN_KEY = /^body$/;
const LONG_KEY = /^(text|intro|summary|quote|note|closing|a|line|excerpt|lead|about|proceeds|description|gettingThere|bestTime|ctaText|thanksText|fallbackText|newsletterText|privacyNote|disclaimer|requestNote|planText|message)$|Text$|Note$/;

export function itemTitle(item: Any, index: number): string {
  if (item === null || typeof item !== "object") return String(item);
  const t = item.title || item.name || item.label || item.q || item.month || item.value || item.days;
  if (item.day !== undefined && item.title) return `Day ${item.day} · ${item.title}`;
  return t ? String(t) : `Item ${index + 1}`;
}

/** An empty copy of an item, used when adding a new entry to a list. */
export function blankLike(sample: Any, list: Any[] = []): Any {
  if (Array.isArray(sample)) return [];
  if (sample === null || typeof sample !== "object") return typeof sample === "number" ? 0 : typeof sample === "boolean" ? false : "";
  const out: Any = {};
  for (const [k, v] of Object.entries(sample)) out[k] = blankLike(v);
  if ("day" in out) out.day = list.length + 1;
  if ("n" in out) out.n = String(list.length + 1).padStart(2, "0");
  return out;
}

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

// ---------- basic inputs ----------

const inputCls = "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[0.95rem] text-ink outline-none transition focus:border-sunset focus:ring-4 focus:ring-sunset/10";

export function FieldShell({ label, hint, htmlFor, children }: { label: string; hint?: ReactNode; htmlFor?: string; children: ReactNode }) {
  return (
    <div>
      {htmlFor ? <label htmlFor={htmlFor} className="mb-1.5 block text-[0.8rem] font-semibold text-earth">{label}</label> : <p className="mb-1.5 block text-[0.8rem] font-semibold text-earth">{label}</p>}
      {children}
      {hint && <p className="mt-1.5 text-xs leading-relaxed text-muted">{hint}</p>}
    </div>
  );
}

function AutoTextarea({ id, value, onChange, rows = 3, mono = false }: { id?: string; value: string; onChange: (v: string) => void; rows?: number; mono?: boolean }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight + 2, 900)}px`;
  }, [value]);
  return <textarea id={id} ref={ref} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} className={`${inputCls} resize-y leading-relaxed ${mono ? "font-mono text-[0.85rem]" : ""}`} />;
}

const FORMAT_HINT = (
  <>
    Formatting: <code>*word*</code> = coloured italic, <code>**word**</code> = bold, <code>[text](/page)</code> = link. Leave an empty line to start a new paragraph.
  </>
);
const MARKDOWN_HINT = (
  <>
    Start a line with <code>## </code> for a heading, <code>- </code> for a bullet, <code>![caption](photo-name)</code> for a photo, or <code>| a | b |</code> rows for a table. Empty line = new paragraph.
  </>
);

// ---------- images ----------

export function ImageThumb({ value, className = "" }: { value: string; className?: string }) {
  return value ? <Photo photo={value} className={`rounded-lg bg-sand ${className}`} /> : <div className={`grid place-items-center rounded-lg bg-sand/60 text-muted ${className}`}><Images className="size-6" /></div>;
}

export async function uploadFile(file: File, notify: AdminCtxT["notify"]): Promise<string | null> {
  if (!file.type.startsWith("image/")) {
    notify("Please choose an image file (JPG, PNG or WebP).", "error");
    return null;
  }
  if (file.size > 12 * 1024 * 1024) {
    notify("That image is over 12 MB. Please use a smaller one.", "error");
    return null;
  }
  try {
    const r = await api.upload(file);
    notify("Image uploaded.");
    return r.url;
  } catch (e) {
    notify(e instanceof ApiError ? e.message : "Upload failed.", "error");
    return null;
  }
}

export function MediaPicker({ onPick, onClose }: { onPick: (v: string) => void; onClose: () => void }) {
  const { content, notify } = useAdmin();
  const [tab, setTab] = useState<"library" | "uploads">("library");
  const [files, setFiles] = useState<{ url: string; name: string }[] | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const slots = Object.keys({ ...photos, ...content.images });

  useEffect(() => {
    api.uploads().then((r) => setFiles(r.files)).catch(() => setFiles([]));
  }, []);

  async function onFile(f?: File) {
    if (!f) return;
    setBusy(true);
    const url = await uploadFile(f, notify);
    setBusy(false);
    if (url) onPick(url);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-night/60 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-paper shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <p className="font-display text-xl">Choose a photo</p>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-full hover:bg-sand/60"><X className="size-5" /></button>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
          {(["library", "uploads"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-sm font-medium ${tab === t ? "bg-earth text-cream" : "bg-sand/50 text-earth"}`}>
              {t === "library" ? "Website photos" : "My uploads"}
            </button>
          ))}
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="ml-auto w-40 rounded-full border border-line bg-white px-4 py-2 text-sm sm:w-56" />
          <label className="btn btn-sun cursor-pointer !px-4 !py-2 !text-[0.7rem]">
            <Upload className="size-4" /> {busy ? "Uploading…" : "Upload new"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto p-5 sm:grid-cols-4">
          {tab === "library"
            ? slots.filter((k) => k.toLowerCase().includes(q.toLowerCase())).map((k) => (
                <button key={k} type="button" onClick={() => onPick(k)} className="group text-left">
                  <Photo photo={k} className="aspect-[4/3] rounded-xl ring-sunset group-hover:ring-4" />
                  <p className="mt-1.5 truncate text-xs text-muted">{k}</p>
                </button>
              ))
            : files === null
              ? <p className="col-span-full text-sm text-muted">Loading…</p>
              : files.length === 0
                ? <p className="col-span-full text-sm text-muted">No uploads yet. Use “Upload new”.</p>
                : files.filter((f) => f.name.toLowerCase().includes(q.toLowerCase())).map((f) => (
                    <button key={f.url} type="button" onClick={() => onPick(f.url)} className="group text-left">
                      <Photo photo={f.url} className="aspect-[4/3] rounded-xl ring-sunset group-hover:ring-4" />
                      <p className="mt-1.5 truncate text-xs text-muted">{f.name}</p>
                    </button>
                  ))}
        </div>
      </div>
    </div>
  );
}

export function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const { notify } = useAdmin();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <FieldShell label={label}>
      <div className="flex items-center gap-3">
        <ImageThumb value={value} className="size-20 shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="truncate text-xs text-muted">{value || "No photo"}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-earth hover:border-earth"><Images className="size-3.5" /> Choose</button>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-earth hover:border-earth">
              <ImagePlus className="size-3.5" /> {busy ? "Uploading…" : "Upload"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  setBusy(true);
                  const url = await uploadFile(f, notify);
                  setBusy(false);
                  if (url) onChange(url);
                }}
              />
            </label>
            {value && <button type="button" onClick={() => onChange("")} className="rounded-full px-2 py-1.5 text-xs text-muted hover:text-terracotta">Remove</button>}
          </div>
        </div>
      </div>
      {open && <MediaPicker onClose={() => setOpen(false)} onPick={(v) => { onChange(v); setOpen(false); }} />}
    </FieldShell>
  );
}

function ImageListField({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  const [adding, setAdding] = useState(false);
  return (
    <FieldShell label={label} hint="Click a photo's arrows to reorder it.">
      <div className="flex flex-wrap gap-3">
        {value.map((v, i) => (
          <div key={i} className="w-28">
            <ImageThumb value={v} className="aspect-square w-28" />
            <div className="mt-1 flex justify-center gap-1">
              <IconBtn label="Move left" disabled={i === 0} onClick={() => onChange(move(value, i, i - 1))}><ArrowUp className="size-3.5 -rotate-90" /></IconBtn>
              <IconBtn label="Move right" disabled={i === value.length - 1} onClick={() => onChange(move(value, i, i + 1))}><ArrowDown className="size-3.5 -rotate-90" /></IconBtn>
              <IconBtn label="Remove" onClick={() => onChange(value.filter((_, k) => k !== i))}><Trash2 className="size-3.5" /></IconBtn>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => setAdding(true)} className="grid aspect-square w-28 place-items-center rounded-lg border-2 border-dashed border-line text-muted hover:border-earth hover:text-earth">
          <Plus className="size-6" />
        </button>
      </div>
      {adding && <MediaPicker onClose={() => setAdding(false)} onPick={(v) => { onChange([...value, v]); setAdding(false); }} />}
    </FieldShell>
  );
}

// ---------- lists ----------

function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const copy = [...arr];
  const [x] = copy.splice(from, 1);
  copy.splice(to, 0, x);
  return copy;
}

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button type="button" title={label} aria-label={label} disabled={disabled} onClick={onClick} className="grid size-7 place-items-center rounded-full text-muted transition hover:bg-sand/70 hover:text-earth disabled:opacity-30">
      {children}
    </button>
  );
}

function TagList({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (v) onChange([...value, v]);
    setDraft("");
  };
  return (
    <FieldShell label={label} hint="One entry per line. Use the arrows to reorder.">
      <div className="space-y-1.5">
        {value.map((v, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input value={v} onChange={(e) => onChange(value.map((x, k) => (k === i ? e.target.value : x)))} className={inputCls} />
            <IconBtn label="Move up" disabled={i === 0} onClick={() => onChange(move(value, i, i - 1))}><ArrowUp className="size-3.5" /></IconBtn>
            <IconBtn label="Move down" disabled={i === value.length - 1} onClick={() => onChange(move(value, i, i + 1))}><ArrowDown className="size-3.5" /></IconBtn>
            <IconBtn label="Remove" onClick={() => onChange(value.filter((_, k) => k !== i))}><Trash2 className="size-3.5" /></IconBtn>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} placeholder="Add an entry…" className={inputCls} />
          <button type="button" onClick={add} className="shrink-0 rounded-xl bg-earth px-3 py-2.5 text-xs font-semibold text-cream">Add</button>
        </div>
      </div>
    </FieldShell>
  );
}

function RefList({ label, value, onChange, options }: { label: string; value: string[]; onChange: (v: string[]) => void; options: { value: string; label: string }[] }) {
  const names = Object.fromEntries(options.map((o) => [o.value, o.label]));
  return (
    <FieldShell label={label}>
      <div className="flex flex-wrap gap-2">
        {value.map((v, i) => (
          <span key={i} className={`inline-flex items-center gap-1 rounded-full py-1 pl-3 pr-1 text-sm ${names[v] ? "bg-sand/70 text-earth" : "bg-red-100 text-red-800"}`}>
            {names[v] ?? `${v} (not found)`}
            <IconBtn label="Move left" disabled={i === 0} onClick={() => onChange(move(value, i, i - 1))}><ArrowUp className="size-3 -rotate-90" /></IconBtn>
            <IconBtn label="Remove" onClick={() => onChange(value.filter((_, k) => k !== i))}><X className="size-3.5" /></IconBtn>
          </span>
        ))}
      </div>
      <select value="" onChange={(e) => e.target.value && onChange([...value, e.target.value])} className={`${inputCls} mt-2`}>
        <option value="">+ Add…</option>
        {options.filter((o) => !value.includes(o.value)).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </FieldShell>
  );
}

export function ObjectList({ label, value, onChange, depth }: { label: string; value: Any[]; onChange: (v: Any[]) => void; depth: number }) {
  const [open, setOpen] = useState<number | null>(null);
  const sample = value[0];
  return (
    <FieldShell label={label}>
      <div className="space-y-2">
        {value.map((item, i) => (
          <div key={i} className="rounded-2xl border border-line bg-white">
            <div className="flex items-center gap-1 pr-2">
              <button type="button" onClick={() => setOpen(open === i ? null : i)} className="flex min-w-0 flex-1 items-center gap-2 px-4 py-3 text-left">
                <ChevronDown className={`size-4 shrink-0 text-muted transition-transform ${open === i ? "" : "-rotate-90"}`} />
                <span className="truncate text-sm font-semibold text-ink">{itemTitle(item, i)}</span>
              </button>
              <IconBtn label="Move up" disabled={i === 0} onClick={() => onChange(move(value, i, i - 1))}><ArrowUp className="size-3.5" /></IconBtn>
              <IconBtn label="Move down" disabled={i === value.length - 1} onClick={() => onChange(move(value, i, i + 1))}><ArrowDown className="size-3.5" /></IconBtn>
              <IconBtn label="Duplicate" onClick={() => onChange([...value.slice(0, i + 1), structuredClone(item), ...value.slice(i + 1)])}><Copy className="size-3.5" /></IconBtn>
              <IconBtn label="Delete" onClick={() => confirm(`Delete “${itemTitle(item, i)}”?`) && onChange(value.filter((_, k) => k !== i))}><Trash2 className="size-3.5" /></IconBtn>
            </div>
            {open === i && (
              <div className="border-t border-line p-4">
                <ObjectFields value={item} onChange={(v) => onChange(value.map((x, k) => (k === i ? v : x)))} depth={depth + 1} />
              </div>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            onChange([...value, sample !== undefined ? blankLike(sample, value) : ""]);
            setOpen(value.length);
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-earth/40 px-4 py-2 text-xs font-semibold text-earth hover:border-earth"
        >
          <Plus className="size-3.5" /> Add {label.toLowerCase().replace(/s$/, "")}
        </button>
      </div>
    </FieldShell>
  );
}

// ---------- the generic field ----------

export function Field({ name, value, onChange, depth = 0 }: { name: string; value: Any; onChange: (v: Any) => void; depth?: number }) {
  const { content } = useAdmin();
  const label = labelFor(name);
  const id = useId();

  if (typeof value === "boolean") {
    return (
      <label className="flex items-center gap-3 text-sm font-semibold text-earth">
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-[#e2662a]" /> {label}
      </label>
    );
  }
  if (typeof value === "number") {
    return (
      <FieldShell label={label} htmlFor={id}>
        <input id={id} type="number" value={value} onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))} className={`${inputCls} max-w-40`} />
      </FieldShell>
    );
  }
  if (typeof value === "string") {
    if (IMAGE_KEY.test(name)) return <ImageField label={label} value={value} onChange={onChange} />;
    if (name === "category" && content.categories[value] !== undefined) {
      return (
        <FieldShell label="Group" htmlFor={id}>
          <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
            {Object.entries(content.categories).map(([k, c]) => <option key={k} value={k}>{c.title}</option>)}
          </select>
        </FieldShell>
      );
    }
    if (MARKDOWN_KEY.test(name)) return <FieldShell label={label} hint={MARKDOWN_HINT} htmlFor={id}><AutoTextarea id={id} value={value} onChange={onChange} rows={10} /></FieldShell>;
    if (LONG_KEY.test(name) || value.length > 90 || value.includes("\n")) return <FieldShell label={label} hint={FORMAT_HINT} htmlFor={id}><AutoTextarea id={id} value={value} onChange={onChange} /></FieldShell>;
    return (
      <FieldShell label={label} hint={/title$/i.test(name) && /\*/.test(value) ? FORMAT_HINT : undefined} htmlFor={id}>
        <input id={id} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
      </FieldShell>
    );
  }
  if (Array.isArray(value)) {
    if (IMAGE_LIST_KEY.test(name) && value.every((v) => typeof v === "string")) return <ImageListField label={label} value={value} onChange={onChange} />;
    if (DEST_REF_KEY.test(name)) return <RefList label={label} value={value} onChange={onChange} options={content.destinations.map((d) => ({ value: d.slug, label: d.name }))} />;
    if (JOURNEY_REF_KEY.test(name)) return <RefList label={label} value={value} onChange={onChange} options={content.journeys.map((j) => ({ value: j.slug, label: `${j.title} (${j.days} days)` }))} />;
    if (value.length === 0 || typeof value[0] === "string") return <TagList label={label} value={value} onChange={onChange} />;
    return <ObjectList label={label} value={value} onChange={onChange} depth={depth} />;
  }
  if (value && typeof value === "object") {
    return (
      <fieldset className={`rounded-2xl border border-line p-4 sm:p-5 ${depth % 2 ? "bg-cream/50" : "bg-white/60"}`}>
        <legend className="px-2 font-display text-lg text-ink">{label}</legend>
        <ObjectFields value={value} onChange={onChange} depth={depth + 1} />
      </fieldset>
    );
  }
  return null;
}

export function ObjectFields({ value, onChange, depth = 0, skip = [] }: { value: Record<string, Any>; onChange: (v: Any) => void; depth?: number; skip?: string[] }) {
  return (
    <div className="space-y-5">
      {Object.entries(value)
        .filter(([k]) => !skip.includes(k))
        .map(([k, v]) => (
          <Field key={k} name={k} value={v} depth={depth} onChange={(nv) => onChange({ ...value, [k]: nv })} />
        ))}
    </div>
  );
}
