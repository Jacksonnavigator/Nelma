import * as SecureStore from "expo-secure-store";
import type { AuthTokens, SessionAudience } from "../types/auth";

const ACCESS_TOKEN_KEY = "nelma.accessToken";
const REFRESH_TOKEN_KEY = "nelma.refreshToken";
const EXPIRES_AT_KEY = "nelma.expiresAt";
const AUDIENCE_KEY = "nelma.audience";

const isSecureStoreAvailable = async (): Promise<boolean> => {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
};

const normalizeAudience = (audience: string | null | undefined): SessionAudience => audience === "dashboard" ? "dashboard" : "mobile";

// Web and runtimes without SecureStore keep a session only for this JS lifetime.
// Never write these fallback tokens to unencrypted persistent browser storage.
let volatileTokens: AuthTokens | null = null;

let pendingStorage: Promise<unknown> = Promise.resolve();
const serialized = <T>(operation: () => Promise<T>): Promise<T> => {
  const result = pendingStorage.then(operation);
  pendingStorage = result.catch(() => undefined);
  return result;
};

export const secureTokenStorage = {
  async save(tokens: AuthTokens): Promise<void> {
    return serialized(async () => {
      if (!(await isSecureStoreAvailable())) {
        volatileTokens = { ...tokens };
        return;
      }
      volatileTokens = null;
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
      await SecureStore.setItemAsync(EXPIRES_AT_KEY, tokens.expiresAt);
      await SecureStore.setItemAsync(AUDIENCE_KEY, normalizeAudience(tokens.audience));
    });
  },

  async get(): Promise<AuthTokens | null> {
    return serialized(async () => {
      if (!(await isSecureStoreAvailable())) {
        return volatileTokens ? { ...volatileTokens } : null;
      }
      const [accessToken, refreshToken, expiresAt, audience] = await Promise.all([
        SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
        SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
        SecureStore.getItemAsync(EXPIRES_AT_KEY),
        SecureStore.getItemAsync(AUDIENCE_KEY)
      ]);

      if (!accessToken || !refreshToken || !expiresAt) {
        return null;
      }

      return { accessToken, refreshToken, expiresAt, audience: normalizeAudience(audience) };
    });
  },

  async getAccessToken(): Promise<string | null> {
    return serialized(async () => {
      if (!(await isSecureStoreAvailable())) {
        return volatileTokens?.accessToken ?? null;
      }
      return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    });
  },

  async clear(): Promise<void> {
    return serialized(async () => {
      volatileTokens = null;
      if (!(await isSecureStoreAvailable())) {
        return;
      }
      await Promise.all([
        SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
        SecureStore.deleteItemAsync(EXPIRES_AT_KEY),
        SecureStore.deleteItemAsync(AUDIENCE_KEY)
      ]);
    });
  }
};
