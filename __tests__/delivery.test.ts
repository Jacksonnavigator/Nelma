import { describe, expect, it } from "vitest";
import type { DeliveryAddress } from "../types/address";
import { buildDeliverySchedule, calculateDeliveryQuote, chargesForDeliveryQuote } from "../utils/delivery";

const address = (area: string, deliveryAddress = "Block A"): DeliveryAddress => ({
  area,
  deliveryAddress,
  phone: "+255 700 000 000",
  deliveryInstructions: undefined,
  latitude: null,
  longitude: null
});

describe("delivery scheduling and charges", () => {
  it("keeps NM-AIST priority deliveries free", () => {
    const quote = calculateDeliveryQuote(address("NM-AIST", "Nelson Mandela campus"));

    expect(quote.zoneId).toBe("nmaist");
    expect(quote.charge.amount).toBe(0);
    expect(chargesForDeliveryQuote(quote)).toEqual([]);
  });

  it("charges the nearby Tengeru zone", () => {
    const quote = calculateDeliveryQuote(address("Tengeru"));

    expect(quote.zoneId).toBe("tengeru");
    expect(quote.charge.amount).toBe(1000);
    expect(chargesForDeliveryQuote(quote)).toHaveLength(1);
  });

  it("uses the standard Arusha fee outside named priority zones", () => {
    const quote = calculateDeliveryQuote(address("Sakina"));

    expect(quote.zoneId).toBe("arusha");
    expect(quote.charge.amount).toBe(1500);
  });

  it("builds a customer-selected delivery time", () => {
    const schedule = buildDeliverySchedule("2026-09-01", "morning");

    expect(schedule).toMatchObject({
      date: "2026-09-01",
      slot: "morning",
      window: "09:00 - 12:00"
    });
  });
});
