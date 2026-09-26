import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Banknote, Clock3, Droplet, MapPin, Navigation, Phone, RefreshCw } from "lucide-react-native";
import { type ComponentType, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BottomActionBar, Button, ConfirmDialog, DeclineSheet, ErrorState, HandoverSheet, IssueSheet, OrderTimeline, Screen, Sheet, SkyBackdrop } from "../../../components";
import { colors } from "../../../constants/colors";
import { driverTheme } from "../../../constants/driver-theme";
import { radius, spacing, typography } from "../../../constants/theme";
import { useDriverOutbox } from "../../../hooks/use-driver-outbox";
import { useTranslation } from "../../../hooks/use-translation";
import { repositories } from "../../../repositories";
import { applyPending, driverOutbox } from "../../../services/driver-outbox";
import { haptics } from "../../../services/haptics";
import type { DeclineAssignmentInput, DeliveryIssueInput, DriverDeliveryActionStatus, DriverDeliveryHandover, Order } from "../../../types/order";
import { DELIVERY_STEPS, buildExternalMapUrl, canMarkDelivered, canStartDelivery, cashDueAmount, customerContactPhone, customerDisplayName, deliveryAddressLine, deliveryAreaLine, deliveryStepIndex, driverActionHint, hasDeliveryCoordinates, isAssignmentLostError, isConnectionError, needsAcceptance, productSummary } from "../../../utils/driver-deliveries";
import { formatCurrency, formatDate } from "../../../utils/format";
import { paymentStatusLabel } from "../../../utils/status";

type PendingAction = "start" | "delivered";

const SAVED_OFFLINE = "No signal. This step is saved on this phone and will be sent to NELMA automatically.";

const Fact = ({ icon: Icon, label, last, tint = "aqua", children }: { icon: ComponentType<{ color?: string; size?: number }>; label: string; last: boolean; tint?: "aqua" | "amber"; children: ReactNode }) => {
  const { t } = useTranslation();
  return (
    <View style={[styles.fact, last ? null : styles.factDivider]}>
      <View style={[styles.factIcon, tint === "amber" ? styles.factIconAmber : null]}>
        <Icon color={tint === "amber" ? driverTheme.amberText : colors.primary} size={17} />
      </View>
      <View style={styles.factValue}>
        <Text style={styles.factLabel}>{t(label)}</Text>
        {children}
      </View>
    </View>
  );
};

const actionStatusFor = (pending: PendingAction): DriverDeliveryActionStatus => (pending === "start" ? "out_for_delivery" : "delivered");

const dialogTitleFor = (pending: PendingAction): string => (pending === "start" ? "Start delivery?" : "Mark delivered?");

