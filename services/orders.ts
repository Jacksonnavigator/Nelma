import { apiClient } from "./api";
import type { PaginatedResult } from "../types/api";
import type { CreateOrderInput, CreateOrderMessageInput, Order } from "../types/order";
import { createIdempotencyKey } from "../utils/idempotency";

type OrdersResponse = Order[] | PaginatedResult<Order>;

const hasAnotherPage = <T>(response: PaginatedResult<T>): boolean => {
  if (typeof response.hasNext === "boolean") {
    return response.hasNext;
  }
  return Boolean(response.page && response.totalPages && response.page < response.totalPages);
};

export const ordersService = {
  async list(): Promise<Order[]> {
    const pageSize = 100;
    let page = 1;
    const items: Order[] = [];

    while (true) {
      const response = await apiClient.get<OrdersResponse>(`/orders?page=${page}&page_size=${pageSize}`);
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

  getById(id: string): Promise<Order> {
    return apiClient.get<Order>("/orders/" + encodeURIComponent(id));
  },

  create(input: CreateOrderInput): Promise<Order> {
    return apiClient.post<Order>("/orders", input, true, createIdempotencyKey("order"));
  },

  cancel(id: string): Promise<Order> {
    return apiClient.post<Order>("/orders/" + encodeURIComponent(id) + "/cancel");
  },

  confirmReceived(id: string): Promise<Order> {
    return apiClient.post<Order>("/orders/" + encodeURIComponent(id) + "/received");
  },

  message(id: string, input: CreateOrderMessageInput): Promise<Order> {
    return apiClient.post<Order>("/orders/" + encodeURIComponent(id) + "/messages", input);
  }
};
