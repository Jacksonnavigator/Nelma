import { describe, expect, it } from "vitest";
import { createCspNonce, securityHeaders, hardenResponse } from "./security-headers";
describe("production response policy", () => {
  it("uses a fresh cryptographically random nonce for each response", () => {
    const a = createCspNonce(),
      b = createCspNonce();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9+/=]{32}$/);
  });
  it("enforces nonce scripts without unsafe-inline or unsafe-eval", () => {
    const nonce = createCspNonce();
    const csp = securityHeaders("https://staff.example/", nonce, "https://api.example/api/v1").get(
      "Content-Security-Policy",
    )!;
    const scripts = csp.split(";").find((x) => x.trim().startsWith("script-src "))!;
    expect(scripts).toContain(`'nonce-${nonce}'`);
    expect(scripts).not.toContain("unsafe-inline");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).toContain("connect-src 'self' https://api.example");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'none'");
  });
  it("lets only this site's own service worker run, so order alerts can work but nothing foreign can", () => {
    const csp = securityHeaders("https://staff.example/", createCspNonce(), "/api/v1").get(
      "Content-Security-Policy",
    )!;
    const workers = csp.split(";").find((x) => x.trim().startsWith("worker-src "))!;
    expect(workers.trim()).toBe("worker-src 'self'");
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain("object-src 'none'");
  });
  it("disables caching, framing, sniffing and unwanted device permissions", () => {
    const h = securityHeaders("https://staff.example/", createCspNonce(), "/api/v1");
    expect(h.get("Cache-Control")).toContain("no-store");
    expect(h.get("X-Frame-Options")).toBe("DENY");
    expect(h.get("X-Content-Type-Options")).toBe("nosniff");
    expect(h.get("Permissions-Policy")).toContain("camera=()");
    expect(h.get("Referrer-Policy")).toBe("no-referrer");
  });
  it("only sends HSTS on HTTPS and does not assert other subdomains' readiness", () => {
    expect(
      securityHeaders("http://127.0.0.1/", createCspNonce(), "/api/v1").has(
        "Strict-Transport-Security",
      ),
    ).toBe(false);
    expect(
      securityHeaders("https://staff.example/", createCspNonce(), "/api/v1").get(
        "Strict-Transport-Security",
      ),
    ).toBe("max-age=31536000");
  });
  it("preserves response status/body while replacing unsafe header defaults", async () => {
    const response = hardenResponse(
      new Response("denied", {
        status: 403,
        headers: { "x-powered-by": "server", "cache-control": "public" },
      }),
      "https://staff.example/",
      createCspNonce(),
      "/api/v1",
    );
    expect(response.status).toBe(403);
    expect(await response.text()).toBe("denied");
    expect(response.headers.has("x-powered-by")).toBe(false);
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
});
