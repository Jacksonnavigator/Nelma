import { validateApiBase } from "./security-config";
export function createCspNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes));
}
export function securityHeaders(requestUrl: string, nonce: string, apiBase: string): Headers {
  const url = new URL(requestUrl);
  if (!/^[A-Za-z0-9+/=]{32}$/.test(nonce)) throw new Error("Invalid CSP nonce.");
  const base = validateApiBase(apiBase, true, "https://same-origin.invalid");
  const apiOrigin = apiBase.startsWith("/") ? "" : ` ${new URL(base).origin}`;
  const headers = new Headers({
    "Content-Security-Policy": [
      "default-src 'none'",
      `script-src 'self' 'nonce-${nonce}'`,
      "script-src-attr 'none'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self'",
      `connect-src 'self'${apiOrigin}`,
      "manifest-src 'self'",
      "worker-src 'none'",
      "object-src 'none'",
      "base-uri 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      ...(url.protocol === "https:" ? ["upgrade-insecure-requests"] : []),
    ].join("; "),
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    "Cache-Control": "no-store, private",
    "Cross-Origin-Opener-Policy": "same-origin",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
  });
  if (url.protocol === "https:") headers.set("Strict-Transport-Security", "max-age=31536000");
  return headers;
}
export function hardenResponse(
  response: Response,
  requestUrl: string,
  nonce: string,
  apiBase: string,
): Response {
  const headers = new Headers(response.headers);
  securityHeaders(requestUrl, nonce, apiBase).forEach((value, key) => headers.set(key, value));
  headers.delete("x-powered-by");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
