import type { ApiError } from "@/types";

/**
 * Thin HTTP client for the existing NELMA FastAPI backend.
 *
 * Base URL comes from VITE_API_URL (see .env.example). Nothing is hardcoded to
 * localhost. Screens never call this directly — they go through repositories.
 */

export const API_BASE_URL: string = (import.meta.env["VITE_API_URL"] as string | undefined) ?? "";

export type DataMode = "mock" | "api";

export const DATA_MODE: DataMode =
  ((import.meta.env["VITE_DATA_MODE"] as DataMode | undefined) ?? "mock") === "api"
    ? "api"
    : "mock";

const TOKEN_KEY = "nelma.dashboard.token";
const REFRESH_KEY = "nelma.dashboard.refresh";
export const SESSION_EXPIRED_EVENT = "nelma:session-expired";
export function getRefreshToken(): string | null {
  return typeof window === "undefined" ? null : window.localStorage.getItem(REFRESH_KEY);
}
export function setRefreshToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(REFRESH_KEY, token);
  else window.localStorage.removeItem(REFRESH_KEY);
}
export function clearSession(): void {
  setAuthToken(null);
  setRefreshToken(null);
}
let refreshPromise: Promise<void> | null = null;
async function refreshSession(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const token = getRefreshToken();
      if (!token) throw { status: 401, message: "Please sign in again." };
      const session = await apiRequest<{ tokens: { accessToken: string; refreshToken: string } }>(
        "auth/dashboard/refresh",
        {
          method: "POST",
          body: { refreshToken: token },
          skipRefresh: true,
        },
      );
      if (getRefreshToken() !== token)
        throw { status: 409, message: "Your session changed. Please try again." };
      setAuthToken(session.tokens.accessToken);
      setRefreshToken(session.tokens.refreshToken);
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export function isApiError(value: unknown): value is ApiError {
  return typeof value === "object" && value !== null && "status" in value && "message" in value;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
  skipRefresh?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!API_BASE_URL)
    throw { status: 0, message: "Set VITE_API_URL in admin/.env before using API mode." };
  const url = new URL(
    path.replace(/^\//, ""),
    API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`,
  );
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const token = getAuthToken();
  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      ...(options.signal ? { signal: options.signal } : {}),
    });
  } catch {
    const error: ApiError = { status: 0, message: "Unable to reach the server." };
    throw error;
  }

  if (
    response.status === 401 &&
    !options.skipRefresh &&
    !/^\/?auth\/(dashboard\/(login|refresh|logout)|forgot-password|reset-password)$/.test(path)
  ) {
    try {
      if (!getAuthToken() || getAuthToken() === token) await refreshSession();
    } catch (error) {
      if (isApiError(error) && (error.status === 401 || error.status === 403)) {
        clearSession();
        if (typeof window !== "undefined") window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      }
      throw error;
    }
    try {
      return await apiRequest<T>(path, { ...options, skipRefresh: true });
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        clearSession();
        if (typeof window !== "undefined") window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      }
      throw error;
    }
  }
  if (!response.ok) {
    const error: ApiError = {
      status: response.status,
      message:
        response.status === 401
          ? "Your session has expired. Please sign in again."
          : response.status === 403
            ? "You do not have permission to perform this action."
            : "Something went wrong. Please try again.",
    };
    const payload: unknown = await response.json().catch(() => null);
    if (payload && typeof payload === "object" && "detail" in payload) {
      const detail = payload.detail;
      if (
        detail &&
        typeof detail === "object" &&
        "message" in detail &&
        typeof detail.message === "string"
      )
        error.message = detail.message;
    }
    throw error;
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/** Simulated latency for the mock repositories. */
export function delay<T>(value: T, ms = 320): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
