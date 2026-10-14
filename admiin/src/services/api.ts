import type { ApiError } from "@/types";
import { resolveDataMode, resolveApiEndpoint, validateApiBase } from "@/lib/security-config";
import { z } from "zod";

export const API_BASE_URL = (import.meta.env["VITE_API_URL"] as string | undefined) ?? "";
export type DataMode = "mock" | "api";
export const DATA_MODE: DataMode = resolveDataMode(import.meta.env["VITE_DATA_MODE"]);
export const SESSION_EXPIRED_EVENT = "nelma:session-expired";
export const SESSION_LOGOUT_CHANNEL = "nelma:logout";
const TOKEN_KEY = "nelma.dashboard.token";
const REFRESH_KEY = "nelma.dashboard.refresh";
// API credentials stay in this browser tab's memory, never in Web Storage.
// A full reload deliberately requires sign-in until the backend supplies a
// reviewed HttpOnly cookie/BFF contract. Server-side calls never get tab tokens.
let accessToken: string | null = null;
let refreshToken: string | null = null;
let sessionVersion = 0;
const tokenSchema = z
  .string()
  .min(1)
  .max(16384)
  .regex(/^[\x21-\x7e]+$/);
export const tokenPairSchema = z.object({ accessToken: tokenSchema, refreshToken: tokenSchema });
export function getSessionVersion(): number {
  return sessionVersion;
}
export function getAuthToken(): string | null {
  return typeof window === "undefined" ? null : accessToken;
}
export function getRefreshToken(): string | null {
  return typeof window === "undefined" ? null : refreshToken;
}
export function setAuthToken(token: string | null): void {
  if (typeof window !== "undefined") accessToken = token === null ? null : tokenSchema.parse(token);
}
export function setRefreshToken(token: string | null): void {
  if (typeof window !== "undefined")
    refreshToken = token === null ? null : tokenSchema.parse(token);
}
export function establishSession(tokens: unknown, expectedVersion: number): void {
  if (expectedVersion !== sessionVersion) throw sessionChanged();
  const parsed = tokenPairSchema.safeParse(tokens);
  if (!parsed.success) throw { status: 502, message: "The server returned an invalid session." };
  sessionVersion++;
  setAuthToken(parsed.data.accessToken);
  setRefreshToken(parsed.data.refreshToken);
}
export function purgeLegacyCredentials(): void {
  if (typeof window === "undefined") return;
  for (const storage of ["localStorage", "sessionStorage"] as const) {
    try {
      window[storage]?.removeItem(TOKEN_KEY);
      window[storage]?.removeItem(REFRESH_KEY);
      if (DATA_MODE === "api") window[storage]?.removeItem("nelma.dashboard.session");
    } catch {
      /* Privacy-mode storage failure must not prevent logout. */
    }
  }
}
export function clearSession(broadcast = true): void {
  sessionVersion++;
  accessToken = null;
  refreshToken = null;
  purgeLegacyCredentials();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    if (broadcast && DATA_MODE === "api" && typeof BroadcastChannel !== "undefined") {
      try {
        const channel = new BroadcastChannel(SESSION_LOGOUT_CHANNEL);
        channel.postMessage("logout");
        channel.close();
      } catch {
        /* local logout still succeeds */
      }
    }
  }
}
function sessionChanged(): ApiError {
  return { status: 409, message: "Your session changed. Please try again." };
}
let refreshPromise: Promise<void> | null = null;
async function refreshSession(): Promise<void> {
  if (!refreshPromise) {
    const expected = sessionVersion;
    const token = getRefreshToken();
    refreshPromise = (async () => {
      if (!token) throw { status: 401, message: "Please sign in again." };
      const session = await apiRequest<{ tokens: unknown }>("auth/dashboard/refresh", {
        method: "POST",
        body: { refreshToken: token },
        skipRefresh: true,
      });
      if (sessionVersion !== expected || getRefreshToken() !== token) throw sessionChanged();
      const tokens = tokenPairSchema.safeParse(session.tokens);
      if (!tokens.success)
        throw { status: 502, message: "The server returned an invalid session." };
      // Refresh rotates credentials, but is not a different authenticated session.
      setAuthToken(tokens.data.accessToken);
      setRefreshToken(tokens.data.refreshToken);
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}
export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    typeof value.status === "number" &&
    "message" in value &&
    typeof value.message === "string"
  );
}
export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
  skipRefresh?: boolean;
  isRetry?: boolean;
}
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const expected = sessionVersion;
  const sessionBound = path !== "auth/dashboard/logout";
  let url: URL;
  try {
    const base = validateApiBase(
      API_BASE_URL,
      import.meta.env.PROD,
      typeof window === "undefined" ? undefined : window.location?.origin,
    );
    url = resolveApiEndpoint(base, path);
  } catch {
    throw {
      status: 0,
      message: "Secure API configuration is invalid. Contact your administrator.",
    };
  }
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== null && value !== "")
      url.searchParams.set(key, String(value));
  }
  const token = getAuthToken();
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (options.signal?.aborted) abort();
  else options.signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, 25_000);
  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      signal: controller.signal,
      credentials: "omit",
      redirect: "error",
      cache: "no-store",
      referrerPolicy: "no-referrer",
    });
  } catch {
    if (sessionBound && sessionVersion !== expected) throw sessionChanged();
    // Only reads may retry. A dropped write/refresh may already have committed.
    if ((options.method ?? "GET") === "GET" && !options.isRetry && !controller.signal.aborted) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      if (sessionBound && sessionVersion !== expected) throw sessionChanged();
      return apiRequest<T>(path, { ...options, isRetry: true });
    }
    throw {
      status: 0,
      message: controller.signal.aborted
        ? "Request cancelled or timed out. Please try again."
        : "Unable to reach the server. Please try again.",
    };
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", abort);
  }
  if (sessionBound && sessionVersion !== expected) throw sessionChanged();
  if (
    response.status === 401 &&
    !options.skipRefresh &&
    !/^auth\/(dashboard\/(login|refresh|logout)|forgot-password|reset-password)$/.test(path)
  ) {
    try {
      if (!getAuthToken() || getAuthToken() === token) await refreshSession();
    } catch (error) {
      if (sessionVersion === expected && isApiError(error) && [401, 403].includes(error.status))
        clearSession();
      throw error;
    }
    try {
      return await apiRequest<T>(path, { ...options, skipRefresh: true });
    } catch (error) {
      if (sessionVersion === expected && isApiError(error) && error.status === 401) clearSession();
      throw error;
    }
  }
  if (!response.ok) {
    const error: ApiError = {
      status: response.status,
      message:
        response.status === 401
          ? "Sign-in failed or your session expired. Please sign in again."
          : response.status === 403
            ? "You do not have permission to perform this action."
            : response.status === 429
              ? "Too many requests. Please wait before trying again."
              : "Something went wrong. Please try again.",
    };
    // Never display internal server errors. Only short, structured 4xx messages.
    if (
      response.status >= 400 &&
      response.status < 500 &&
      ![401, 403, 429].includes(response.status)
    ) {
      const payload: unknown = await readBoundedJson(response, options.signal).catch(() => null);
      const parsed = z
        .object({ detail: z.object({ message: z.string().max(500) }) })
        .safeParse(payload);
      if (parsed.success) error.message = parsed.data.detail.message;
    }
    throw error;
  }
  if (response.status === 204) return undefined as T;
  try {
    const payload = await readBoundedJson(response, options.signal);
    if (sessionBound && sessionVersion !== expected) throw sessionChanged();
    return payload as T;
  } catch (error) {
    if (isApiError(error)) throw error;
    throw { status: 502, message: "The server returned an invalid response. Please try again." };
  }
}
async function readBoundedJson(response: Response, signal?: AbortSignal): Promise<unknown> {
  if (!response.headers.get("content-type")?.toLowerCase().includes("application/json"))
    throw { status: 502, message: "The server returned an invalid response." };
  if (!response.body) throw { status: 502, message: "The server returned an empty response." };
  const reader = response.body.getReader();
  let rejectBudget!: (reason: unknown) => void;
  const budget = new Promise<never>((_, reject) => {
    rejectBudget = reject;
  });
  const abort = () => {
    rejectBudget({ status: 0, message: "Response cancelled or timed out. Please try again." });
    void reader.cancel().catch(() => undefined);
  };
  const timer = setTimeout(abort, 25_000);
  signal?.addEventListener("abort", abort, { once: true });
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const result = await Promise.race([reader.read(), budget]);
      if (signal?.aborted) throw { status: 0, message: "Request cancelled." };
      if (result.done) break;
      size += result.value.byteLength;
      if (size > 8 * 1024 * 1024) {
        await reader.cancel();
        throw { status: 502, message: "The server response exceeded the safe size limit." };
      }
      chunks.push(result.value);
    }
    const all = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      all.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return JSON.parse(new TextDecoder().decode(all));
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
    reader.releaseLock();
  }
}
export function delay<T>(value: T, ms = 320): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
