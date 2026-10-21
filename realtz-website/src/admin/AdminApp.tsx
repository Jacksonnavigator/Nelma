import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import { CheckCircle2, ExternalLink, Eye, FileText, History, Home, Images, Inbox, LayoutList, Loader2, LogOut, Menu, Save, Settings, User, X, AlertTriangle, Map, Navigation } from "lucide-react";
import { api, ApiError, type Status } from "./api";
import { AdminCtx } from "./fields";
import { COLLECTION_DEFS, PAGE_DEFS } from "./defs";
import { AccountView, CategoriesView, CollectionView, DashboardView, InboxView, MediaView, MenusView, PageView, SettingsView, VersionsView, type Editor } from "./views";
import { defaultContent, type Content } from "../content/defaults";
import { mergeContent, savePreviewDraft, StaticContent } from "../content/store";

type Toast = { id: number; message: string; kind: "ok" | "error" };

export default function AdminApp() {
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Dashboard | Real Tanzania Discovery Adventures";
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex, nofollow";
    document.head.appendChild(robots);
    api.status().then(setStatus).catch((e: ApiError) => setError(e.message));
    return () => robots.remove();
  }, []);

  if (error) return <Centered><AlertTriangle className="mx-auto size-10 text-terracotta" /><p className="mt-4 text-center text-muted">{error}</p></Centered>;
  if (!status) return <Centered><Loader2 className="mx-auto size-8 animate-spin text-terracotta" /></Centered>;
  if (!status.setup) return <AuthForm mode="setup" onDone={setStatus} />;
  if (!status.loggedIn) return <AuthForm mode="login" onDone={setStatus} />;
  return <Dashboard user={status.user ?? "admin"} onLogout={async () => { await api.logout().catch(() => null); setStatus({ ...status, loggedIn: false, user: null }); }} />;
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-[#f4efe6] px-5">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}

function AuthForm({ mode, onDone }: { mode: "setup" | "login"; onDone: (s: Status) => void }) {
  const [username, setUsername] = useState(mode === "setup" ? "admin" : "");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (mode === "setup" && password !== repeat) return setError("The two passwords don't match.");
    setBusy(true);
    try {
      onDone(mode === "setup" ? await api.setup(username, password) : await api.login(username, password));
    } catch (err) {
      setError((err as Error).message);
    }
    setBusy(false);
  }

  const input = "w-full rounded-xl border border-line bg-white px-4 py-3 outline-none focus:border-sunset focus:ring-4 focus:ring-sunset/10";
  return (
    <Centered>
      <form onSubmit={submit} className="rounded-[2rem] border border-line bg-white p-8 shadow-xl shadow-earth/10">
        <div className="flex items-center gap-3">
          <span className="grid size-14 place-items-center rounded-2xl bg-cream p-1.5"><img src="/brand/logo-mark.png" alt="" className="w-full" /></span>
          <div>
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.3em] text-terracotta">Website dashboard</p>
            <p className="font-display text-xl text-ink">Real Tanzania Discovery</p>
          </div>
        </div>
        <h1 className="mt-8 font-display text-3xl text-ink">{mode === "setup" ? "Create your admin account" : "Sign in"}</h1>
        {mode === "setup" && <p className="mt-2 text-sm leading-relaxed text-muted">This is the first visit to the dashboard. Choose the username and password you'll use from now on. Keep the password somewhere safe.</p>}
        <div className="mt-6 space-y-4">
          <label className="block"><span className="mb-1.5 block text-sm font-semibold text-earth">Username</span><input required autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} className={input} /></label>
          <label className="block"><span className="mb-1.5 block text-sm font-semibold text-earth">Password{mode === "setup" && " (at least 10 characters)"}</span><input required type="password" autoComplete={mode === "setup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} className={input} /></label>
          {mode === "setup" && <label className="block"><span className="mb-1.5 block text-sm font-semibold text-earth">Repeat password</span><input required type="password" autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} className={input} /></label>}
        </div>
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
        <button disabled={busy} className="btn btn-sun mt-6 w-full">{busy ? "Please wait…" : mode === "setup" ? "Create account" : "Sign in"}</button>
        <a href="/" className="mt-4 block text-center text-sm text-muted hover:text-earth">← Back to the website</a>
      </form>
    </Centered>
  );
}

