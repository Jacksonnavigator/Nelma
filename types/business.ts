import type { AddressLocationPreference, LanguagePreference } from "./user";
import type { OrderStatus } from "./order";

export type SalesReportPeriod = "daily" | "monthly";

export type SalesReportMetrics = {
  orders: number;
  deliveredOrders: number;
  receivedOrders: number;
  undeliveredOrders: number;
  revenue: number;
  deliveryFees: number;
  pendingPayments: number;
  newCustomers: number;
};

export type SalesReport = {
  period: SalesReportPeriod;
  label: string;
  startDate: string;
  endDate: string;
  metrics: SalesReportMetrics;
};

export type BusinessOrderQueueItem = {
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  phone: string;
  area: string;
  status: OrderStatus;
  total: number;
  scheduledFor?: string;
  updatedAt: string;
};

export type CustomerRecord = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  preferredLanguage?: LanguagePreference;
  addressLocationPreference?: AddressLocationPreference;
  primaryArea?: string;
  totalOrders: number;
  totalSpend: number;
  lastOrderAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type BusinessDashboard = {
  dailyReport: SalesReport;
  monthlyReport: SalesReport;
  undeliveredOrders: BusinessOrderQueueItem[];
  receivedOrders: BusinessOrderQueueItem[];
  customers: CustomerRecord[];
};
