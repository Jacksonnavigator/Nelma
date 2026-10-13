import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/types";

// Plain colours: the theme's --chart-* tokens are oklch values, which hsl(var(...)) turned into black.
export const CHART_COLORS = {
  blue: "#2563eb",
  green: "#16a34a",
  orange: "#f97316",
  yellow: "#eab308",
  red: "#dc2626",
  purple: "#9333ea",
  teal: "#0d9488",
  pink: "#db2777",
  sky: "#0ea5e9",
  gray: "#64748b",
} as const;

/** One fixed colour per order status, so a status keeps its colour on every chart. */
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: CHART_COLORS.yellow,
  confirmed: CHART_COLORS.sky,
  processing: CHART_COLORS.purple,
  out_for_delivery: CHART_COLORS.orange,
  delivered: CHART_COLORS.blue,
  customer_received: CHART_COLORS.green,
  cancelled: CHART_COLORS.red,
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  paid: CHART_COLORS.green,
  pending: CHART_COLORS.yellow,
  failed: CHART_COLORS.red,
  cancelled: CHART_COLORS.gray,
  refunded: CHART_COLORS.purple,
};

export const PAYMENT_METHOD_COLORS: Record<PaymentMethod, string> = {
  cash: CHART_COLORS.green,
  mobile_money: CHART_COLORS.blue,
};

/** New bottle + water in blue, refills in green; products added later use the series colours. */
export const PRODUCT_COLORS: Record<string, string> = {
  first_purchase: CHART_COLORS.blue,
  refill: CHART_COLORS.green,
};
