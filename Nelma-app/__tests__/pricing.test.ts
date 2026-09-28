import { describe, expect, it } from "vitest";
import { FIRST_PURCHASE, productCatalog, REFILL } from "../constants/pricing";
import { calculateOrderPricing } from "../utils/order";

describe("NELMA pricing", () => {
  it("keeps official fallback prices centralized", () => {
    expect(FIRST_PURCHASE).toBe(18000);
    expect(REFILL).toBe(4000);
  });

  it("calculates first-time purchase totals", () => {
    expect(calculateOrderPricing("first_purchase", 1).total).toBe(FIRST_PURCHASE);
    expect(calculateOrderPricing("first_purchase", 2).total).toBe(FIRST_PURCHASE * 2);
  });

  it("calculates refill totals", () => {
    expect(calculateOrderPricing("refill", 1).total).toBe(REFILL);
    expect(calculateOrderPricing("refill", 3).total).toBe(REFILL * 3);
  });

  it("supports backend-provided public pricing settings", () => {
    const settingsCatalog = {
      ...productCatalog,
      refill: {
        ...productCatalog.refill,
        unitPrice: 4500
      }
    };

    expect(calculateOrderPricing("refill", 2, [], settingsCatalog).total).toBe(9000);
  });

  it("rejects invalid quantities", () => {
    expect(() => calculateOrderPricing("refill", 0)).toThrow();
    expect(() => calculateOrderPricing("first_purchase", 1.5)).toThrow();
  });

  it("stores the correct image for each order type", () => {
    expect(productCatalog.first_purchase.image).toBeDefined();
    expect(productCatalog.refill.image).toBeDefined();
    expect(productCatalog.first_purchase.image).not.toBe(productCatalog.refill.image);
  });
});