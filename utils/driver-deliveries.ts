import type { ApiError } from "../types/api";
import type { DriverPeriodStats, DriverSummary } from "../types/driver";
import type { DriverDeliveryGroupFilter, DriverDeliveryStatusFilter, Order, OrderStatus } from "../types/order";
import { driverDeliveryStatusLabel } from "./status";

export type DriverDeliveryFilters = {
  group?: DriverDeliveryGroupFilter;
  status?: DriverDeliveryStatusFilter;
  search?: string;
  date?: string;
};

export type DriverHistoryDateFilter = "all" | "today" | "week";

const assignedStatuses: OrderStatus[] = ["pending", "confirmed", "processing"];
const activeStatuses: OrderStatus[] = ["pending", "confirmed", "processing", "out_for_delivery"];

export const primaryOrderItem = (order: Order) => order.items[0] ?? null;

export const customerDisplayName = (order: Order): string => order.customerName?.trim() || "NELMA Customer";

export const customerContactPhone = (order: Order): string | null => order.customerPhone?.trim() || order.deliveryAddress.phone?.trim() || null;

export const productSummary = (order: Order): string => {
  const item = primaryOrderItem(order);
  const name = item?.productName ?? "20L Drinking Water";
  return String(order.quantity || item?.quantity || 1) + " x " + name;
};

export const deliveryAreaLine = (order: Order): string => {
  return order.deliveryAddress.area || "Arusha";
};

export const deliveryAddressLine = (order: Order): string => {
  return order.deliveryAddress.deliveryAddress || deliveryAreaLine(order);
};

export const deliveryDateKey = (order: Order): string => {
  return order.deliverySchedule?.date ?? order.createdAt.slice(0, 10);
};

export const deliveryTimeLabel = (order: Order): string => {
  if (!order.deliverySchedule) {
    return "No delivery time set";
  }
  return order.deliverySchedule.label + " - " + order.deliverySchedule.window;
};

export const closedTimeLabel = (order: Order): string => order.customerReceivedAt ?? order.updatedAt;

export const currentDateKey = (now = new Date()): string => {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
};

// Local calendar day of an ISO timestamp, so late-night deliveries land on the right day.
export const localDayKey = (iso: string): string => currentDateKey(new Date(iso));

export const isDeliveryToday =(order: Order, todayKey = currentDateKey()): boolean => deliveryDateKey(order) === todayKey;

export const isUpcomingDelivery = (order: Order, todayKey = currentDateKey()): boolean => deliveryDateKey(order) > todayKey;

export const isDriverAssignedStage = (status: OrderStatus): boolean => assignedStatuses.includes(status);

export const isDriverActiveDelivery = (order: Order): boolean => activeStatuses.includes(order.status) && !order.customerReceivedAt;

export const isDriverHistoryDelivery = (order: Order): boolean => order.status === "delivered" || order.status === "received" || order.status === "cancelled" || Boolean(order.customerReceivedAt);

export const canStartDelivery = (order: Order): boolean => Boolean(order.assignedDriverId) && isDriverAssignedStage(order.status) && !order.customerReceivedAt;

export const canMarkDelivered = (order: Order): boolean => order.status === "out_for_delivery";

// Strict null: older backends omit the field entirely, and those stops need no acknowledgement.
export const needsAcceptance = (order: Order): boolean => canStartDelivery(order) && order.driverAcceptedAt === null;

export const driverActionHint = (order: Order): string => {
  if (needsAcceptance(order)) {
    return "Accept this stop so dispatch knows you have it, or hand it back if you cannot take it.";
  }
  if (canStartDelivery(order)) {
    return "Collect the water, then tap Start Delivery when you leave.";
  }
  if (order.status === "out_for_delivery") {
    return "Go to the customer. Tap Mark Delivered after handing over the water.";
  }
  if (order.status === "delivered" && !order.customerReceivedAt) {
    return "Delivery marked complete. The customer confirms receipt in their order details. You can continue to your next delivery.";
  }
  if (order.status === "received" || order.customerReceivedAt) {
    return "Customer receipt confirmed.";
  }
  return driverDeliveryStatusLabel(order.status);
};

export const hasDeliveryCoordinates = (order: Order): boolean => {
  return typeof order.deliveryAddress.latitude === "number" && typeof order.deliveryAddress.longitude === "number";
};

export const buildExternalMapUrl = (
  latitude?: number | null,
  longitude?: number | null,
  platform: "ios" | "android" | "web" | "windows" | "macos" = "web",
  label = "NELMA delivery location"
): string | null => {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return null;
  }
  const query = latitude + "," + longitude;
  const encodedLabel = encodeURIComponent(label);
  if (platform === "ios") {
    return "http://maps.apple.com/?ll=" + query + "&q=" + encodedLabel;
  }
  if (platform === "android") {
    return "geo:" + query + "?q=" + query + "(" + encodedLabel + ")";
  }
  return "https://www.google.com/maps/search/?api=1&query=" + query;
};

