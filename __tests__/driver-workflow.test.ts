import { createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { baseOrder } from "./fixtures/driver-order";
import type { Order } from "../types/order";

const api = vi.hoisted(() => ({ listDeliveries: vi.fn(), getDelivery: vi.fn(), updateStatus: vi.fn(), confirmReceived: vi.fn() }));
const navigation = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }));
const native = vi.hoisted(() => ({ openURL: vi.fn(async () => undefined) }));
vi.mock("../repositories", () => ({ repositories: { driver: api } }));
vi.mock("expo-router", async () => {
  const { useEffect } = await import("react");
  return { router: navigation, useLocalSearchParams: () => ({ id: "order_1" }), useFocusEffect: (callback: () => void | (() => void)) => useEffect(callback, [callback]) };
});
vi.mock("../hooks/use-translation", () => ({ useTranslation: () => ({ t: (value: string) => value }) }));
vi.mock("../store/auth-context", () => ({ useAuth: () => ({ user: { fullName: "Musa Driver" } }) }));
vi.mock("../services/haptics", () => ({ haptics: { selection: vi.fn(), success: vi.fn(), light: vi.fn() } }));
vi.mock("lucide-react-native", () => ({ ArrowLeft: () => null, ChevronDown: () => null, ChevronUp: () => null, ChevronRight: () => null, Clock3: () => null, Droplets: () => null, MapPin: () => null, RefreshCw: () => null, Navigation: () => null, Phone: () => null }));
vi.mock("react-native", () => ({
  View: "view", Text: "text", Pressable: "pressable", ScrollView: "scroll", ActivityIndicator: "loading", RefreshControl: "refresh",
  Platform: { OS: "android", select: (values: Record<string, unknown>) => values.android ?? values.default },
  StyleSheet: { create: (styles: unknown) => styles }, Linking: { openURL: native.openURL },
  FlatList: (props: { ListHeaderComponent: import("react").ReactNode; data: Order[]; renderItem: (entry: { item: Order }) => import("react").ReactNode }) => createElement("list", null, props.ListHeaderComponent, ...props.data.map((item) => createElement("item", { key: item.id }, props.renderItem({ item }))))
}));
vi.mock("../components", () => ({
  AppTopBar: () => null,
  Screen: ({ children }: { children: import("react").ReactNode }) => createElement("screen", null, children),
  Button: (props: object) => createElement("button", props),
  BottomActionBar: (props: object) => createElement("actionbar", props),
  ConfirmDialog: (props: object) => createElement("dialog", props),
  ErrorState: (props: object) => createElement("error", props),
  EmptyState: (props: object) => createElement("empty", props),
  OrderTimeline: () => createElement("timeline"),
  StatusBadge: (props: object) => createElement("badge", props),
  DriverDeliveryCard: (props: object) => createElement("delivery", props)
}));

import Detail from "../app/driver/delivery/[id]";
import Deliveries from "../app/driver/(tabs)/deliveries";
let renderer: ReactTestRenderer | undefined;
async function mount(Component = Detail) {
  await act(async () => { renderer = create(createElement(Component)); });
}
const action = () => renderer!.root.find((node) => String(node.type) === "actionbar");
async function confirmAction() {
  await act(async () => { action().props.onPress(); });
  expect(renderer!.root.findByType("dialog").props.visible).toBe(true);
  await act(async () => { await renderer!.root.findByType("dialog").props.onConfirm(); });
}

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.clearAllMocks();
  api.getDelivery.mockResolvedValue({ ...baseOrder });
  api.listDeliveries.mockResolvedValue([]);
});
afterEach(async () => {
  await act(async () => { renderer?.unmount(); });
  renderer = undefined;
});

