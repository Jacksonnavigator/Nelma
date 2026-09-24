import { Redirect, router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { CheckCircle2, MessageCircle, RefreshCw, Repeat, Send, XCircle } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import { AppState, StyleSheet, Text, View } from "react-native";
import { Button, Card, ConfirmDialog, DeliveryCodeCard, ErrorState, Header, Input, LoadingScreen, OrderTimeline, ReceiptSummary, Screen, ServiceAreaMap, StatusBadge } from "../../components";
import { colors } from "../../constants/colors";
import { radius, spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";
import { useOrders } from "../../store/order-context";
import type { Order } from "../../types/order";
import { formatDate } from "../../utils/format";
import { canConfirmReceived, canReorder } from "../../utils/order";

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { getOrder, cancelOrder, confirmReceived, sendOrderMessage, reorder } = useOrders();
  const { t } = useTranslation();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [receiving, setReceiving] = useState(false);
  const [showReceived, setShowReceived] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const requestVersion = useRef(0);
  const mutating = useRef(false);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const loadOrder = useCallback(async (initial = false) => {
    if (!id || mutating.current) return;
    const version = ++requestVersion.current;
    if (initial) setLoading(true);
    setRefreshing(true);
    try {
      const fresh = await getOrder(id);
      if (version === requestVersion.current) {
        setOrder(fresh);
        setError(null);
      }
    } catch {
      if (version === requestVersion.current) setError("Unable to refresh this order. Please try again.");
    } finally {
      if (version === requestVersion.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [getOrder, id]);

  useFocusEffect(useCallback(() => {
    void loadOrder(true);
    const timer = setInterval(() => {
      if (AppState.currentState === "active") void loadOrder();
    }, 15000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void loadOrder();
    });
    return () => {
      requestVersion.current += 1;
      clearInterval(timer);
      subscription.remove();
    };
  }, [loadOrder]));

  if (!id) {
    return <Redirect href="/(tabs)/orders" />;
  }

  if (loading) {
    return <LoadingScreen message="Loading order" />;
  }

  if (!order) {
    return <Screen><ErrorState message={error ?? "Order not found."} onAction={() => router.replace("/(tabs)/orders")} actionLabel="Back to Orders" /></Screen>;
  }

  const item = order.items[0];
  const messages = order.messages ?? [];
  const canMarkReceived = canConfirmReceived(order);

  const markReceived = async () => {
    if (mutating.current) return;
    mutating.current = true;
    requestVersion.current += 1;
    setRefreshing(false);
    setError(null);
    setReceiving(true);
    try {
      const updated = await confirmReceived(order.id);
      setOrder(updated);
      setShowReceived(false);
    } catch {
      setShowReceived(false);
      setError("Unable to confirm receipt. Please try again.");
    } finally {
      mutating.current = false;
      setReceiving(false);
    }
  };

  const sendMessage = async () => {
    const body = messageText.trim();
    if (!body) {
      return;
    }

    setSendingMessage(true);
    setChatError(null);
    try {
      const nextMessages = await sendOrderMessage(order.id, body);
      setOrder((current) => current ? { ...current, messages: nextMessages } : current);
      setMessageText("");
    } catch {
      setChatError("Unable to send this message right now.");
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <Screen>
      <Header title="Order details" subtitle={formatDate(order.createdAt)} />
      {error ? <Text accessibilityRole="alert" style={styles.errorText}>{t(error)}</Text> : null}
      <Card style={styles.statusCard}>
        <View style={styles.badges}>
          <StatusBadge type="order" status={order.status} />
          <StatusBadge type="payment" status={order.paymentStatus} />
        </View>
        {canMarkReceived ? (
          <View style={styles.receiptPrompt}>
            <Text style={styles.sectionTitle}>{t("Has your water arrived?")}</Text>
            <Text style={styles.helper}>{t("Your driver marked this order delivered. Confirm only after you have received your water.")}</Text>
            <Button title="I Received This Order" icon={CheckCircle2} variant="accent" onPress={() => setShowReceived(true)} loading={receiving} />
          </View>
        ) : null}
        {order.status === "out_for_delivery" ? <DeliveryCodeCard orderId={order.id} /> : null}
        <OrderTimeline events={order.timeline} currentStatus={order.status} />
        {order.customerReceivedAt ? <Text style={styles.receivedNote}>{t("Confirmed received on")} {formatDate(order.customerReceivedAt)}.</Text> : null}
        <Button title="Refresh order" icon={RefreshCw} variant="ghost" onPress={() => void loadOrder()} loading={refreshing} disabled={receiving || cancelling} />
      </Card>

      <ReceiptSummary
        orderType={order.orderType}
        productName={item.productName}
        quantity={order.quantity}
        unitPrice={item.unitPrice}
        subtotal={order.subtotal}
        charges={order.charges}
        total={order.total}
        deliveryAddress={order.deliveryAddress}
        deliverySchedule={order.deliverySchedule}
        customerRemarks={order.customerRemarks}
        paymentMethodLabel={order.payment?.methodLabel}
        date={formatDate(order.createdAt)}
      />

      <ServiceAreaMap
        compact
        latitude={order.deliveryAddress.latitude}
        longitude={order.deliveryAddress.longitude}
        subtitle="Destination pin for this order inside the current Arusha service area."
        title="Delivery destination"
      />

      <Card style={styles.chatCard}>
        <View style={styles.chatHeader}>
          <View style={styles.chatIconWrap}>
            <MessageCircle color={colors.primary} size={20} strokeWidth={2.4} />
          </View>
          <View style={styles.chatTitleCopy}>
            <Text style={styles.sectionTitle}>{t("Order conversation")}</Text>
            <Text style={styles.helper}>{t("Remarks and support notes stay attached to this order.")}</Text>
          </View>
        </View>

        <View style={styles.messageList}>
          {messages.length ? messages.map((message) => {
            const customer = message.sender === "customer";
            const system = message.sender === "system";
            return (
              <View key={message.id} style={[styles.messageBubble, customer ? styles.customerBubble : system ? styles.systemBubble : styles.teamBubble]}>
                <Text style={styles.messageAuthor}>{t(customer ? "You" : system ? "NELMA update" : "NELMA")}</Text>
                <Text style={styles.messageBody}>{t(message.body)}</Text>
                <Text style={styles.messageTime}>{formatDate(message.createdAt)}</Text>
              </View>
            );
          }) : <Text style={styles.helper}>{t("No messages yet. Send a remark if the delivery team needs extra details.")}</Text>}
        </View>

        <Input
          label="Message"
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Type a remark or question for this order"
          multiline
          style={styles.messageInput}
        />
        {chatError ? <Text style={styles.errorText}>{t(chatError)}</Text> : null}
        <Button title="Send Message" icon={Send} onPress={sendMessage} disabled={!messageText.trim()} loading={sendingMessage} />
      </Card>

      <Card style={styles.actionsCard}>
        <Text style={styles.sectionTitle}>{t("Actions")}</Text>
        {canReorder(order) ? <Button title="Reorder" icon={Repeat} onPress={() => { reorder(order); router.push("/order/quantity"); }} /> : null}
        {order.availableActions.includes("cancel") ? <Button title="Cancel Order" icon={XCircle} variant="danger" onPress={() => setShowCancel(true)} /> : null}
        <Button title="Contact Support" variant="ghost" onPress={() => router.push({ pathname: "/support/contact", params: { orderId: order.id } })} />
      </Card>

      <ConfirmDialog
        visible={showReceived}
        title="Confirm delivery received?"
        message="Confirm that you have received the water for this order."
        confirmLabel="Confirm Received"
        loading={receiving}
        onCancel={() => { if (!receiving) setShowReceived(false); }}
        onConfirm={markReceived}
      />

      <ConfirmDialog
        visible={showCancel}
        title="Cancel order?"
        message="NELMA will only cancel this order if the backend confirms the action is still allowed."
        confirmLabel="Cancel Order"
        destructive
        loading={cancelling}
        onCancel={() => setShowCancel(false)}
        onConfirm={async () => {
          if (mutating.current) return;
          mutating.current = true;
          requestVersion.current += 1;
          setRefreshing(false);
          setCancelling(true);
          try {
            const updated = await cancelOrder(order.id);
            setOrder(updated);
            setShowCancel(false);
          } catch {
            setShowCancel(false);
            setError("Unable to cancel this order. Please refresh and try again.");
          } finally {
            mutating.current = false;
            setCancelling(false);
          }
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  receiptPrompt: { gap: spacing.sm, backgroundColor: colors.surfaceMint, padding: spacing.md, borderRadius: radius.md },
  statusCard: {
    gap: spacing.lg
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  receivedNote: {
    backgroundColor: colors.surfaceMint,
    borderRadius: radius.md,
    color: colors.success,
    fontFamily: typography.fonts.bold,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small,
    padding: spacing.md
  },
  chatCard: {
    gap: spacing.lg
  },
  chatHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  chatIconWrap: {
    alignItems: "center",
    backgroundColor: colors.surfaceBlue,
    borderRadius: radius.pill,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  chatTitleCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0
  },
  helper: {
    color: colors.mutedText,
    fontFamily: typography.fonts.regular,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small
  },
  messageList: {
    gap: spacing.sm
  },
  messageBubble: {
    borderRadius: radius.lg,
    gap: spacing.xs,
    padding: spacing.md
  },
  customerBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.surfaceBlue,
    maxWidth: "90%"
  },
  teamBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceAlt,
    maxWidth: "90%"
  },
  systemBubble: {
    alignSelf: "stretch",
    backgroundColor: colors.surfaceMint
  },
  messageAuthor: {
    color: colors.text,
    fontFamily: typography.fonts.bold,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small
  },
  messageBody: {
    color: colors.text,
    fontFamily: typography.fonts.regular,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small
  },
  messageTime: {
    color: colors.mutedText,
    fontFamily: typography.fonts.regular,
    fontSize: typography.tiny,
    lineHeight: typography.lineHeight.tiny
  },
  messageInput: {
    minHeight: 88,
    textAlignVertical: "top"
  },
  actionsCard: {
    gap: spacing.md
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: typography.fonts.bold,
    fontSize: typography.h3,
    lineHeight: typography.lineHeight.h3
  },
  errorText: {
    backgroundColor: colors.dangerBg,
    borderRadius: radius.md,
    color: colors.danger,
    fontFamily: typography.fonts.bold,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small,
    padding: spacing.md
  }
});
