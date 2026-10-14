import { requireNewPassword, validateImageUpload } from "@/lib/security-input";
import { z } from "zod";
import { safeEntityId } from "@/lib/security-config";
import {
  apiRequest,
  getAuthToken,
  getRefreshToken,
  clearSession,
  establishSession,
  getSessionVersion,
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
  Product,
  DeliveryFees,
  UserAccount,
  UserAccountPage,
  WebsiteRequest,
  WebsiteRequestPage,
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
const apiUserSchema = z.object({
  id: z.string().min(1).max(128),
  fullName: z.string().min(1).max(200),
  email: z.string().max(254).nullable(),
  phone: z.string().max(32),
  role: z.enum(["SYSTEM_ADMIN", "SALES_MANAGER"]),
  isActive: z.boolean(),
});
function dashboardUser(input: unknown, requireActive = false): DashboardUser {
  const parsed = apiUserSchema.safeParse(input);
  if (!parsed.success)
    throw { status: 502, message: "The server returned invalid account information." };
  const user = parsed.data;
  if (requireActive && !user.isActive)
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
function acceptSession(session: ApiSession, expectedVersion: number): AuthSession {
  const user = dashboardUser(session?.user, true);
  establishSession(session?.tokens, expectedVersion);
  return { token: session.tokens.accessToken, user };
}

function adminAccount(user: ApiUser): AdminAccount {
  return { ...dashboardUser(user), createdAt: user.createdAt, lastLoginAt: null };
}
/** Base64 contents of a picked file, without the data: URL prefix. */
async function fileToBase64(file: File): Promise<string> {
  await validateImageUpload(file);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",", 2)[1] ?? "");
    reader.onerror = () => reject(reader.error ?? new Error("Could not read the image."));
    reader.readAsDataURL(file);
  });
}

