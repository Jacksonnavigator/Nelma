import {
  apiRequest,
  setAuthToken,
  getAuthToken,
  getRefreshToken,
  setRefreshToken,
  clearSession,
} from "@/services/api";
import type {
  ActivityEvent,
  AdminAccount,
  AppNotification,
  AuditEvent,
  Customer,
  DashboardMetrics,
  DashboardUser,
  Delivery,
  Driver,
  OperationsOverview,
  Order,
  OrderStatus,
  PaginatedResponse,
  PriceConfiguration,
  SalesReport,
  SystemSettings,
} from "@/types";
import type { AuthSession, ServiceRegistry } from "@/services/contracts";

/**
 * FastAPI-backed repositories.
 *
 * Enabled with VITE_DATA_MODE=api. Endpoint paths match the NELMA
 * backend contract. The backend remains the authoritative source for pricing,
 * order state transitions and role authorization.
 */
interface ApiUser {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}
interface ApiSession {
  user: ApiUser;
  tokens: { accessToken: string; refreshToken: string };
}
function dashboardUser(user: ApiUser): DashboardUser {
  if (user.role !== "SYSTEM_ADMIN" && user.role !== "SALES_MANAGER")
    throw { status: 403, message: "This account cannot access the dashboard." };
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email ?? "",
    phone: user.phone,
    role: user.role,
    status: user.isActive ? "active" : "inactive",
  };
}
function acceptSession(session: ApiSession): AuthSession {
  const user = dashboardUser(session.user);
  setAuthToken(session.tokens.accessToken);
  setRefreshToken(session.tokens.refreshToken);
  return { token: session.tokens.accessToken, user };
}