function Dashboard({ user, onLogout }: { user: string; onLogout: () => void }) {
  const [content, setContentState] = useState<Content | null>(null);
  const [savedJson, setSavedJson] = useState("");
  const [baseUpdated, setBaseUpdated] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loadError, setLoadError] = useState("");
  const { pathname } = useLocation();

  const notify = useCallback((message: string, kind: "ok" | "error" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "error" ? 7000 : 3500);
  }, []);

  const reload = useCallback(async () => {
    try {
      const r = await api.loadContent();
      const merged = mergeContent(defaultContent, r.content);
      setContentState(merged);
      setSavedJson(JSON.stringify(merged));
      setBaseUpdated(r.updated);
    } catch (e) {
      setLoadError((e as Error).message);
    }
  }, []);

  const refreshInbox = useCallback(() => {
    api.inbox().then((r) => setUnread(r.items.filter((i) => !i.read).length)).catch(() => null);
  }, []);

  useEffect(() => {
    reload();
    refreshInbox();
  }, [reload, refreshInbox]);

  useEffect(() => setMenuOpen(false), [pathname]);

  const json = useMemo(() => (content ? JSON.stringify(content) : ""), [content]);
  const dirty = content !== null && json !== savedJson;

  const save = useCallback(async () => {
    if (!content || saving) return;
    setSaving(true);
    try {
      const r = await api.saveContent(content, baseUpdated);
      setBaseUpdated(r.updated);
      setSavedJson(JSON.stringify(content));
      notify("Saved. The website is updated.");
    } catch (e) {
      const err = e as ApiError;
      if (err.status === 401) notify("You were signed out. Copy any long text you changed, then reload and sign in.", "error");
      else notify(err.message, "error");
    }
    setSaving(false);
  }, [content, baseUpdated, saving, notify]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
      }
    };
    const onLeave = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, [save, dirty]);

  if (loadError) return <Centered><AlertTriangle className="mx-auto size-10 text-terracotta" /><p className="mt-4 text-center text-muted">{loadError}</p></Centered>;
  if (!content) return <Centered><Loader2 className="mx-auto size-8 animate-spin text-terracotta" /></Centered>;

  const editor: Editor = {
    content,
    setContent: (fn) => setContentState((c) => (c ? fn(c) : c)),
    preview: (path) => {
      savePreviewDraft(content);
      window.open(`${path}${path.includes("?") ? "&" : "?"}preview=1`, "_blank");
    },
    unread,
    refreshInbox,
  };

  const discard = () => {
    if (confirm("Throw away all changes since your last save?")) setContentState(JSON.parse(savedJson));
  };

  return (
    <AdminCtx.Provider value={{ content, notify }}>
      <StaticContent value={content}>
        <div className="min-h-screen bg-[#f4efe6] text-ink lg:grid lg:grid-cols-[17rem_1fr]">
          <Sidebar open={menuOpen} unread={unread} onClose={() => setMenuOpen(false)} onLogout={() => (!dirty || confirm("You have unsaved changes. Sign out anyway?")) && onLogout()} />

          <div className="min-w-0">
            <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-[#f4efe6]/90 px-4 py-3 backdrop-blur md:px-8">
              <button type="button" onClick={() => setMenuOpen(true)} className="grid size-10 place-items-center rounded-full bg-white lg:hidden" aria-label="Open menu"><Menu className="size-5" /></button>
              <div className="min-w-0 flex-1 text-sm">
                {dirty ? (
                  <span className="inline-flex items-center gap-2 font-semibold text-terracotta"><span className="size-2 rounded-full bg-sunset" /> Unsaved changes</span>
                ) : (
                  <span className="inline-flex items-center gap-2 text-muted"><CheckCircle2 className="size-4 text-emerald-600" /> All changes saved</span>
                )}
              </div>
              {dirty && <button type="button" onClick={discard} className="hidden rounded-full px-3 py-2 text-xs font-semibold text-muted hover:text-earth sm:block">Discard</button>}
              <button type="button" onClick={() => editor.preview(previewPath(pathname, content))} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-earth hover:border-earth"><Eye className="size-4" /><span className="hidden sm:inline">Preview</span></button>
              <button type="button" onClick={save} disabled={!dirty || saving} className="btn btn-sun !px-5 !py-2.5 !text-[0.7rem] disabled:opacity-50 disabled:hover:translate-y-0">
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} {saving ? "Saving…" : "Save & publish"}
              </button>
            </header>

            <main className="px-4 py-8 md:px-8 md:py-10">
              <Routes>
                <Route index element={<DashboardView editor={editor} lastSaved={baseUpdated} />} />
                <Route path="inbox" element={<InboxView editor={editor} />} />
                <Route path="pages/:key" element={<PageView editor={editor} />} />
                <Route path="collections/:key" element={<CollectionView editor={editor} />} />
                <Route path="collections/:key/:index" element={<CollectionView editor={editor} />} />
                <Route path="groups" element={<CategoriesView editor={editor} />} />
                <Route path="media" element={<MediaView editor={editor} />} />
                <Route path="settings" element={<SettingsView editor={editor} />} />
                <Route path="menus" element={<MenusView editor={editor} />} />
                <Route path="versions" element={<VersionsView reload={reload} />} />
                <Route path="account" element={<AccountView user={user} onLogout={onLogout} />} />
                <Route path="*" element={<DashboardView editor={editor} lastSaved={baseUpdated} />} />
              </Routes>
            </main>
          </div>
        </div>

        <div className="pointer-events-none fixed bottom-4 left-1/2 z-[200] flex w-[min(92vw,28rem)] -translate-x-1/2 flex-col gap-2">
          {toasts.map((t) => (
            <div key={t.id} role="status" className={`pointer-events-auto rounded-2xl px-5 py-3.5 text-sm font-medium shadow-xl ${t.kind === "error" ? "bg-red-700 text-white" : "bg-night text-cream"}`}>{t.message}</div>
          ))}
        </div>
      </StaticContent>
    </AdminCtx.Provider>
  );
}

