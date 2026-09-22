export type PaymentStatus = "pending" | "processing" | "paid" | "failed" | "cancelled" | "refunded";

export type PaymentMethodType = "mobile_money" | "cash" | "other";

export type PaymentMethod = {
  id: string;
  type: PaymentMethodType;
  label: string;
  description: string;
  enabled: boolean;
  requiresCustomerAction: boolean;
};

export type Payment = {
  id: string;
  orderId: string;
  amount: number;
  currency: "TZS";
  methodId: string;
  methodLabel: string;
  status: PaymentStatus;
  providerReference?: string | null;
  failureReason?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InitializePaymentInput = {
  orderId: string;
  methodId: string;
};