import { apiClient } from "./api";
import type { PaginatedResult } from "../types/api";
import type { Notification } from "../types/notification";

type NotificationsResponse = Notification[] | PaginatedResult<Notification>;

const hasAnotherPage = <T>(response: PaginatedResult<T>): boolean => {
  if (typeof response.hasNext === "boolean") {
    return response.hasNext;
  }
  return Boolean(response.page && response.totalPages && response.page < response.totalPages);
};

export const notificationsService = {
  async list(): Promise<Notification[]> {
    const pageSize = 100;
    let page = 1;
    const items: Notification[] = [];

    while (true) {
      const response = await apiClient.get<NotificationsResponse>(`/notifications?page=${page}&page_size=${pageSize}`);
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

  markRead(id: string): Promise<Notification> {
    return apiClient.patch<Notification>("/notifications/" + encodeURIComponent(id) + "/read");
  },

  readAll(): Promise<void> {
    return apiClient.post<void>("/notifications/read-all");
  }
};