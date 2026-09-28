import { describe, expect, it } from "vitest";
import { emptyDeliveryAddress, hasCoordinates, normalizeDeliveryAddress, savedAddressToDeliveryAddress } from "../utils/address";
import { hasErrors, validateDeliveryAddress, validateSavedAddress } from "../utils/validation";
import type { SavedAddress } from "../types/address";

describe("delivery address", () => {
  it("validates required manual address fields", () => {
    const address = {
      deliveryAddress: "Block C residences, NM-AIST",
      area: "NM-AIST",
      phone: "+255 700 000 000",
      deliveryInstructions: "Call on arrival.",
      latitude: null,
      longitude: null
    };

    expect(hasErrors(validateDeliveryAddress(address))).toBe(false);
  });

  it("keeps GPS optional", () => {
    const address = emptyDeliveryAddress("+255 700 000 000");
    const ready = {
      ...address,
      deliveryAddress: "Tengeru market road",
      area: "Tengeru",
    };

    expect(hasCoordinates(ready)).toBe(false);
    expect(hasErrors(validateDeliveryAddress(ready))).toBe(false);
  });

  it("validates coordinate ranges when GPS is attached", () => {
    const errors = validateDeliveryAddress({
      deliveryAddress: "Block C residences, NM-AIST",
      area: "NM-AIST",
      phone: "+255 700 000 000",
      latitude: -120,
      longitude: 39
    });

    expect(errors.latitude).toBeTruthy();
  });

  it("normalizes saved addresses without removed fields", () => {
    const saved: SavedAddress = {
      id: "address_1",
      label: "Hostel",
      deliveryAddress: "  Block C residences  ",
      area: " NM-AIST ",
      phone: " +255 700 000 000 ",
      deliveryInstructions: " Ring twice ",
      latitude: -3.3996,
      longitude: 36.7959,
      createdAt: "2026-08-28T00:00:00.000Z",
      updatedAt: "2026-08-28T00:00:00.000Z"
    };

    const normalized = savedAddressToDeliveryAddress(saved);
    expect(normalized.deliveryAddress).toBe("Block C residences");
    expect(hasCoordinates(normalized)).toBe(true);
    expect(Object.keys(normalizeDeliveryAddress(normalized)).sort()).toEqual(["area", "deliveryAddress", "deliveryInstructions", "latitude", "longitude", "phone"].sort());
  });

  it("requires a label for saved addresses", () => {
    const errors = validateSavedAddress({
      label: "",
      deliveryAddress: "Block C residences",
      area: "NM-AIST",
      phone: "+255 700 000 000",
      latitude: null,
      longitude: null
    });

    expect(errors.label).toBeTruthy();
  });
});
