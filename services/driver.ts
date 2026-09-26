import { apiClient } from "./api";
import type { PaginatedResult } from "../types/api";
import type { DriverSummary } from "../types/driver";
import type { DeclineAssignmentInput, DeliveryIssueInput, DriverDeliveryActionStatus, DriverDeliveryHandover, Order } from "../types/order";

// The first request after the free Render plan sleeps can take up to a minute.
const MUTATION_TIMEOUT_MS = 60000;

export const driverService = {
  async listActive(): Promise<Order[]> {
    const response = await apiClient.get<Order[] | PaginatedResult<Order>>("/driver/deliveries?scope=active");
    return Array.isArray(response) ? response : response.items;
  },

  async listHistory(page: number, pageSize = 30): Promise<PaginatedResult<Order>> {
    const response = await apiClient.get<Order[] | PaginatedResult<Order>>(`/driver/deliveries?scope=history&page=${page}&page_size=${pageSize}`);
    if (Array.isArray(response)) {
      return { items: response, page, pageSize, total: response.length, totalPages: 1, hasNext: false, hasPrevious: page > 1 };
    }
    return response;
  },

  getDelivery(id: string): Promise<Order> {
    return apiClient.get<Order>("/driver/deliveries/" + encodeURIComponent(id));
  },

  updateStatus(id: string, status: DriverDeliveryActionStatus, handover?: DriverDeliveryHandover): Promise<Order> {
    return apiClient.patch<Order>("/driver/deliveries/" + encodeURIComponent(id) + "/status", { status, ...handover }, true, MUTATION_TIMEOUT_MS);
  },

  reportIssue(id: string, input: DeliveryIssueInput): Promise<Order> {
    return apiClient.post<Order>("/driver/deliveries/" + encodeURIComponent(id) + "/issue", input, true, undefined, MUTATION_TIMEOUT_MS);
  },

  accept(id: string): Promise<Order> {
    return apiClient.post<Order>("/driver/deliveries/" + encodeURIComponent(id) + "/accept", undefined, true, undefined, MUTATION_TIMEOUT_MS);
  },

  async decline(id: string, input: DeclineAssignmentInput): Promise<void> {
    await apiClient.post<void>("/driver/deliveries/" + encodeURIComponent(id) + "/decline", input, true, undefined, MUTATION_TIMEOUT_MS);
  },

  async setDuty(onDuty: boolean): Promise<boolean> {
    const result = await apiClient.patch<{ onDuty: boolean }>("/driver/duty", { onDuty }, true, MUTATION_TIMEOUT_MS);
    return result.onDuty;
  },

  async shareLocation(position: { latitude: number; longitude: number }): Promise<void> {
    await apiClient.post<void>("/driver/location", position);
  },

  getSummary(): Promise<DriverSummary> {
    return apiClient.get<DriverSummary>("/driver/summary");
  }
};
