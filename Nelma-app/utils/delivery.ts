import type { DeliveryAddress } from "../types/address";
import type { DeliverySchedule, DeliverySlotId, OrderCharge } from "../types/order";
import type { DeliveryConfig } from "../types/settings";

export type DeliveryDateOption = {
  date: string;
  label: string;
  helper: string;
};

export type DeliverySlotOption = {
  id: DeliverySlotId;
  /** Short chip text: "Soonest" or the window itself. */
  chip: string;
  label: string;
  window: string;
};

export type DeliveryQuote = {
  zoneId: string;
  zoneName: string;
  charge: OrderCharge;
};

/** Used until the settings arrive, and with backends that do not send them. Matches the server defaults: free delivery. */
export const defaultDeliveryConfig: DeliveryConfig = {
  timeWindows: ["09:00 - 12:00", "12:00 - 16:00", "16:00 - 19:00"],
  zones: [
    { id: "nmaist", name: "NM-AIST campus", fee: 0, keywords: ["nm-aist", "nmaist", "nelson mandela"] },
    { id: "tengeru", name: "Tengeru", fee: 0, keywords: ["tengeru"] }
  ],
  defaultZoneName: "Arusha",
  defaultFee: 0
};

const ASAP: DeliverySlotOption = { id: "asap", chip: "Soonest", label: "As soon as possible", window: "Next available delivery" };

// "09:00 - 12:00" reads as Morning, so labels stay friendly whatever windows staff configure.
const periodFor = (window: string): string => {
  const hour = Number(window.match(/(\d{1,2})[:.]\d{2}/)?.[1] ?? NaN);
  if (Number.isNaN(hour)) return "Scheduled";
  if (hour < 12) return "Morning";
  if (hour < 16) return "Afternoon";
  return "Evening";
};

export const deliverySlotsFor = (config: DeliveryConfig = defaultDeliveryConfig): DeliverySlotOption[] => [
  ASAP,
  ...config.timeWindows.map((window, index) => ({ id: `window_${index}`, chip: window, label: periodFor(window), window }))
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

export const buildDeliverySchedule = (date: string, slot: DeliverySlotId, config: DeliveryConfig = defaultDeliveryConfig): DeliverySchedule => {
  const slots = deliverySlotsFor(config);
  const option = slots.find((item) => item.id === slot) ?? ASAP;
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

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Whole words only, the same rule the server uses, so the price shown is the price charged.
const mentions = (text: string, keyword: string): boolean =>
  new RegExp(`(?<![a-z0-9])${escapeRegExp(keyword.toLowerCase())}(?![a-z0-9])`).test(text);

export const calculateDeliveryQuote = (address?: DeliveryAddress, config: DeliveryConfig = defaultDeliveryConfig): DeliveryQuote => {
  const text = `${address?.area ?? ""} ${address?.deliveryAddress ?? ""}`.toLowerCase();
  const zone = config.zones.find((item) => item.keywords.some((keyword) => mentions(text, keyword)));
  const id = zone ? zone.id : "default";
  const name = zone ? zone.name : config.defaultZoneName;
  const amount = zone ? zone.fee : config.defaultFee;
  return { zoneId: id, zoneName: name, charge: { id: `delivery_${id}`, label: `Delivery fee - ${name}`, amount } };
};

export const chargesForDeliveryQuote = (quote: DeliveryQuote): OrderCharge[] => {
  return quote.charge.amount > 0 ? [quote.charge] : [];
};
