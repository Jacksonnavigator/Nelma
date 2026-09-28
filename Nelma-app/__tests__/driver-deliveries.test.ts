import { describe, expect, it } from "vitest";
import { REFILL } from "../constants/pricing";
import type { Order } from "../types/order";
import { driverDeliveryQueue, buildExternalMapUrl, canMarkDelivered, canStartDelivery, filterDriverDeliveries, filterDriverHistory, isDriverActiveDelivery, isDriverHistoryDelivery } from "../utils/driver-deliveries";
import { mobileLandingForUser } from "../utils/role-routing";
import { driverDeliveryStatusLabel } from "../utils/status";

const baseOrder: Order = {
  id: "order_1",
  orderNumber: "NELMA-1",
  customerId: "customer_1",
  customerName: "Asha Mrema",
  customerPhone: "+255700000000",
  createdByUserId: "customer_1",
  source: "USER_MOBILE",
  assignedDriverId: "driver_1",
  createdAt: "2026-09-03T08:00:00.000Z",
  updatedAt: "2026-09-03T08:00:00.000Z",
  orderType: "refill",
  items: [{ productName: "20L Drinking Water", orderType: "refill", quantity: 2, unitPrice: REFILL, subtotal: REFILL * 2 }],
  quantity: 2,
  deliveryAddress: {
    deliveryAddress: "NM-AIST Block C",
    area: "NM-AIST",
    phone: "+255700000000",
    deliveryInstructions: "Call on arrival",
    latitude: -3.3996,
    longitude: 36.7959
  },
  deliverySchedule: {
    date: "2026-09-03",
    slot: "afternoon",
    label: "Today, Afternoon",
    window: "13:00 - 16:00"
  },
  customerRemarks: "Bring two refills",
  customerReceivedAt: null,
  customerReceivedByUserId: null,
  messages: [],
  subtotal: REFILL * 2,
  charges: [],
  total: REFILL * 2,
  currency: "TZS",
  status: "processing",
  paymentStatus: "paid",
  payment: null,
  timeline: [],
  availableActions: ["contact_support", "message_nelma"]
};

const orderWith = (overrides: Partial<Order>): Order => ({ ...baseOrder, ...overrides });

describe("driver mobile delivery helpers", () => {
  it("routes mobile roles to their own landing surfaces", () => {
    expect(mobileLandingForUser({ role: "DRIVER" })).toBe("/driver/(tabs)/deliveries");
    expect(mobileLandingForUser({ role: "USER" })).toBe("/(tabs)/home");
  });

  it("keeps driver transitions in backend order", () => {
    expect(canStartDelivery(orderWith({ status: "pending" }))).toBe(true);
    expect(canStartDelivery(orderWith({ status: "confirmed" }))).toBe(true);
    expect(canStartDelivery(orderWith({ status: "processing" }))).toBe(true);
    expect(canStartDelivery(orderWith({ assignedDriverId: null }))).toBe(false);
    for (const status of ["out_for_delivery", "delivered", "received", "cancelled"] as const) {
      expect(canStartDelivery(orderWith({ status }))).toBe(false);
    }
    expect(canMarkDelivered(orderWith({ status: "processing" }))).toBe(false);
    expect(canMarkDelivered(orderWith({ status: "out_for_delivery" }))).toBe(true);
  });

  it("labels assigned work without changing the underlying order status", () => {
    expect(driverDeliveryStatusLabel("pending")).toBe("Ready to start");
    expect(driverDeliveryStatusLabel("confirmed")).toBe("Ready to start");
    expect(driverDeliveryStatusLabel("processing")).toBe("Ready to start");
    expect(driverDeliveryStatusLabel("received")).toBe("Customer Received");
  });

  it("filters current driver assignments by group, status, and search", () => {
    const upcoming = orderWith({ id: "order_2", status: "out_for_delivery", deliverySchedule: { ...baseOrder.deliverySchedule!, date: "2026-09-05", label: "Saturday, Afternoon" } });
    const received = orderWith({ id: "order_3", status: "received", customerReceivedAt: "2026-09-03T14:00:00.000Z" });

    expect(filterDriverDeliveries([baseOrder, upcoming, received], { group: "today", status: "assigned" }, "2026-09-03")).toEqual([baseOrder]);
    expect(filterDriverDeliveries([baseOrder, upcoming, received], { group: "upcoming", status: "out_for_delivery" }, "2026-09-03")).toEqual([upcoming]);
    expect(filterDriverDeliveries([baseOrder, upcoming], { group: "all", status: "all", search: "asha" }, "2026-09-03")).toEqual([baseOrder, upcoming]);
  });

  it("separates active deliveries from closed driver history", () => {
    const delivered = orderWith({ id: "order_2", status: "delivered" });
    const received = orderWith({ id: "order_3", status: "received", customerReceivedAt: "2026-09-03T14:00:00.000Z" });

    expect(isDriverActiveDelivery(delivered)).toBe(false);
    expect(isDriverHistoryDelivery(delivered)).toBe(true);
    expect(isDriverHistoryDelivery(received)).toBe(true);
    expect(filterDriverHistory([baseOrder, delivered, received], "NM-AIST", "today", "2026-09-03")).toEqual([delivered, received]);
  });

  it("builds external map links only when coordinates exist", () => {
    expect(buildExternalMapUrl(-3.3996, 36.7959, "android", "NM-AIST")).toContain("geo:-3.3996,36.7959");
    expect(buildExternalMapUrl(null, 36.7959)).toBeNull();
  });
});

describe("driver delivery queue", () => {
  it("continues an active trip and moves delivered work to history", () => {
    const travelling = orderWith({ id: "trip", status: "out_for_delivery" });
    const handedOver = orderWith({ id: "receipt", status: "delivered" });
    const assigned = orderWith({ id: "assigned", status: "confirmed", deliverySchedule: { ...baseOrder.deliverySchedule!, date: "2026-09-02" } });
    expect(driverDeliveryQueue([baseOrder, assigned, handedOver, travelling]).map((order) => order.id))
      .toEqual(["trip", "assigned", "order_1"]);
  });

  it("retains overdue and future assignments and excludes closed work", () => {
    const future = orderWith({ id: "future", deliverySchedule: { ...baseOrder.deliverySchedule!, date: "2027-01-01" } });
    const closed = orderWith({ id: "closed", status: "received" });
    const cancelled = orderWith({ id: "cancelled", status: "cancelled" });
    const orders = [future, closed, baseOrder, cancelled];
    expect(driverDeliveryQueue(orders).map((order) => order.id)).toEqual(["order_1", "future"]);
    expect(orders[0]).toBe(future);
  });
});
