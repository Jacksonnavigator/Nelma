import { createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { baseOrder } from "./fixtures/driver-order";
import type { Order } from "../types/order";

const api = vi.hoisted(() => ({ listActive: vi.fn(), getSummary: vi.fn(), getDelivery: vi.fn(), updateStatus: vi.fn(), reportIssue: vi.fn(), confirmReceived: vi.fn() }));
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
vi.mock("lucide-react-native", () => ({ Droplet: () => null, Banknote: () => null, Check: () => null, Truck: () => null, ArrowLeft: () => null, ChevronDown: () => null, ChevronUp: () => null, ChevronRight: () => null, Clock3: () => null, Droplets: () => null, MapPin: () => null, RefreshCw: () => null, Navigation: () => null, Phone: () => null }));
vi.mock("react-native", () => ({
  AppState: { currentState: "active", addEventListener: () => ({ remove() {} }) },
  Animated: { Value: class { setValue() {} interpolate() { return 0; } }, timing: () => ({ start() {} }), View: "view" },
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
  HandoverSheet: (props: object) => createElement("handover", props),
  IssueSheet: (props: object) => createElement("issue", props),
  DriverTitle: (props: object) => createElement("title", props),
  RouteStop: (props: object) => createElement("stop", props),
  Sheet: ({ children }: { children: import("react").ReactNode }) => createElement("sheet", null, children),
  BrandGradient: ({ children }: { children: import("react").ReactNode }) => createElement("gradient", null, children),
  SkyBackdrop: () => null,
  Ripples: () => null,
  DropletArt: () => null,
  LiveDot: () => null,
  WaterProgress: () => null
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
const byTag = (tag: string) => renderer!.root.find((node) => String(node.type) === tag);
const handoverSheet = () => byTag("handover");
async function confirmHandover(handover: object = { deliveryCode: "4821" }) {
  await act(async () => { action().props.onPress(); });
  expect(handoverSheet().props.visible).toBe(true);
  await act(async () => { await handoverSheet().props.onConfirm(handover); });
}
const openIssueSheet = async () => {
  const link = renderer!.root.findAll((node) => String(node.type) === "pressable").find((node) => node.findAll((child) => String(child.type) === "text").some((text) => text.props.children === "Problem with this stop?"))!;
  await act(async () => { link.props.onPress(); });
};

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.clearAllMocks();
  api.getDelivery.mockResolvedValue({ ...baseOrder });
  api.listActive.mockResolvedValue([]);
  api.getSummary.mockResolvedValue({ activeDeliveries: 0, today: { deliveries: 0, bottles: 0, value: 0 }, week: { deliveries: 0, bottles: 0, value: 0 }, month: { deliveries: 0, bottles: 0, value: 0 }, allTime: { deliveries: 0, bottles: 0, value: 0 }, daily: [] });
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
    await confirmHandover();
    expect(api.updateStatus).toHaveBeenLastCalledWith(baseOrder.id, "delivered", { deliveryCode: "4821" });
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

  it("keeps the handover sheet open with the reason when the code or cash is rejected", async () => {
    api.getDelivery.mockResolvedValue({ ...baseOrder, status: "out_for_delivery" });
    api.updateStatus.mockRejectedValue({ message: "That delivery code is not correct.", code: "INVALID_DELIVERY_CODE", status: 400 });
    await mount();
    await confirmHandover({ deliveryCode: "0000" });
    expect(handoverSheet().props.visible).toBe(true);
    expect(handoverSheet().props.error).toBe("That delivery code is not correct.");
    expect(action().props.buttonTitle).toBe("Mark Delivered");
  });

  it("re-checks the real status when the connection drops during an update", async () => {
    api.updateStatus.mockRejectedValue({ code: "TIMEOUT", message: "Unable to connect" });
    api.getDelivery.mockResolvedValueOnce({ ...baseOrder }).mockResolvedValueOnce({ ...baseOrder, status: "out_for_delivery" });
    await mount();
    await confirmAction();
    expect(api.getDelivery).toHaveBeenCalledTimes(2);
    expect(action().props.buttonTitle).toBe("Mark Delivered");
    expect(renderer!.root.findAllByType("text").some((node) => String(node.props.children).includes("connection was slow"))).toBe(true);
  });

  it("reports a problem and shows the delivery back with dispatch", async () => {
    api.getDelivery.mockResolvedValue({ ...baseOrder, status: "out_for_delivery" });
    api.reportIssue.mockResolvedValue({ ...baseOrder, status: "processing" });
    await mount();
    expect(action().props.buttonTitle).toBe("Mark Delivered");
    await openIssueSheet();
    expect(byTag("issue").props.visible).toBe(true);
    expect(byTag("issue").props.canUndo).toBe(true);
    await act(async () => { byTag("issue").props.onSubmit({ reason: "customer_unreachable", note: "Phone off" }); });
    expect(api.reportIssue).toHaveBeenCalledWith(baseOrder.id, { reason: "customer_unreachable", note: "Phone off" });
    expect(byTag("issue").props.visible).toBe(false);
    expect(action().props.buttonTitle).toBe("Start Delivery");
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
    api.listActive.mockResolvedValue([baseOrder, trip]);
    await mount(Deliveries);
    const cards = renderer!.root.findAll((node) => String(node.type) === "stop");
    expect(cards.map((card) => card.props.order.id)).toEqual([baseOrder.id]);
    const continueButton = renderer!.root.findAllByType("button").find((node) => node.props.title === "Continue delivery")!;
    await act(async () => { continueButton.props.onPress(); });
    expect(navigation.push).toHaveBeenCalledWith({ pathname: "/driver/delivery/[id]", params: { id: "trip" } });
    expect(api.listActive).toHaveBeenCalledOnce();
  });

  it.each(["pending", "confirmed", "processing"] as const)("offers pickup for a %s assignment on home", async (status) => {
    api.listActive.mockResolvedValue([{ ...baseOrder, status }]);
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
