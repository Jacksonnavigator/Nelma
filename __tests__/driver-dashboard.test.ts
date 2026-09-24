import { describe, expect, it } from "vitest";
import { REFILL } from "../constants/pricing";
import type { Order } from "../types/order";
import { cashDueAmount, deliveryStepIndex, driverDayStats, driverHistoryStats } from "../utils/driver-deliveries";

const baseOrder: Order = {
  id: "order_1",
  orderNumber: "NELMA-1",
  customerId: "customer_1",
  customerName: "Asha Mrema",
  customerPhone: "+255700000000",
  assignedDriverId: "driver_1",
  createdAt: "2026-09-03T08:00:00.000Z",
  updatedAt: "2026-09-03T08:00:00.000Z",
  orderType: "refill",
  items: [{ productName: "20L Drinking Water", orderType: "refill", quantity: 2, unitPrice: REFILL, subtotal: REFILL * 2 }],
  quantity: 2,
  deliveryAddress: { deliveryAddress: "NM-AIST Block C", area: "NM-AIST", phone: "+255700000000" },
  deliverySchedule: { date: "2026-09-03", slot: "afternoon", label: "Today, Afternoon", window: "13:00 - 16:00" },
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

describe("driver dashboard helpers", () => {
  const today = "2026-09-03";

  it("only asks for payment that has not been made", () => {
    expect(cashDueAmount(orderWith({ paymentStatus: "paid" }))).toBe(0);
    expect(cashDueAmount(orderWith({ paymentStatus: "pending" }))).toBe(REFILL * 2);
    expect(cashDueAmount(orderWith({ paymentStatus: "pending", status: "cancelled" }))).toBe(0);
  });

  it("summarises today's work for the driver", () => {
    const stats = driverDayStats(
      [
        orderWith({ id: "a", status: "processing", paymentStatus: "pending" }),
        orderWith({ id: "b", status: "out_for_delivery", quantity: 3 }),
        orderWith({ id: "c", status: "received", customerReceivedAt: "2026-09-03T10:00:00.000Z" }),
        orderWith({ id: "d", status: "cancelled", updatedAt: "2026-09-03T10:00:00.000Z" })
      ],
      today
    );
    expect(stats).toMatchObject({ remaining: 2, inProgress: 1, completedToday: 1, totalToday: 3, bottlesToDeliver: 5, cashToCollect: REFILL * 2 });
  });

  it("totals completed history without counting cancelled orders", () => {
    const stats = driverHistoryStats(
      [
        orderWith({ id: "a", status: "delivered", updatedAt: "2026-09-02T10:00:00.000Z" }),
        orderWith({ id: "b", status: "received", customerReceivedAt: "2026-08-01T10:00:00.000Z", quantity: 4 }),
        orderWith({ id: "c", status: "cancelled" })
      ],
      today
    );
    expect(stats).toEqual({ deliveries: 2, bottles: 6, thisWeek: 1 });
  });

  it("maps delivery status to a progress step", () => {
    expect(deliveryStepIndex(orderWith({ status: "processing" }))).toBe(0);
    expect(deliveryStepIndex(orderWith({ status: "out_for_delivery" }))).toBe(1);
    expect(deliveryStepIndex(orderWith({ status: "delivered" }))).toBe(2);
    expect(deliveryStepIndex(orderWith({ status: "delivered", customerReceivedAt: "2026-09-03T10:00:00.000Z" }))).toBe(3);
  });
});
