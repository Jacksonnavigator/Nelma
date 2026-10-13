import { describe, expect, it } from "vitest";
import { businessDate } from "./format";
describe("businessDate", () => {
  it("uses Tanzania midnight instead of UTC midnight", () => {
    expect(businessDate(new Date("2026-09-15T21:30:00Z"))).toBe("2026-09-16");
    expect(businessDate(new Date("2026-09-15T20:59:59Z"))).toBe("2026-09-15");
  });
});
