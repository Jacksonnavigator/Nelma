const DEFAULT_TIMEOUT_MS = 15000;

const parseTimeout = (value: string | undefined): number => {
  if (!value) {
    return DEFAULT_TIMEOUT_MS;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
};

export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "",
  useMocks: process.env.EXPO_PUBLIC_USE_MOCKS === "true",
  apiTimeoutMs: parseTimeout(process.env.EXPO_PUBLIC_API_TIMEOUT_MS)
} as const;