export const isAssignmentLostError = (error: unknown): boolean => {
  const apiError = error as Partial<ApiError>;
  return apiError.status === 403 || apiError.status === 404 || apiError.code === "FORBIDDEN" || apiError.code === "NOT_FOUND" || apiError.code === "ORDER_NOT_FOUND";
};

const matchesStatusFilter = (order: Order, statusFilter: DriverDeliveryStatusFilter): boolean => {
  if (statusFilter === "all") {
    return true;
  }
  if (statusFilter === "assigned") {
    return isDriverAssignedStage(order.status);
  }
  return order.status === statusFilter;
};

const matchesGroupFilter = (order: Order, groupFilter: DriverDeliveryGroupFilter, todayKey: string): boolean => {
  if (groupFilter === "all") {
    return true;
  }
  if (groupFilter === "today") {
    return isDeliveryToday(order, todayKey);
  }
  return isUpcomingDelivery(order, todayKey);
};

export const filterDriverDeliveries = (orders: Order[], filters: DriverDeliveryFilters = {}, todayKey = currentDateKey()): Order[] => {
  const groupFilter = filters.group ?? "today";
  const statusFilter = filters.status ?? "all";
  const search = filters.search?.trim().toLowerCase();
  return orders.filter((order) => {
    if (filters.date && deliveryDateKey(order) !== filters.date) {
      return false;
    }
    if (!matchesGroupFilter(order, groupFilter, todayKey)) {
      return false;
    }
    if (!matchesStatusFilter(order, statusFilter)) {
      return false;
    }
    if (!search) {
      return true;
    }
    const haystack = [
      customerDisplayName(order),
      customerContactPhone(order) ?? "",
      productSummary(order),
      deliveryAreaLine(order),
      deliveryAddressLine(order),
      driverDeliveryStatusLabel(order.status)
    ].join(" ").toLowerCase();
    return haystack.includes(search);
  });
};

export const filterDriverHistory = (orders: Order[], search = "", dateFilter: DriverHistoryDateFilter = "all", todayKey = currentDateKey()): Order[] => {
  const startOfWeek = new Date(todayKey + "T00:00:00");
  startOfWeek.setDate(startOfWeek.getDate() - 6);
  const weekKey = currentDateKey(startOfWeek);
  const normalizedSearch = search.trim().toLowerCase();
  return orders.filter((order) => {
    if (!isDriverHistoryDelivery(order)) {
      return false;
    }
    const dateKey = deliveryDateKey(order);
    if (dateFilter === "today" && dateKey !== todayKey) {
      return false;
    }
    if (dateFilter === "week" && dateKey < weekKey) {
      return false;
    }
    if (!normalizedSearch) {
      return true;
    }
    const haystack = [customerDisplayName(order), productSummary(order), deliveryAreaLine(order), deliveryAddressLine(order)].join(" ").toLowerCase();
    return haystack.includes(normalizedSearch);
  });
};

export const sortDriverDeliveries = (orders: Order[]): Order[] => {
  return [...orders].sort((first, second) => {
    const firstSchedule = deliveryDateKey(first) + " " + (first.deliverySchedule?.window ?? "");
    const secondSchedule = deliveryDateKey(second) + " " + (second.deliverySchedule?.window ?? "");
    return firstSchedule.localeCompare(secondSchedule) || second.updatedAt.localeCompare(first.updatedAt);
  });
};

export const bottleCount = (order: Order): number => order.quantity || primaryOrderItem(order)?.quantity || 1;

export const cashDueAmount = (order: Order): number => {
  if (order.status === "cancelled" || order.paymentStatus === "paid" || order.paymentStatus === "refunded") return 0;
  if (order.paymentMethod && order.paymentMethod !== "cash") return 0; // Mobile money is settled online, not at the door.
  return order.total;
};

// True when the driver must collect the money themselves at handover.
export const needsCashConfirmation = (order: Order): boolean => order.paymentMethod === "cash" && order.paymentStatus === "pending" && order.status !== "cancelled";

export const isConnectionError = (error: unknown): boolean => {
  const code = (error as Partial<ApiError> | null)?.code;
  return code === "NETWORK_ERROR" || code === "TIMEOUT";
};

export type DriverDayStats = {
  remaining: number;
  inProgress: number;
  completedToday: number;
  totalToday: number;
  bottlesToDeliver: number;
  cashToCollect: number;
};

export const driverDayStats = (orders: Order[], todayKey = currentDateKey()): DriverDayStats => {
  const active = orders.filter(isDriverActiveDelivery);
  const completedToday = orders.filter((order) => isDriverHistoryDelivery(order) && order.status !== "cancelled" && localDayKey(closedTimeLabel(order)) === todayKey).length;
  return {
    remaining: active.length,
    inProgress: active.filter((order) => order.status === "out_for_delivery").length,
    completedToday,
    totalToday: completedToday + active.length,
    bottlesToDeliver: active.reduce((sum, order) => sum + bottleCount(order), 0),
    cashToCollect: active.reduce((sum, order) => sum + cashDueAmount(order), 0)
  };
};

