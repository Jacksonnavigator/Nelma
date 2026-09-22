import { describe, expect, it } from "vitest";
import { REFILL } from "../constants/pricing";
import { buildOrderTimeline, filterOrders, isActiveOrderStatus } from "../utils/order";
import { isTerminalPaymentStatus, orderStatusLabel, paymentStatusLabel } from "../utils/status";
import type { Order } from "../types/order";

const baseOrder: Order = {
  id: "order_1",
  orderNumber: "NELMA-1",
  customerId: "user_1",
  createdAt: "2026-08-28T00:00:00.000Z",
  updatedAt: "2026-08-28T00:00:00.000Z",
  orderType: "refill",
  items: [{ productName: "20L Drinking Water", orderType: "refill", quantity: 1, unitPrice: REFILL, subtotal: REFILL }],
  quantity: 1,
  deliveryAddress: {
    deliveryAddress: "House 24, Main Road",
    area: "Sinza",
    phone: "+255 700 000 000",
    deliveryInstructions: undefined,
    latitude: null,
    longitude: null
  },
  subtotal: REFILL,
  charges: [],
  total: REFILL,
  currency: "TZS",
  status: "processing",
  paymentStatus: "processing",
  payment: null,
  timeline: [],
  availableActions: ["reorder"]
};

describe("order and payment statuses", () => {
  it("labels all important statuses", () => {
    expect(orderStatusLabel("out_for_delivery")).toBe("Out for Delivery");
    expect(paymentStatusLabel("refunded")).toBe("Refunded");
  });

  it("knows active and terminal states", () => {
    expect(isActiveOrderStatus("processing")).toBe(true);
    expect(isActiveOrderStatus("delivered")).toBe(false);
    expect(isTerminalPaymentStatus("paid")).toBe(true);
    expect(isTerminalPaymentStatus("processing")).toBe(false);
  });

  it("builds a tracking timeline", () => {
    const timeline = buildOrderTimeline("processing", "2026-08-28T00:00:00.000Z");
    expect(timeline.find((item) => item.status === "processing")?.completedAt).toBeTruthy();
    expect(timeline.find((item) => item.status === "out_for_delivery")?.completedAt).toBeNull();
  });

  it("filters order history", () => {
    const delivered: Order = { ...baseOrder, id: "order_2", status: "delivered" };
    const cancelled: Order = { ...baseOrder, id: "order_3", status: "cancelled" };
    expect(filterOrders([baseOrder, delivered, cancelled], "active")).toHaveLength(1);
    expect(filterOrders([baseOrder, delivered, cancelled], "completed")).toHaveLength(1);
    expect(filterOrders([baseOrder, delivered, cancelled], "cancelled")).toHaveLength(1);
  });
});