/** Which website page best matches the dashboard screen you're on. */
function previewPath(pathname: string, content: Content): string {
  const m = pathname.match(/^\/admin\/(pages|collections)\/([^/]+)(?:\/(\d+))?/);
  if (!m) return "/";
  if (m[1] === "pages") return PAGE_DEFS.find((p) => p.key === m[2])?.path ?? "/";
  const def = COLLECTION_DEFS.find((d) => d.key === m[2]);
  if (!def) return "/";
  const item = m[3] !== undefined ? (content[def.key] as unknown[])[Number(m[3])] : undefined;
  return item ? def.path(item) : def.path((content[def.key] as unknown[])[0] ?? {});
}

function Sidebar({ open, unread, onClose, onLogout }: { open: boolean; unread: number; onClose: () => void; onLogout: () => void }) {
  const link = ({ isActive }: { isActive: boolean }) => `flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${isActive ? "bg-white/12 font-semibold text-white" : "text-cream/70 hover:bg-white/6 hover:text-white"}`;
  const group = "mb-1 mt-6 px-3 text-[0.65rem] font-bold uppercase tracking-[0.22em] text-gold/80";
  return (
    <>
      <div className={`fixed inset-0 z-40 bg-night/50 lg:hidden ${open ? "" : "hidden"}`} onClick={onClose} />
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-night px-4 pb-10 pt-5 transition-transform lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-auto lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between gap-3 px-2">
          <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-cream p-1"><img src="/brand/logo-mark.png" alt="" className="w-full" /></span>
            <span className="leading-tight text-cream">
              <span className="block text-[0.6rem] font-bold uppercase tracking-[0.28em] text-gold">Dashboard</span>
              <span className="font-display text-base">Real Tanzania</span>
            </span>
          </a>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full text-cream lg:hidden" aria-label="Close menu"><X className="size-5" /></button>
        </div>

        <nav className="mt-6" aria-label="Dashboard">
          <NavLink to="/admin" end className={link}><Home className="size-4" /> Overview</NavLink>
          <NavLink to="/admin/inbox" className={link}><Inbox className="size-4" /> Inbox {unread > 0 && <span className="ml-auto rounded-full bg-sunset px-2 py-0.5 text-[0.7rem] font-bold text-night">{unread}</span>}</NavLink>

          <p className={group}>Pages</p>
          {PAGE_DEFS.map((p) => (
            <NavLink key={p.key} to={`/admin/pages/${p.key}`} className={link}><FileText className="size-4 shrink-0" /> <span className="truncate">{p.label}</span></NavLink>
          ))}

          <p className={group}>Lists</p>
          {COLLECTION_DEFS.map((c) => (
            <NavLink key={c.key} to={`/admin/collections/${c.key}`} className={link}><LayoutList className="size-4 shrink-0" /> <span className="truncate">{c.label}</span></NavLink>
          ))}
          <NavLink to="/admin/groups" className={link}><Map className="size-4" /> Destination groups</NavLink>

          <p className={group}>Website</p>
          <NavLink to="/admin/media" className={link}><Images className="size-4" /> Photos & media</NavLink>
          <NavLink to="/admin/settings" className={link}><Settings className="size-4" /> Settings & contacts</NavLink>
          <NavLink to="/admin/menus" className={link}><Navigation className="size-4" /> Menus & footer links</NavLink>
          <NavLink to="/admin/versions" className={link}><History className="size-4" /> Version history</NavLink>
          <NavLink to="/admin/account" className={link}><User className="size-4" /> Account</NavLink>
          <a href="/" target="_blank" rel="noreferrer" className={link({ isActive: false })}><ExternalLink className="size-4" /> View website</a>
          <button type="button" onClick={onLogout} className={`${link({ isActive: false })} w-full`}><LogOut className="size-4" /> Sign out</button>
        </nav>
      </aside>
    </>
  );
}