export const httpServices: ServiceRegistry = {
  auth: {
    async login(identifier, password) {
      const expectedVersion = getSessionVersion();
      const session = await apiRequest<ApiSession>("auth/dashboard/login", {
        method: "POST",
        body: { identifier, password },
      });
      return acceptSession(session, expectedVersion);
    },
    async logout() {
      const refreshToken = getRefreshToken();
      // Start revocation with the old access token, then discard local credentials
      // immediately even if the network is unavailable. Server revocation must be
      // checked by operators; offline logout cannot promise server-side revocation.
      const request = refreshToken
        ? apiRequest<void>("auth/dashboard/logout", {
            method: "POST",
            body: { refreshToken },
            skipRefresh: true,
          })
        : Promise.resolve();
      clearSession();
      await request;
    },
    currentUser: async () =>
      getAuthToken() ? dashboardUser(await apiRequest<ApiUser>("auth/dashboard/me"), true) : null,
    updateProfile: async (input) =>
      dashboardUser(
        await apiRequest<ApiUser>("auth/dashboard/me", { method: "PATCH", body: input }),
      ),
    changePassword: (input) => {
      requireNewPassword(input.newPassword);
      if (input.newPassword !== input.confirmPassword)
        throw { status: 400, message: "Passwords must match." };
      return apiRequest<void>("auth/dashboard/security", { method: "PATCH", body: input });
    },
    forgotPassword: (identifier) =>
      apiRequest<{ message: string }>("auth/forgot-password", {
        method: "POST",
        body: { identifier },
      }),
    resetPassword: (input) => {
      requireNewPassword(input.newPassword);
      if (input.newPassword !== input.confirmPassword)
        throw { status: 400, message: "Passwords must match." };
      return apiRequest<void>("auth/reset-password", { method: "POST", body: input });
    },
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
    get: (id) => apiRequest<Order>(`admin/orders/${safeEntityId(id)}`),
    create: (input) => apiRequest<Order>("admin/orders", { method: "POST", body: input }),
    collectCash: (id, amount) =>
      apiRequest<Order>(`admin/orders/${safeEntityId(id)}/collect-cash`, {
        method: "POST",
        body: { amount },
      }),
    confirm: (id) =>
      apiRequest<Order>(`admin/orders/${safeEntityId(id)}/confirm`, { method: "POST" }),
    process: (id) =>
      apiRequest<Order>(`admin/orders/${safeEntityId(id)}/process`, { method: "POST" }),
    reply: (id, body) =>
      apiRequest<Order>(`admin/orders/${safeEntityId(id)}/messages`, {
        method: "POST",
        body: { body },
      }),
    cancel: (id, reason) =>
      apiRequest<Order>(`admin/orders/${safeEntityId(id)}/cancel`, {
        method: "POST",
        body: { reason },
      }),
    statusCounts: () =>
      apiRequest<{ status: OrderStatus; count: number }[]>("admin/orders/status-counts"),
  },

  customers: {
    search: (term) => apiRequest<Customer[]>("admin/customers", { query: { search: term } }),
    get: (id) => apiRequest<Customer>(`admin/customers/${safeEntityId(id)}`),
  },

  deliveries: {
    forOrder: (orderId) => apiRequest<Delivery>(`admin/deliveries/${safeEntityId(orderId)}`),
    list: (query) =>
      apiRequest<PaginatedResponse<Delivery>>("admin/deliveries", {
        query: {
          view: query.view,
          search: query.search,
          page: query.page,
          page_size: query.pageSize,
        },
      }),
    get: (id) => apiRequest<Delivery>(`admin/deliveries/${safeEntityId(id)}`),
    assignDriver: (deliveryId, driverId) =>
      apiRequest<Delivery>(`admin/deliveries/${safeEntityId(deliveryId)}/assign`, {
        method: "POST",
        body: { driver_id: driverId },
      }),
    updateStatus: (deliveryId, status) =>
      apiRequest<Delivery>(`admin/deliveries/${safeEntityId(deliveryId)}`, {
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
    get: (id) => apiRequest<Driver>(`admin/drivers/${safeEntityId(id)}`),
    available: () => apiRequest<Driver[]>("admin/drivers/available"),
    create: (input) => {
      requireNewPassword(input.password);
      return apiRequest<Driver>("admin/drivers", { method: "POST", body: input });
    },
    update: async (id, input) => {
      if (input.status) {
        await apiRequest(
          `drivers/${safeEntityId(id)}/${input.status === "active" ? "activate" : "deactivate"}`,
          {
            method: "POST",
          },
        );
        return apiRequest<Driver>(`admin/drivers/${safeEntityId(id)}`);
      }
      return apiRequest<Driver>(`admin/drivers/${safeEntityId(id)}`, {
        method: "PATCH",
        body: input,
      });
    },
    deliveriesFor: (driverId) =>
      apiRequest<Delivery[]>(`admin/drivers/${safeEntityId(driverId)}/deliveries`),
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
      apiRequest<PriceConfiguration>(`admin/pricing/${safeEntityId(product)}`, {
        method: "PATCH",
        body: { price },
      }),
  },

  products: {
    list: () => apiRequest<Product[]>("admin/products"),
    create: (input) => apiRequest<Product>("admin/products", { method: "POST", body: input }),
    update: (id, input) =>
      apiRequest<Product>(`admin/products/${safeEntityId(id)}`, { method: "PATCH", body: input }),
    uploadImage: async (id, file) =>
      apiRequest<Product>(`admin/products/${safeEntityId(id)}/image`, {
        method: "POST",
        body: { contentType: file.type, data: await fileToBase64(file) },
      }),
    deliveryFees: () => apiRequest<DeliveryFees>("admin/delivery-fees"),
    saveDeliveryFees: (input) =>
      apiRequest<DeliveryFees>("admin/delivery-fees", { method: "PUT", body: input }),
  },

  users: {
    list: (query) =>
      apiRequest<UserAccountPage>("admin/users", {
        query: {
          page: query.page,
          page_size: query.pageSize,
          role: query.role,
          status: query.status,
          search: query.search,
        },
      }),
    setActive: (id, active) =>
      apiRequest<UserAccount>(`admin/users/${safeEntityId(id)}/status`, {
        method: "POST",
        body: { active },
      }),
    setPassword: (id, password) => {
      requireNewPassword(password);
      return apiRequest<void>(`admin/users/${safeEntityId(id)}/password`, {
        method: "POST",
        body: { password },
      });
    },
  },

  adminAccounts: {
    list: async () => (await apiRequest<ApiUser[]>("admin/accounts")).map(adminAccount),
    create: async (input) => {
      requireNewPassword(input.password);
      return adminAccount(
        await apiRequest<ApiUser>("admin/accounts", { method: "POST", body: input }),
      );
    },
    update: async (id, input) => {
      if (input.status)
        return adminAccount(
          await apiRequest<ApiUser>(
            `admin/accounts/${safeEntityId(id)}/${input.status === "active" ? "activate" : "deactivate"}`,
            { method: "POST" },
          ),
        );
      return adminAccount(
        await apiRequest<ApiUser>(`admin/accounts/${safeEntityId(id)}`, {
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
    markRead: (id) =>
      apiRequest<void>(`admin/notifications/${safeEntityId(id)}/read`, { method: "POST" }),
    markAllRead: () => apiRequest<void>("admin/notifications/read-all", { method: "POST" }),
  },

  operations: {
    overview: () => apiRequest<OperationsOverview>("admin/operations"),
    handIn: (driverId, paymentIds, amountReceived) =>
      apiRequest<{ settled: number }>(`admin/operations/cash/${safeEntityId(driverId)}/hand-in`, {
        method: "POST",
        body: { paymentIds, amountReceived },
      }),
    reviewFlag: (id) =>
      apiRequest<void>(`admin/operations/flags/${safeEntityId(id)}/review`, { method: "POST" }),
  },

  websiteRequests: {
    list: (query) =>
      apiRequest<WebsiteRequestPage>("admin/website-requests", {
        query: {
          kind: query.kind,
          status: query.status,
          page: query.page,
          page_size: query.pageSize,
        },
      }),
    setStatus: (id, status) =>
      apiRequest<WebsiteRequest>(`admin/website-requests/${safeEntityId(id)}/status`, {
        method: "POST",
        body: { status },
      }),
  },
};