export type DriverHistoryStats = { deliveries: number; bottles: number; thisWeek: number };

export const driverHistoryStats = (orders: Order[], todayKey = currentDateKey()): DriverHistoryStats => {
  const done = orders.filter((order) => isDriverHistoryDelivery(order) && order.status !== "cancelled");
  const weekStart = new Date(todayKey + "T00:00:00");
  weekStart.setDate(weekStart.getDate() - 6);
  const weekKey = currentDateKey(weekStart);
  return {
    deliveries: done.length,
    bottles: done.reduce((sum, order) => sum + bottleCount(order), 0),
    thisWeek: done.filter((order) => localDayKey(closedTimeLabel(order)) >= weekKey).length
  };
};

// Offline/mock equivalent of GET /driver/summary.
export const driverSummaryFromOrders = (orders: Order[], todayKey = currentDateKey()): DriverSummary => {
  const weekStart = new Date(todayKey + "T00:00:00");
  weekStart.setDate(weekStart.getDate() - 6);
  const weekKey = currentDateKey(weekStart);
  const monthKey = todayKey.slice(0, 8) + "01";
  const totals = (keep: (day: string) => boolean): DriverPeriodStats => {
    const done = orders.filter((order) => isDriverHistoryDelivery(order) && order.status !== "cancelled" && keep(localDayKey(closedTimeLabel(order))));
    return { deliveries: done.length, bottles: done.reduce((sum, order) => sum + bottleCount(order), 0), value: done.reduce((sum, order) => sum + order.total, 0) };
  };
  const closedPerDay = new Map<string, number>();
  for (const order of orders) {
    if (isDriverHistoryDelivery(order) && order.status !== "cancelled") {
      const key = localDayKey(closedTimeLabel(order));
      closedPerDay.set(key, (closedPerDay.get(key) ?? 0) + 1);
    }
  }
  const daily = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(todayKey + "T00:00:00");
    day.setDate(day.getDate() - (6 - index));
    const date = currentDateKey(day);
    return { date, deliveries: closedPerDay.get(date) ?? 0 };
  });
  return {
    activeDeliveries: orders.filter(isDriverActiveDelivery).length,
    daily,
    today: totals((day) => day === todayKey),
    week: totals((day) => day >= weekKey && day <= todayKey),
    month: totals((day) => day >= monthKey && day <= todayKey),
    allTime: totals(() => true)
  };
};

export const isDriverNotification = (notification: { type: string }): boolean => notification.type.startsWith("driver_") || notification.type === "system_announcement";

export type WeekPoint = { key: string; count: number; today: boolean };

// One point per day for the last seven days ending today (oldest first).
export const lastSevenDays = (orders: Order[], todayKey = currentDateKey()): WeekPoint[] => {
  const counts = new Map<string, number>();
  for (const order of orders) {
    if (!isDriverHistoryDelivery(order) || order.status === "cancelled") continue;
    const key = localDayKey(closedTimeLabel(order));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(todayKey + "T00:00:00");
    day.setDate(day.getDate() - (6 - index));
    const key = currentDateKey(day);
    return { key, count: counts.get(key) ?? 0, today: key === todayKey };
  });
};

export const deliveryWindowLabel = (order: Order): string => {
  const schedule = order.deliverySchedule;
  if (!schedule) return "Any time";
  return schedule.window || schedule.label || "Any time";
};

export type HistoryDay = { key: string; deliveries: number; bottles: number; data: Order[] };

// Newest day first; inside a day, the most recently closed delivery first.
export const groupHistoryByDay = (orders: Order[]): HistoryDay[] => {
  const days = new Map<string, HistoryDay>();
  const sorted = [...orders].sort((first, second) => closedTimeLabel(second).localeCompare(closedTimeLabel(first)));
  for (const order of sorted) {
    const key = localDayKey(closedTimeLabel(order));
    const day = days.get(key) ?? { key, deliveries: 0, bottles: 0, data: [] };
    day.data.push(order);
    if (order.status !== "cancelled") {
      day.deliveries += 1;
      day.bottles += bottleCount(order);
    }
    days.set(key, day);
  }
  return [...days.values()];
};

export const DELIVERY_STEPS = ["Assigned", "On the way", "Delivered", "Received"] as const;

// 0 = assigned, 1 = on the way, 2 = delivered (awaiting customer), 3 = received.
export const deliveryStepIndex = (order: Order): number => {
  if (order.status === "received" || order.customerReceivedAt) return 3;
  if (order.status === "delivered") return 2;
  if (order.status === "out_for_delivery") return 1;
  return 0;
};

// Keep work already in progress first. Do not hide overdue or future assignments.
export const driverDeliveryQueue = (orders: Order[]): Order[] => {
  const priority = (order: Order): number => {
    if (order.status === "out_for_delivery") return 0;
    return 1;
  };
  return sortDriverDeliveries(orders.filter(isDriverActiveDelivery))
    .sort((first, second) => priority(first) - priority(second));
};
