/** Input checks are defence-in-depth. The backend must independently enforce them. */
export const MIN_NEW_PASSWORD_LENGTH = 15;
export const MAX_PASSWORD_LENGTH = 128;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export function requireNewPassword(value: unknown): asserts value is string {
  if (
    typeof value !== "string" ||
    value.length < MIN_NEW_PASSWORD_LENGTH ||
    value.length > MAX_PASSWORD_LENGTH
  )
    throw {
      status: 400,
      message: "Use a password of 15–128 characters. A long, unique passphrase is recommended.",
    };
}
export function csvCell(value: string | number): string {
  const text = String(value);
  // Spreadsheet formula injection can hide behind whitespace/control characters.
  const unsafe = /^[\t\r\n]/.test(text) || /^[\s\u0000-\u001f]*[=+\-@]/u.test(text);
  const safe = unsafe ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}
export function safeImageUrl(
  value: string | null | undefined,
  allowBlob = false,
  origin?: string,
): string | null {
  if (!value || value.length > 2048 || /[\s\\\x00-\x1f\x7f]/.test(value)) return null;
  if (/^\/(?!\/)[a-zA-Z0-9_./-]+$/.test(value) && !/(?:^|\/)\.{1,2}(?:\/|$)/.test(value))
    return value;
  if (allowBlob && origin && value.startsWith(`blob:${origin}/`)) return value;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port || url.hash)
      return null;
    const host = url.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host.endsWith(".localhost") ||
      !host.includes(".") ||
      host.includes(":")
    )
      return null;
    if (/^(127|10|0|169\.254|192\.168)\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host))
      return null;
    return url.href;
  } catch {
    return null;
  }
}
export async function validateImageUpload(
  file: Pick<File, "type" | "size" | "slice">,
): Promise<void> {
  if (!file.size || file.size > MAX_IMAGE_BYTES)
    throw { status: 400, message: "Choose an image smaller than 5 MB." };
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b);
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp =
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (!(
    (file.type === "image/png" && png) ||
    (file.type === "image/jpeg" && jpeg) ||
    (file.type === "image/webp" && webp)
  ))
    throw { status: 400, message: "The file does not match a supported JPG, PNG or WebP image." };
  // This detects obvious disguises, not every polyglot/decompression bomb.
  // Backend decoding, dimension limits and re-encoding are release requirements.
}
export function safeChartCss(
  id: string,
  colors: Array<[string, string | undefined]>,
  prefix = "",
): string {
  const validColor =
    /^(?:#[\da-fA-F]{3}|#[\da-fA-F]{4}|#[\da-fA-F]{6}|#[\da-fA-F]{8}|(?:rgb|rgba|hsl|hsla)\([\d.,% /+-]+\)|var\(--[a-zA-Z0-9_-]+\))$/;
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeId) return "";
  const declarations = colors
    .filter(([key, color]) => /^[a-zA-Z0-9_-]+$/.test(key) && color && validColor.test(color))
    .map(([key, color]) => `--color-${key}: ${color};`)
    .join("\n");
  return `${prefix === ".dark" ? ".dark " : ""}[data-chart="${safeId}"] {${declarations}}`;
}
