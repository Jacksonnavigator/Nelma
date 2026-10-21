import { API } from "../content/store";

let csrf = "";

export type Status = { setup: boolean; loggedIn: boolean; user: string | null; csrf: string; php?: string; writable?: boolean };

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };
  if (init.method && init.method !== "GET") headers["X-CSRF-Token"] = csrf;
  let res: Response;
  try {
    res = await fetch(`${API}/${path}`, { credentials: "same-origin", cache: "no-store", ...init, headers });
  } catch {
    throw new ApiError("Can't reach the server. Check your internet connection.", 0);
  }
  const text = await res.text();
  let json: { ok?: boolean; error?: string; csrf?: string } & Record<string, unknown>;
  try {
    json = JSON.parse(text);
  } catch {
    throw new ApiError(
      res.status === 404 || text.trim().startsWith("<")
        ? "The dashboard's server part (the /api folder) isn't running here. On Namecheap, make sure the api folder was uploaded."
        : `Unexpected server answer (${res.status}).`,
      res.status,
    );
  }
  if (json.csrf) csrf = json.csrf;
  if (!res.ok || json.ok === false) throw new ApiError(json.error || `Server error (${res.status})`, res.status);
  return json as T;
}

const post = <T,>(path: string, body: unknown) => call<T>(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export const api = {
  status: () => call<Status>("auth.php?action=status"),
  setup: (username: string, password: string) => post<Status>("auth.php?action=setup", { username, password }),
  login: (username: string, password: string) => post<Status>("auth.php?action=login", { username, password }),
  logout: () => post<{ ok: true }>("auth.php?action=logout", {}),
  changePassword: (current: string, password: string, username?: string) => post<{ ok: true }>("auth.php?action=password", { current, password, username }),

  loadContent: () => call<{ content: unknown; updated: string | null; by: string | null }>("content.php"),
  saveContent: (content: unknown, baseUpdated: string | null, note = "") => post<{ updated: string }>("content.php", { content, baseUpdated, note }),

  uploads: () => call<{ files: { url: string; name: string; size: number; time: number }[] }>("upload.php"),
  upload: async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return call<{ url: string; name: string }>("upload.php", { method: "POST", body: fd });
  },
  deleteUpload: (url: string) => call<{ ok: true }>(`upload.php?delete=${encodeURIComponent(url)}`, { method: "POST" }),

  inbox: () => call<{ items: InboxItem[] }>("inbox.php"),
  inboxAction: (action: "read" | "unread" | "delete", ids: string[]) => post<{ items: InboxItem[] }>("inbox.php", { action, ids }),

  versions: () => call<{ items: { file: string; updated: string | null; by: string | null; note: string; size: number }[] }>("backups.php"),
  restore: (file: string) => post<{ updated: string }>("backups.php", { action: "restore", file }),
};

export type InboxItem = { id: string; time: string; kind: "trip" | "contact" | "newsletter"; subject: string; fields: Record<string, string>; read: boolean };
