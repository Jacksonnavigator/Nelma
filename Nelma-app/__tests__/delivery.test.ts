import { describe, expect, it } from "vitest";
import type { DeliveryAddress } from "../types/address";
import { buildDeliverySchedule, calculateDeliveryQuote, chargesForDeliveryQuote, deliverySlotsFor } from "../utils/delivery";

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

    expect(quote.zoneId).toBe("default");
    expect(quote.zoneName).toBe("Arusha");
    expect(quote.charge.amount).toBe(1500);
  });

  it("does not give the campus rate to any address that says hostel", () => {
    expect(calculateDeliveryQuote(address("Arusha", "Kijenge hostel block C")).charge.amount).toBe(1500);
  });

  it("uses the zones and fees set in the dashboard", () => {
    const config = { timeWindows: ["08:00 - 10:00"], zones: [{ id: "njiro", name: "Njiro", fee: 700, keywords: ["njiro"] }], defaultZoneName: "Town", defaultFee: 2000 };
    expect(calculateDeliveryQuote(address("Arusha", "Njiro complex 4A"), config).charge).toEqual({ id: "delivery_njiro", label: "Delivery fee - Njiro", amount: 700 });
    expect(calculateDeliveryQuote(address("Tengeru"), config).charge.amount).toBe(2000);
    expect(deliverySlotsFor(config).map((slot) => slot.id)).toEqual(["asap", "window_0"]);
  });

  it("builds a customer-selected delivery time", () => {
    const schedule = buildDeliverySchedule("2026-09-01", "window_0");

    expect(schedule).toMatchObject({
      date: "2026-09-01",
      slot: "window_0",
      label: "2026-09-01, Morning",
      window: "09:00 - 12:00"
    });
  });
});
