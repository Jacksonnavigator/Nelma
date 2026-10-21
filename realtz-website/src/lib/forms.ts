import { API } from "../content/store";

export type Fields = Record<string, string>;
export type FormKind = "trip" | "contact" | "newsletter";

export function toText(subject: string, fields: Fields) {
  const lines = Object.entries(fields)
    .filter(([, v]) => v.trim() !== "")
    .map(([k, v]) => `${k}: ${v}`);
  return `${subject}\n\n${lines.join("\n")}`;
}

/**
 * Sends a form to the website's own server (/api/submit.php), which stores it in
 * the admin inbox and emails the team. Returns "fallback" if the server can't be
 * reached, so the page can offer WhatsApp or email instead.
 */
export async function sendForm(kind: FormKind, subject: string, fields: Fields): Promise<"sent" | "fallback"> {
  try {
    const res = await fetch(`${API}/submit.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, subject, fields, website: "" }),
    });
    const json = await res.json().catch(() => null);
    return res.ok && json?.ok ? "sent" : "fallback";
  } catch {
    return "fallback";
  }
}

export const fallbackLinks = (subject: string, fields: Fields, settings: { whatsapp: string; email: string }) => {
  const text = toText(subject, fields);
  return {
    whatsapp: `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`,
    email: `mailto:${settings.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`,
  };
};
