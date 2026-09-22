import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
describe("data mode selection", () => {
  it.each([undefined, "false", "TRUE", "garbage"])("does not silently use mocks for %s", async (value) => {
    vi.stubEnv("EXPO_PUBLIC_USE_MOCKS", value);
    expect((await import("../config/env")).env.useMocks).toBe(false);
  });
  it("permits an explicitly requested frontend demo", async () => {
    vi.stubEnv("EXPO_PUBLIC_USE_MOCKS", "true");
    expect((await import("../config/env")).env.useMocks).toBe(true);
  });
});
