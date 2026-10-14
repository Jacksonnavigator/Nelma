import { describe, expect, it } from "vitest";
import {
  resolveDataMode,
  validateApiBase,
  resolveApiEndpoint,
  safeEntityId,
} from "./security-config";
import { can } from "./permissions";
import type { DashboardRole } from "@/types";
describe("fail-closed configuration", () => {
  it("defaults to real API mode, not demo", () => expect(resolveDataMode(undefined)).toBe("api"));
  it("rejects misspelled modes", () => expect(() => resolveDataMode("ap1")).toThrow());
  it("rejects unencrypted production endpoints", () =>
    expect(() => validateApiBase("http://api.example/api/v1", true)).toThrow());
  it("allows same-origin paths and configured HTTPS", () => {
    expect(validateApiBase("/api/v1", true)).toBe("/api/v1");
    expect(validateApiBase("https://api.example/api/v1/", true)).toBe("https://api.example/api/v1");
  });
  it("rejects credential, query, fragment and protocol-relative configuration", () => {
    for (const url of [
      "https://user:pass@api.example/api",
      "https://api.example/api?token=x",
      "https://api.example/api#x",
      "//evil.example/api",
      "javascript:alert(1)",
    ])
      expect(() => validateApiBase(url, true)).toThrow();
  });
  it("rejects relative API paths on an unencrypted production application", () =>
    expect(() => validateApiBase("/api/v1", true, "http://example.test")).toThrow());
  it("limits HTTP development to local loopback", () => {
    expect(validateApiBase("http://127.0.0.1:8000/api/v1", false)).toContain("127.0.0.1");
    expect(() => validateApiBase("http://api.example/api/v1", false)).toThrow();
  });
  it("prevents cross-origin and path-traversal API endpoints", () => {
    for (const path of [
      "https://evil.example/x",
      "//evil.example/x",
      "../auth",
      "admin/../auth",
      "admin/%2e%2e/auth",
      "admin\\orders",
      "admin/orders?x=1",
      "admin/orders#x",
    ])
      expect(() => resolveApiEndpoint("https://api.example/api/v1", path)).toThrow();
    expect(resolveApiEndpoint("https://api.example/api/v1", "admin/orders").href).toBe(
      "https://api.example/api/v1/admin/orders",
    );
  });
  it("validates interpolated record identifiers", () => {
    expect(safeEntityId("a0b1-c2d3_4")).toBe("a0b1-c2d3_4");
    for (const id of ["../admin", "a/b", "a?role=admin", "%2e%2e", "", "a".repeat(129)])
      expect(() => safeEntityId(id)).toThrow();
  });
  it("unknown or prototype roles never acquire permissions", () => {
    for (const role of ["OWNER", "toString", "__proto__"])
      expect(can(role as DashboardRole, "settings.manage")).toBe(false);
  });
});
