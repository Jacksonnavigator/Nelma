import { localStore } from "../../storage/local-store";
import type { SavedAddress } from "../../types/address";
import type { CustomerRecord } from "../../types/business";
import type { Notification } from "../../types/notification";
import type { Order } from "../../types/order";
import type { Payment } from "../../types/payment";
import type { User, UserRole } from "../../types/user";
import { getDefaultDeliverySchedule } from "../../utils/delivery";
import { buildOrderTimeline } from "../../utils/order";
import { mockCustomers, mockNotifications, mockOrders, mockSavedAddresses, mockUser } from "./mock-data";

const USER_KEY = "nelma.mock.user";
const ORDERS_KEY = "nelma.mock.orders";
const NOTIFICATIONS_KEY = "nelma.mock.notifications";
const PAYMENTS_KEY = "nelma.mock.payments";
const ADDRESSES_KEY = "nelma.mock.addresses";
const CUSTOMERS_KEY = "nelma.mock.customers";

const legacyAreaNames = new Set(["Sinza", "Mikocheni"]);
const seededAddressIds = new Set(["address_home", "address_work", "address_nmaist", "address_tengeru"]);

const normalizeRole = (role: unknown): UserRole => {
  if (role === "DRIVER" || role === "SALES_MANAGER" || role === "SYSTEM_ADMIN") {
    return role;
  }
  return "USER";
};

const userWithDefaults = (user: User): User => ({
  ...user,
  role: normalizeRole(user.role),
  preferredLanguage: user.preferredLanguage ?? "en",
  addressLocationPreference: user.addressLocationPreference ?? "single"
});

const stripRemovedAddressFields = (addresses: SavedAddress[]): SavedAddress[] => addresses.map((address) => {
  const { isDefault: _isDefault, ...cleanAddress } = address as SavedAddress & { isDefault?: boolean };
  return cleanAddress;
});

const hydrateOrder = (order: Order): Order => ({
  ...order,
  customerName: order.customerName ?? undefined,
  customerPhone: order.customerPhone ?? order.deliveryAddress.phone ?? null,
  createdByUserId: order.createdByUserId ?? order.customerId,
  source: order.source ?? "USER_MOBILE",
  assignedDriverId: order.assignedDriverId ?? null,
  deliverySchedule: order.deliverySchedule ?? getDefaultDeliverySchedule(),
  customerReceivedAt: order.customerReceivedAt ?? null,
  customerReceivedByUserId: order.customerReceivedByUserId ?? null,
  messages: order.messages ?? [],
  timeline: order.timeline ?? buildOrderTimeline(order.status, order.updatedAt),
  availableActions: order.availableActions ?? ["reorder", "contact_support", "message_nelma"]
});

const hydrateCustomer = (customer: CustomerRecord): CustomerRecord => ({
  ...customer,
  totalOrders: customer.totalOrders ?? 0,
  totalSpend: customer.totalSpend ?? 0,
  updatedAt: customer.updatedAt ?? customer.createdAt
});

const hasLegacyAddressData = (addresses: SavedAddress[]) => {
  return addresses.some((address) => legacyAreaNames.has(address.area) || seededAddressIds.has(address.id));
};

const hasLegacyOrderData = (orders: Order[]) => {
  return orders.some((order) => legacyAreaNames.has(order.deliveryAddress.area));
};

export const mockStorage = {
  async getUser(): Promise<User> {
    const stored = await localStore.getJson<User>(USER_KEY);
    if (stored) {
      const hydrated = userWithDefaults(stored);
      await localStore.setJson(USER_KEY, hydrated);
      return hydrated;
    }
    await localStore.setJson(USER_KEY, mockUser);
    return mockUser;
  },

  async setUser(user: User): Promise<void> {
    await localStore.setJson(USER_KEY, userWithDefaults(user));
  },

  async getCustomers(): Promise<CustomerRecord[]> {
    const stored = await localStore.getJson<CustomerRecord[]>(CUSTOMERS_KEY);
    if (stored) {
      const hydrated = stored.map(hydrateCustomer);
      await localStore.setJson(CUSTOMERS_KEY, hydrated);
      return hydrated;
    }
    await localStore.setJson(CUSTOMERS_KEY, mockCustomers);
    return mockCustomers;
  },

  async setCustomers(customers: CustomerRecord[]): Promise<void> {
    await localStore.setJson(CUSTOMERS_KEY, customers.map(hydrateCustomer));
  },

  async getAddresses(): Promise<SavedAddress[]> {
    const stored = await localStore.getJson<SavedAddress[]>(ADDRESSES_KEY);
    if (stored && !hasLegacyAddressData(stored)) {
      const cleaned = stripRemovedAddressFields(stored);
      await localStore.setJson(ADDRESSES_KEY, cleaned);
      return cleaned;
    }
    await localStore.setJson(ADDRESSES_KEY, mockSavedAddresses);
    return mockSavedAddresses;
  },

  async setAddresses(addresses: SavedAddress[]): Promise<void> {
    await localStore.setJson(ADDRESSES_KEY, stripRemovedAddressFields(addresses));
  },

  async getOrders(): Promise<Order[]> {
    const stored = await localStore.getJson<Order[]>(ORDERS_KEY);
    if (stored && !hasLegacyOrderData(stored)) {
      const hydrated = stored.map(hydrateOrder);
      await localStore.setJson(ORDERS_KEY, hydrated);
      return hydrated;
    }
    await localStore.setJson(ORDERS_KEY, mockOrders);
    return mockOrders;
  },

  async setOrders(orders: Order[]): Promise<void> {
    await localStore.setJson(ORDERS_KEY, orders.map(hydrateOrder));
  },

  async getNotifications(): Promise<Notification[]> {
    const stored = await localStore.getJson<Notification[]>(NOTIFICATIONS_KEY);
    if (stored) {
      return stored;
    }
    await localStore.setJson(NOTIFICATIONS_KEY, mockNotifications);
    return mockNotifications;
  },

  async setNotifications(notifications: Notification[]): Promise<void> {
    await localStore.setJson(NOTIFICATIONS_KEY, notifications);
  },

  async getPayments(): Promise<Payment[]> {
    return (await localStore.getJson<Payment[]>(PAYMENTS_KEY)) ?? [];
  },

  async setPayments(payments: Payment[]): Promise<void> {
    await localStore.setJson(PAYMENTS_KEY, payments);
  }
};
