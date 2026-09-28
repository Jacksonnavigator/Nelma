import type { AuthSession } from "../types/auth";
import { env } from "../config/env";
import { secureTokenStorage } from "../storage/secure-token-storage";
import type { ApiError } from "../types/api";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  authenticated?: boolean;
  timeoutMs?: number;
  idempotencyKey?: string;
  /** Set on the single longer retry made while the server may still be waking up. */
  coldRetry?: boolean;
};

const COLD_START_TIMEOUT_MS = 60000;

type UnauthorizedHandler = () => void | Promise<void>;

const fallbackMessage = "Unable to connect to NELMA right now. Please check your internet connection and try again.";

const mapStatusToCode = (status: number): ApiError["code"] => {
  if (status === 401) {
    return "UNAUTHORIZED";
  }
  if (status === 403) {
    return "FORBIDDEN";
  }
  if (status === 404) {
    return "NOT_FOUND";
  }
  if (status === 422) {
    return "VALIDATION_ERROR";
  }
  if (status >= 500) {
    return "SERVER_ERROR";
  }
  return "UNKNOWN";
};

const customerMessageForStatus = (status: number): string => {
  if (status === 401) {
    return "Your session has expired. Please sign in again.";
  }
  if (status === 403) {
    return "You do not have permission to complete this action.";
  }
  if (status === 404) {
    return "We could not find that information.";
  }
  if (status === 422) {
    return "Please check the information and try again.";
  }
  if (status >= 500) {
    return "NELMA is having trouble right now. Please try again shortly.";
  }
  return "Something went wrong. Please try again.";
};

const customerMessageForBackendCode = (code: string, fallback: string): string => {
  const messages: Record<string, string> = {
    PHONE_ALREADY_EXISTS: "An account already exists with this phone number.",
    EMAIL_ALREADY_EXISTS: "An account already exists with this email address.",
    INVALID_CREDENTIALS: "Phone/email or password is incorrect.",
    ORDER_NOT_CANCELLABLE: "This order can no longer be cancelled.",
    PAYMENT_METHOD_UNAVAILABLE: "Choose another payment method.",
    ADDRESS_REQUIRED: "Enter a delivery address before placing the order."
  };
  return messages[code] ?? fallback;
};

const parseJson = (payload: string): unknown => {
  if (!payload) {
    return null;
  }
  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
};

const buildApiError = (status: number, parsed: unknown): ApiError => {
  const body = parsed as { detail?: { code?: unknown; message?: unknown; errors?: unknown }; message?: unknown; details?: unknown } | null;
  const detail = body?.detail;
  const code = typeof detail?.code === "string" ? detail.code : mapStatusToCode(status);
  const validationErrors = Array.isArray(detail) ? detail : detail?.errors;
  const validationMessage = code === "VALIDATION_ERROR" && Array.isArray(validationErrors)
    ? validationErrors.map((error: { loc?: unknown[]; msg?: unknown }) => {
      const field = error.loc?.filter((part) => part !== "body").join(".");
      return typeof error.msg === "string" ? (field ? field + ": " : "") + error.msg : "";
    }).filter(Boolean).join("\n")
    : "";
  const fallback = validationMessage || (typeof detail?.message === "string" ? detail.message : customerMessageForStatus(status));
  return {
    code,
    status,
    message: customerMessageForBackendCode(code, typeof body?.message === "string" ? body.message : fallback),
    details: body?.details ?? detail?.errors ?? detail
  };
};

export class ApiClient {
  private unauthorizedHandler?: UnauthorizedHandler;
  private refreshPromise?: Promise<boolean>;
  private sessionVersion = 0;
  private serverAwake = false;

  /** Nudge a sleeping server awake while the splash screen shows, so the first real request is fast. */
  warmUp(): void {
    if (!env.apiUrl || this.serverAwake) return;
    this.request("/health", { authenticated: false, timeoutMs: COLD_START_TIMEOUT_MS, coldRetry: true }).catch(() => undefined);
  }

  // Reads and sign-in can be repeated safely; other writes only when they carry an idempotency key.
  private safeToRetry(path: string, options: RequestOptions): boolean {
    return (options.method ?? "GET") === "GET" || Boolean(options.idempotencyKey) || path === "/auth/login" || path === "/auth/refresh";
  }

