import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Copy, Download, ExternalLink, Eye, ImagePlus, Images, Inbox as InboxIcon, Mail, Map, MessageSquare, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { api, ApiError, type InboxItem } from "./api";
import { COLLECTION_DEFS, PAGE_DEFS } from "./defs";
import { Field, FieldShell, ImageThumb, MediaPicker, ObjectFields, blankLike, itemTitle, slugify, uploadFile, useAdmin } from "./fields";
import { Photo } from "../components/Photo";
import { photos } from "../data/images";
import type { Content } from "../content/defaults";
import { WhatsApp } from "../components/BrandIcons";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Any = any;
export type Editor = {
  content: Content;
  setContent: (fn: (c: Content) => Content) => void;
  preview: (path: string) => void;
  unread: number;
  refreshInbox: () => void;
};

export function Panel({ title, actions, children, note }: { title: ReactNode; actions?: ReactNode; children: ReactNode; note?: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink md:text-4xl">{title}</h1>
          {note && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{note}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

const smallBtn = "inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-earth transition hover:border-earth";
const card = "rounded-3xl border border-line bg-white p-5 sm:p-7 shadow-[0_1px_0_rgba(0,0,0,0.02)]";

// ---------- dashboard ----------

export function DashboardView({ editor, lastSaved }: { editor: Editor; lastSaved: string | null }) {
  const c = editor.content;
  const stats = [
    { label: "Unread messages", value: editor.unread, to: "/admin/inbox", icon: InboxIcon },
    { label: "Journeys", value: c.journeys.length, to: "/admin/collections/journeys", icon: Map },
    { label: "Destinations & peoples", value: c.destinations.length, to: "/admin/collections/destinations", icon: Map },
    { label: "Journal articles", value: c.articles.length, to: "/admin/collections/articles", icon: MessageSquare },
  ];
  return (
    <Panel title={`Karibu! 👋`} note={lastSaved ? `Website last saved ${new Date(lastSaved).toLocaleString()}.` : "Nothing has been saved from the dashboard yet. The website is showing its original content."}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className={`${card} transition hover:border-earth`}>
            <s.icon className="size-5 text-terracotta" />
            <p className="mt-4 font-display text-4xl text-ink">{s.value}</p>
            <p className="mt-1 text-sm text-muted">{s.label}</p>
          </Link>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className={card}>
          <h2 className="font-display text-2xl">How editing works</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted">
            <li>Pick a page or list on the left and change any text or photo.</li>
            <li>Press <strong className="text-ink">Preview</strong> to see your changes on the real site (only you can see them).</li>
            <li>Press <strong className="text-ink">Save &amp; publish</strong>. Visitors see the change straight away. No rebuilding or uploading needed.</li>
            <li>Made a mistake? <Link to="/admin/versions" className="font-semibold text-terracotta underline">Version history</Link> brings back any earlier version.</li>
          </ol>
        </div>
        <div className={card}>
          <h2 className="font-display text-2xl">Quick links</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/admin/pages/home" className={smallBtn}>Edit home page</Link>
            <Link to="/admin/collections/journeys" className={smallBtn}>Add a journey</Link>
            <Link to="/admin/collections/articles" className={smallBtn}>Write an article</Link>
            <Link to="/admin/media" className={smallBtn}>Change photos</Link>
            <Link to="/admin/settings" className={smallBtn}>Phone numbers & emails</Link>
            <a href="/" target="_blank" rel="noreferrer" className={smallBtn}><ExternalLink className="size-3.5" /> Open website</a>
          </div>
        </div>
      </div>
    </Panel>
  );
}

// ---------- page editor ----------

export function PageView({ editor }: { editor: Editor }) {
  const { key = "" } = useParams();
  const def = PAGE_DEFS.find((p) => p.key === key);
  if (!def) return <Navigate to="/admin" replace />;
  const value = editor.content.pages[def.key] as Any;
  return (
    <Panel
      title={def.label}
      note={def.note}
      actions={<button type="button" onClick={() => editor.preview(def.path)} className={smallBtn}><Eye className="size-3.5" /> Preview this page</button>}
    >
      <div className={card}>
        <ObjectFields value={value} onChange={(v) => editor.setContent((c) => ({ ...c, pages: { ...c.pages, [def.key]: v } }))} />
      </div>
    </Panel>
  );
}

// ---------- collections ----------

export function CollectionView({ editor }: { editor: Editor }) {
  const { key = "", index } = useParams();
  const navigate = useNavigate();
  const def = COLLECTION_DEFS.find((d) => d.key === key);
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("");
  if (!def) return <Navigate to="/admin" replace />;
  const list = editor.content[def.key] as Any[];
  const setList = (next: Any[]) => editor.setContent((c) => ({ ...c, [def.key]: next }));
  const isDest = def.key === "destinations";

  if (index !== undefined) {
    const i = Number(index);
    const item = list[i];
    if (!item) return <Navigate to={`/admin/collections/${def.key}`} replace />;
    return <ItemEditor editor={editor} def={def} list={list} index={i} setList={setList} />;
  }

  const addNew = () => {
    const sample = list[0] ?? {};
    const item = blankLike(sample, list);
    if ("title" in item) item.title = `New ${def.singular}`;
    else if ("name" in item) item.name = `New ${def.singular}`;
    if (def.slug) {
      let slug = slugify(item.title || item.name || def.singular);
      let n = 2;
      while (list.some((x) => x.slug === slug)) slug = `${slugify(item.title || item.name)}-${n++}`;
      item.slug = slug;
    }
    if (isDest) item.category = group || list[0]?.category || "national-parks";
    setList([...list, item]);
    navigate(`/admin/collections/${def.key}/${list.length}`);
  };

  const filtered = list
    .map((item, i) => ({ item, i }))
    .filter(({ item }) => (!group || item.category === group) && JSON.stringify(item).toLowerCase().includes(q.toLowerCase()));

  return (
    <Panel title={def.label} note={def.note} actions={<button type="button" onClick={addNew} className="btn btn-sun !px-5 !py-2.5 !text-[0.7rem]"><Plus className="size-4" /> Add {def.singular}</button>}>
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${def.label.toLowerCase()}…`} className="w-full rounded-full border border-line bg-white py-2.5 pl-10 pr-4 text-sm" />
        </div>
        {isDest && (
          <select value={group} onChange={(e) => setGroup(e.target.value)} className="rounded-full border border-line bg-white px-4 py-2.5 text-sm">
            <option value="">All groups</option>
            {Object.entries(editor.content.categories).map(([k, c]) => <option key={k} value={k}>{c.title}</option>)}
          </select>
        )}
      </div>
      <div className="overflow-hidden rounded-3xl border border-line bg-white">
        {filtered.length === 0 && <p className="p-6 text-sm text-muted">Nothing found.</p>}
        {filtered.map(({ item, i }) => (
          <Link key={i} to={`/admin/collections/${def.key}/${i}`} className="flex items-center gap-4 border-b border-line px-4 py-3 last:border-b-0 hover:bg-sand/30">
            {"photo" in item || "photos" in item ? <ImageThumb value={item.photo || item.photos?.[0] || ""} className="size-12 shrink-0" /> : null}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-ink">{itemTitle(item, i)}</p>
              <p className="truncate text-xs text-muted">{isDest ? editor.content.categories[item.category]?.title ?? item.category : item.summary || item.excerpt || item.text || item.line || item.quote || item.a || item.label || ""}</p>
            </div>
            <span className="text-xs font-semibold text-terracotta">Edit</span>
          </Link>
        ))}
      </div>
    </Panel>
  );
}

function ItemEditor({ editor, def, list, index, setList }: { editor: Editor; def: (typeof COLLECTION_DEFS)[number]; list: Any[]; index: number; setList: (l: Any[]) => void }) {
  const navigate = useNavigate();
  const item = list[index];
  const update = (v: Any) => setList(list.map((x, k) => (k === index ? v : x)));
  const slugTaken = def.slug && list.some((x, k) => k !== index && x.slug === item.slug);
  const { slug, ...rest } = item;

  return (
    <Panel
      title={
        <span className="flex items-center gap-3">
          <Link to={`/admin/collections/${def.key}`} className="grid size-10 place-items-center rounded-full border border-line bg-white" aria-label="Back to list"><ArrowLeft className="size-4" /></Link>
          <span className="truncate">{itemTitle(item, index)}</span>
        </span>
      }
      actions={
        <>
          <button type="button" onClick={() => editor.preview(def.path(item))} className={smallBtn}><Eye className="size-3.5" /> Preview</button>
          <button
            type="button"
            className={smallBtn}
            onClick={() => {
              const copy = structuredClone(item);
              if (def.slug) copy.slug = `${item.slug}-copy`;
              if (copy.title) copy.title += " (copy)";
              else if (copy.name) copy.name += " (copy)";
              setList([...list, copy]);
              navigate(`/admin/collections/${def.key}/${list.length}`);
            }}
          >
            <Copy className="size-3.5" /> Duplicate
          </button>
          <button
            type="button"
            className={`${smallBtn} hover:!border-red-600 hover:text-red-700`}
            onClick={() => {
              if (!confirm(`Delete “${itemTitle(item, index)}”? You can still undo this by not saving, or later from Version history.`)) return;
              setList(list.filter((_, k) => k !== index));
              navigate(`/admin/collections/${def.key}`);
            }}
          >
            <Trash2 className="size-3.5" /> Delete
          </button>
        </>
      }
    >
      <div className={card}>
        <div className="space-y-5">
          {def.slug && (
            <FieldShell
              label="Web address name (slug)"
              hint={
                <>
                  The page lives at <code>{def.path(item)}</code>. Use lowercase words and dashes. Changing it breaks links that point to the old address.
                  {slugTaken && <span className="block font-semibold text-red-700">Another {def.singular} already uses this address.</span>}
                </>
              }
            >
              <div className="flex gap-2">
                <input id="slug-field" aria-label="Web address name (slug)" value={slug} onChange={(e) => update({ ...item, slug: slugify(e.target.value) || e.target.value.toLowerCase() })} className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[0.95rem]" />
                <button type="button" onClick={() => update({ ...item, slug: slugify(item.title || item.name || "") })} className="shrink-0 rounded-xl border border-line px-3 text-xs font-semibold text-earth">From name</button>
              </div>
            </FieldShell>
          )}
          <ObjectFields value={rest} onChange={(v) => update(def.slug ? { slug, ...v } : v)} />
        </div>
      </div>
    </Panel>
  );
}

// ---------- groups of destinations ----------

export function CategoriesView({ editor }: { editor: Editor }) {
  return (
    <Panel title="Destination groups" note="The four groups shown in the Destinations menu (national parks, mountains, islands, peoples). Their names, introductions and banner photos.">
      <div className={card}>
        <ObjectFields value={editor.content.categories} onChange={(v) => editor.setContent((c) => ({ ...c, categories: v }))} />
      </div>
    </Panel>
  );
}

// ---------- settings & menus ----------

export function SettingsView({ editor }: { editor: Editor }) {
  return (
    <Panel title="Settings & contacts" note="Company details, phone numbers, emails, office hours, social links and where website messages are sent.">
      <div className={card}>
        <ObjectFields value={editor.content.settings} onChange={(v) => editor.setContent((c) => ({ ...c, settings: v }))} />
      </div>
    </Panel>
  );
}

export function MenusView({ editor }: { editor: Editor }) {
  return (
    <Panel title="Menus & footer links" note="The main menu at the top of every page, and the link columns in the footer. “Link” is an address on this site, like /safari or /destinations/mountains.">
      <div className="space-y-6">
        <div className={card}>
          <Field name="Main menu" value={editor.content.nav} onChange={(v) => editor.setContent((c) => ({ ...c, nav: v }))} />
        </div>
        <div className={card}>
          <Field name="Footer links" value={editor.content.footerLinks} onChange={(v) => editor.setContent((c) => ({ ...c, footerLinks: v }))} />
        </div>
      </div>
    </Panel>
  );
}

// ---------- media ----------

export function MediaView({ editor }: { editor: Editor }) {
  const { notify } = useAdmin();
  const [files, setFiles] = useState<{ url: string; name: string; size: number }[] | null>(null);
  const [picking, setPicking] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const images = editor.content.images;
  const slots = Array.from(new Set([...Object.keys(photos), ...Object.keys(images)]));
  const load = () => api.uploads().then((r) => setFiles(r.files)).catch((e) => { setFiles([]); notify(e.message, "error"); });
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const setSlot = (k: string, patch: Partial<{ src: string; alt: string }>) =>
    editor.setContent((c) => ({ ...c, images: { ...c.images, [k]: Object.assign({ src: "", alt: photos[k as keyof typeof photos]?.alt ?? "" }, c.images[k], patch) } }));

  return (
    <Panel title="Photos & media" note="Every named photo used around the website. Replace one here and it changes everywhere it is used. Uploaded images can also be picked directly in any photo field.">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search photos…" className="mb-4 w-full rounded-full border border-line bg-white px-4 py-2.5 text-sm" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {slots.filter((k) => k.toLowerCase().includes(q.toLowerCase())).map((k) => (
          <div key={k} className="overflow-hidden rounded-3xl border border-line bg-white">
            <Photo photo={k} className="aspect-[4/3]" />
            <div className="space-y-2 p-4">
              <p className="font-mono text-xs text-muted">{k}</p>
              <input value={images[k]?.alt ?? ""} onChange={(e) => setSlot(k, { alt: e.target.value })} placeholder="Description (for Google & screen readers)" className="w-full rounded-lg border border-line px-3 py-2 text-xs" />
              <div className="flex flex-wrap gap-2">
                <label className={`${smallBtn} cursor-pointer !px-3 !py-1.5`}>
                  <ImagePlus className="size-3.5" /> Replace
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (!f) return; const url = await uploadFile(f, notify); if (url) { setSlot(k, { src: url }); load(); } }} />
                </label>
                <button type="button" onClick={() => setPicking(k)} className={`${smallBtn} !px-3 !py-1.5`}><Images className="size-3.5" /> From uploads</button>
                {images[k]?.src && <button type="button" onClick={() => setSlot(k, { src: "" })} className={`${smallBtn} !px-3 !py-1.5`}><RotateCcw className="size-3.5" /> Original</button>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mb-4 mt-12 font-display text-2xl">My uploads</h2>
      {files === null ? <p className="text-sm text-muted">Loading…</p> : files.length === 0 ? <p className="text-sm text-muted">No uploads yet.</p> : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {files.map((f) => (
            <div key={f.url} className="overflow-hidden rounded-2xl border border-line bg-white">
              <Photo photo={f.url} className="aspect-square" />
              <div className="flex items-center justify-between gap-1 p-2">
                <span className="truncate text-xs text-muted">{Math.round(f.size / 1024)} KB</span>
                <div className="flex">
                  <button type="button" title="Copy address" onClick={() => { navigator.clipboard?.writeText(f.url); notify("Image address copied."); }} className="grid size-7 place-items-center rounded-full hover:bg-sand"><Copy className="size-3.5" /></button>
                  <button type="button" title="Delete" onClick={async () => { if (!confirm("Delete this image? Pages using it will show a placeholder.")) return; try { await api.deleteUpload(f.url); load(); notify("Image deleted."); } catch (e) { notify((e as Error).message, "error"); } }} className="grid size-7 place-items-center rounded-full hover:bg-sand"><Trash2 className="size-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {picking && <MediaPicker onClose={() => setPicking(null)} onPick={(v) => { setSlot(picking, { src: v.startsWith("/") ? v : "" }); setPicking(null); }} />}
    </Panel>
  );
}

// ---------- inbox ----------

const kindLabel: Record<string, string> = { trip: "Trip request", contact: "Contact", newsletter: "Newsletter" };

export function InboxView({ editor }: { editor: Editor }) {
  const { notify } = useAdmin();
  const [items, setItems] = useState<InboxItem[] | null>(null);
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    api.inbox().then((r) => setItems(r.items)).catch((e) => { setItems([]); notify(e.message, "error"); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const act = async (action: "read" | "unread" | "delete", ids: string[]) => {
    try {
      const r = await api.inboxAction(action, ids);
      setItems(r.items);
      editor.refreshInbox();
    } catch (e) {
      notify((e as ApiError).message, "error");
    }
  };

  const shown = useMemo(() => (items ?? []).filter((i) => filter === "all" || (filter === "unread" ? !i.read : i.kind === filter)), [items, filter]);
  const open = items?.find((i) => i.id === openId);

  const exportCsv = () => {
    const rows = (items ?? []).filter((i) => i.kind === "newsletter").map((i) => [i.fields.Name ?? "", i.fields.Email ?? "", i.time]);
    const csv = [["Name", "Email", "Signed up"], ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "newsletter-subscribers.csv";
    a.click();
  };

  if (open) {
    const phone = (open.fields.Phone || "").replace(/[^\d+]/g, "");
    return (
      <Panel title={<span className="flex items-center gap-3"><button type="button" onClick={() => setOpenId(null)} className="grid size-10 place-items-center rounded-full border border-line bg-white" aria-label="Back"><ArrowLeft className="size-4" /></button>{open.subject}</span>} note={`${kindLabel[open.kind]} · ${new Date(open.time).toLocaleString()}`}>
        <div className={card}>
          <dl className="divide-y divide-line">
            {Object.entries(open.fields).filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="grid gap-1 py-3 sm:grid-cols-[12rem_1fr]">
                <dt className="text-sm font-semibold text-earth">{k}</dt>
                <dd className="whitespace-pre-wrap text-sm text-ink">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 flex flex-wrap gap-2">
            {open.fields.Email && <a href={`mailto:${open.fields.Email}?subject=${encodeURIComponent("Re: " + open.subject)}`} className="btn btn-earth !px-5 !py-2.5 !text-[0.7rem]"><Mail className="size-4" /> Reply by email</a>}
            {phone && <a href={`https://wa.me/${phone.replace(/^\+/, "")}`} target="_blank" rel="noreferrer" className="btn bg-[#25d366] !px-5 !py-2.5 !text-[0.7rem] text-white"><WhatsApp className="size-4" /> WhatsApp</a>}
            <button type="button" onClick={() => act("unread", [open.id])} className={smallBtn}>Mark unread</button>
            <button type="button" onClick={() => { if (confirm("Delete this message?")) { act("delete", [open.id]); setOpenId(null); } }} className={smallBtn}><Trash2 className="size-3.5" /> Delete</button>
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <Panel
      title="Inbox"
      note="Every trip request, contact message and newsletter sign-up from the website. A copy is also emailed to the address in Settings."
      actions={<button type="button" onClick={exportCsv} className={smallBtn}><Download className="size-3.5" /> Newsletter list (CSV)</button>}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {[["all", "All"], ["unread", "Unread"], ["trip", "Trip requests"], ["contact", "Contact"], ["newsletter", "Newsletter"]].map(([k, l]) => (
          <button key={k} type="button" onClick={() => setFilter(k)} className={`rounded-full px-4 py-2 text-sm font-medium ${filter === k ? "bg-earth text-cream" : "border border-line bg-white text-earth"}`}>{l}</button>
        ))}
      </div>
      <div className="overflow-hidden rounded-3xl border border-line bg-white">
        {items === null && <p className="p-6 text-sm text-muted">Loading…</p>}
        {items !== null && shown.length === 0 && <p className="p-6 text-sm text-muted">No messages here yet.</p>}
        {shown.map((i) => (
          <button key={i.id} type="button" onClick={() => { setOpenId(i.id); if (!i.read) act("read", [i.id]); }} className="flex w-full items-center gap-4 border-b border-line px-5 py-4 text-left last:border-b-0 hover:bg-sand/30">
            <span className={`size-2.5 shrink-0 rounded-full ${i.read ? "bg-transparent" : "bg-sunset"}`} />
            <div className="min-w-0 flex-1">
              <p className={`truncate ${i.read ? "text-ink" : "font-semibold text-ink"}`}>{i.subject}</p>
              <p className="truncate text-xs text-muted">{i.fields.Email || i.fields.Phone} · {(i.fields.Message || i.fields.Interests || "").slice(0, 90)}</p>
            </div>
            <div className="shrink-0 text-right">
              <span className="block rounded-full bg-sand/60 px-2.5 py-1 text-[0.7rem] font-semibold text-earth">{kindLabel[i.kind]}</span>
              <span className="mt-1 block text-[0.7rem] text-muted">{new Date(i.time).toLocaleDateString()}</span>
            </div>
          </button>
        ))}
      </div>
    </Panel>
  );
}

// ---------- versions ----------

export function VersionsView({ reload }: { reload: () => Promise<void> }) {
  const { notify } = useAdmin();
  const [items, setItems] = useState<{ file: string; updated: string | null; by: string | null; note: string }[] | null>(null);
  const load = () => api.versions().then((r) => setItems(r.items)).catch((e) => { setItems([]); notify(e.message, "error"); });
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Panel title="Version history" note="Every time you save, the previous version is kept (the last 40). Restoring makes that version live again; your current version is kept too, so you can always go back.">
      <div className="overflow-hidden rounded-3xl border border-line bg-white">
        {items === null && <p className="p-6 text-sm text-muted">Loading…</p>}
        {items?.length === 0 && <p className="p-6 text-sm text-muted">No earlier versions yet. They appear after your second save.</p>}
        {items?.map((v) => (
          <div key={v.file} className="flex flex-wrap items-center gap-4 border-b border-line px-5 py-4 last:border-b-0">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{v.updated ? new Date(v.updated).toLocaleString() : v.file}</p>
              <p className="text-xs text-muted">{[v.by && `Saved by ${v.by}`, v.note].filter(Boolean).join(" · ")}</p>
            </div>
            <button
              type="button"
              className={smallBtn}
              onClick={async () => {
                if (!confirm("Make this version live on the website? Unsaved changes in the dashboard will be lost.")) return;
                try {
                  await api.restore(v.file);
                  await reload();
                  load();
                  notify("Version restored and published.");
                } catch (e) {
                  notify((e as Error).message, "error");
                }
              }}
            >
              <RotateCcw className="size-3.5" /> Restore
            </button>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ---------- account ----------

export function AccountView({ user, onLogout }: { user: string; onLogout: () => void }) {
  const { notify } = useAdmin();
  const [form, setForm] = useState({ current: "", password: "", repeat: "", username: user });
  const [busy, setBusy] = useState(false);
  return (
    <Panel title="Account" note={`Signed in as ${user}.`}>
      <form
        className={`${card} max-w-lg space-y-4`}
        onSubmit={async (e) => {
          e.preventDefault();
          if (form.password !== form.repeat) return notify("The two new passwords don't match.", "error");
          setBusy(true);
          try {
            await api.changePassword(form.current, form.password, form.username);
            notify("Password changed.");
            setForm({ ...form, current: "", password: "", repeat: "" });
          } catch (err) {
            notify((err as Error).message, "error");
          }
          setBusy(false);
        }}
      >
        <h2 className="font-display text-2xl">Change username or password</h2>
        {(["username", "current", "password", "repeat"] as const).map((k) => (
          <FieldShell key={k} htmlFor={`acc-${k}`} label={{ username: "Username", current: "Current password", password: "New password (at least 10 characters)", repeat: "Repeat new password" }[k]}>
            <input id={`acc-${k}`} type={k === "username" ? "text" : "password"} required value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} autoComplete={k === "current" ? "current-password" : k === "username" ? "username" : "new-password"} className="w-full rounded-xl border border-line px-3.5 py-2.5" />
          </FieldShell>
        ))}
        <button disabled={busy} className="btn btn-earth">{busy ? "Saving…" : "Change password"}</button>
      </form>
      <button type="button" onClick={onLogout} className={`${smallBtn} mt-6`}>Sign out</button>
    </Panel>
  );
}