const dialogConfirmFor = (pending: PendingAction): string => (pending === "start" ? "Start Delivery" : "Mark Delivered");

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
  useDriverOutbox(); // Scopes the offline queue to this driver even when opened straight from a push alert.
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignmentLost, setAssignmentLost] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [submittingAction, setSubmittingAction] = useState<PendingAction | null>(null);
  const [handoverError, setHandoverError] = useState<string | null>(null);
  const [issueOpen, setIssueOpen] = useState(false);
  const [submittingIssue, setSubmittingIssue] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [submittingDecline, setSubmittingDecline] = useState(false);
  const [declineError, setDeclineError] = useState<string | null>(null);

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
      await driverOutbox.flush().catch(() => undefined);
      setOrder(applyPending(await repositories.driver.getDelivery(deliveryId)));
    } catch (caught) {
      const saved = isConnectionError(caught) ? await driverOutbox.savedOrder(deliveryId) : null;
      if (isAssignmentLostError(caught)) {
        setAssignmentLost(true);
        setError("This delivery is no longer assigned to you.");
      } else if (saved) {
        setOrder(applyPending(saved));
        setError("No signal. Showing the copy saved on this phone.");
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

  const messageOf = (caught: unknown, fallback: string): string => {
    return typeof (caught as { message?: unknown }).message === "string" ? String((caught as { message: string }).message) : fallback;
  };

  const submitAction = async (handover?: DriverDeliveryHandover) => {
    if (!order || !pendingAction || submittingAction) {
      return;
    }
    const action = pendingAction;
    setSubmittingAction(action);
    setHandoverError(null);
    try {
      const nextOrder = handover
        ? await repositories.driver.updateStatus(order.id, actionStatusFor(action), handover)
        : await repositories.driver.updateStatus(order.id, actionStatusFor(action));
      setOrder(nextOrder);
      setError(null);
      setAssignmentLost(false);
      setPendingAction(null);
      haptics.success();
    } catch (caught) {
      haptics.light();
      if (isAssignmentLostError(caught)) {
        setPendingAction(null);
        setAssignmentLost(true);
        setError("This delivery is no longer assigned to you.");
      } else if (isConnectionError(caught)) {
        // Keep the step on the phone and send it later. A replay is safe even if this attempt already
        // reached NELMA, because repeating the same step changes nothing on the server.
        await driverOutbox.enqueue(order, actionStatusFor(action), handover);
        setPendingAction(null);
        setOrder(applyPending(order));
        setError(SAVED_OFFLINE);
      } else if (action === "delivered") {
        // Wrong code or cash amount: keep the sheet open so the driver can correct it.
        setHandoverError(messageOf(caught, "Unable to complete this delivery right now."));
      } else {
        setPendingAction(null);
        setError(messageOf(caught, "Unable to update this delivery right now."));
      }
    } finally {
      setSubmittingAction(null);
    }
  };

  const submitIssue = async (input: DeliveryIssueInput) => {
    if (!order || submittingIssue) {
      return;
    }
    setSubmittingIssue(true);
    setIssueError(null);
    try {
      setOrder(await repositories.driver.reportIssue(order.id, input));
      setError(null);
      setIssueOpen(false);
      haptics.success();
    } catch (caught) {
      haptics.light();
      if (isAssignmentLostError(caught)) {
        setIssueOpen(false);
        setAssignmentLost(true);
        setError("This delivery is no longer assigned to you.");
      } else if (isConnectionError(caught)) {
        setIssueOpen(false);
        await loadDelivery(false);
        setError("The connection was slow. This is the latest status from NELMA.");
      } else {
        setIssueError(messageOf(caught, "Unable to send this report right now."));
      }
    } finally {
      setSubmittingIssue(false);
    }
  };

  const acceptStop = async () => {
    if (!order || accepting) {
      return;
    }
    setAccepting(true);
    try {
      setOrder(await repositories.driver.accept(order.id));
      setError(null);
      haptics.success();
    } catch (caught) {
      haptics.light();
      if (isAssignmentLostError(caught)) {
        setAssignmentLost(true);
        setError("This delivery is no longer assigned to you.");
      } else if (isConnectionError(caught)) {
        await driverOutbox.enqueue(order, "accept");
        setOrder(applyPending(order));
        setError(SAVED_OFFLINE);
      } else {
        setError(messageOf(caught, "Unable to accept this stop right now."));
      }
    } finally {
      setAccepting(false);
    }
  };

  const submitDecline = async (input: DeclineAssignmentInput) => {
    if (!order || submittingDecline) {
      return;
    }
    setSubmittingDecline(true);
    setDeclineError(null);
    try {
      await repositories.driver.decline(order.id, input);
      setDeclineOpen(false);
      haptics.success();
      router.replace("/driver/(tabs)/deliveries");
    } catch (caught) {
      haptics.light();
      if (isAssignmentLostError(caught)) {
        // Already gone from this driver's route, which is what they wanted.
        setDeclineOpen(false);
        router.replace("/driver/(tabs)/deliveries");
      } else if (isConnectionError(caught)) {
        setDeclineOpen(false);
        await loadDelivery(false);
        setError("The connection was slow. This is the latest status from NELMA.");
      } else {
        setDeclineError(messageOf(caught, "Unable to hand this stop back right now."));
      }
    } finally {
      setSubmittingDecline(false);
    }
  };

  if (loading && !order) {
    return (
      <Screen contentContainerStyle={styles.screen} keyboard={false} padded={false} scroll={false} style={styles.safe}>
        <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      </Screen>
    );
  }

  if (assignmentLost || !order) {
    return (
      <Screen contentContainerStyle={styles.screen} keyboard={false} padded={false} scroll={false} style={styles.safe}>
        <View style={styles.center}>
          <ErrorState title="Delivery unavailable" message={error ?? "This delivery is no longer assigned to you."} actionLabel="Back to Deliveries" onAction={() => router.replace("/driver/(tabs)/deliveries")} />
        </View>
      </Screen>
    );
  }

  const awaitingAccept = needsAcceptance(order);
  const nextAction: PendingAction | null = canStartDelivery(order) ? "start"
    : canMarkDelivered(order) ? "delivered" : null;
  const closed = receiptConfirmed || order.status === "delivered" || order.status === "cancelled";
  const busy = Boolean(submittingAction) || refreshing || accepting;
  const step = deliveryStepIndex(order);
  const due = cashDueAmount(order);
  const notes = [order.deliveryAddress.deliveryInstructions, order.customerRemarks].filter(Boolean) as string[];
  const open = order.status === "processing" || order.status === "out_for_delivery";

  return (
    <Screen safeBottom={false} contentContainerStyle={styles.screen} keyboard={false} padded={false} scroll={false} style={styles.safe}>
      <SkyBackdrop />
      <View style={styles.header}>
        <Pressable accessibilityLabel={t("Back to Deliveries")} accessibilityRole="button" onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        <Pressable accessibilityLabel={t("Refresh delivery")} accessibilityRole="button" disabled={busy || Boolean(pendingAction)} onPress={() => void loadDelivery(false)} style={styles.headerButton}>
          {refreshing ? <ActivityIndicator color={colors.mutedText} /> : <RefreshCw size={20} color={busy ? colors.disabled : colors.mutedText} />}
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {error ? <Text accessibilityRole="alert" style={styles.error}>{t(error)}</Text> : null}

        {order.status !== "cancelled" ? (
          <View style={styles.progress}>
            <View style={styles.segments}>
              {DELIVERY_STEPS.map((label, index) => <View key={label} style={[styles.segment, index <= step ? styles.segmentDone : null]} />)}
            </View>
            <Text style={styles.progressText}>{t(DELIVERY_STEPS[step])}  {"·"}  {step + 1} / {DELIVERY_STEPS.length}</Text>
          </View>
        ) : null}

        <Sheet style={styles.destination}>
          <View style={styles.pin}><MapPin color={colors.primary} size={20} /></View>
          <View style={styles.destinationCopy}>
            <Text style={styles.eyebrow}>{t("Deliver to")}</Text>
            <Text style={styles.address}>{deliveryAddressLine(order)}</Text>
            <Text style={styles.area}>{deliveryAreaLine(order)}</Text>
          </View>
        </Sheet>

        <Sheet style={styles.customerSheet}>
          <View style={styles.person}>
            <View style={styles.initial}><Text style={styles.initialText}>{customerDisplayName(order).charAt(0).toUpperCase()}</Text></View>
            <View style={styles.personCopy}>
              <Text style={styles.personName}>{customerDisplayName(order)}</Text>
              <Text selectable style={styles.personPhone}>{phone ?? t("No customer phone")}</Text>
            </View>
          </View>
          <View style={styles.contactActions}>
            <Button title="Call" icon={Phone} variant="secondary" disabled={!phone} onPress={callCustomer} style={styles.contactButton} />
            <Button title="Navigate" icon={Navigation} variant="secondary" disabled={!hasCoordinates} onPress={openLocation} style={styles.contactButton} />
          </View>
          {!hasCoordinates ? <Text style={styles.subtle}>{t("No pin attached")}</Text> : null}
        </Sheet>

        <Sheet style={styles.facts}>
          <Fact icon={Droplet} label="Items" last={false}><Text style={styles.factText}>{productSummary(order)}</Text></Fact>
          <Fact icon={Clock3} label="Window" last={false}>
            <Text style={styles.factText}>{t(order.deliverySchedule?.label ?? "No delivery time set")}</Text>
            {order.deliverySchedule?.window ? <Text style={styles.factMuted}>{order.deliverySchedule.window}</Text> : null}
          </Fact>
          <Fact icon={Banknote} label="Payment" last tint={due > 0 && !closed ? "amber" : "aqua"}>
            <Text style={styles.factText}>{formatCurrency(order.total, order.currency)}</Text>
            <Text style={due > 0 && !closed ? styles.factDue : styles.factMuted}>
              {due > 0 && !closed ? t("Collect on delivery") : t(paymentStatusLabel(order.paymentStatus))}
              {order.payment?.methodLabel ? "  ·  " + t(order.payment.methodLabel) : ""}
            </Text>
          </Fact>
        </Sheet>

        {notes.length ? (
          <View style={styles.notes}>
            {notes.map((note) => <Text key={note} style={styles.note}>{note}</Text>)}
          </View>
        ) : null}

        <Pressable accessibilityRole="button" accessibilityState={{ expanded: activityOpen }} onPress={() => setActivityOpen((open) => !open)} style={styles.link}>
          <Text style={styles.linkText}>{t(activityOpen ? "Hide activity" : "Show activity")}</Text>
        </Pressable>
        {activityOpen ? (
          <View style={styles.activity}>
            {order.customerReceivedAt ? <Text style={styles.subtle}>{t("Confirmed received on")} {formatDate(order.customerReceivedAt)}</Text> : null}
            {(order.messages ?? []).slice(-3).map((message) => (
              <View key={message.id} style={styles.notes}>
                <Text style={styles.noteAuthor}>{t(message.sender === "customer" ? "Customer" : message.sender === "nelma" ? "NELMA" : "System")}</Text>
                <Text style={styles.note}>{message.body}</Text>
              </View>
            ))}
            <OrderTimeline events={order.timeline} currentStatus={order.status} />
          </View>
        ) : null}

        {canStartDelivery(order) ? (
          <Pressable accessibilityRole="button" onPress={() => { setDeclineError(null); setDeclineOpen(true); }} style={styles.link}>
            <Text style={styles.linkText}>{t("Can't take this stop?")}</Text>
          </Pressable>
        ) : null}
        {open && !awaitingAccept ? (
          <Pressable accessibilityRole="button" onPress={() => { setIssueError(null); setIssueOpen(true); }} style={styles.link}>
            <Text style={styles.linkText}>{t("Problem with this stop?")}</Text>
          </Pressable>
        ) : open ? null : (
          <Pressable accessibilityRole="button" onPress={() => router.push("/support/contact")} style={styles.link}>
            <Text style={styles.linkText}>{t("Contact NELMA")}</Text>
          </Pressable>
        )}
      </ScrollView>

      <BottomActionBar
        buttonTitle={awaitingAccept ? "Accept stop" : nextAction ? dialogConfirmFor(nextAction) : closed ? "Back to Deliveries" : "Check for updates"}
        loading={Boolean(submittingAction) || accepting}
        disabled={busy || Boolean(pendingAction)}
        onPress={() => {
          if (awaitingAccept) void acceptStop();
          else if (nextAction) setPendingAction(nextAction);
          else if (closed) router.replace("/driver/(tabs)/deliveries");
          else void loadDelivery(false);
        }}
      >
        <Text style={styles.actionHint}>{t(driverActionHint(order))}</Text>
      </BottomActionBar>

      <ConfirmDialog
        visible={pendingAction === "start"}
        title={dialogTitleFor("start")}
        message={dialogMessageFor("start", order)}
        confirmLabel={dialogConfirmFor("start")}
        loading={submittingAction === "start"}
        onCancel={() => { if (!submittingAction) setPendingAction(null); }}
        onConfirm={() => void submitAction()}
      />

      <HandoverSheet
        visible={pendingAction === "delivered"}
        order={order}
        loading={submittingAction === "delivered"}
        error={handoverError}
        onCancel={() => { if (!submittingAction) { setPendingAction(null); setHandoverError(null); } }}
        onConfirm={(handover) => submitAction(handover)}
      />

      <IssueSheet
        visible={issueOpen}
        canUndo={order.status === "out_for_delivery"}
        loading={submittingIssue}
        error={issueError}
        onClose={() => setIssueOpen(false)}
        onSubmit={(input) => void submitIssue(input)}
        onContact={() => { setIssueOpen(false); router.push("/support/contact"); }}
      />

      <DeclineSheet
        visible={declineOpen}
        loading={submittingDecline}
        error={declineError}
        onClose={() => setDeclineOpen(false)}
        onSubmit={(input) => void submitDecline(input)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: driverTheme.pageBg },
  screen: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingHorizontal: spacing.xs, paddingVertical: spacing.xxs },
  headerButton: { alignItems: "center", justifyContent: "center", width: 44, height: 44 },
  orderNumber: { flex: 1, color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: 14, lineHeight: 20, fontVariant: ["tabular-nums"] },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  error: { color: colors.danger, fontFamily: typography.fonts.medium, fontSize: 13, lineHeight: 19 },
  progress: { gap: spacing.xs },
  segments: { flexDirection: "row", gap: 4 },
  segment: { flex: 1, height: 6, borderRadius: 3, backgroundColor: driverTheme.aquaLine },
  segmentDone: { backgroundColor: colors.primary },
  progressText: { color: colors.mutedText, fontFamily: typography.fonts.semibold, fontSize: 12, lineHeight: 18 },
  destination: { flexDirection: "row", gap: spacing.md, padding: spacing.md + 2 },
  pin: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: driverTheme.aqua },
  destinationCopy: { flex: 1, gap: 2 },
  eyebrow: { color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: 13, lineHeight: 18 },
  address: { color: colors.ink, fontFamily: typography.fonts.bold, fontSize: 23, letterSpacing: -0.4, lineHeight: 29 },
  area: { color: colors.mutedText, fontFamily: typography.fonts.regular, fontSize: 15, lineHeight: 22 },
  customerSheet: { padding: spacing.md, gap: spacing.md },
  person: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  initial: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: driverTheme.deep },
  initialText: { color: colors.white, fontFamily: typography.fonts.bold, fontSize: 18, lineHeight: 24 },
  personCopy: { flex: 1, gap: 1 },
  personName: { color: colors.ink, fontFamily: typography.fonts.bold, fontSize: 18, lineHeight: 25 },
  personPhone: { color: colors.mutedText, fontFamily: typography.fonts.regular, fontSize: 14, lineHeight: 20, fontVariant: ["tabular-nums"] },
  contactActions: { flexDirection: "row", gap: spacing.xs },
  contactButton: { flex: 1, minHeight: 48, paddingHorizontal: spacing.xs, backgroundColor: driverTheme.aqua, borderColor: driverTheme.aquaLine },
  subtle: { color: colors.mutedText, fontFamily: typography.fonts.regular, fontSize: 13, lineHeight: 19 },
  facts: { borderRadius: radius.xl },
  fact: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md },
  factDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: driverTheme.aquaLine },
  factIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: driverTheme.aqua },
  factIconAmber: { backgroundColor: driverTheme.amberBg },
  factLabel: { color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: 12, lineHeight: 17 },
  factValue: { flex: 1, gap: 1 },
  factText: { color: colors.ink, fontFamily: typography.fonts.bold, fontSize: 15, lineHeight: 21 },
  factMuted: { color: colors.mutedText, fontFamily: typography.fonts.regular, fontSize: 13, lineHeight: 19 },
  factDue: { color: driverTheme.amberText, fontFamily: typography.fonts.bold, fontSize: 13, lineHeight: 19 },
  notes: { gap: spacing.xxs, padding: spacing.md, borderRadius: radius.md, backgroundColor: driverTheme.aqua, borderLeftWidth: 4, borderLeftColor: colors.primary },
  note: { color: colors.text, fontFamily: typography.fonts.regular, fontSize: 15, lineHeight: 22 },
  noteAuthor: { color: colors.mutedText, fontFamily: typography.fonts.semibold, fontSize: 12, lineHeight: 18 },
  link: { minHeight: 44, justifyContent: "center" },
  linkText: { color: colors.primary, fontFamily: typography.fonts.semibold, fontSize: 14, lineHeight: 20 },
  activity: { gap: spacing.md },
  actionHint: { color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: 13, lineHeight: 19, textAlign: "center" }
});
