import { site, whatsappHref } from "../data/site";

const endpoint = import.meta.env.VITE_FORM_ENDPOINT as string | undefined;

export type Fields = Record<string, string>;

export const formsConnected = Boolean(endpoint);

export function toText(subject: string, fields: Fields) {
  const lines = Object.entries(fields)
    .filter(([, v]) => v.trim() !== "")
    .map(([k, v]) => `${k}: ${v}`);
  return `${subject}\n\n${lines.join("\n")}`;
}

/**
 * Sends a form to VITE_FORM_ENDPOINT (Formspree or any service that accepts JSON).
 * Returns "sent" when delivered, or "fallback" when no endpoint is set so the
 * caller can offer WhatsApp or email instead.
 */
export async function sendForm(subject: string, fields: Fields): Promise<"sent" | "fallback"> {
  if (!endpoint) return "fallback";
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ _subject: subject, ...fields }),
  });
  if (!res.ok) throw new Error(`Form service answered ${res.status}`);
  return "sent";
}

export const fallbackLinks = (subject: string, fields: Fields) => {
  const text = toText(subject, fields);
  return {
    whatsapp: whatsappHref(text),
    email: `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`,
  };
};
