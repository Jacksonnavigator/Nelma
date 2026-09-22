import { productCatalog, type ProductCatalog } from "../constants/pricing";
import type { Order, OrderCharge, OrderFilter, OrderStatus, OrderTimelineEvent, OrderType } from "../types/order";

export type OrderPricing = {
  orderType: OrderType;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  charges: OrderCharge[];
  total: number;
};

export const ensurePositiveQuantity = (quantity: number): number => {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("Quantity must be a positive whole number.");
  }
  return quantity;
};

export const calculateOrderPricing = (
  orderType: OrderType,
  quantity: number,
  charges: OrderCharge[] = [],
  catalog: ProductCatalog = productCatalog
): OrderPricing => {
  const safeQuantity = ensurePositiveQuantity(quantity);
  const unitPrice = catalog[orderType].unitPrice;
  const subtotal = unitPrice * safeQuantity;
  const chargeTotal = charges.reduce((sum, charge) => sum + charge.amount, 0);

  return {
    orderType,
    unitPrice,
    quantity: safeQuantity,
    subtotal,
    charges,
    total: subtotal + chargeTotal
  };
};

export const getOrderTypeLabel = (orderType: OrderType, catalog: ProductCatalog = productCatalog): string => catalog[orderType].label;

export const getOrderProductName = (orderType: OrderType, catalog: ProductCatalog = productCatalog): string => catalog[orderType].productName;

export const isActiveOrderStatus = (status: OrderStatus): boolean => {
  return ["pending", "confirmed", "processing", "out_for_delivery"].includes(status);
};

export const canReorder = (order: Order): boolean => order.availableActions.includes("reorder") && order.status !== "cancelled";

export const canConfirmReceived = (order: Order): boolean => order.availableActions.includes("mark_received") && order.status === "delivered" && !order.customerReceivedAt;

export const filterOrders = (orders: Order[], filter: OrderFilter): Order[] => {
  if (filter === "all") {
    return orders;
  }
  if (filter === "active") {
    return orders.filter((order) => isActiveOrderStatus(order.status));
  }
  if (filter === "completed") {
    return orders.filter((order) => order.status === "delivered" || order.status === "received");
  }
  return orders.filter((order) => order.status === "cancelled");
};

const orderSteps: Array<{ status: OrderStatus; label: string }> = [
  { status: "pending", label: "Order Received" },
  { status: "confirmed", label: "Confirmed" },
  { status: "processing", label: "Processing" },
  { status: "out_for_delivery", label: "Out for Delivery" },
  { status: "delivered", label: "Delivered" },
  { status: "received", label: "Customer Received" }
];

export const buildOrderTimeline = (currentStatus: OrderStatus, nowIso: string): OrderTimelineEvent[] => {
  if (currentStatus === "cancelled") {
    return [
      { id: "pending", status: "pending", label: "Order Received", completedAt: nowIso },
      { id: "cancelled", status: "cancelled", label: "Cancelled", completedAt: nowIso }
    ];
  }

  const currentIndex = orderSteps.findIndex((step) => step.status === currentStatus);
  return orderSteps.map((step, index) => ({
    id: step.status,
    status: step.status,
    label: step.label,
    completedAt: index <= currentIndex ? nowIso : null
  }));
};
