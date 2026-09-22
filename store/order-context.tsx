import { createContext, PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { productCatalog, type ProductCatalog } from "../constants/pricing";
import { useRequiredContext } from "../hooks/use-required-context";
import { repositories } from "../repositories";
import { analytics } from "../services/analytics";
import type { DeliveryAddress, SavedAddress, UpsertSavedAddressInput } from "../types/address";
import type { CreateOrderInput, DeliverySchedule, Order, OrderCharge, OrderDraft, OrderMessage, OrderType } from "../types/order";
import type { PaymentMethod } from "../types/payment";
import type { PublicSettings } from "../types/settings";
import { getDefaultDeliverySchedule } from "../utils/delivery";
import { emptyDeliveryAddress, normalizeDeliveryAddress, savedAddressToDeliveryAddress } from "../utils/address";
import { calculateOrderPricing } from "../utils/order";

type LoadStatus = "idle" | "loading" | "success" | "error";

type OrderContextValue = {
  orders: Order[];
  paymentMethods: PaymentMethod[];
  savedAddresses: SavedAddress[];
  pricingCatalog: ProductCatalog;
  draft: OrderDraft;
  status: LoadStatus;
  addressesLoading: boolean;
  settingsLoading: boolean;
  submitting: boolean;
  error: string | null;
  activeOrder: Order | null;
  loadOrders(): Promise<void>;
  loadPaymentMethods(): Promise<void>;
  loadSavedAddresses(): Promise<void>;
  loadPublicSettings(): Promise<void>;
  getOrder(id: string): Promise<Order>;
  startOrder(orderType?: OrderType): void;
  setOrderType(orderType: OrderType): void;
  setQuantity(quantity: number): void;
  setDeliveryAddress(address: DeliveryAddress): void;
  setDeliverySchedule(schedule: DeliverySchedule): void;
  setDeliveryCharges(charges: OrderCharge[]): void;
  setCustomerRemarks(remarks: string): void;
  setPaymentMethod(paymentMethodId: string): void;
  createSavedAddress(input: UpsertSavedAddressInput): Promise<SavedAddress>;
  updateSavedAddress(id: string, input: UpsertSavedAddressInput): Promise<SavedAddress>;
  deleteSavedAddress(id: string): Promise<void>;
  submitOrder(): Promise<Order>;
  cancelOrder(id: string): Promise<Order>;
  confirmReceived(id: string): Promise<Order>;
  sendOrderMessage(id: string, body: string): Promise<OrderMessage[]>;
  reorder(order: Order): void;
  clearDraft(): void;
};

const OrderContext = createContext<OrderContextValue | undefined>(undefined);

const freshDraft = (): OrderDraft => ({ quantity: 1, deliverySchedule: getDefaultDeliverySchedule(), charges: [] });

const initialDraft: OrderDraft = freshDraft();

const toMessage = (error: unknown): string => {
  return typeof (error as { message?: unknown }).message === "string" ? String((error as { message: string }).message) : "Unable to load orders right now.";
};

const firstSavedAddressFrom = (addresses: SavedAddress[]): DeliveryAddress | undefined => {
  const address = addresses[0];
  return address ? savedAddressToDeliveryAddress(address) : undefined;
};

const preferredPaymentMethod = (methods: PaymentMethod[]): PaymentMethod | undefined => {
  return methods.find((method) => method.enabled && method.type === "cash") ?? methods.find((method) => method.enabled && method.type !== "mobile_money");
};

const catalogFromSettings = (settings: PublicSettings): ProductCatalog => ({
  first_purchase: {
    ...productCatalog.first_purchase,
    label: settings.products.first_purchase.name || productCatalog.first_purchase.label,
    unitPrice: settings.products.first_purchase.unitPrice
  },
  refill: {
    ...productCatalog.refill,
    label: settings.products.refill.name || productCatalog.refill.label,
    unitPrice: settings.products.refill.unitPrice
  }
});

export const OrderProvider = ({ children }: PropsWithChildren) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const orderVersions = useRef(new Map<string, number>());
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [pricingCatalog, setPricingCatalog] = useState<ProductCatalog>(productCatalog);
  const [draft, setDraft] = useState<OrderDraft>(initialDraft);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPublicSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const settings = await repositories.settings.public();
      setPricingCatalog(catalogFromSettings(settings));
    } catch {
      setPricingCatalog(productCatalog);
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPublicSettings().catch(() => undefined);
  }, [loadPublicSettings]);

  const loadPaymentMethods = useCallback(async () => {
    const methods = await repositories.payments.listMethods();
    setPaymentMethods(methods);
    setDraft((current) => ({
      ...current,
      paymentMethodId: current.paymentMethodId && methods.some((method) => method.id === current.paymentMethodId && method.enabled && method.type !== "mobile_money")
        ? current.paymentMethodId
        : preferredPaymentMethod(methods)?.id
    }));
  }, []);

  const loadSavedAddresses = useCallback(async () => {
    setAddressesLoading(true);
    try {
      const addresses = await repositories.addresses.list();
      setSavedAddresses(addresses);
      setDraft((current) => ({
        ...current,
        deliveryAddress: current.deliveryAddress ?? firstSavedAddressFrom(addresses)
      }));
    } finally {
      setAddressesLoading(false);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const [nextOrders] = await Promise.all([
        repositories.orders.list(),
        loadPaymentMethods(),
        loadSavedAddresses(),
        loadPublicSettings()
      ]);
      setOrders(nextOrders);
      setStatus("success");
    } catch (err) {
      setError(toMessage(err));
      setStatus("error");
    }
  }, [loadPaymentMethods, loadPublicSettings, loadSavedAddresses]);

  const getOrder = useCallback(async (id: string) => {
    const version = (orderVersions.current.get(id) ?? 0) + 1;
    orderVersions.current.set(id, version);
    const fresh = await repositories.orders.getById(id);
    if (orderVersions.current.get(id) === version) {
      setOrders((current) => [fresh, ...current.filter((order) => order.id !== id)]);
    }
    return fresh;
  }, []);

  const startOrder = useCallback((orderType?: OrderType) => {
    setDraft({
      ...freshDraft(),
      orderType,
      deliveryAddress: firstSavedAddressFrom(savedAddresses),
      paymentMethodId: preferredPaymentMethod(paymentMethods)?.id
    });
    analytics.track("order_started", { orderType: orderType ?? null });
  }, [paymentMethods, savedAddresses]);

  const setOrderType = useCallback((orderType: OrderType) => {
    setDraft((current) => ({ ...current, orderType }));
  }, []);

  const setQuantity = useCallback((quantity: number) => {
    const safeQuantity = Math.max(1, Math.floor(quantity));
    setDraft((current) => ({ ...current, quantity: safeQuantity }));
  }, []);

  const setDeliveryAddress = useCallback((address: DeliveryAddress) => {
    setDraft((current) => ({ ...current, deliveryAddress: normalizeDeliveryAddress(address) }));
  }, []);

  const setDeliverySchedule = useCallback((schedule: DeliverySchedule) => {
    setDraft((current) => ({ ...current, deliverySchedule: schedule }));
  }, []);

  const setDeliveryCharges = useCallback((charges: OrderCharge[]) => {
    setDraft((current) => ({ ...current, charges }));
  }, []);

  const setCustomerRemarks = useCallback((remarks: string) => {
    setDraft((current) => ({ ...current, customerRemarks: remarks }));
  }, []);

  const setPaymentMethod = useCallback((paymentMethodId: string) => {
    setDraft((current) => ({ ...current, paymentMethodId }));
  }, []);

  const createSavedAddress = useCallback(async (input: UpsertSavedAddressInput) => {
    const saved = await repositories.addresses.create(input);
    setSavedAddresses((current) => [saved, ...current]);
    setDraft((current) => ({ ...current, deliveryAddress: savedAddressToDeliveryAddress(saved) }));
    return saved;
  }, []);

  const updateSavedAddress = useCallback(async (id: string, input: UpsertSavedAddressInput) => {
    const saved = await repositories.addresses.update(id, input);
    setSavedAddresses((current) => current.map((address) => address.id === saved.id ? saved : address));
    setDraft((current) => ({ ...current, deliveryAddress: savedAddressToDeliveryAddress(saved) }));
    return saved;
  }, []);

  const deleteSavedAddress = useCallback(async (id: string) => {
    await repositories.addresses.remove(id);
    setSavedAddresses((current) => current.filter((address) => address.id !== id));
  }, []);

  const submitOrder = useCallback(async () => {
    if (!draft.orderType) {
      throw new Error("Choose an order type.");
    }
    if (!draft.deliveryAddress) {
      throw new Error("Enter a delivery address.");
    }
    if (!draft.deliverySchedule) {
      throw new Error("Choose a delivery time.");
    }
    if (!draft.paymentMethodId) {
      throw new Error("Choose a payment method.");
    }

    setSubmitting(true);
    setError(null);
    try {
      const charges = draft.charges ?? [];
      const input: CreateOrderInput = {
        orderType: draft.orderType,
        quantity: calculateOrderPricing(draft.orderType, draft.quantity, charges, pricingCatalog).quantity,
        deliveryAddress: normalizeDeliveryAddress(draft.deliveryAddress),
        deliverySchedule: draft.deliverySchedule,
        customerRemarks: draft.customerRemarks?.trim() || undefined,
        charges,
        paymentMethodId: draft.paymentMethodId
      };
      const order = await repositories.orders.create(input);
      analytics.track("order_created", { orderType: order.orderType, total: order.total });
      analytics.track("payment_started", { methodId: draft.paymentMethodId });
      const payment = await repositories.payments.initialize({ orderId: order.id, methodId: draft.paymentMethodId });
      const orderWithPayment: Order = { ...order, payment, paymentStatus: payment.status };
      setOrders((current) => [orderWithPayment, ...current.filter((item) => item.id !== order.id)]);
      setDraft({ ...freshDraft(), deliveryAddress: firstSavedAddressFrom(savedAddresses) });
      return orderWithPayment;
    } catch (err) {
      setError(toMessage(err));
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [draft, pricingCatalog, savedAddresses]);

  const cancelOrder = useCallback(async (id: string) => {
    orderVersions.current.set(id, (orderVersions.current.get(id) ?? 0) + 1);
    const updated = await repositories.orders.cancel(id);
    orderVersions.current.set(id, (orderVersions.current.get(id) ?? 0) + 1);
    setOrders((current) => current.map((order) => order.id === id ? updated : order));
    return updated;
  }, []);

  const confirmReceived = useCallback(async (id: string) => {
    orderVersions.current.set(id, (orderVersions.current.get(id) ?? 0) + 1);
    const updated = await repositories.orders.confirmReceived(id);
    orderVersions.current.set(id, (orderVersions.current.get(id) ?? 0) + 1);
    setOrders((current) => current.map((order) => order.id === id ? updated : order));
    return updated;
  }, []);

  const sendOrderMessage = useCallback(async (id: string, body: string) => {
    const updated = await repositories.orders.message(id, { body });
    setOrders((current) => current.map((order) => order.id === id ? updated : order));
    return updated.messages ?? [];
  }, []);

  const reorder = useCallback((order: Order) => {
    setDraft({
      ...freshDraft(),
      orderType: order.orderType,
      quantity: order.quantity,
      deliveryAddress: order.deliveryAddress,
      charges: order.charges,
      paymentMethodId: preferredPaymentMethod(paymentMethods)?.id
    });
    analytics.track("order_started", { orderType: order.orderType, reorder: true });
  }, [paymentMethods]);

  const clearDraft = useCallback(() => setDraft({ ...freshDraft(), deliveryAddress: firstSavedAddressFrom(savedAddresses) }), [savedAddresses]);

  const activeOrder = useMemo(() => {
    return orders.find((order) => order.status === "delivered" && !order.customerReceivedAt)
      ?? orders.find((order) => ["pending", "confirmed", "processing", "out_for_delivery"].includes(order.status)) ?? null;
  }, [orders]);

  const value = useMemo<OrderContextValue>(() => ({
    orders,
    paymentMethods,
    savedAddresses,
    pricingCatalog,
    draft,
    status,
    addressesLoading,
    settingsLoading,
    submitting,
    error,
    activeOrder,
    loadOrders,
    loadPaymentMethods,
    loadSavedAddresses,
    loadPublicSettings,
    getOrder,
    startOrder,
    setOrderType,
    setQuantity,
    setDeliveryAddress,
    setDeliverySchedule,
    setDeliveryCharges,
    setCustomerRemarks,
    setPaymentMethod,
    createSavedAddress,
    updateSavedAddress,
    deleteSavedAddress,
    submitOrder,
    cancelOrder,
    confirmReceived,
    sendOrderMessage,
    reorder,
    clearDraft
  }), [orders, paymentMethods, savedAddresses, pricingCatalog, draft, status, addressesLoading, settingsLoading, submitting, error, activeOrder, loadOrders, loadPaymentMethods, loadSavedAddresses, loadPublicSettings, getOrder, startOrder, setOrderType, setQuantity, setDeliveryAddress, setDeliverySchedule, setDeliveryCharges, setCustomerRemarks, setPaymentMethod, createSavedAddress, updateSavedAddress, deleteSavedAddress, submitOrder, cancelOrder, confirmReceived, sendOrderMessage, reorder, clearDraft]);

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};

export const useOrders = (): OrderContextValue => useRequiredContext(OrderContext, "useOrders");