describe("simplified driver workflow", () => {
  it("finishes the driver task at handover and leaves receipt to the customer", async () => {
    api.updateStatus.mockImplementation(async (_id: string, status: Order["status"]) => ({ ...baseOrder, status }));
    api.confirmReceived.mockResolvedValue({ ...baseOrder, status: "received", customerReceivedAt: "2026-09-21T12:00:00Z" });
    await mount();
    expect(action().props.buttonTitle).toBe("Start Delivery");
    expect(renderer!.root.findAll((node) => String(node.type) === "timeline")).toHaveLength(0);
    expect(api.updateStatus).not.toHaveBeenCalled();
    await confirmAction();
    expect(api.updateStatus).toHaveBeenLastCalledWith(baseOrder.id, "out_for_delivery");
    expect(action().props.buttonTitle).toBe("Mark Delivered");
    await confirmAction();
    expect(api.updateStatus).toHaveBeenLastCalledWith(baseOrder.id, "delivered");
    expect(api.confirmReceived).not.toHaveBeenCalled();
    expect(action().props.buttonTitle).toBe("Back to Deliveries");
    await act(async () => { action().props.onPress(); });
    expect(navigation.replace).toHaveBeenCalledWith("/driver/(tabs)/deliveries");
  });

  it.each(["pending", "confirmed", "processing"] as const)("can start a %s assignment immediately", async (status) => {
    api.getDelivery.mockResolvedValue({ ...baseOrder, status });
    api.updateStatus.mockResolvedValue({ ...baseOrder, status: "out_for_delivery" });
    await mount();
    expect(action().props.buttonTitle).toBe("Start Delivery");
    expect(api.updateStatus).not.toHaveBeenCalled();
    await confirmAction();
    expect(api.updateStatus).toHaveBeenCalledWith(baseOrder.id, "out_for_delivery");
    expect(action().props.buttonTitle).toBe("Mark Delivered");
  });

  it("keeps the current step and shows an error if the update fails", async () => {
    api.updateStatus.mockRejectedValue({ message: "Connection lost" });
    await mount();
    await confirmAction();
    expect(action().props.buttonTitle).toBe("Start Delivery");
    expect(renderer!.root.findByType("dialog").props.visible).toBe(false);
    expect(renderer!.root.findAllByType("text").some((node) => node.props.children === "Connection lost")).toBe(true);
  });

  it("removes delivery actions when an assignment is revoked", async () => {
    api.updateStatus.mockRejectedValue({ status: 403 });
    await mount();
    await confirmAction();
    expect(renderer!.root.findAll((node) => String(node.type) === "actionbar")).toHaveLength(0);
    expect(renderer!.root.find((node) => String(node.type) === "error").props.title).toBe("Delivery unavailable");
  });

  it("disables navigation and calls when contact data is missing", async () => {
    api.getDelivery.mockResolvedValue({ ...baseOrder, customerPhone: null, deliveryAddress: { ...baseOrder.deliveryAddress, phone: "", latitude: null, longitude: null } });
    await mount();
    for (const title of ["Navigate", "Call"]) {
      expect(renderer!.root.findAllByType("button").find((node) => node.props.title === title)!.props.disabled).toBe(true);
    }
    expect(native.openURL).not.toHaveBeenCalled();
  });

  it("focuses the current trip and keeps other assignments in the list", async () => {
    const trip = { ...baseOrder, id: "trip", status: "out_for_delivery" };
    api.listDeliveries.mockResolvedValue([baseOrder, trip]);
    await mount(Deliveries);
    const cards = renderer!.root.findAll((node) => String(node.type) === "delivery");
    expect(cards.map((card) => card.props.order.id)).toEqual([baseOrder.id]);
    const continueButton = renderer!.root.findAllByType("button").find((node) => node.props.title === "Continue delivery")!;
    await act(async () => { continueButton.props.onPress(); });
    expect(navigation.push).toHaveBeenCalledWith({ pathname: "/driver/delivery/[id]", params: { id: "trip" } });
    expect(api.listDeliveries).toHaveBeenCalledOnce();
  });

  it.each(["pending", "confirmed", "processing"] as const)("offers pickup for a %s assignment on home", async (status) => {
    api.listDeliveries.mockResolvedValue([{ ...baseOrder, status }]);
    await mount(Deliveries);
    const text = renderer!.root.findAllByType("text").map((node) => node.props.children);
    expect(text).toContain("Ready to start");
    expect(text).not.toContain("Waiting for NELMA");
    expect(text).toContain("Collect the water, then tap Start Delivery when you leave.");
    const viewButton = renderer!.root.findAllByType("button").find((node) => node.props.title === "View pickup")!;
    await act(async () => { viewButton.props.onPress(); });
    expect(navigation.push).toHaveBeenCalledWith({ pathname: "/driver/delivery/[id]", params: { id: baseOrder.id } });
    expect(api.updateStatus).not.toHaveBeenCalled();
  });
});
