import { appConfig } from "../../config/app";
import { buildDeliverySchedule, calculateDeliveryQuote, chargesForDeliveryQuote } from "../../utils/delivery";
import { calculateOrderPricing, buildOrderTimeline } from "../../utils/order";
import type { DeliveryAddress, SavedAddress } from "../../types/address";
import type { CustomerRecord } from "../../types/business";
import type { Notification } from "../../types/notification";
import type { Order, OrderMessage } from "../../types/order";
import type { PaymentMethod } from "../../types/payment";
import type { User } from "../../types/user";

const now = new Date("2026-09-01T08:15:00.000Z").toISOString();
const yesterday = new Date("2026-08-31T12:30:00.000Z").toISOString();
const previous = new Date("2026-08-20T08:00:00.000Z").toISOString();

export const mockUser: User = {
  id: "user_001",
  fullName: "Jackson Mrema",
  phone: "+255 700 000 000",
  email: "jackson@example.com",
  avatarUrl: null,
  role: "USER",
  preferredLanguage: "en",
  addressLocationPreference: "single",
  notificationPreferences: {
    orderUpdates: true,
    paymentUpdates: true,
    promotions: false,
    systemAnnouncements: true
  },
  createdAt: previous
};

export const mockSavedAddresses: SavedAddress[] = [];

const mockOrderAddress: DeliveryAddress = {
  deliveryAddress: "Block C residences, Nelson Mandela African Institute of Science and Technology",
  area: "NM-AIST",
  phone: "+255 700 000 000",
  deliveryInstructions: "Call when you reach the campus gate.",
  latitude: -3.3996,
  longitude: 36.7959
};

export const mockCustomers: CustomerRecord[] = [
  {
    id: mockUser.id,
    fullName: mockUser.fullName,
    phone: mockUser.phone,
    email: mockUser.email ?? "",
    preferredLanguage: mockUser.preferredLanguage,
    addressLocationPreference: mockUser.addressLocationPreference,
    primaryArea: mockOrderAddress.area,
    totalOrders: 2,
    totalSpend: 26000,
    lastOrderAt: now,
    createdAt: mockUser.createdAt,
    updatedAt: now
  }
];

export const mockPaymentMethods: PaymentMethod[] = [
  {
    id: "mobile_money",
    type: "mobile_money",
    label: "Mobile Money",
    description: "Initialize payment through the NELMA backend and supported provider.",
    enabled: true,
    requiresCustomerAction: true
  },
  {
    id: "cash",
    type: "cash",
    label: "Cash",
    description: "Available only when enabled by NELMA in the backend configuration.",
    enabled: true,
    requiresCustomerAction: false
  }
];

const makeOrderMessage = (orderId: string, body: string, createdAt: string): OrderMessage => ({
  id: "message_" + orderId,
  orderId,
  sender: "customer",
  body,
  createdAt
});

const makeOrder = (overrides: Pick<Order, "id" | "orderNumber" | "orderType" | "quantity" | "status" | "paymentStatus" | "createdAt" | "updatedAt"> & { remarks?: string }): Order => {
  const charges = chargesForDeliveryQuote(calculateDeliveryQuote(mockOrderAddress));
  const pricing = calculateOrderPricing(overrides.orderType, overrides.quantity, charges);
  const schedule = buildDeliverySchedule(overrides.createdAt.slice(0, 10), overrides.status === "processing" ? "afternoon" : "morning");
  const remarks = overrides.remarks ?? "Please call when the rider reaches the campus gate.";
  return {
    ...overrides,
    customerId: mockUser.id,
    customerName: mockUser.fullName,
    customerPhone: mockUser.phone,
    createdByUserId: mockUser.id,
    source: "USER_MOBILE",
    assignedDriverId: null,
    items: [
      {
        productName: pricing.orderType === "first_purchase" ? "20L Water + New Container" : "20L Drinking Water",
        orderType: pricing.orderType,
        quantity: pricing.quantity,
        unitPrice: pricing.unitPrice,
        subtotal: pricing.subtotal
      }
    ],
    deliveryAddress: mockOrderAddress,
    deliverySchedule: schedule,
    customerRemarks: remarks,
    customerReceivedAt: null,
    customerReceivedByUserId: null,
    messages: [makeOrderMessage(overrides.id, remarks, overrides.createdAt)],
    subtotal: pricing.subtotal,
    charges: pricing.charges,
    total: pricing.total,
    currency: appConfig.currency,
    payment: null,
    timeline: buildOrderTimeline(overrides.status, overrides.updatedAt),
    availableActions: overrides.status === "cancelled"
      ? ["contact_support", "message_nelma"]
      : (["reorder", "contact_support", "message_nelma"].concat(overrides.status === "delivered" ? ["mark_received"] : overrides.status === "pending" ? ["cancel"] : []) as Order["availableActions"])
  };
};

export const mockOrders: Order[] = [
  makeOrder({
    id: "order_10001",
    orderNumber: "NELMA-10001",
    orderType: "refill",
    quantity: 2,
    status: "processing",
    paymentStatus: "processing",
    createdAt: now,
    updatedAt: now
  }),
  makeOrder({
    id: "order_10000",
    orderNumber: "NELMA-10000",
    orderType: "first_purchase",
    quantity: 1,
    status: "delivered",
    paymentStatus: "paid",
    createdAt: previous,
    updatedAt: yesterday
  })
];

export const mockNotifications: Notification[] = [
  {
    id: "notification_001",
    type: "order_processing",
    title: "Order processing",
    body: "Your NELMA order is being prepared for delivery to " + mockOrderAddress.area + ".",
    read: false,
    createdAt: now,
    orderId: "order_10001"
  },
  {
    id: "notification_002",
    type: "payment_successful",
    title: "Payment update",
    body: "Payment for order NELMA-10000 was recorded successfully.",
    read: true,
    createdAt: yesterday,
    orderId: "order_10000"
  }
];



