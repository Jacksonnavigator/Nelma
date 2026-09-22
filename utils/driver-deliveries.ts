import type { ApiError } from "../types/api";
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

export const isDeliveryToday = (order: Order, todayKey = currentDateKey()): boolean => deliveryDateKey(order) === todayKey;

export const isUpcomingDelivery = (order: Order, todayKey = currentDateKey()): boolean => deliveryDateKey(order) > todayKey;

export const isDriverAssignedStage = (status: OrderStatus): boolean => assignedStatuses.includes(status);

export const isDriverActiveDelivery = (order: Order): boolean => activeStatuses.includes(order.status) && !order.customerReceivedAt;

export const isDriverHistoryDelivery = (order: Order): boolean => order.status === "delivered" || order.status === "received" || order.status === "cancelled" || Boolean(order.customerReceivedAt);

export const canStartDelivery = (order: Order): boolean => Boolean(order.assignedDriverId) && isDriverAssignedStage(order.status) && !order.customerReceivedAt;

export const canMarkDelivered = (order: Order): boolean => order.status === "out_for_delivery";

export const driverActionHint = (order: Order): string => {
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

// Keep work already in progress first. Do not hide overdue or future assignments.
export const driverDeliveryQueue = (orders: Order[]): Order[] => {
  const priority = (order: Order): number => {
    if (order.status === "out_for_delivery") return 0;
    return 1;
  };
  return sortDriverDeliveries(orders.filter(isDriverActiveDelivery))
    .sort((first, second) => priority(first) - priority(second));
};
