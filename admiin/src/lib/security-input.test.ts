import { describe, expect, it } from "vitest";
import {
  csvCell,
  safeImageUrl,
  validateImageUpload,
  requireNewPassword,
  safeChartCss,
} from "./security-input";
describe("untrusted input hardening", () => {
  it("neutralizes spreadsheet formulas including leading whitespace and control characters", () => {
    for (const value of [
      "=1+1",
      "+cmd",
      "-cmd",
      "@SUM(1)",
      "  =1+1",
      "\t=1+1",
      "\r+cmd",
      "\n@cmd",
      "\u0000=1+1",
    ])
      expect(csvCell(value)).toMatch(/^"'/);
  });
  it("escapes CSV quotes and preserves ordinary values", () => {
    expect(csvCell('A "quoted" name')).toBe('"A ""quoted"" name"');
    expect(csvCell(18000)).toBe('"18000"');
  });
  it("rejects active content, credentials, loopback, private and insecure image URLs", () => {
    for (const value of [
      "javascript:alert(1)",
      "data:image/svg+xml,<svg/>",
      "http://img.example/x",
      "//evil.example/x",
      "https://user:pass@img.example/x",
      "https://127.0.0.1/x",
      "https://10.0.0.1/x",
      "https://172.16.0.1/x",
      "https://[::1]/x",
      "/../x",
      "/%2e%2e/x",
    ])
      expect(safeImageUrl(value)).toBeNull();
  });
  it("allows public HTTPS and local product images", () => {
    expect(safeImageUrl("https://images.example/product.jpg")).toBe(
      "https://images.example/product.jpg",
    );
    expect(safeImageUrl("/products/refill.jpg")).toBe("/products/refill.jpg");
  });
  it("only permits an explicitly allowed same-origin preview blob", () => {
    expect(safeImageUrl("blob:https://staff.example/id", true, "https://staff.example")).toBe(
      "blob:https://staff.example/id",
    );
    expect(safeImageUrl("blob:https://evil.example/id", true, "https://staff.example")).toBeNull();
  });
  it("blocks file-type disguises, empty files and oversize files", async () => {
    for (const file of [
      new File(["<svg onload='alert(1)'/>"], "fake.png", { type: "image/png" }),
      new File([], "empty.jpg", { type: "image/jpeg" }),
      new File([new Uint8Array(5 * 1024 * 1024 + 1)], "big.png", { type: "image/png" }),
    ])
      await expect(validateImageUpload(file)).rejects.toMatchObject({ status: 400 });
  });
  it("checks the allowed raster image signatures", async () => {
    await expect(
      validateImageUpload(
        new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0])], "small.png", {
          type: "image/png",
        }),
      ),
    ).resolves.toBeUndefined();
    await expect(
      validateImageUpload(
        new File([new Uint8Array([255, 216, 255])], "small.jpg", { type: "image/jpeg" }),
      ),
    ).resolves.toBeUndefined();
  });
  it("requires long new passwords without arbitrary complexity rules", () => {
    for (const password of [undefined, "short", "a".repeat(129)])
      expect(() => requireNewPassword(password)).toThrow();
    expect(() => requireNewPassword("a long unique passphrase")).not.toThrow();
  });
  it("filters CSS keys, colors, identifiers and closing-tag injections", () => {
    const css = safeChartCss('safe"><script>alert(1)</script>', [
      ["good", "#abcdef"],
      ["bad", "red;}</style><script>alert(1)</script>"],
      ["bad;key", "#fff"],
    ]);
    expect(css).toContain("--color-good: #abcdef");
    expect(css).not.toContain("<");
    expect(css).not.toContain("--color-bad");
  });
});
