import type { Order } from "../../types/order";
import { REFILL } from "../../constants/pricing";

export const baseOrder: Order = {
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
