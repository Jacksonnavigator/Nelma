import type { DeliveryAddress } from "./address";
import type { Payment, PaymentStatus } from "./payment";

/** A product code from the catalog: first_purchase, refill, or one added in the dashboard. */
export type OrderType = string;

export type OrderStatus = "pending" | "confirmed" | "processing" | "out_for_delivery" | "delivered" | "received" | "cancelled";

export type OrderAction = "cancel" | "reorder" | "contact_support" | "mark_received" | "message_nelma";

export type OrderSource = "USER_MOBILE" | "SALES_MANAGER_DASHBOARD";

export type DriverDeliveryActionStatus = "out_for_delivery" | "delivered";

export type ProofSkipReason = "customer_has_no_phone" | "code_not_working";

// Extra details the backend requires when a driver completes a handover.
export type DriverDeliveryHandover = {
  cashCollected?: number;
  deliveryCode?: string;
  proofSkipReason?: ProofSkipReason;
  latitude?: number;
  longitude?: number;
};

export type DeliveryIssueReason = "customer_unreachable" | "wrong_address" | "customer_refused" | "started_by_mistake" | "other";

export type DeliveryIssueInput = { reason: DeliveryIssueReason; note?: string };

export type DeclineReason = "vehicle_problem" | "too_far" | "not_enough_stock" | "ending_shift" | "other";

export type DeclineAssignmentInput = { reason: DeclineReason; note?: string };

export type DriverDeliveryGroupFilter = "today" | "upcoming" | "all";

export type DriverDeliveryStatusFilter = "all" | "assigned" | "out_for_delivery" | "delivered";

export type DeliverySlotId = "asap" | "morning" | "afternoon" | "evening";

export type DeliverySchedule = {
  date: string;
  slot: DeliverySlotId;
  label: string;
  window: string;
};

export type OrderMessageSender = "customer" | "nelma" | "system";

export type OrderMessage = {
  id: string;
  orderId: string;
  sender: OrderMessageSender;
  body: string;
  createdAt: string;
};

export type CreateOrderMessageInput = {
  body: string;
};

export type OrderItem = {
  productName: string;
  orderType: OrderType;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type OrderCharge = {
  id: string;
  label: string;
  amount: number;
};

export type OrderTimelineEvent = {
  id: string;
  label: string;
  status: OrderStatus;
  completedAt?: string | null;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName?: string | null;
  customerPhone?: string | null;
  createdByUserId?: string | null;
  source?: OrderSource;
  assignedDriverId?: string | null;
  driverAssignedAt?: string | null;
  /** Null until the driver accepts or starts the stop. Missing on older backends. */
  driverAcceptedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  orderType: OrderType;
  items: OrderItem[];
  quantity: number;
  deliveryAddress: DeliveryAddress;
  deliverySchedule?: DeliverySchedule;
  customerRemarks?: string;
  customerReceivedAt?: string | null;
  customerReceivedByUserId?: string | null;
  messages?: OrderMessage[];
  subtotal: number;
  charges: OrderCharge[];
  total: number;
  currency: "TZS";
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  payment?: Payment | null;
  timeline: OrderTimelineEvent[];
  availableActions: OrderAction[];
};

export type CreateOrderInput = {
  orderType: OrderType;
  quantity: number;
  deliveryAddress: DeliveryAddress;
  deliverySchedule: DeliverySchedule;
  customerRemarks?: string;
  charges: OrderCharge[];
  paymentMethodId: string;
};

export type OrderDraft = {
  orderType?: OrderType;
  quantity: number;
  deliveryAddress?: DeliveryAddress;
  deliverySchedule?: DeliverySchedule;
  customerRemarks?: string;
  charges?: OrderCharge[];
  paymentMethodId?: string;
};

export type OrderFilter = "all" | "active" | "completed" | "cancelled";