  invalidateSession(): void {
    this.sessionVersion += 1;
    this.refreshPromise = undefined;
  }

  private assertSession(version: number): void {
    if (version !== this.sessionVersion) {
      throw { code: "SESSION_CHANGED", message: "Your session changed. Please try again." } satisfies ApiError;
    }
  }

  setUnauthorizedHandler(handler: UnauthorizedHandler): void {
    this.unauthorizedHandler = handler;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.execute<T>(path, options, true);
  }

  private async execute<T>(path: string, options: RequestOptions, allowRefresh: boolean): Promise<T> {
    if (!env.apiUrl) {
      throw {
        code: "NETWORK_ERROR",
        message: "NELMA backend URL is not configured. Set EXPO_PUBLIC_API_URL."
      } satisfies ApiError;
    }

    const version = this.sessionVersion;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? env.apiTimeoutMs);
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json"
    };

    if (options.idempotencyKey) {
      headers["Idempotency-Key"] = options.idempotencyKey;
    }

    if (options.authenticated !== false) {
      const token = await secureTokenStorage.getAccessToken();
      if (token) {
        headers.Authorization = "Bearer " + token;
      }
    }

    try {
      const response = await fetch(env.apiUrl + path, {
        method: options.method ?? "GET",
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal
      });

      this.serverAwake = true;
      const parsed = parseJson(await response.text());
      this.assertSession(version);

      if (!response.ok) {
        if (response.status === 401 && options.authenticated !== false && allowRefresh) {
          const refreshed = await this.refreshTokens();
          this.assertSession(version);
          if (refreshed) {
            return this.execute<T>(path, options, false);
          }
          if (this.unauthorizedHandler) {
            await this.unauthorizedHandler();
          }
        }
        throw buildApiError(response.status, parsed);
      }

      return ((parsed as { data?: unknown })?.data ?? parsed) as T;
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        // A sleeping server (Render's free plan) can take close to a minute to wake. Until the server
        // has answered once, give reads and sign-in one longer second try instead of failing.
        if (!this.serverAwake && !options.coldRetry && this.safeToRetry(path, options)) {
          return this.execute<T>(path, { ...options, coldRetry: true, timeoutMs: COLD_START_TIMEOUT_MS }, allowRefresh);
        }
        throw { code: "TIMEOUT", message: fallbackMessage } satisfies ApiError;
      }
      if ((error as ApiError).code) {
        throw error;
      }
      throw { code: "NETWORK_ERROR", message: fallbackMessage } satisfies ApiError;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async refreshTokens(): Promise<boolean> {
    if (!this.refreshPromise) {
      const version = this.sessionVersion;
      this.refreshPromise = this.performRefresh(version).finally(() => {
        if (version === this.sessionVersion) this.refreshPromise = undefined;
      });
    }
    return this.refreshPromise;
  }

  private async performRefresh(version: number): Promise<boolean> {
    const tokens = await secureTokenStorage.get();
    if (!tokens?.refreshToken || !env.apiUrl) {
      return false;
    }
    try {
      const response = await fetch(env.apiUrl + "/auth/refresh", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ refreshToken: tokens.refreshToken })
      });
      if (version !== this.sessionVersion) return false;
      if (!response.ok) {
        await secureTokenStorage.clear();
        return false;
      }
      const session = (await response.json()) as AuthSession;
      if (version !== this.sessionVersion) return false;
      if (!session.tokens?.accessToken || !session.tokens?.refreshToken) {
        return false;
      }
      await secureTokenStorage.save(session.tokens);
      return true;
    } catch {
      return false;
    }
  }

  get<T>(path: string, authenticated = true): Promise<T> {
    return this.request<T>(path, { method: "GET", authenticated });
  }

  post<T>(path: string, body?: unknown, authenticated = true, idempotencyKey?: string, timeoutMs?: number): Promise<T> {
    return this.request<T>(path, { method: "POST", body, authenticated, idempotencyKey, timeoutMs });
  }

  patch<T>(path: string, body?: unknown, authenticated = true, timeoutMs?: number): Promise<T> {
    return this.request<T>(path, { method: "PATCH", body, authenticated, timeoutMs });
  }

  delete<T>(path: string, authenticated = true): Promise<T> {
    return this.request<T>(path, { method: "DELETE", authenticated });
  }
}

export const apiClient = new ApiClient();
