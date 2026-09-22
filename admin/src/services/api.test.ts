import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("VITE_API_URL", "http://localhost:8011/api/v1");
  const store = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    },
    dispatchEvent: vi.fn(),
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("dashboard API client", () => {
  it("omits empty query values and preserves meaningful false and zero values", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetch);
    const { apiRequest } = await import("./api");
    await apiRequest("admin/orders", {
      query: { search: undefined, status: null, empty: "", page: 0, flag: false },
    });
    const url = new URL(fetch.mock.calls[0]![0]);
    expect([...url.searchParams]).toEqual([
      ["page", "0"],
      ["flag", "false"],
    ]);
  });
  it("coalesces simultaneous 401s into one token refresh and retries with the new token", async () => {
    let refreshes = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, options: RequestInit) => {
        if (url.includes("/auth/dashboard/refresh")) {
          refreshes++;
          await new Promise((resolve) => setTimeout(resolve, 10));
          return Response.json({
            tokens: { accessToken: "new-access", refreshToken: "new-refresh" },
          });
        }
        return (options.headers as Record<string, string>)["Authorization"] === "Bearer new-access"
          ? Response.json({ ok: true })
          : new Response(null, { status: 401 });
      }),
    );
    const { apiRequest, setAuthToken, setRefreshToken, getRefreshToken } = await import("./api");
    setAuthToken("expired");
    setRefreshToken("old-refresh");
    expect(await Promise.all([apiRequest("admin/orders"), apiRequest("admin/settings")])).toEqual([
      { ok: true },
      { ok: true },
    ]);
    expect(refreshes).toBe(1);
    expect(getRefreshToken()).toBe("new-refresh");
  });
  it("clears a rejected session and notifies the auth provider", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 401 })));
    const { apiRequest, setAuthToken, setRefreshToken, getAuthToken, getRefreshToken } =
      await import("./api");
    setAuthToken("expired");
    setRefreshToken("revoked");
    await expect(apiRequest("admin/orders")).rejects.toMatchObject({ status: 401 });
    expect(getAuthToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(window.dispatchEvent).toHaveBeenCalledOnce();
  });
  it("preserves a session on temporary network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    const { apiRequest, setAuthToken, getAuthToken } = await import("./api");
    setAuthToken("valid");
    await expect(apiRequest("admin/orders")).rejects.toMatchObject({ status: 0 });
    expect(getAuthToken()).toBe("valid");
  });
  it("surfaces structured backend errors without retrying unauthorized writes", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        Response.json(
          { detail: { message: "This phone is already registered." } },
          { status: 409 },
        ),
      );
    vi.stubGlobal("fetch", fetch);
    const { apiRequest } = await import("./api");
    await expect(apiRequest("admin/accounts", { method: "POST", body: {} })).rejects.toMatchObject({
      status: 409,
      message: "This phone is already registered.",
    });
    expect(fetch).toHaveBeenCalledOnce();
  });
  it("refreshes an expired current-user request", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, options: RequestInit) => {
        if (url.endsWith("/refresh"))
          return Response.json({ tokens: { accessToken: "new", refreshToken: "next" } });
        return (options.headers as Record<string, string>)["Authorization"] === "Bearer new"
          ? Response.json({ id: "user" })
          : new Response(null, { status: 401 });
      }),
    );
    const { apiRequest, setAuthToken, setRefreshToken } = await import("./api");
    setAuthToken("expired");
    setRefreshToken("refresh");
    expect(await apiRequest("auth/dashboard/me")).toEqual({ id: "user" });
  });
  it("does not restore credentials when logout happens during refresh", async () => {
    let finish!: (response: Response) => void;
    const { apiRequest, setAuthToken, setRefreshToken, clearSession, getAuthToken } =
      await import("./api");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.endsWith("/refresh")) {
          clearSession();
          return await new Promise<Response>((resolve) => {
            finish = resolve;
          });
        }
        return new Response(null, { status: 401 });
      }),
    );
    setAuthToken("expired");
    setRefreshToken("refresh");
    const request = apiRequest("admin/orders");
    const rejection = expect(request).rejects.toMatchObject({ status: 409 });
    await vi.waitFor(() => expect(finish).toBeDefined());
    finish(Response.json({ tokens: { accessToken: "new", refreshToken: "next" } }));
    await rejection;
    expect(getAuthToken()).toBeNull();
  });
  it("keeps a refreshed session when the requested action is forbidden", async () => {
    const { apiRequest, setAuthToken, setRefreshToken, getAuthToken } = await import("./api");
    setAuthToken("expired");
    setRefreshToken("refresh");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, options: RequestInit) => {
        if (url.endsWith("/refresh"))
          return Response.json({ tokens: { accessToken: "new", refreshToken: "next" } });
        return new Response(null, {
          status:
            (options.headers as Record<string, string>)["Authorization"] === "Bearer new"
              ? 403
              : 401,
        });
      }),
    );
    await expect(apiRequest("admin/settings")).rejects.toMatchObject({ status: 403 });
    expect(getAuthToken()).toBe("new");
    expect(window.dispatchEvent).not.toHaveBeenCalled();
  });
});