function adminAccount(user: ApiUser): AdminAccount {
  return { ...dashboardUser(user), createdAt: user.createdAt, lastLoginAt: null };
}
export const httpServices: ServiceRegistry = {
  auth: {
    async login(identifier, password) {
      const session = await apiRequest<ApiSession>("auth/dashboard/login", {
        method: "POST",
        body: { identifier, password },
      });
      return acceptSession(session);
    },
    async logout() {
      const refreshToken = getRefreshToken();
      try {
        if (refreshToken)
          await apiRequest<void>("auth/dashboard/logout", {
            method: "POST",
            body: { refreshToken },
            skipRefresh: true,
          });
      } finally {
        clearSession();
      }
    },
    currentUser: async () =>
      getAuthToken() ? dashboardUser(await apiRequest<ApiUser>("auth/dashboard/me")) : null,
    updateProfile: async (input) =>
      dashboardUser(
        await apiRequest<ApiUser>("auth/dashboard/me", { method: "PATCH", body: input }),
      ),
    changePassword: (input) =>
      apiRequest<void>("auth/dashboard/security", { method: "PATCH", body: input }),
    forgotPassword: (identifier) =>
      apiRequest<{ message: string }>("auth/forgot-password", {
        method: "POST",
        body: { identifier },
      }),
    resetPassword: (input) =>
      apiRequest<void>("auth/reset-password", { method: "POST", body: input }),
  },

  orders: {
    metrics: () => apiRequest<DashboardMetrics>("admin/dashboard"),
    activity: (role) => apiRequest<ActivityEvent[]>("admin/activity", { query: { role } }),
    list: (query) =>
      apiRequest<PaginatedResponse<Order>>("admin/orders", {
        query: {
          status: query.status,
          search: query.search,
          product: query.product,
          payment_method: query.paymentMethod,
          payment_status: query.paymentStatus,
          order_date: query.orderDate,
          delivery_date: query.deliveryDate,
          page: query.page,
          page_size: query.pageSize,
        },
      }),
    get: (id) => apiRequest<Order>(`admin/orders/${id}`),
    create: (input) => apiRequest<Order>("admin/orders", { method: "POST", body: input }),
    collectCash: (id, amount) =>
      apiRequest<Order>(`admin/orders/${id}/collect-cash`, { method: "POST", body: { amount } }),
    confirm: (id) => apiRequest<Order>(`admin/orders/${id}/confirm`, { method: "POST" }),
    process: (id) => apiRequest<Order>(`admin/orders/${id}/process`, { method: "POST" }),
    statusCounts: () =>
      apiRequest<{ status: OrderStatus; count: number }[]>("admin/orders/status-counts"),
  },

  customers: {
    search: (term) => apiRequest<Customer[]>("admin/customers", { query: { search: term } }),
    get: (id) => apiRequest<Customer>(`admin/customers/${id}`),
  },

  deliveries: {
    forOrder: (orderId) => apiRequest<Delivery>(`admin/deliveries/${orderId}`),
    list: (query) =>
      apiRequest<PaginatedResponse<Delivery>>("admin/deliveries", {
        query: {
          view: query.view,
          search: query.search,
          page: query.page,
          page_size: query.pageSize,
        },
      }),
    get: (id) => apiRequest<Delivery>(`admin/deliveries/${id}`),
    assignDriver: (deliveryId, driverId) =>
      apiRequest<Delivery>(`admin/deliveries/${deliveryId}/assign`, {
        method: "POST",
        body: { driver_id: driverId },
      }),
    updateStatus: (deliveryId, status) =>
      apiRequest<Delivery>(`admin/deliveries/${deliveryId}`, {
        method: "PATCH",
        body: { status },
      }),
  },

  drivers: {
    list: (query) =>
      apiRequest<PaginatedResponse<Driver>>("admin/drivers", {
        query: {
          search: query.search,
          status: query.status,
          page: query.page,
          page_size: query.pageSize,
        },
      }),
    get: (id) => apiRequest<Driver>(`admin/drivers/${id}`),
    available: () => apiRequest<Driver[]>("admin/drivers/available"),
    create: (input) => apiRequest<Driver>("admin/drivers", { method: "POST", body: input }),
    update: async (id, input) => {
      if (input.status) {
        await apiRequest(`drivers/${id}/${input.status === "active" ? "activate" : "deactivate"}`, {
          method: "POST",
        });
        return apiRequest<Driver>(`admin/drivers/${id}`);
      }
      return apiRequest<Driver>(`admin/drivers/${id}`, { method: "PATCH", body: input });
    },
    deliveriesFor: (driverId) => apiRequest<Delivery[]>(`admin/drivers/${driverId}/deliveries`),
  },

  sales: {
    report: (query) =>
      apiRequest<SalesReport>("admin/reports/sales", {
        query: { period: query.period, from: query.from, to: query.to },
      }),
  },

  pricing: {
    list: () => apiRequest<PriceConfiguration[]>("admin/pricing"),
    update: (product, price) =>
      apiRequest<PriceConfiguration>(`admin/pricing/${product}`, {
        method: "PATCH",
        body: { price },
      }),
  },

  adminAccounts: {
    list: async () => (await apiRequest<ApiUser[]>("admin/accounts")).map(adminAccount),
    create: async (input) =>
      adminAccount(await apiRequest<ApiUser>("admin/accounts", { method: "POST", body: input })),
    update: async (id, input) => {
      if (input.status)
        return adminAccount(
          await apiRequest<ApiUser>(
            `admin/accounts/${id}/${input.status === "active" ? "activate" : "deactivate"}`,
            { method: "POST" },
          ),
        );
      return adminAccount(
        await apiRequest<ApiUser>(`admin/accounts/${id}`, {
          method: "PATCH",
          body: {
            fullName: input.fullName,
            email: input.email,
            phone: input.phone,
            role: input.role,
          },
        }),
      );
    },
  },

  settings: {
    get: () => apiRequest<SystemSettings>("admin/settings"),
    orderOptions: () =>
      apiRequest<Pick<SystemSettings, "delivery" | "payments">>("admin/order-options"),
    update: (patch) =>
      apiRequest<SystemSettings>("admin/settings", { method: "PATCH", body: patch }),
  },

  audit: {
    list: (query) =>
      apiRequest<PaginatedResponse<AuditEvent>>("admin/audit-logs", {
        query: {
          actor: query.actor,
          action: query.action,
          entity: query.entity,
          date: query.date,
          page: query.page,
          page_size: query.pageSize,
        },
      }),
  },

  notifications: {
    list: (role) => apiRequest<AppNotification[]>("admin/notifications", { query: { role } }),
    markRead: (id) => apiRequest<void>(`admin/notifications/${id}/read`, { method: "POST" }),
    markAllRead: () => apiRequest<void>("admin/notifications/read-all", { method: "POST" }),
  },

  operations: {
    overview: () => apiRequest<OperationsOverview>("admin/operations"),
    handIn: (driverId, paymentIds, amountReceived) =>
      apiRequest<{ settled: number }>(`admin/operations/cash/${driverId}/hand-in`, {
        method: "POST",
        body: { paymentIds, amountReceived },
      }),
    reviewFlag: (id) => apiRequest<void>(`admin/operations/flags/${id}/review`, { method: "POST" }),
  },
};
