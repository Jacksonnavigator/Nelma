import { appConfig } from "../../config/app";
import { catalogItem, productCatalog } from "../../constants/pricing";
import { buildOrderTimeline, calculateOrderPricing } from "../../utils/order";
import type { AppRepositories } from "../contracts";
import { normalizeDeliveryAddress } from "../../utils/address";
import { calculateDeliveryQuote, chargesForDeliveryQuote, getDefaultDeliverySchedule } from "../../utils/delivery";
import { canStartDelivery, driverSummaryFromOrders, isDriverActiveDelivery, isDriverHistoryDelivery } from "../../utils/driver-deliveries";
import type { AuthSession, ForgotPasswordResult } from "../../types/auth";
import type { CustomerRecord } from "../../types/business";
import type { Notification } from "../../types/notification";
import type { CreateOrderMessageInput, DeclineAssignmentInput, DeliveryIssueInput, DriverDeliveryActionStatus, DriverDeliveryHandover, Order, OrderMessage } from "../../types/order";
import type { Payment } from "../../types/payment";
import type { PublicSettings } from "../../types/settings";
import type { SavedAddress } from "../../types/address";
import type { UpdateUserInput, User } from "../../types/user";
import { mockPaymentMethods } from "./mock-data";
import { mockStorage } from "./storage";

// Demo only: duty status lives for the app session.
let mockDriverOnDuty = true;

const latency = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 350));
};

const sessionForUser = (user: User): AuthSession => ({
  user,
  tokens: {
    accessToken: "mock_access_token",
    refreshToken: "mock_refresh_token",
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    audience: "mobile"
  }
});

const addNotification = async (notification: Notification): Promise<void> => {
  const notifications = await mockStorage.getNotifications();
  await mockStorage.setNotifications([notification, ...notifications]);
};

const customerFromUser = (user: User, nowIso: string): CustomerRecord => ({
  id: user.id,
  fullName: user.fullName,
  phone: user.phone,
  email: user.email ?? "",
  preferredLanguage: user.preferredLanguage,
  addressLocationPreference: user.addressLocationPreference,
  totalOrders: 0,
  totalSpend: 0,
  createdAt: user.createdAt,
  updatedAt: nowIso
});

const upsertCustomer = async (user: User, order?: Order): Promise<void> => {
  const customers = await mockStorage.getCustomers();
  const nowIso = new Date().toISOString();
  const orders = await mockStorage.getOrders();
  const customerOrders = (order ? [order, ...orders.filter((item) => item.id !== order.id)] : orders).filter((item) => item.customerId === user.id && item.status !== "cancelled");
  const existing = customers.find((customer) => customer.id === user.id) ?? customerFromUser(user, nowIso);
  const nextCustomer: CustomerRecord = {
    ...existing,
    fullName: user.fullName,
    phone: user.phone,
    email: user.email ?? "",
    preferredLanguage: user.preferredLanguage,
    addressLocationPreference: user.addressLocationPreference,
    primaryArea: order?.deliveryAddress.area ?? existing.primaryArea,
    totalOrders: customerOrders.length,
    totalSpend: customerOrders.reduce((sum, item) => sum + item.total, 0),
    lastOrderAt: customerOrders[0]?.createdAt ?? existing.lastOrderAt,
    updatedAt: nowIso
  };
  await mockStorage.setCustomers([nextCustomer, ...customers.filter((customer) => customer.id !== user.id)]);
};

const updateOrder = async (id: string, updater: (order: Order) => Order): Promise<Order> => {
  const orders = await mockStorage.getOrders();
  let updated: Order | null = null;
  const next = orders.map((order) => {
    if (order.id !== id) {
      return order;
    }
    updated = updater(order);
    return updated;
  });
  if (!updated) {
    throw new Error("Order not found.");
  }
  await mockStorage.setOrders(next);
  return updated;
};

const assertMockDriver = async (): Promise<User> => {
  const user = await mockStorage.getUser();
  if (user.role !== "DRIVER") {
    throw new Error("Driver access required.");
  }
  return user;
};

const updateDriverDelivery = async (id: string, user: User, nextStatus: DriverDeliveryActionStatus): Promise<Order> => {
  const nowIso = new Date().toISOString();
  return updateOrder(id, (order) => {
    if (order.assignedDriverId !== user.id) {
      throw new Error("This delivery is no longer assigned to you.");
    }
    if (nextStatus === "out_for_delivery" && !canStartDelivery(order)) {
      throw new Error("This delivery cannot be started yet.");
    }
    if (nextStatus === "delivered" && order.status !== "out_for_delivery") {
      throw new Error("Start the delivery before marking it delivered.");
    }
    return {
      ...order,
      status: nextStatus,
      updatedAt: nowIso,
      timeline: buildOrderTimeline(nextStatus, nowIso),
      availableActions: nextStatus === "delivered" ? ["mark_received", "reorder", "contact_support", "message_nelma"] : order.availableActions
    };
  });
};

