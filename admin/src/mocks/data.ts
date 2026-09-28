import type {
  ActivityEvent,
  AdminAccount,
  AppNotification,
  AuditEvent,
  Customer,
  Delivery,
  DeliveryStatus,
  Driver,
  Order,
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  PriceConfiguration,
  SystemSettings,
} from "@/types";
import { ORDER_LIFECYCLE, PRODUCT_LABELS, type BuiltInProduct } from "@/lib/format";

/**
 * Mock dataset for development/demo only.
 * Replaced wholesale by the FastAPI repositories — nothing here is persisted.
 */

export const PRICES: Record<BuiltInProduct, number> = {
  first_purchase: 18000,
  refill: 4000,
};

const day = 86_400_000;
const now = Date.now();

function iso(offsetMs: number): string {
  return new Date(now + offsetMs).toISOString();
}

function dayISO(offsetDays: number): string {
  const d = new Date(now + offsetDays * day);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

const AREAS = [
  { label: "Home", area: "Sinza", addressLine: "Sinza Mori, off Shekilango Road" },
  { label: "Home", area: "Mikocheni", addressLine: "Mikocheni B, Plot 118, Senga Road" },
  { label: "Office", area: "Mbezi", addressLine: "Mbezi Beach, Africana Road" },
  { label: "Home", area: "Kinondoni", addressLine: "Kinondoni Studio, Ali Hassan Mwinyi Rd" },
  { label: "Campus", area: "Ubungo", addressLine: "UDSM Campus, Hall 6 reception" },
  { label: "Home", area: "Tegeta", addressLine: "Tegeta Nyuki, house 42" },
];

const NAMES = [
  "John Mwita",
  "Amina Hassan",
  "Neema Joseph",
  "Baraka Mushi",
  "Fatuma Salum",
  "Emmanuel Kileo",
  "Zainabu Ally",
  "Peter Massawe",
  "Grace Mollel",
  "Hamisi Juma",
  "Rehema Kimaro",
  "Daniel Shirima",
];

export const customers: Customer[] = NAMES.map((fullName, i) => ({
  id: `cus_${(i + 1).toString().padStart(3, "0")}`,
  fullName,
  phone: `+2557${(60000000 + i * 1234567).toString().slice(0, 8)}`,
  savedLocations: [
    {
      id: `loc_${i}_1`,
      ...AREAS[i % AREAS.length]!,
      instructions: i % 3 === 0 ? "Call on arrival, blue gate" : "Leave with the receptionist",
      coordinates: { lat: -6.77 - i * 0.01, lng: 39.22 + i * 0.01 },
    },
  ],
}));

export const drivers: Driver[] = [
  {
    id: "drv_001",
    fullName: "Salum Rashid",
    phone: "+255712004411",
    status: "active",
    todayAssigned: 6,
    activeDeliveries: 2,
    completedDeliveries: 412,
    available: true,
  },
  {
    id: "drv_002",
    fullName: "Joseph Mnyika",
    phone: "+255754110982",
    status: "active",
    todayAssigned: 4,
    activeDeliveries: 1,
    completedDeliveries: 287,
    available: true,
  },
  {
    id: "drv_003",
    fullName: "Hawa Mbwana",
    phone: "+255689223114",
    status: "active",
    todayAssigned: 3,
    activeDeliveries: 1,
    completedDeliveries: 198,
    available: true,
  },
  {
    id: "drv_004",
    fullName: "Frank Lyimo",
    phone: "+255766338100",
    status: "active",
    todayAssigned: 7,
    activeDeliveries: 3,
    completedDeliveries: 521,
    available: false,
  },
  {
    id: "drv_005",
    fullName: "Mariam Kessy",
    phone: "+255715887432",
    status: "inactive",
    todayAssigned: 0,
    activeDeliveries: 0,
    completedDeliveries: 143,
    available: false,
  },
  {
    id: "drv_006",
    fullName: "Elias Sanga",
    phone: "+255783551209",
    status: "active",
    todayAssigned: 2,
    activeDeliveries: 0,
    completedDeliveries: 96,
    available: true,
  },
];

export const adminAccounts: AdminAccount[] = [
  {
    id: "usr_sm_1",
    fullName: "Asha Mrisho",
    email: "asha.mrisho@nelma.example",
    phone: "+255711220044",
    role: "SALES_MANAGER",
    status: "active",
    createdAt: iso(-220 * day),
    lastLoginAt: iso(-2 * 3600_000),
  },
  {
    id: "usr_sm_2",
    fullName: "Godfrey Temu",
    email: "godfrey.temu@nelma.example",
    phone: "+255712994411",
    role: "SALES_MANAGER",
    status: "active",
    createdAt: iso(-140 * day),
    lastLoginAt: iso(-26 * 3600_000),
  },
  {
    id: "usr_sm_3",
    fullName: "Lilian Mwakalinga",
    email: "lilian.m@nelma.example",
    phone: "+255755663322",
    role: "SALES_MANAGER",
    status: "inactive",
    createdAt: iso(-320 * day),
    lastLoginAt: iso(-40 * day),
  },
  {
    id: "usr_ad_1",
    fullName: "Omary Nassoro",
    email: "omary.nassoro@nelma.example",
    phone: "+255789112233",
    role: "SYSTEM_ADMIN",
    status: "active",
    createdAt: iso(-400 * day),
    lastLoginAt: iso(-45 * 60_000),
  },
  {
    id: "usr_ad_2",
    fullName: "Doreen Kibona",
    email: "doreen.kibona@nelma.example",
    phone: "+255744556677",
    role: "SYSTEM_ADMIN",
    status: "active",
    createdAt: iso(-90 * day),
    lastLoginAt: iso(-5 * day),
  },
];

const WINDOWS = [
  "08:00 – 10:00",
  "10:00 – 12:00",
  "12:00 – 14:00",
  "14:00 – 16:00",
  "16:00 – 18:00",
];

function buildTimeline(status: OrderStatus, createdAt: string) {
  if (status === "cancelled") {
    return [
      { status: "pending" as OrderStatus, at: createdAt },
      { status: "cancelled" as OrderStatus, at: iso(-3 * 3600_000) },
    ];
  }
  const idx = ORDER_LIFECYCLE.indexOf(status);
  return ORDER_LIFECYCLE.map((s, i) => ({
    status: s,
    at: i <= idx ? new Date(new Date(createdAt).getTime() + i * 45 * 60_000).toISOString() : null,
  }));
}

const STATUS_PLAN: OrderStatus[] = [
  "pending",
  "pending",
  "pending",
  "pending",
  "pending",
  "confirmed",
  "confirmed",
  "confirmed",
  "processing",
  "processing",
  "processing",
  "processing",
  "out_for_delivery",
  "out_for_delivery",
  "out_for_delivery",
  "delivered",
  "delivered",
  "delivered",
  "delivered",
  "customer_received",
  "customer_received",
  "customer_received",
  "customer_received",
  "customer_received",
  "cancelled",
];

function paymentFor(status: OrderStatus, i: number): PaymentStatus {
  if (status === "cancelled") return "cancelled";
  if (status === "customer_received") return i % 9 === 0 ? "pending" : "paid";
  if (status === "delivered") return i % 3 === 0 ? "paid" : "pending";
  return "pending";
}

export const orders: Order[] = Array.from({ length: 64 }, (_, i) => {
  const status = STATUS_PLAN[i % STATUS_PLAN.length]!;
  const customer = customers[i % customers.length]!;
  const product: BuiltInProduct = i % 4 === 0 ? "first_purchase" : "refill";
  const quantity = product === "first_purchase" ? 1 + (i % 2) : 1 + (i % 5);
  const unitPrice = PRICES[product];
  const subtotal = unitPrice * quantity;
  const deliveryCharge = [0, 1500, 2000, 2500][i % 4]!;
  const ageDays = Math.floor(i / 8);
  const createdAt = iso(-(ageDays * day + (i % 8) * 2.5 * 3600_000));
  const method: PaymentMethod = "cash";
  const source = i % 7 === 0 ? "SALES_MANAGER_DASHBOARD" : "USER_MOBILE";
  const location = customer.savedLocations[0]!;

  return {
    id: `ord_${(1000 + i).toString()}`,
    customer: { id: customer.id, fullName: customer.fullName, phone: customer.phone },
    item: { product, quantity, unitPrice, subtotal },
    status,
    createdAt,
    requestedDeliveryDate: dayISO(i % 5 === 0 ? 1 : -ageDays),
    requestedDeliveryWindow: WINDOWS[i % WINDOWS.length]!,
    deliveryLocation: location,
    paymentMethod: method,
    paymentStatus: paymentFor(status, i),
    deliveryCharge,
    total: subtotal + deliveryCharge,
    source,
    createdBy:
      source === "SALES_MANAGER_DASHBOARD"
        ? { id: "usr_sm_1", fullName: "Asha Mrisho", role: "SALES_MANAGER" }
        : null,
    assignedDriverId:
      status === "processing" ||
      status === "pending" ||
      status === "confirmed" ||
      status === "cancelled"
        ? null
        : drivers[i % 4]!.id,
    timeline: buildTimeline(status, createdAt),
  } satisfies Order;
});

function deliveryStatusFor(order: Order): DeliveryStatus {
  switch (order.status) {
    case "cancelled":
      return "cancelled";
    case "out_for_delivery":
      return "out_for_delivery";
    case "delivered":
      return "delivered";
    case "customer_received":
      return "customer_received";
    default:
      return order.assignedDriverId ? "assigned" : "unassigned";
  }
}

export const deliveries: Delivery[] = orders
  .filter((o) => o.status !== "pending" && o.status !== "cancelled")
  .map((o, i) => ({
    id: `dlv_${2000 + i}`,
    orderId: o.id,
    customerName: o.customer.fullName,
    customerPhone: o.customer.phone,
    location: o.deliveryLocation,
    scheduledDate: o.requestedDeliveryDate,
    timeWindow: o.requestedDeliveryWindow,
    product: o.item.product,
    quantity: o.item.quantity,
    driverId: o.assignedDriverId,
    status: deliveryStatusFor(o),
  }));

export const pricing: PriceConfiguration[] = [
  {
    product: "first_purchase",
    label: PRODUCT_LABELS.first_purchase,
    price: PRICES.first_purchase,
    currency: "TZS",
    updatedAt: iso(-32 * day),
    updatedBy: "Omary Nassoro",
  },
  {
    product: "refill",
    label: PRODUCT_LABELS.refill,
    price: PRICES.refill,
    currency: "TZS",
    updatedAt: iso(-11 * day),
    updatedBy: "Asha Mrisho",
  },
];

export const notifications: AppNotification[] = [
  {
    id: "ntf_1",
    kind: "order",
    title: "New order received",
    body: "Amina Hassan ordered 3 × 20L Refill for today, 10:00 – 12:00.",
    createdAt: iso(-12 * 60_000),
    read: false,
    audience: ["SALES_MANAGER"],
  },
  {
    id: "ntf_2",
    kind: "delivery",
    title: "Delivery requires assignment",
    body: "4 deliveries scheduled today have no driver assigned.",
    createdAt: iso(-48 * 60_000),
    read: false,
    audience: ["SALES_MANAGER", "SYSTEM_ADMIN"],
  },
  {
    id: "ntf_3",
    kind: "payment",
    title: "Payment still pending",
    body: "Cash payment for Baraka Mushi's delivered order is not settled.",
    createdAt: iso(-3 * 3600_000),
    read: false,
    audience: ["SALES_MANAGER", "SYSTEM_ADMIN"],
  },
  {
    id: "ntf_4",
    kind: "driver",
    title: "Driver unavailable",
    body: "Frank Lyimo marked himself unavailable with 3 active deliveries.",
    createdAt: iso(-5 * 3600_000),
    read: true,
    audience: ["SALES_MANAGER", "SYSTEM_ADMIN"],
  },
  {
    id: "ntf_5",
    kind: "delivery",
    title: "Delivery completed",
    body: "Salum Rashid completed a delivery in Mikocheni.",
    createdAt: iso(-6 * 3600_000),
    read: true,
    audience: ["SALES_MANAGER"],
  },
  {
    id: "ntf_6",
    kind: "system",
    title: "Pricing changed",
    body: "Refill price was updated by Asha Mrisho.",
    createdAt: iso(-11 * day),
    read: true,
    audience: ["SYSTEM_ADMIN"],
  },
  {
    id: "ntf_7",
    kind: "system",
    title: "New dashboard account",
    body: "A Sales Manager account was created for Godfrey Temu.",
    createdAt: iso(-14 * day),
    read: true,
    audience: ["SYSTEM_ADMIN"],
  },
];

export const auditEvents: AuditEvent[] = [
  {
    id: "aud_1",
    at: iso(-40 * 60_000),
    actor: "Asha Mrisho",
    role: "SALES_MANAGER",
    action: "DRIVER_ASSIGNED",
    entity: "Delivery",
    description: "Assigned Salum Rashid to a Mikocheni delivery.",
  },
  {
    id: "aud_2",
    at: iso(-2 * 3600_000),
    actor: "Asha Mrisho",
    role: "SALES_MANAGER",
    action: "ORDER_CREATED",
    entity: "Order",
    description: "Created a phone order for Neema Joseph (2 × 20L Refill).",
  },
  {
    id: "aud_3",
    at: iso(-9 * 3600_000),
    actor: "Omary Nassoro",
    role: "SYSTEM_ADMIN",
    action: "SETTING_CHANGED",
    entity: "System Settings",
    description: "Updated support phone number.",
  },
  {
    id: "aud_4",
    at: iso(-1 * day),
    actor: "Omary Nassoro",
    role: "SYSTEM_ADMIN",
    action: "ACCOUNT_CREATED",
    entity: "Admin Account",
    description: "Created Sales Manager account for Godfrey Temu.",
  },
  {
    id: "aud_5",
    at: iso(-2 * day),
    actor: "Doreen Kibona",
    role: "SYSTEM_ADMIN",
    action: "DRIVER_DEACTIVATED",
    entity: "Driver",
    description: "Deactivated driver Mariam Kessy.",
  },
  {
    id: "aud_6",
    at: iso(-11 * day),
    actor: "Asha Mrisho",
    role: "SALES_MANAGER",
    action: "PRICE_UPDATED",
    entity: "Pricing",
    description: "Changed 20L Refill price to TZS 4,000.",
  },
  {
    id: "aud_7",
    at: iso(-14 * day),
    actor: "Omary Nassoro",
    role: "SYSTEM_ADMIN",
    action: "ACCOUNT_DEACTIVATED",
    entity: "Admin Account",
    description: "Deactivated Sales Manager account Lilian Mwakalinga.",
  },
  {
    id: "aud_8",
    at: iso(-18 * day),
    actor: "Doreen Kibona",
    role: "SYSTEM_ADMIN",
    action: "SETTING_CHANGED",
    entity: "System Settings",
    description: "Mobile Money kept disabled (under construction).",
  },
  {
    id: "aud_9",
    at: iso(-21 * day),
    actor: "Godfrey Temu",
    role: "SALES_MANAGER",
    action: "DRIVER_UPDATED",
    entity: "Driver",
    description: "Updated phone number for Elias Sanga.",
  },
  {
    id: "aud_10",
    at: iso(-32 * day),
    actor: "Omary Nassoro",
    role: "SYSTEM_ADMIN",
    action: "PRICE_UPDATED",
    entity: "Pricing",
    description: "Changed New bottle purchase price to TZS 18,000.",
  },
];

export const recentActivity: ActivityEvent[] = [
  {
    id: "act_1",
    at: iso(-8 * 60_000),
    title: "Order confirmed",
    description: "Refill order for Zainabu Ally moved to Confirmed.",
  },
  {
    id: "act_2",
    at: iso(-26 * 60_000),
    title: "Driver assigned",
    description: "Joseph Mnyika assigned to a Sinza delivery.",
  },
  {
    id: "act_3",
    at: iso(-55 * 60_000),
    title: "Delivery completed",
    description: "Hawa Mbwana delivered 4 × 20L Refill in Mbezi.",
  },
  {
    id: "act_4",
    at: iso(-90 * 60_000),
    title: "Order created",
    description: "Phone order captured for Baraka Mushi.",
  },
  {
    id: "act_5",
    at: iso(-150 * 60_000),
    title: "Payment settled",
    description: "Cash payment received for a Kinondoni delivery.",
  },
];

export const adminActivity: ActivityEvent[] = [
  {
    id: "aact_1",
    at: iso(-45 * 60_000),
    title: "Driver assigned",
    description: "Asha Mrisho assigned Salum Rashid to a delivery.",
  },
  {
    id: "aact_2",
    at: iso(-9 * 3600_000),
    title: "System setting changed",
    description: "Support phone number updated.",
  },
  {
    id: "aact_3",
    at: iso(-1 * day),
    title: "Account created",
    description: "Sales Manager account created for Godfrey Temu.",
  },
  {
    id: "aact_4",
    at: iso(-2 * day),
    title: "Driver deactivated",
    description: "Mariam Kessy set to inactive.",
  },
];

export const systemSettings: SystemSettings = {
  business: {
    name: "NELMA Drinking Water",
    supportPhone: "+255 700 000 000",
    supportEmail: "support@nelma.example",
    address: "Placeholder address, Dar es Salaam",
    operatingHours: "Mon – Sat, 08:00 – 18:00",
  },
  payments: { cashEnabled: true, mobileMoneyEnabled: false },
  notifications: { newOrderAlerts: true, deliveryAlerts: true, paymentAlerts: true },
  delivery: {
    feeRuleSource: "Server-defined (FastAPI)",
    defaultTimeWindows: WINDOWS,
  },
};

export const timeWindows = WINDOWS;
