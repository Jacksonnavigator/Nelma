/**
 * NELMA Dashboard domain models.
 *
 * These mirror the concepts owned by the existing NELMA FastAPI backend.
 * The frontend is NEVER authoritative: prices, statuses and permissions are
 * ultimately enforced server-side. These types exist so mock repositories and
 * future API repositories share one contract.
 */

export type DashboardRole = "SALES_MANAGER" | "SYSTEM_ADMIN";

export type AccountStatus = "active" | "inactive";

export interface DashboardUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: DashboardRole;
  status: AccountStatus;
}

export interface AdminAccount extends DashboardUser {
  createdAt: string;
  lastLoginAt: string | null;
}

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  savedLocations: DeliveryLocation[];
}

export interface DeliveryLocation {
  id?: string;
  label: string;
  area: string;
  addressLine: string;
  instructions?: string;
  phone?: string;
  coordinates?: { lat: number; lng: number };
}

export type OrderType = "first_purchase" | "refill";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "out_for_delivery"
  | "delivered"
  | "customer_received"
  | "cancelled";

export type PaymentMethod = "cash" | "mobile_money";

export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled" | "refunded";

export type OrderSource = "USER_MOBILE" | "SALES_MANAGER_DASHBOARD";

export interface OrderItem {
  product: OrderType;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderTimelineEntry {
  status: OrderStatus;
  at: string | null;
}

export interface Order {
  /** Internal identifier. Intentionally NOT surfaced as a primary UI label. */
  id: string;
  customer: Pick<Customer, "id" | "fullName" | "phone">;
  item: OrderItem;
  status: OrderStatus;
  createdAt: string;
  requestedDeliveryDate: string;
  requestedDeliveryWindow: string;
  deliveryLocation: DeliveryLocation;
  cashReceipt?: { id: string; amount: number; collectedAt: string } | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  deliveryCharge: number;
  total: number;
  source: OrderSource;
  createdBy: { id: string; fullName: string; role: DashboardRole } | null;
  assignedDriverId: string | null;
  timeline: OrderTimelineEntry[];
}

export type DeliveryStatus =
  "unassigned" | "assigned" | "out_for_delivery" | "delivered" | "customer_received" | "cancelled";

export interface Delivery {
  id: string;
  orderId: string;
  orderStatus?: OrderStatus;
  customerName: string;
  customerPhone: string;
  location: DeliveryLocation;
  scheduledDate: string;
  timeWindow: string;
  product: OrderType;
  quantity: number;
  driverId: string | null;
  status: DeliveryStatus;
}

export interface Driver {
  id: string;
  fullName: string;
  phone: string;
  status: AccountStatus;
  todayAssigned: number;
  activeDeliveries: number;
  completedDeliveries: number;
  available: boolean;
}

export interface PriceConfiguration {
  product: OrderType;
  label: string;
  price: number;
  currency: "TZS";
  updatedAt: string | null;
  updatedBy: string;
}

export interface SalesSummary {
  totalSales: number;
  totalOrders: number;
  unitsSold: number;
  firstPurchases: number;
  refills: number;
  completedOrders: number;
  cancelledOrders: number;
  cashPayments: number;
  pendingPayments: number;
  deliveryCharges: number;
}

export interface SalesTrendPoint {
  date: string;
  sales: number;
  orders: number;
}

export interface SalesReport {
  summary: SalesSummary;
  trend: SalesTrendPoint[];
  productMix: { product: OrderType; label: string; orders: number; sales: number }[];
  statusDistribution: { status: OrderStatus; count: number }[];
  paymentDistribution: { status: PaymentStatus; count: number }[];
  records: SalesRecord[];
}

export interface SalesRecord {
  orderId: string;
  date: string;
  customer: string;
  product: OrderType;
  quantity: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  total: number;
}

export type NotificationKind = "order" | "delivery" | "payment" | "driver" | "system";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  audience: DashboardRole[];
}

export interface AuditEvent {
  id: string;
  at: string;
  actor: string;
  role: string;
  action: string;
  entity: string;
  description: string;
}

export interface ActivityEvent {
  id: string;
  at: string;
  title: string;
  description: string;
}

export interface SystemSettings {
  business: {
    name: string;
    supportPhone: string;
    supportEmail: string;
    address: string;
    operatingHours: string;
  };
  payments: {
    cashEnabled: boolean;
    mobileMoneyEnabled: boolean;
  };
  notifications: {
    newOrderAlerts: boolean;
    deliveryAlerts: boolean;
    paymentAlerts: boolean;
  };
  delivery: {
    /** Server-defined. The dashboard never invents delivery pricing rules. */
    feeRuleSource: string;
    defaultTimeWindows: string[];
  };
}

export interface DashboardMetrics {
  todayOrders: number;
  pendingOrders: number;
  processing: number;
  outForDelivery: number;
  completedToday: number;
  todaySales: number;
  pendingPayments: number;
  activeDrivers: number;
  activeSalesManagers: number;
  pendingDeliveries: number;
  systemStatus: "operational" | "degraded" | "down";
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ApiError {
  status: number;
  message: string;
  detail?: string;
}
