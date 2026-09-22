import type { DeliveryAddress } from "../types/address";
import type { DeliverySchedule, DeliverySlotId, OrderCharge } from "../types/order";

export type DeliveryDateOption = {
  date: string;
  label: string;
  helper: string;
};

export type DeliverySlotOption = {
  id: DeliverySlotId;
  label: string;
  window: string;
};

export type DeliveryZoneId = "nmaist" | "tengeru" | "arusha";

export type DeliveryQuote = {
  zoneId: DeliveryZoneId;
  zoneName: string;
  charge: OrderCharge;
  helper: string;
};

const arushaBounds = {
  north: -3.28,
  south: -3.48,
  west: 36.56,
  east: 36.9
};

export const deliverySlots: DeliverySlotOption[] = [
  { id: "asap", label: "As soon as possible", window: "Next available delivery" },
  { id: "morning", label: "Morning", window: "09:00 - 12:00" },
  { id: "afternoon", label: "Afternoon", window: "12:00 - 16:00" },
  { id: "evening", label: "Evening", window: "16:00 - 19:00" }
];

const formatDateValue = (date: Date): string => date.toISOString().slice(0, 10);

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const formatShortDate = (date: Date): string => new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);

export const getDeliveryDateOptions = (baseDate = new Date()): DeliveryDateOption[] => [
  { date: formatDateValue(baseDate), label: "Today", helper: formatShortDate(baseDate) },
  { date: formatDateValue(addDays(baseDate, 1)), label: "Tomorrow", helper: formatShortDate(addDays(baseDate, 1)) },
  { date: formatDateValue(addDays(baseDate, 2)), label: "Next day", helper: formatShortDate(addDays(baseDate, 2)) }
];

export const buildDeliverySchedule = (date: string, slot: DeliverySlotId): DeliverySchedule => {
  const option = deliverySlots.find((item) => item.id === slot) ?? deliverySlots[0];
  const dateOption = getDeliveryDateOptions().find((item) => item.date === date);
  return {
    date,
    slot: option.id,
    label: dateOption ? `${dateOption.label}, ${option.label}` : `${date}, ${option.label}`,
    window: option.window
  };
};

export const getDefaultDeliverySchedule = (): DeliverySchedule => {
  const firstDate = getDeliveryDateOptions()[0];
  return buildDeliverySchedule(firstDate.date, "asap");
};

export const calculateDeliveryQuote = (address?: DeliveryAddress): DeliveryQuote => {
  const text = `${address?.area ?? ""} ${address?.deliveryAddress ?? ""}`.toLowerCase();
  const latitude = address?.latitude;
  const longitude = address?.longitude;
  const hasCoordinate = typeof latitude === "number" && typeof longitude === "number";
  const insideArushaBounds = hasCoordinate
    ? latitude <= arushaBounds.north && latitude >= arushaBounds.south && longitude >= arushaBounds.west && longitude <= arushaBounds.east
    : false;

  if (text.includes("nm-aist") || text.includes("nmaist") || text.includes("nelson mandela") || text.includes("campus") || text.includes("hostel") || text.includes("phd")) {
    return {
      zoneId: "nmaist",
      zoneName: "NM-AIST campus",
      charge: { id: "delivery_nmaist", label: "Delivery fee - NM-AIST campus", amount: 0 },
      helper: "Free delivery for the current NM-AIST priority area."
    };
  }

  if (text.includes("tengeru")) {
    return {
      zoneId: "tengeru",
      zoneName: "Tengeru nearby area",
      charge: { id: "delivery_tengeru", label: "Delivery fee - Tengeru", amount: 1000 },
      helper: "Nearby Arusha delivery fee for Tengeru locations."
    };
  }

  return {
    zoneId: "arusha",
    zoneName: insideArushaBounds ? "Arusha mapped area" : "Arusha standard area",
    charge: { id: "delivery_arusha", label: "Delivery fee - Arusha", amount: 1500 },
    helper: "Standard Arusha delivery fee. NELMA currently serves Arusha and NM-AIST first."
  };
};

export const chargesForDeliveryQuote = (quote: DeliveryQuote): OrderCharge[] => {
  return quote.charge.amount > 0 ? [quote.charge] : [];
};
