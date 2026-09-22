import { createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { baseOrder } from "./fixtures/driver-order";

const api = vi.hoisted(() => ({ getOrder: vi.fn(), confirmReceived: vi.fn(), cancelOrder: vi.fn(), sendOrderMessage: vi.fn(), reorder: vi.fn() }));
vi.mock("../store/order-context", () => ({ useOrders: () => api }));
vi.mock("../hooks/use-translation", () => ({ useTranslation: () => ({ t: (text: string) => text }) }));
vi.mock("expo-router", async () => {
  const { useEffect } = await import("react");
  return { router: { push: vi.fn(), replace: vi.fn() }, Redirect: () => null, useLocalSearchParams: () => ({ id: "order_1" }), useFocusEffect: (fn: () => void | (() => void)) => useEffect(fn, [fn]) };
});
vi.mock("lucide-react-native", () => ({ CheckCircle2: () => null, MessageCircle: () => null, RefreshCw: () => null, Repeat: () => null, Send: () => null, XCircle: () => null }));
vi.mock("react-native", () => ({
  View: "view", Text: "text", StyleSheet: { create: (styles: unknown) => styles },
  Platform: { OS: "android", select: (styles: Record<string, unknown>) => styles.android ?? styles.default },
  AppState: { currentState: "active", addEventListener: () => ({ remove: vi.fn() }) }
}));
vi.mock("../components", () => ({
  Screen: ({ children }: { children: import("react").ReactNode }) => createElement("screen", null, children),
  Card: ({ children }: { children: import("react").ReactNode }) => createElement("card", null, children),
  Button: (props: object) => createElement("button", props),
  ConfirmDialog: (props: object) => createElement("dialog", props),
  Header: () => null, Input: () => null, LoadingScreen: () => createElement("loading"),
  ErrorState: () => createElement("error"), OrderTimeline: () => null, ReceiptSummary: () => null,
  ServiceAreaMap: () => null, StatusBadge: () => null
}));
import Details from "../app/orders/[id]";

let screen: ReactTestRenderer;
const delivered = { ...baseOrder, status: "delivered" as const, availableActions: ["mark_received" as const] };
const receiptButtons = () => screen.root.findAllByType("button").filter((node) => node.props.title === "I Received This Order");
const receiptDialog = () => screen.root.findAllByType("dialog").find((node) => node.props.title === "Confirm delivery received?")!;
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  api.getOrder.mockResolvedValue({ ...baseOrder, status: "out_for_delivery" });
});
afterEach(async () => {
  await act(async () => { screen?.unmount(); });
  vi.useRealTimers();
});

describe("customer delivery confirmation", () => {
  it("refreshes an open order after driver handover and asks the customer to confirm", async () => {
    await act(async () => { screen = create(createElement(Details)); });
    expect(receiptButtons()).toHaveLength(0);
    api.getOrder.mockResolvedValue(delivered);
    await act(async () => { await vi.advanceTimersByTimeAsync(15000); });
    expect(receiptButtons()).toHaveLength(1);
    await act(async () => { receiptButtons()[0].props.onPress(); });
    expect(receiptDialog().props.visible).toBe(true);
    expect(api.confirmReceived).not.toHaveBeenCalled();
    api.confirmReceived.mockResolvedValue({ ...delivered, status: "received", customerReceivedAt: "2026-09-21T12:00:00Z", customerReceivedByUserId: baseOrder.customerId, availableActions: [] });
    await act(async () => { await receiptDialog().props.onConfirm(); });
    expect(api.confirmReceived).toHaveBeenCalledWith(baseOrder.id);
    expect(receiptButtons()).toHaveLength(0);
    expect(receiptDialog().props.visible).toBe(false);
  });

  it("keeps confirmation available and displays an error when receipt submission fails", async () => {
    api.getOrder.mockResolvedValue(delivered);
    api.confirmReceived.mockRejectedValue(new Error("offline"));
    await act(async () => { screen = create(createElement(Details)); });
    await act(async () => { receiptButtons()[0].props.onPress(); });
    await act(async () => { await receiptDialog().props.onConfirm(); });
    expect(receiptButtons()).toHaveLength(1);
    expect(screen.root.findAllByType("text").some((node) => node.props.children === "Unable to confirm receipt. Please try again.")).toBe(true);
  });

  it("does not replace a successful receipt with an older refresh response", async () => {
    api.getOrder.mockResolvedValue(delivered);
    await act(async () => { screen = create(createElement(Details)); });
    let resolveRefresh!: (order: typeof delivered) => void;
    api.getOrder.mockImplementation(() => new Promise((resolve) => { resolveRefresh = resolve; }));
    await act(async () => { await vi.advanceTimersByTimeAsync(15000); });
    api.confirmReceived.mockResolvedValue({ ...delivered, status: "received", customerReceivedAt: "2026-09-21T12:00:00Z", availableActions: [] });
    await act(async () => { receiptButtons()[0].props.onPress(); });
    await act(async () => { await receiptDialog().props.onConfirm(); });
    await act(async () => { resolveRefresh(delivered); });
    expect(receiptButtons()).toHaveLength(0);
  });
});
