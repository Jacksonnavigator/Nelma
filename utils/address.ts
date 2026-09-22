import type { DeliveryAddress, SavedAddress } from "../types/address";

export const emptyDeliveryAddress = (phone = ""): DeliveryAddress => ({
  deliveryAddress: "",
  area: "",
  phone,
  deliveryInstructions: "",
  latitude: null,
  longitude: null
});

export const normalizeDeliveryAddress = (input: DeliveryAddress): DeliveryAddress => ({
  deliveryAddress: input.deliveryAddress.trim(),
  area: input.area.trim(),
  phone: input.phone.trim(),
  deliveryInstructions: input.deliveryInstructions?.trim() || undefined,
  latitude: input.latitude ?? null,
  longitude: input.longitude ?? null
});

export const savedAddressToDeliveryAddress = (address: SavedAddress): DeliveryAddress => normalizeDeliveryAddress(address);

export const formatAddressSummary = (address: DeliveryAddress): string => {
  const parts = [address.area, address.deliveryAddress].filter(Boolean);
  return parts.join(" - ");
};

export const hasCoordinates = (address: DeliveryAddress): boolean => {
  return typeof address.latitude === "number" && typeof address.longitude === "number";
};
