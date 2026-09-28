import type { OrderStatus } from "../types/order";
import type { PaymentStatus } from "../types/payment";

export type StatusTone = "info" | "success" | "warning" | "danger" | "neutral";

export const orderStatusLabel = (status: OrderStatus): string => {
  const labels: Record<OrderStatus, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    processing: "Processing",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    received: "Received",
    cancelled: "Cancelled"
  };
  return labels[status];
};

export const driverDeliveryStatusLabel = (status: OrderStatus): string => {
  if (status === "pending" || status === "confirmed" || status === "processing") return "Ready to start";
  if (status === "received") {
    return "Customer Received";
  }
  if (status === "delivered") return "Awaiting customer confirmation";
  return orderStatusLabel(status);
};

export const paymentStatusLabel = (status: PaymentStatus): string => {
  const labels: Record<PaymentStatus, string> = {
    pending: "Pending",
    processing: "Processing",
    paid: "Paid",
    failed: "Failed",
    cancelled: "Cancelled",
    refunded: "Refunded"
  };
  return labels[status];
};

export const orderStatusTone = (status: OrderStatus): StatusTone => {
  if (status === "delivered" || status === "received") {
    return "success";
  }
  if (status === "cancelled") {
    return "danger";
  }
  if (status === "pending") {
    return "warning";
  }
  return "info";
};

export const paymentStatusTone = (status: PaymentStatus): StatusTone => {
  if (status === "paid") {
    return "success";
  }
  if (["failed", "cancelled", "refunded"].includes(status)) {
    return "danger";
  }
  if (status === "pending") {
    return "warning";
  }
  return "info";
};

export const isTerminalPaymentStatus = (status: PaymentStatus): boolean => {
  return ["paid", "failed", "cancelled", "refunded"].includes(status);
};
