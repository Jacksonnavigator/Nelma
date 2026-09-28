import { apiClient } from "./api";
import type { InitializePaymentInput, Payment, PaymentMethod } from "../types/payment";
import { createIdempotencyKey } from "../utils/idempotency";

export const paymentsService = {
  listMethods(): Promise<PaymentMethod[]> {
    return apiClient.get<PaymentMethod[]>("/payments/methods");
  },

  initialize(input: InitializePaymentInput): Promise<Payment> {
    return apiClient.post<Payment>("/payments/initialize", input, true, createIdempotencyKey("payment-" + input.orderId + "-" + input.methodId));
  },

  getById(id: string): Promise<Payment> {
    return apiClient.get<Payment>("/payments/" + encodeURIComponent(id));
  }
};
