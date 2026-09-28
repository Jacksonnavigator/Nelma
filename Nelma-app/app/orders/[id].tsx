import { Redirect, router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { CheckCircle2, MessageCircle, Repeat, Send } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import { AppState, Pressable, StyleSheet, Text, View } from "react-native";
import { Button, Card, ConfirmDialog, DeliveryCodeCard, ErrorState, Header, Input, LoadingScreen, OrderTimeline, Screen, StatusBadge } from "../../components";
import { colors } from "../../constants/colors";
import { radius, spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";
import { useOrders } from "../../store/order-context";
import type { Order } from "../../types/order";
import { formatCurrency, formatDate } from "../../utils/format";
import { canConfirmReceived, canReorder, getOrderProductName } from "../../utils/order";
import { paymentStatusLabel } from "../../utils/status";

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
  const [chatOpen, setChatOpen] = useState(false);

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

  const deliveryFee = order.charges.reduce((sum, charge) => sum + charge.amount, 0);
  const schedule = order.deliverySchedule;
  const note = order.customerRemarks?.trim() || order.deliveryAddress.deliveryInstructions?.trim();
  const canCancel = order.availableActions.includes("cancel");

  return (
    <Screen>
      <Header title={order.orderNumber} subtitle={formatDate(order.createdAt)} />
      {error ? <Text accessibilityRole="alert" style={styles.errorText}>{t(error)}</Text> : null}

      <Card style={styles.statusCard}>
        <StatusBadge type="order" status={order.status} />
        {canMarkReceived ? (
          <View style={styles.receiptPrompt}>
            <Text style={styles.sectionTitle}>{t("Has your water arrived?")}</Text>
            <Text style={styles.helper}>{t("Confirm only after you have received your water.")}</Text>
            <Button title="I Received This Order" icon={CheckCircle2} variant="accent" onPress={() => setShowReceived(true)} loading={receiving} />
          </View>
        ) : null}
        {order.status === "out_for_delivery" ? <DeliveryCodeCard orderId={order.id} /> : null}
        <OrderTimeline events={order.timeline} currentStatus={order.status} />
        {order.customerReceivedAt ? <Text style={styles.receivedNote}>{t("Confirmed received on")} {formatDate(order.customerReceivedAt)}.</Text> : null}
      </Card>

      <Card style={styles.detailsCard}>
        <View style={styles.itemRow}>
          <Text style={styles.itemText}>{order.quantity} x {t(item?.productName ?? getOrderProductName(order.orderType))}</Text>
          <Text style={styles.total}>{formatCurrency(order.total, order.currency)}</Text>
        </View>
        {deliveryFee > 0 ? <Text style={styles.helper}>{t("Includes delivery")} {formatCurrency(deliveryFee, order.currency)}</Text> : null}

        <View style={styles.detail}>
          <Text style={styles.detailLabel}>{t("Delivery")}</Text>
          <Text style={styles.detailValue}>{order.deliveryAddress.deliveryAddress}</Text>
          {schedule ? <Text style={styles.helper}>{t(schedule.label)}  ·  {t(schedule.window)}</Text> : null}
          {note ? <Text style={styles.note}>{note}</Text> : null}
        </View>

        <View style={styles.detail}>
          <Text style={styles.detailLabel}>{t("Payment")}</Text>
          <Text style={styles.detailValue}>
            {order.payment?.methodLabel ? t(order.payment.methodLabel) + "  ·  " : ""}{t(paymentStatusLabel(order.paymentStatus))}
          </Text>
        </View>
      </Card>

      {messages.length || chatOpen ? (
        <Card style={styles.chatCard}>
          <Text style={styles.sectionTitle}>{t("Messages")}</Text>
          {messages.map((message) => {
            const customer = message.sender === "customer";
            const system = message.sender === "system";
            return (
              <View key={message.id} style={[styles.messageBubble, customer ? styles.customerBubble : system ? styles.systemBubble : styles.teamBubble]}>
                {customer ? null : <Text style={styles.messageAuthor}>{t(system ? "NELMA update" : "NELMA")}</Text>}
                <Text style={styles.messageBody}>{t(message.body)}</Text>
                <Text style={styles.messageTime}>{formatDate(message.createdAt)}</Text>
              </View>
            );
          })}
          {chatOpen ? (
            <>
              <Input label="Message" value={messageText} onChangeText={setMessageText} placeholder="Write to NELMA about this order" multiline style={styles.messageInput} />
              {chatError ? <Text style={styles.errorText}>{t(chatError)}</Text> : null}
              <Button title="Send Message" icon={Send} onPress={sendMessage} disabled={!messageText.trim()} loading={sendingMessage} />
            </>
          ) : (
            <Pressable accessibilityRole="button" onPress={() => setChatOpen(true)} style={styles.link}>
              <Text style={styles.linkText}>{t("Reply")}</Text>
            </Pressable>
          )}
        </Card>
      ) : null}

      <View style={styles.actions}>
        {canReorder(order) ? <Button title="Reorder" icon={Repeat} onPress={() => { reorder(order); router.push("/order/quantity"); }} /> : null}
        {!messages.length && !chatOpen ? (
          <Button title="Message NELMA" icon={MessageCircle} variant="secondary" onPress={() => setChatOpen(true)} />
        ) : null}
        <View style={styles.linkRow}>
          {canCancel ? (
            <Pressable accessibilityRole="button" onPress={() => setShowCancel(true)} style={styles.link}>
              <Text style={[styles.linkText, styles.dangerText]}>{t("Cancel order")}</Text>
            </Pressable>
          ) : null}
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/support/contact", params: { order: order.orderNumber } })} style={styles.link}>
            <Text style={styles.linkText}>{t("Contact support")}</Text>
          </Pressable>
        </View>
      </View>

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
        message="Your order will be cancelled if it has not been prepared yet."
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
  statusCard: { gap: spacing.md },
  receiptPrompt: { gap: spacing.sm, backgroundColor: colors.surfaceMint, padding: spacing.md, borderRadius: radius.md },
  receivedNote: { color: colors.success, fontFamily: typography.fonts.semibold, fontSize: typography.small, lineHeight: typography.lineHeight.small },
  detailsCard: { gap: spacing.md },
  itemRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: spacing.md },
  itemText: { flex: 1, color: colors.text, fontFamily: typography.fonts.bold, fontSize: typography.body, lineHeight: typography.lineHeight.body },
  total: { color: colors.text, fontFamily: typography.fonts.bold, fontSize: typography.h3, lineHeight: typography.lineHeight.h3 },
  detail: { gap: 2, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.line },
  detailLabel: { color: colors.mutedText, fontFamily: typography.fonts.semibold, fontSize: typography.tiny, lineHeight: typography.lineHeight.tiny, letterSpacing: 0.5, textTransform: "uppercase" },
  detailValue: { color: colors.text, fontFamily: typography.fonts.semibold, fontSize: typography.body, lineHeight: typography.lineHeight.body },
  note: { color: colors.text, fontFamily: typography.fonts.regular, fontSize: typography.small, lineHeight: typography.lineHeight.small, marginTop: spacing.xxs, fontStyle: "italic" },
  helper: { color: colors.mutedText, fontFamily: typography.fonts.regular, fontSize: typography.small, lineHeight: typography.lineHeight.small },
  chatCard: { gap: spacing.sm },
  messageBubble: { borderRadius: radius.lg, gap: 2, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  customerBubble: { alignSelf: "flex-end", backgroundColor: colors.surfaceBlue, maxWidth: "88%" },
  teamBubble: { alignSelf: "flex-start", backgroundColor: colors.surfaceAlt, maxWidth: "88%" },
  systemBubble: { alignSelf: "stretch", backgroundColor: colors.surfaceMint },
  messageAuthor: { color: colors.text, fontFamily: typography.fonts.bold, fontSize: typography.tiny, lineHeight: typography.lineHeight.tiny },
  messageBody: { color: colors.text, fontFamily: typography.fonts.regular, fontSize: typography.small, lineHeight: typography.lineHeight.small },
  messageTime: { color: colors.mutedText, fontFamily: typography.fonts.regular, fontSize: typography.tiny, lineHeight: typography.lineHeight.tiny },
  messageInput: { minHeight: 80, textAlignVertical: "top" },
  actions: { gap: spacing.sm },
  linkRow: { flexDirection: "row", justifyContent: "center", flexWrap: "wrap", columnGap: spacing.xl },
  link: { minHeight: 44, justifyContent: "center" },
  linkText: { color: colors.primary, fontFamily: typography.fonts.semibold, fontSize: typography.small, lineHeight: typography.lineHeight.small },
  dangerText: { color: colors.danger },
  sectionTitle: { color: colors.text, fontFamily: typography.fonts.bold, fontSize: typography.h3, lineHeight: typography.lineHeight.h3 },
  errorText: { backgroundColor: colors.dangerBg, borderRadius: radius.md, color: colors.danger, fontFamily: typography.fonts.bold, fontSize: typography.small, lineHeight: typography.lineHeight.small, padding: spacing.md }
});
