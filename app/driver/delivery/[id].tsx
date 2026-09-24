import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Banknote, Check, ChevronDown, ChevronUp, Navigation, Phone, RefreshCw } from "lucide-react-native";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BottomActionBar, Button, ConfirmDialog, ErrorState, OrderTimeline, Screen, StatusBadge } from "../../../components";
import { colors } from "../../../constants/colors";
import { radius, spacing, typography } from "../../../constants/theme";
import { useTranslation } from "../../../hooks/use-translation";
import { repositories } from "../../../repositories";
import { haptics } from "../../../services/haptics";
import type { DriverDeliveryActionStatus, Order } from "../../../types/order";
import { DELIVERY_STEPS, cashDueAmount, deliveryStepIndex, buildExternalMapUrl, canMarkDelivered, canStartDelivery, customerContactPhone, customerDisplayName, deliveryAddressLine, deliveryAreaLine, deliveryTimeLabel, driverActionHint, hasDeliveryCoordinates, isAssignmentLostError, productSummary } from "../../../utils/driver-deliveries";
import { formatCurrency, formatDate } from "../../../utils/format";
import { driverDeliveryStatusLabel } from "../../../utils/status";

type PendingAction = "start" | "delivered";

const InfoRow = ({ label, value, children }: { label: string; value?: string | null; children?: ReactNode }) => {
  const { t } = useTranslation();
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{t(label)}</Text>
      {children ?? <Text selectable style={styles.infoValue}>{t(value || "Not available")}</Text>}
    </View>
  );
};

const actionStatusFor = (pending: PendingAction): DriverDeliveryActionStatus => {
  if (pending === "start") {
    return "out_for_delivery";
  }
  return "delivered";
};

const dialogTitleFor = (pending: PendingAction): string => {
  if (pending === "start") {
    return "Start delivery?";
  }
  return "Mark delivered?";
};

const dialogConfirmFor = (pending: PendingAction): string => {
  if (pending === "start") {
    return "Start Delivery";
  }
  return "Mark Delivered";
};

const dialogMessageFor = (pending: PendingAction, order: Order): string => {
  const customer = customerDisplayName(order);
  if (pending === "start") {
    return "Start delivery for " + customer + " now?";
  }
  return "Mark this delivery as delivered after handover to " + customer + ". The customer will confirm receipt in their app.";
};

