/** Public configuration only. Never put credentials in VITE_* variables. */
export function resolveDataMode(value: unknown): "api" | "mock" {
  if (value === undefined || value === "" || value === "api") return "api";
  if (value === "mock") return "mock";
  throw new Error("Invalid VITE_DATA_MODE. Choose api or explicitly choose mock for a demo.");
}

export function validateApiBase(value: string, production: boolean, appOrigin?: string): string {
  if (!value || value.length > 2048 || /[\s\\\x00-\x1f\x7f]/.test(value))
    throw new Error("Configure a valid VITE_API_URL.");
  const relative = value.startsWith("/") && !value.startsWith("//");
  if (!relative && !/^https?:\/\//.test(value))
    throw new Error("API URL must use HTTP(S) or a same-origin path.");
  const url = new URL(value, appOrigin ?? "https://same-origin.invalid");
  if (url.username || url.password || url.search || url.hash)
    throw new Error("API URL must not contain credentials, a query or a fragment.");
  if (/(?:^|\/)\.{1,2}(?:\/|$)|%2e|%2f|%5c/i.test(value)) throw new Error("Invalid API path.");
  if (production && url.protocol !== "https:")
    throw new Error("Production API connections require HTTPS.");
  if (
    !production &&
    url.protocol === "http:" &&
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
  )
    throw new Error(
      "Unencrypted API connections are allowed only on local loopback during development.",
    );
  return relative && !appOrigin ? value.replace(/\/$/, "") : url.href.replace(/\/$/, "");
}

export function resolveApiEndpoint(base: string, path: string): URL {
  if (!/^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(path) || path.length > 1024)
    throw new Error("Invalid API endpoint path.");
  const url = new URL(`${base.replace(/\/$/, "")}/${path}`);
  const root = new URL(base);
  if (
    url.origin !== root.origin ||
    !url.pathname.startsWith(`${root.pathname.replace(/\/$/, "")}/`)
  )
    throw new Error("API endpoint escaped its configured origin or path.");
  return url;
}

export function safeEntityId(value: string): string {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(value))
    throw { status: 400, message: "Invalid record identifier." };
  return value;
}
