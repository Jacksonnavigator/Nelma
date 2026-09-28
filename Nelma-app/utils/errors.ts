/** The customer-safe message from an API or app error, or a fallback when there is none. */
export const errorMessage = (error: unknown, fallback: string): string => {
  const message = (error as { message?: unknown } | null)?.message;
  return typeof message === "string" && message.trim() ? message : fallback;
};