export const mockRepositories: AppRepositories = {
  auth: {
    async register(input): Promise<AuthSession> {
      await latency();
      const nowIso = new Date().toISOString();
      const user: User = {
        id: "user_" + Date.now(),
        fullName: input.fullName.trim(),
        phone: input.phone.trim(),
        email: input.email.trim().toLowerCase(),
        avatarUrl: null,
        role: "USER",
        preferredLanguage: input.preferredLanguage ?? "en",
        addressLocationPreference: input.addressLocationPreference ?? "single",
        notificationPreferences: {
          orderUpdates: true,
          paymentUpdates: true,
          promotions: false,
          systemAnnouncements: true
        },
        createdAt: nowIso
      };
      await mockStorage.setUser(user);
      await upsertCustomer(user);
      if (input.signupAddress) {
        const signupAddress: SavedAddress = {
          ...normalizeDeliveryAddress(input.signupAddress),
          id: "address_signup_" + Date.now(),
          label: input.addressLocationPreference === "multiple" ? "First delivery location" : "My delivery location",
          createdAt: nowIso,
          updatedAt: nowIso
        };
        await mockStorage.setAddresses([signupAddress]);
      } else {
        await mockStorage.setAddresses([]);
      }
      return sessionForUser(user);
    },

    async login(): Promise<AuthSession> {
      await latency();
      const user = await mockStorage.getUser();
      await upsertCustomer(user);
      return sessionForUser(user);
    },

    async forgotPassword(): Promise<ForgotPasswordResult> {
      await latency();
      return {
        resetToken: "123456",
        message: "If the account exists, NELMA will send a verification code. In mock mode, use 123456."
      };
    },

    async resetPassword(): Promise<void> {
      await latency();
    },

    async refresh(): Promise<AuthSession> {
      await latency();
      return sessionForUser(await mockStorage.getUser());
    },

    async logout(): Promise<void> {
      await latency();
    },

    async getCurrentUser(): Promise<User> {
      await latency();
      return mockStorage.getUser();
    }
  },

  user: {
    async getCurrentUser(): Promise<User> {
      await latency();
      return mockStorage.getUser();
    },

    async update(input: UpdateUserInput): Promise<User> {
      await latency();
      const current = await mockStorage.getUser();
      const next: User = {
        ...current,
        ...input,
        notificationPreferences: {
          ...current.notificationPreferences,
          ...input.notificationPreferences
        }
      };
      await mockStorage.setUser(next);
      await upsertCustomer(next);
      return next;
    },

    async changePassword(): Promise<void> {
      await latency();
    },

    async deleteAccount(): Promise<void> {
      await latency();
    }
  },

  addresses: {
    async list(): Promise<SavedAddress[]> {
      await latency();
      return mockStorage.getAddresses();
    },

    async create(input): Promise<SavedAddress> {
      await latency();
      const nowIso = new Date().toISOString();
      const saved: SavedAddress = {
        ...normalizeDeliveryAddress(input),
        id: "address_" + Date.now(),
        label: input.label.trim(),
        createdAt: nowIso,
        updatedAt: nowIso
      };
      const addresses = await mockStorage.getAddresses();
      await mockStorage.setAddresses([saved, ...addresses]);
      return saved;
    },

    async update(id, input): Promise<SavedAddress> {
      await latency();
      const addresses = await mockStorage.getAddresses();
      const nowIso = new Date().toISOString();
      let updated: SavedAddress | null = null;
      const next: SavedAddress[] = addresses.map((address): SavedAddress => {
        if (address.id !== id) {
          return address;
        }
        const nextAddress: SavedAddress = {
          ...address,
          ...normalizeDeliveryAddress(input),
          label: input.label.trim(),
          updatedAt: nowIso
        };
        updated = nextAddress;
        return nextAddress;
      });
      if (!updated) {
        throw new Error("Address not found.");
      }
      await mockStorage.setAddresses(next);
      return updated;
    },

    async remove(id): Promise<void> {
      await latency();
      const addresses = await mockStorage.getAddresses();
      await mockStorage.setAddresses(addresses.filter((address) => address.id !== id));
    }
  },

  orders: {
    async list(): Promise<Order[]> {
      await latency();
      return mockStorage.getOrders();
    },

    async getById(id: string): Promise<Order> {
      await latency();
      const order = (await mockStorage.getOrders()).find((item) => item.id === id);
      if (!order) {
        throw new Error("Order not found.");
      }
      return order;
    },

    async create(input): Promise<Order> {
      await latency();
      const user = await mockStorage.getUser();
      const charges = input.charges.length ? input.charges : chargesForDeliveryQuote(calculateDeliveryQuote(input.deliveryAddress));
      const pricing = calculateOrderPricing(input.orderType, input.quantity, charges);
      const method = mockPaymentMethods.find((item) => item.id === input.paymentMethodId) ?? mockPaymentMethods[0];
      const nowIso = new Date().toISOString();
      const id = "order_" + Date.now();
      const orderNumber = "NELMA-" + String(Date.now()).slice(-5);
      const paymentStatus = method.type === "cash" ? "pending" : "processing";
      const remark = input.customerRemarks?.trim();
      const messages: OrderMessage[] = remark ? [{ id: "message_" + Date.now(), orderId: id, sender: "customer", body: remark, createdAt: nowIso }] : [];
      const order: Order = {
        id,
        orderNumber,
        customerId: user.id,
        createdAt: nowIso,
        updatedAt: nowIso,
        orderType: input.orderType,
        items: [
          {
            productName: catalogItem(productCatalog, input.orderType).productName,
            orderType: input.orderType,
            quantity: pricing.quantity,
            unitPrice: pricing.unitPrice,
            subtotal: pricing.subtotal
          }
        ],
        quantity: pricing.quantity,
        deliveryAddress: normalizeDeliveryAddress(input.deliveryAddress),
        deliverySchedule: input.deliverySchedule ?? getDefaultDeliverySchedule(),
        customerRemarks: remark || undefined,
        customerReceivedAt: null,
        messages,
        subtotal: pricing.subtotal,
        charges: pricing.charges,
        total: pricing.total,
        currency: appConfig.currency,
        status: "confirmed",
        paymentStatus,
        payment: null,
        timeline: buildOrderTimeline("confirmed", nowIso),
        availableActions: ["cancel", "reorder", "contact_support", "message_nelma"]
      };
      const orders = await mockStorage.getOrders();
      await mockStorage.setOrders([order, ...orders]);
      await upsertCustomer(user, order);
      await addNotification({
        id: "notification_" + Date.now(),
        type: "order_received",
        title: "Order received",
        body: "NELMA received order " + order.orderNumber + " for delivery to " + order.deliveryAddress.area + ".",
        read: false,
        createdAt: nowIso,
        orderId: order.id
      });
      return order;
    },

    async cancel(id: string): Promise<Order> {
      await latency();
      const nowIso = new Date().toISOString();
      return updateOrder(id, (order) => ({
        ...order,
        status: "cancelled" as const,
        paymentStatus: order.paymentStatus === "paid" ? order.paymentStatus : "cancelled" as const,
        updatedAt: nowIso,
        timeline: buildOrderTimeline("cancelled", nowIso),
        availableActions: ["contact_support", "message_nelma"] as Order["availableActions"]
      }));
    },

    async confirmReceived(id: string): Promise<Order> {
      await latency();
      const nowIso = new Date().toISOString();
      return updateOrder(id, (order) => {
        const message: OrderMessage = {
          id: "message_received_" + Date.now(),
          orderId: order.id,
          sender: "system",
          body: "Customer confirmed this order was received.",
          createdAt: nowIso
        };
        return {
          ...order,
          status: "received" as const,
          customerReceivedAt: nowIso,
          updatedAt: nowIso,
          messages: [...(order.messages ?? []), message],
          timeline: buildOrderTimeline("received", nowIso),
          availableActions: ["reorder", "contact_support", "message_nelma"] as Order["availableActions"]
        };
      });
    },

    async getDeliveryCode(_id: string): Promise<string> {
      await latency();
      return "4821";
    },

    async message(id: string, input: CreateOrderMessageInput): Promise<Order> {
      await latency();
      const body = input.body.trim();
      if (!body) {
        throw new Error("Enter a message before sending.");
      }
      const nowIso = new Date().toISOString();
      return updateOrder(id, (order) => ({
        ...order,
        updatedAt: nowIso,
        messages: [...(order.messages ?? []), { id: "message_" + Date.now(), orderId: order.id, sender: "customer", body, createdAt: nowIso }]
      }));
    }
  },
  driver: {
    async listActive(): Promise<Order[]> {
      await latency();
      const user = await assertMockDriver();
      const orders = await mockStorage.getOrders();
      return orders.filter((order) => order.assignedDriverId === user.id && isDriverActiveDelivery(order));
    },

    async listHistory(page: number, pageSize = 30) {
      await latency();
      const user = await assertMockDriver();
      const closed = (await mockStorage.getOrders()).filter((order) => order.assignedDriverId === user.id && isDriverHistoryDelivery(order));
      const start = (page - 1) * pageSize;
      const totalPages = Math.max(1, Math.ceil(closed.length / pageSize));
      return { items: closed.slice(start, start + pageSize), page, pageSize, total: closed.length, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 };
    },

    async reportIssue(id: string, input: DeliveryIssueInput): Promise<Order> {
      await latency();
      const user = await assertMockDriver();
      const nowIso = new Date().toISOString();
      return updateOrder(id, (order) => {
        if (order.assignedDriverId !== user.id) {
          throw new Error("This delivery is no longer assigned to you.");
        }
        return { ...order, status: order.status === "out_for_delivery" ? "processing" : order.status, updatedAt: nowIso, timeline: buildOrderTimeline("processing", nowIso) };
      });
    },

    async getDelivery(id: string): Promise<Order> {
      await latency();
      const user = await assertMockDriver();
      const order = (await mockStorage.getOrders()).find((item) => item.id === id && item.assignedDriverId === user.id);
      if (!order) {
        throw new Error("This delivery is no longer assigned to you.");
      }
      return order;
    },

    async updateStatus(id: string, status: DriverDeliveryActionStatus, _handover?: DriverDeliveryHandover): Promise<Order> {
      await latency();
      const user = await assertMockDriver();
      if (status !== "out_for_delivery" && status !== "delivered") {
        throw new Error("Drivers can only update active delivery progress.");
      }
      return updateDriverDelivery(id, user, status);
    },

    async accept(id: string): Promise<Order> {
      await latency();
      const user = await assertMockDriver();
      return updateOrder(id, (order) => {
        if (order.assignedDriverId !== user.id) {
          throw new Error("This delivery is no longer assigned to you.");
        }
        return { ...order, driverAcceptedAt: order.driverAcceptedAt ?? new Date().toISOString() };
      });
    },

    async decline(id: string, _input: DeclineAssignmentInput): Promise<void> {
      await latency();
      const user = await assertMockDriver();
      await updateOrder(id, (order) => {
        if (order.assignedDriverId !== user.id) {
          throw new Error("This delivery is no longer assigned to you.");
        }
        if (!canStartDelivery(order)) {
          throw new Error("Started deliveries cannot be declined. Report a problem instead.");
        }
        return { ...order, assignedDriverId: null, driverAssignedAt: null, driverAcceptedAt: null };
      });
    },

    async setDuty(onDuty: boolean): Promise<boolean> {
      await latency();
      await assertMockDriver();
      mockDriverOnDuty = onDuty;
      return mockDriverOnDuty;
    },

    async shareLocation(): Promise<void> {
      // Demo mode has no dispatch to share with.
    },

    async getSummary() {
      await latency();
      const user = await assertMockDriver();
      const orders = (await mockStorage.getOrders()).filter((order) => order.assignedDriverId === user.id);
      return { ...driverSummaryFromOrders(orders), onDuty: mockDriverOnDuty };
    }
  },
  payments: {
    async listMethods() {
      await latency();
      return mockPaymentMethods.filter((method) => method.enabled);
    },

    async initialize(input): Promise<Payment> {
      await latency();
      const order = await mockRepositories.orders.getById(input.orderId);
      const method = mockPaymentMethods.find((item) => item.id === input.methodId) ?? mockPaymentMethods[0];
      const nowIso = new Date().toISOString();
      const payment: Payment = {
        id: "payment_" + Date.now(),
        orderId: input.orderId,
        amount: order.total,
        currency: appConfig.currency,
        methodId: method.id,
        methodLabel: method.label,
        status: method.type === "cash" ? "pending" : "processing",
        createdAt: nowIso,
        updatedAt: nowIso
      };
      const payments = await mockStorage.getPayments();
      await mockStorage.setPayments([payment, ...payments]);
      return payment;
    },

    async getById(id: string): Promise<Payment> {
      await latency();
      const payment = (await mockStorage.getPayments()).find((item) => item.id === id);
      if (!payment) {
        throw new Error("Payment not found.");
      }
      return payment;
    }
  },

  notifications: {
    async list(): Promise<Notification[]> {
      await latency();
      return mockStorage.getNotifications();
    },

    async markRead(id: string): Promise<Notification> {
      await latency();
      const notifications = await mockStorage.getNotifications();
      const next = notifications.map((notification) => notification.id === id ? { ...notification, read: true } : notification);
      await mockStorage.setNotifications(next);
      const updated = next.find((notification) => notification.id === id);
      if (!updated) {
        throw new Error("Notification not found.");
      }
      return updated;
    },

    async readAll(): Promise<void> {
      await latency();
      const notifications = await mockStorage.getNotifications();
      await mockStorage.setNotifications(notifications.map((notification) => ({ ...notification, read: true })));
    }
  },

  settings: {
    async public(): Promise<PublicSettings> {
      await latency();
      return {
        currency: appConfig.currency,
        products: Object.fromEntries(Object.values(productCatalog).map((product) => [
          product.type,
          { name: product.label, unitPrice: product.unitPrice, description: product.description, imageUrl: null, sortOrder: product.sortOrder }
        ]))
      };
    }
  }
};




