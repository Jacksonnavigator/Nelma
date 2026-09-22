import { apiClient } from "./api";
import type { PaginatedResult } from "../types/api";
import type { DriverDeliveryActionStatus, Order } from "../types/order";

type DriverDeliveriesResponse = Order[] | PaginatedResult<Order>;

const hasAnotherPage = <T>(response: PaginatedResult<T>): boolean => {
  if (typeof response.hasNext === "boolean") {
    return response.hasNext;
  }
  return Boolean(response.page && response.totalPages && response.page < response.totalPages);
};

export const driverService = {
  async listDeliveries(): Promise<Order[]> {
    const pageSize = 100;
    let page = 1;
    const items: Order[] = [];

    while (true) {
      const response = await apiClient.get<DriverDeliveriesResponse>(`/driver/deliveries?page=${page}&page_size=${pageSize}`);
      if (Array.isArray(response)) {
        return response;
      }
      items.push(...response.items);
      if (!hasAnotherPage(response)) {
        return items;
      }
      page += 1;
    }
  },

  getDelivery(id: string): Promise<Order> {
    return apiClient.get<Order>("/driver/deliveries/" + encodeURIComponent(id));
  },

  updateStatus(id: string, status: DriverDeliveryActionStatus): Promise<Order> {
    return apiClient.patch<Order>("/driver/deliveries/" + encodeURIComponent(id) + "/status", { status });
  }
};
