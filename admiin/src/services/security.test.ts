import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("VITE_API_URL", "https://api.example/api/v1");
  vi.stubEnv("VITE_DATA_MODE", "api");
  const store = new Map<string, string>();
  const storage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: vi.fn((k: string, v: string) => store.set(k, v)),
    removeItem: vi.fn((k: string) => store.delete(k)),
  };
  vi.stubGlobal("window", {
    location: { origin: "https://staff.example" },
    localStorage: storage,
    sessionStorage: storage,
    dispatchEvent: vi.fn(),
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
const user = {
  id: "staff_1",
  fullName: "Example Staff",
  email: "staff@example.test",
  phone: "+255700000000",
  role: "SYSTEM_ADMIN",
  isActive: true,
  createdAt: "2026-01-01",
};
describe("security-critical client boundaries", () => {
  it("never persists API access or refresh tokens in browser storage", async () => {
    const a = await import("./api");
    a.setAuthToken("access-secret");
    a.setRefreshToken("refresh-secret");
    expect(window.localStorage.setItem).not.toHaveBeenCalled();
    expect(a.getAuthToken()).toBe("access-secret");
  });
  it("purges legacy stored credentials and works when storage is unavailable", async () => {
    window.localStorage.setItem("nelma.dashboard.token", "legacy");
    const a = await import("./api");
    a.purgeLegacyCredentials();
    expect(window.localStorage.getItem("nelma.dashboard.token")).toBeNull();
    vi.stubGlobal("window", {
      get localStorage() {
        throw Error("blocked");
      },
      get sessionStorage() {
        throw Error("blocked");
      },
      dispatchEvent: vi.fn(),
    });
    expect(() => a.clearSession(false)).not.toThrow();
  });
  it("rejects external endpoint injection before fetch can send a token", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const a = await import("./api");
    a.setAuthToken("secret");
    await expect(a.apiRequest("https://evil.example/x")).rejects.toMatchObject({ status: 0 });
    expect(fetch).not.toHaveBeenCalled();
  });
  it("uses no ambient cookies, redirects, referrers or HTTP response caching", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetch);
    const a = await import("./api");
    await a.apiRequest("admin/orders");
    expect(fetch.mock.calls[0]![1]).toMatchObject({
      credentials: "omit",
      redirect: "error",
      cache: "no-store",
      referrerPolicy: "no-referrer",
    });
  });
  it("does not automatically retry login, refresh or other writes after network failure", async () => {
    const fetch = vi.fn().mockRejectedValue(Error("offline"));
    vi.stubGlobal("fetch", fetch);
    const a = await import("./api");
    for (const path of ["auth/dashboard/login", "auth/dashboard/refresh", "admin/orders"])
      await expect(a.apiRequest(path, { method: "POST", body: {} })).rejects.toMatchObject({
        status: 0,
      });
    expect(fetch).toHaveBeenCalledTimes(3);
  });
  it("does not replay rate-limited requests", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 429 }));
    vi.stubGlobal("fetch", fetch);
    const a = await import("./api");
    await expect(a.apiRequest("admin/orders")).rejects.toMatchObject({ status: 429 });
    expect(fetch).toHaveBeenCalledOnce();
  });
  it("bounds stalled requests with a timeout", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_u: string, o: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            o.signal!.addEventListener("abort", () => reject(new Error("aborted")));
          }),
      ),
    );
    const a = await import("./api");
    const request = a.apiRequest("admin/orders");
    const rejection = expect(request).rejects.toMatchObject({ status: 0 });
    await vi.advanceTimersByTimeAsync(25000);
    await rejection;
  });
  it("honours cancellation without retrying", async () => {
    const c = new AbortController();
    c.abort();
    const fetch = vi.fn().mockRejectedValue(Error("aborted"));
    vi.stubGlobal("fetch", fetch);
    const a = await import("./api");
    await expect(a.apiRequest("admin/orders", { signal: c.signal })).rejects.toMatchObject({
      status: 0,
    });
    expect(fetch).toHaveBeenCalledOnce();
  });
  it("rejects an old successful response after logout", async () => {
    let done!: (r: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((r) => {
            done = r;
          }),
      ),
    );
    const a = await import("./api");
    a.setAuthToken("old");
    const request = a.apiRequest("admin/orders");
    const rejection = expect(request).rejects.toMatchObject({ status: 409 });
    a.clearSession(false);
    done(Response.json({ private: "data" }));
    await rejection;
  });
  it("does not reveal backend stack traces in server-error messages", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ detail: { message: "DATABASE_PASSWORD=secret" } }, { status: 500 }),
        ),
    );
    const a = await import("./api");
    await expect(a.apiRequest("admin/settings")).rejects.toMatchObject({
      message: "Something went wrong. Please try again.",
    });
  });
  it("rejects malformed JSON instead of throwing a raw parser error", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response("not-json", { headers: { "content-type": "application/json" } }),
        ),
    );
    const a = await import("./api");
    await expect(a.apiRequest("admin/settings")).rejects.toMatchObject({ status: 502 });
  });
  it("rejects inactive and unexpected-role logins without keeping tokens", async () => {
    const a = await import("./api");
    const { httpServices } = await import("./http");
    for (const u of [
      { ...user, isActive: false },
      { ...user, role: "SUPER_ADMIN" },
    ]) {
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValue(
            Response.json({ user: u, tokens: { accessToken: "access", refreshToken: "refresh" } }),
          ),
      );
      await expect(httpServices.auth.login("staff", "password")).rejects.toBeDefined();
      expect(a.getAuthToken()).toBeNull();
    }
  });
  it("rejects malformed token pairs atomically", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ user, tokens: { accessToken: "access", refreshToken: null } }),
        ),
    );
    const { httpServices } = await import("./http");
    const a = await import("./api");
    await expect(httpServices.auth.login("staff", "password")).rejects.toMatchObject({
      status: 502,
    });
    expect(a.getAuthToken()).toBeNull();
    expect(a.getRefreshToken()).toBeNull();
  });
  it("rejects pending login completion after logout", async () => {
    let done!: (r: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((r) => {
            done = r;
          }),
      ),
    );
    const a = await import("./api");
    const { httpServices } = await import("./http");
    const login = httpServices.auth.login("staff", "password");
    const rejection = expect(login).rejects.toMatchObject({ status: 409 });
    a.clearSession(false);
    done(Response.json({ user, tokens: { accessToken: "access", refreshToken: "refresh" } }));
    await rejection;
    expect(a.getAuthToken()).toBeNull();
  });
  it("clears local credentials immediately even when revocation is offline", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(Error("offline")));
    const a = await import("./api");
    a.setAuthToken("access");
    a.setRefreshToken("refresh");
    const { httpServices } = await import("./http");
    const logout = httpServices.auth.logout();
    expect(a.getAuthToken()).toBeNull();
    expect(a.getRefreshToken()).toBeNull();
    await expect(logout).rejects.toMatchObject({ status: 0 });
  });
  it("rejects oversized JSON responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(new Uint8Array(8 * 1024 * 1024 + 1), {
            headers: { "content-type": "application/json" },
          }),
        ),
    );
    const a = await import("./api");
    await expect(a.apiRequest("admin/orders")).rejects.toMatchObject({ status: 502 });
  });
  it("bounds a stalled response body after headers arrive", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(new ReadableStream({ start() {} }), {
            headers: { "content-type": "application/json" },
          }),
        ),
    );
    const a = await import("./api");
    const result = expect(a.apiRequest("admin/orders")).rejects.toMatchObject({ status: 0 });
    await vi.advanceTimersByTimeAsync(25_001);
    await result;
  });
  it("accepts successful revocation acknowledgement after local logout", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    const a = await import("./api");
    a.setAuthToken("access");
    a.setRefreshToken("refresh");
    const { httpServices } = await import("./http");
    await expect(httpServices.auth.logout()).resolves.toBeUndefined();
    expect(a.getAuthToken()).toBeNull();
  });
  it("does not send a short initial password to the backend", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const { httpServices } = await import("./http");
    await expect(
      httpServices.adminAccounts.create({
        fullName: "Staff",
        email: "staff@example.test",
        phone: "+255700000000",
        role: "SALES_MANAGER",
        password: "short",
      }),
    ).rejects.toMatchObject({ status: 400 });
    expect(fetch).not.toHaveBeenCalled();
  });
});