export default function DriverDeliveryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const deliveryId = Array.isArray(id) ? id[0] : id;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignmentLost, setAssignmentLost] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [submittingAction, setSubmittingAction] = useState<PendingAction | null>(null);

  const loadDelivery = useCallback(async (initial = false) => {
    if (!deliveryId) {
      setError("This delivery is no longer assigned to you.");
      setAssignmentLost(true);
      setLoading(false);
      return;
    }
    if (initial) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);
    setAssignmentLost(false);
    try {
      setOrder(await repositories.driver.getDelivery(deliveryId));
    } catch (caught) {
      if (isAssignmentLostError(caught)) {
        setAssignmentLost(true);
        setError("This delivery is no longer assigned to you.");
      } else {
        setError("Unable to load this delivery right now.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [deliveryId]);

  useEffect(() => {
    void loadDelivery(true);
  }, [loadDelivery]);

  const phone = useMemo(() => order ? customerContactPhone(order) : null, [order]);
  const hasCoordinates = useMemo(() => order ? hasDeliveryCoordinates(order) : false, [order]);
  const receiptConfirmed = Boolean(order?.customerReceivedAt) || order?.status === "received";

  const callCustomer = async () => {
    if (!phone) {
      return;
    }
    haptics.selection();
    await Linking.openURL("tel:" + phone.replace(/[^+\d]/g, "")).catch(() => setError("Unable to open the phone app. Please call the number shown."));
  };

  const openLocation = async () => {
    if (!order) {
      return;
    }
    const platform = Platform.OS === "ios" || Platform.OS === "android" ? Platform.OS : "web";
    const url = buildExternalMapUrl(order.deliveryAddress.latitude, order.deliveryAddress.longitude, platform, deliveryAreaLine(order));
    if (!url) {
      return;
    }
    haptics.selection();
    await Linking.openURL(url).catch(() => setError("Unable to open maps. Please use the address shown."));
  };

  const submitAction = async () => {
    if (!order || !pendingAction || submittingAction) {
      return;
    }
    const action = pendingAction;
    setSubmittingAction(action);
    try {
      const nextOrder = await repositories.driver.updateStatus(order.id, actionStatusFor(action));
      setOrder(nextOrder);
      setError(null);
      setAssignmentLost(false);
      setPendingAction(null);
      haptics.success();
    } catch (caught) {
      setPendingAction(null);
      haptics.light();
      if (isAssignmentLostError(caught)) {
        setAssignmentLost(true);
        setError("This delivery is no longer assigned to you.");
      } else {
        setError(typeof (caught as { message?: unknown }).message === "string" ? String((caught as { message: string }).message) : "Unable to update this delivery right now.");
      }
    } finally {
      setSubmittingAction(null);
    }
  };

  if (loading && !order) {
    return (
      <Screen contentContainerStyle={styles.screen} keyboard={false} padded={false} scroll={false} style={styles.safe}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>{t("Loading delivery")}</Text>
        </View>
      </Screen>
    );
  }

  if (assignmentLost || !order) {
    return (
      <Screen contentContainerStyle={styles.screen} keyboard={false} padded={false} scroll={false} style={styles.safe}>
        <View style={styles.stateWrap}>
          <ErrorState title="Delivery unavailable" message={error ?? "This delivery is no longer assigned to you."} actionLabel="Back to Deliveries" onAction={() => router.replace("/driver/(tabs)/deliveries")} />
        </View>
      </Screen>
    );
  }

  const nextAction: PendingAction | null = canStartDelivery(order) ? "start"
    : canMarkDelivered(order) ? "delivered" : null;
  const closed = receiptConfirmed || order.status === "delivered" || order.status === "cancelled";
  const busy = Boolean(submittingAction) || refreshing;
  const stepIndex = deliveryStepIndex(order);
  const cashDue = cashDueAmount(order);

  return (
    <Screen safeBottom={false} contentContainerStyle={styles.screen} keyboard={false} padded={false} scroll={false}>
      <View style={styles.localHeader}>
        <Pressable accessibilityLabel={t("Back to Deliveries")} accessibilityRole="button" onPress={() => router.back()} style={styles.headerIconButton}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t(closed ? "Delivery record" : "Your delivery")}</Text>
        <Pressable accessibilityLabel={t("Refresh delivery")} accessibilityRole="button" disabled={busy || Boolean(pendingAction)} onPress={() => void loadDelivery(false)} style={styles.headerIconButton}>
          {refreshing ? <ActivityIndicator color={colors.primary} /> : <RefreshCw size={21} color={busy ? colors.disabled : colors.primary} />}
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {error ? <Text accessibilityRole="alert" style={styles.inlineError}>{t(error)}</Text> : null}
        <View style={styles.statusRow}>
          <StatusBadge type="order" status={order.status} labelOverride={driverDeliveryStatusLabel(order.status)} />
          <Text style={styles.muted}>{order.orderNumber}</Text>
        </View>
        {order.status !== "cancelled" ? (
          <View style={styles.stepper} accessibilityLabel={t(DELIVERY_STEPS[stepIndex])}>
            {DELIVERY_STEPS.map((label, index) => {
              const done = index < stepIndex || stepIndex === DELIVERY_STEPS.length - 1;
              const current = index === stepIndex && !done;
              return (
                <View key={label} style={styles.step}>
                  <View style={styles.stepTrack}>
                    <View style={[styles.stepLine, index === 0 ? styles.stepLineHidden : null, index <= stepIndex ? styles.stepLineActive : null]} />
                    <View style={[styles.stepDot, done ? styles.stepDotDone : null, current ? styles.stepDotCurrent : null]}>
                      {done ? <Check color={colors.white} size={12} strokeWidth={3} /> : null}
                    </View>
                    <View style={[styles.stepLine, index === DELIVERY_STEPS.length - 1 ? styles.stepLineHidden : null, index < stepIndex ? styles.stepLineActive : null]} />
                  </View>
                  <Text numberOfLines={1} style={[styles.stepLabel, index <= stepIndex ? styles.stepLabelActive : null]}>{t(label)}</Text>
                </View>
              );
            })}
          </View>
        ) : null}
        {cashDue > 0 && !closed ? (
          <View style={styles.cashBanner}>
            <Banknote color="#9A6B00" size={22} />
            <View style={styles.cashCopy}>
              <Text style={styles.cashTitle}>{t("Collect payment on delivery")}</Text>
              <Text style={styles.cashAmount}>{formatCurrency(cashDue, order.currency)}</Text>
            </View>
          </View>
        ) : null}
        <View style={styles.destination}>
          <Text style={styles.eyebrow}>{t("Deliver to")}</Text>
          <Text style={styles.address}>{deliveryAddressLine(order)}</Text>
          <Text style={styles.area}>{deliveryAreaLine(order)}</Text>
          <Text style={styles.muted}>{t(deliveryTimeLabel(order))}</Text>
        </View>

        <View style={styles.customer}>
          <Text style={styles.customerName}>{customerDisplayName(order)}</Text>
          {phone ? <Text selectable style={styles.muted}>{phone}</Text> : null}
          <Text style={styles.product}>{productSummary(order)}</Text>
        </View>

        <View style={styles.quickActions}>
          <Button title="Navigate" icon={Navigation} variant="secondary" disabled={!hasCoordinates} onPress={openLocation} style={styles.quickButton} />
          <Button title="Call" icon={Phone} variant="secondary" disabled={!phone} onPress={callCustomer} style={styles.quickButton} />
        </View>
        {!hasCoordinates ? <Text style={styles.muted}>{t("No pin attached")}</Text> : null}
        {!phone ? <Text style={styles.muted}>{t("No customer phone")}</Text> : null}

        {order.deliveryAddress.deliveryInstructions || order.customerRemarks ? (
          <View style={styles.notes}>
            <Text style={styles.sectionTitle}>{t("Delivery notes")}</Text>
            {order.deliveryAddress.deliveryInstructions ? <Text style={styles.body}>{order.deliveryAddress.deliveryInstructions}</Text> : null}
            {order.customerRemarks ? <Text style={styles.body}>{order.customerRemarks}</Text> : null}
          </View>
        ) : null}

        <View style={styles.payment}>
          <View style={styles.paymentCopy}>
            <Text style={styles.muted}>{t("Payment")} {order.payment?.methodLabel ? "\u00b7 " + t(order.payment.methodLabel) : ""}</Text>
            <Text style={styles.amount}>{formatCurrency(order.total, order.currency)}</Text>
          </View>
          <StatusBadge type="payment" status={order.paymentStatus} compact />
        </View>

        <Pressable accessibilityRole="button" accessibilityState={{ expanded: detailsOpen }} onPress={() => setDetailsOpen((open) => !open)} style={styles.detailsToggle}>
          <Text style={styles.sectionTitle}>{t("Order details")}</Text>
          {detailsOpen ? <ChevronUp color={colors.mutedText} size={20} /> : <ChevronDown color={colors.mutedText} size={20} />}
        </Pressable>
        {detailsOpen ? (
          <View style={styles.details}>
            <InfoRow label="Quantity" value={String(order.quantity)} />
            <InfoRow label="Last updated" value={formatDate(order.updatedAt)} />
            {order.customerReceivedAt ? <InfoRow label="Confirmed received on" value={formatDate(order.customerReceivedAt)} /> : null}
            {(order.messages ?? []).slice(-3).map((message) => (
              <View key={message.id} style={styles.notes}>
                <Text style={styles.sectionTitle}>{t(message.sender === "customer" ? "Customer" : message.sender === "nelma" ? "NELMA" : "System")}</Text>
                <Text style={styles.body}>{message.body}</Text>
              </View>
            ))}
            <OrderTimeline events={order.timeline} currentStatus={order.status} />
          </View>
        ) : null}
        <Button title="Contact NELMA" variant="ghost" onPress={() => router.push("/support/contact")} />
      </ScrollView>

      <BottomActionBar
        buttonTitle={nextAction ? dialogConfirmFor(nextAction) : closed ? "Back to Deliveries" : "Check for updates"}
        loading={Boolean(submittingAction)}
        disabled={busy || Boolean(pendingAction)}
        onPress={() => {
          if (nextAction) setPendingAction(nextAction);
          else if (closed) router.replace("/driver/(tabs)/deliveries");
          else void loadDelivery(false);
        }}
      >
        <Text style={styles.actionHint}>{t(driverActionHint(order))}</Text>
      </BottomActionBar>

      <ConfirmDialog
        visible={Boolean(pendingAction)}
        title={pendingAction ? dialogTitleFor(pendingAction) : "Confirm"}
        message={pendingAction ? dialogMessageFor(pendingAction, order) : "Confirm this delivery update."}
        confirmLabel={pendingAction ? dialogConfirmFor(pendingAction) : "Confirm"}
        loading={Boolean(submittingAction)}
        onCancel={() => { if (!submittingAction) setPendingAction(null); }}
        onConfirm={submitAction}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.white },
  screen: { backgroundColor: colors.white, flex: 1 },
  localHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", gap: spacing.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderBottomColor: colors.line, borderBottomWidth: 1 },
  headerIconButton: { alignItems: "center", justifyContent: "center", width: 44, height: 44 },
  headerTitle: { flex: 1, textAlign: "center", color: colors.text, fontFamily: typography.fonts.bold, fontSize: 18, lineHeight: 26 },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, flexWrap: "wrap" },
  stepper: { flexDirection: "row", paddingVertical: spacing.xs },
  step: { flex: 1, alignItems: "center", gap: spacing.xxs },
  stepTrack: { flexDirection: "row", alignItems: "center", alignSelf: "stretch" },
  stepLine: { flex: 1, height: 3, backgroundColor: colors.line },
  stepLineHidden: { backgroundColor: "transparent" },
  stepLineActive: { backgroundColor: colors.primary },
  stepDot: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: colors.white, borderColor: colors.border, borderWidth: 2 },
  stepDotDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepDotCurrent: { borderColor: colors.primary, borderWidth: 6 },
  stepLabel: { color: colors.subtleText, fontFamily: typography.fonts.medium, fontSize: 11, lineHeight: 16 },
  stepLabelActive: { color: colors.text, fontFamily: typography.fonts.bold },
  cashBanner: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.warningBg, borderRadius: radius.sm, padding: spacing.md },
  cashCopy: { flex: 1, gap: 2 },
  cashTitle: { color: "#9A6B00", fontFamily: typography.fonts.semibold, fontSize: 13, lineHeight: 20 },
  cashAmount: { color: colors.text, fontFamily: typography.fonts.bold, fontSize: 22, lineHeight: 28 },
  destination: { gap: spacing.xs, paddingVertical: spacing.sm },
  eyebrow: { color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: 13, lineHeight: 20 },
  address: { color: colors.text, fontFamily: typography.fonts.bold, fontSize: 27, lineHeight: 35 },
  area: { color: colors.text, fontFamily: typography.fonts.medium, fontSize: 16, lineHeight: 24 },
  muted: { color: colors.mutedText, fontFamily: typography.fonts.regular, fontSize: 13, lineHeight: 20 },
  customer: { gap: spacing.xxs },
  customerName: { color: colors.text, fontFamily: typography.fonts.bold, fontSize: 20, lineHeight: 28 },
  product: { color: colors.text, fontFamily: typography.fonts.medium, fontSize: 15, lineHeight: 22, marginTop: spacing.xs },
  quickActions: { flexDirection: "row", gap: spacing.sm },
  quickButton: { flex: 1, paddingHorizontal: spacing.xs },
  notes: { backgroundColor: colors.surfaceAlt, padding: spacing.md, borderRadius: radius.sm, gap: spacing.xs },
  sectionTitle: { color: colors.text, fontFamily: typography.fonts.semibold, fontSize: 15, lineHeight: 22 },
  body: { color: colors.text, fontFamily: typography.fonts.regular, fontSize: 14, lineHeight: 22 },
  payment: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md, borderTopColor: colors.line, borderTopWidth: 1, borderBottomColor: colors.line, borderBottomWidth: 1 },
  paymentCopy: { flex: 1, gap: spacing.xxs },
  amount: { color: colors.text, fontFamily: typography.fonts.bold, fontSize: 20, lineHeight: 28 },
  detailsToggle: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  details: { gap: spacing.md },
  infoRow: { gap: spacing.xxs },
  infoLabel: { color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: 13, lineHeight: 20 },
  infoValue: { color: colors.text, fontFamily: typography.fonts.regular, fontSize: 15, lineHeight: 22 },
  actionHint: { color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: 13, lineHeight: 20, textAlign: "center" },
  inlineError: { backgroundColor: colors.dangerBg, borderRadius: radius.sm, color: colors.danger, padding: spacing.sm, fontFamily: typography.fonts.medium, fontSize: 13, lineHeight: 20 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  loadingText: { color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: 15, lineHeight: 22 },
  stateWrap: { flex: 1, justifyContent: "center", padding: spacing.lg }
});
