import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Banknote, Check, ChevronRight, Clock3, Droplet, MapPin, Navigation, Phone, RefreshCw } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BottomActionBar, Button, ConfirmDialog, DeclineSheet, ErrorState, HandoverSheet, IssueSheet, MapArt, OrderTimeline, Screen } from "../../../components";
import { colors } from "../../../constants/colors";
import { driverTheme, liftShadow, sheetShadow } from "../../../constants/driver-theme";
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
    <Screen safeBottom={false} contentContainerStyle={styles.screen} keyboard={false} padded={false} scroll={false} style={styles.safeMap}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.map}>
          <MapArt height={136} />
          <View style={styles.mapBar}>
            <Pressable accessibilityLabel={t("Back to Deliveries")} accessibilityRole="button" onPress={() => router.back()} style={[styles.floatButton, sheetShadow]}>
              <ArrowLeft size={21} color={colors.ink} />
            </Pressable>
            <Text style={[styles.orderNumber, sheetShadow]}>{order.orderNumber}</Text>
            <Pressable accessibilityLabel={t("Refresh delivery")} accessibilityRole="button" disabled={busy || Boolean(pendingAction)} onPress={() => void loadDelivery(false)} style={[styles.floatButton, sheetShadow]}>
              {refreshing ? <ActivityIndicator color={colors.primary} /> : <RefreshCw size={19} color={busy ? colors.disabled : colors.ink} />}
            </Pressable>
          </View>
        </View>

        <View style={styles.body}>
          <View style={[styles.destination, liftShadow]}>
            <Text style={styles.eyebrow}>{t("Deliver to")}</Text>
            <Text style={styles.address}>{deliveryAddressLine(order)}</Text>
            <View style={styles.areaRow}>
              <MapPin color={colors.primary} size={15} />
              <Text style={styles.area}>{deliveryAreaLine(order)}</Text>
              {!hasCoordinates ? <Text style={styles.noPin}>{t("No pin attached")}</Text> : null}
            </View>

            <View style={styles.person}>
              <View style={styles.initial}><Text style={styles.initialText}>{customerDisplayName(order).charAt(0).toUpperCase()}</Text></View>
              <View style={styles.personCopy}>
                <Text style={styles.personName}>{customerDisplayName(order)}</Text>
                <Text selectable style={styles.personPhone}>{phone ?? t("No customer phone")}</Text>
              </View>
            </View>
            <View style={styles.contactActions}>
              <Button title="Call" icon={Phone} variant="secondary" disabled={!phone} onPress={callCustomer} style={styles.contactButton} />
              <Button title="Navigate" icon={Navigation} disabled={!hasCoordinates} onPress={openLocation} style={styles.contactButton} />
            </View>
          </View>

          {error ? <Text accessibilityRole="alert" style={styles.error}>{t(error)}</Text> : null}

          {order.status !== "cancelled" ? (
            <View style={styles.steps}>
              {DELIVERY_STEPS.map((label, index) => {
                const done = index < step;
                const currentStep = index === step;
                return (
                  <View key={label} style={styles.stepCell}>
                    <View style={styles.stepRail}>
                      <View style={[styles.stepLine, index === 0 ? styles.stepLineHidden : index <= step ? styles.stepLineDone : null]} />
                      <View style={[styles.stepNode, done ? styles.stepNodeDone : currentStep ? styles.stepNodeCurrent : null]}>
                        {done ? <Check color={colors.white} size={12} strokeWidth={3} /> : <View style={[styles.stepDot, currentStep ? styles.stepDotCurrent : null]} />}
                      </View>
                      <View style={[styles.stepLine, index === DELIVERY_STEPS.length - 1 ? styles.stepLineHidden : index < step ? styles.stepLineDone : null]} />
                    </View>
                    <Text numberOfLines={1} style={[styles.stepLabel, currentStep ? styles.stepLabelCurrent : done ? styles.stepLabelDone : null]}>{t(label)}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.cancelled}>{t("This delivery was cancelled.")}</Text>
          )}

          <View style={[styles.ticket, sheetShadow]}>
            <View style={styles.ticketRow}>
              <View style={styles.ticketIcon}><Droplet color={colors.primary} size={17} /></View>
              <View style={styles.ticketCopy}>
                <Text style={styles.ticketLabel}>{t("Items")}</Text>
                <Text style={styles.ticketText}>{productSummary(order)}</Text>
              </View>
            </View>
            <View style={styles.ticketRow}>
              <View style={styles.ticketIcon}><Clock3 color={colors.primary} size={17} /></View>
              <View style={styles.ticketCopy}>
                <Text style={styles.ticketLabel}>{t("Window")}</Text>
                <Text style={styles.ticketText}>{t(order.deliverySchedule?.label ?? "No delivery time set")}</Text>
              </View>
              {order.deliverySchedule?.window ? <Text style={styles.ticketWindow}>{order.deliverySchedule.window}</Text> : null}
            </View>

            <View style={styles.perforation}>
              <View style={[styles.notch, styles.notchLeft]} />
              <View style={styles.dashes} />
              <View style={[styles.notch, styles.notchRight]} />
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.ticketLabel}>{t("Payment")}</Text>
              <Text style={styles.total}>{formatCurrency(order.total, order.currency)}</Text>
            </View>
            <View style={[styles.payState, due > 0 && !closed ? styles.payStateDue : null]}>
              {due > 0 && !closed ? <Banknote color={driverTheme.amberText} size={16} /> : null}
              <Text style={due > 0 && !closed ? styles.payDue : styles.payMuted}>
                {due > 0 && !closed ? t("Collect on delivery") : t(paymentStatusLabel(order.paymentStatus))}
                {order.payment?.methodLabel ? "  ·  " + t(order.payment.methodLabel) : ""}
              </Text>
            </View>
          </View>

          {notes.length ? (
            <View style={styles.notesBlock}>
              <Text style={styles.sectionLabel}>{t("From the customer")}</Text>
              {notes.map((note) => (
                <View key={note} style={styles.bubble}>
                  <Text style={styles.note}>{note}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={[styles.links, sheetShadow]}>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: activityOpen }} onPress={() => setActivityOpen((open) => !open)} style={({ pressed }) => [styles.link, pressed ? styles.linkPressed : null]}>
              <Text style={styles.linkText}>{t(activityOpen ? "Hide activity" : "Show activity")}</Text>
              <ChevronRight color={colors.subtleText} size={18} />
            </Pressable>
            {activityOpen ? (
              <View style={styles.activity}>
                {order.customerReceivedAt ? <Text style={styles.subtle}>{t("Confirmed received on")} {formatDate(order.customerReceivedAt)}</Text> : null}
                {(order.messages ?? []).slice(-3).map((message) => (
                  <View key={message.id} style={styles.bubble}>
                    <Text style={styles.noteAuthor}>{t(message.sender === "customer" ? "Customer" : message.sender === "nelma" ? "NELMA" : "System")}</Text>
                    <Text style={styles.note}>{message.body}</Text>
                  </View>
                ))}
                <OrderTimeline events={order.timeline} currentStatus={order.status} />
              </View>
            ) : null}

            {canStartDelivery(order) ? (
              <Pressable accessibilityRole="button" onPress={() => { setDeclineError(null); setDeclineOpen(true); }} style={({ pressed }) => [styles.link, styles.linkDivider, pressed ? styles.linkPressed : null]}>
                <Text style={styles.linkText}>{t("Can't take this stop?")}</Text>
                <ChevronRight color={colors.subtleText} size={18} />
              </Pressable>
            ) : null}
            {open && !awaitingAccept ? (
              <Pressable accessibilityRole="button" onPress={() => { setIssueError(null); setIssueOpen(true); }} style={({ pressed }) => [styles.link, styles.linkDivider, pressed ? styles.linkPressed : null]}>
                <Text style={[styles.linkText, styles.linkDanger]}>{t("Problem with this stop?")}</Text>
                <ChevronRight color={colors.subtleText} size={18} />
              </Pressable>
            ) : open ? null : (
              <Pressable accessibilityRole="button" onPress={() => router.push("/support/contact")} style={({ pressed }) => [styles.link, styles.linkDivider, pressed ? styles.linkPressed : null]}>
                <Text style={styles.linkText}>{t("Contact NELMA")}</Text>
                <ChevronRight color={colors.subtleText} size={18} />
              </Pressable>
            )}
          </View>
        </View>
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

const NOTCH = 22;

const styles = StyleSheet.create({
  safe: { backgroundColor: driverTheme.pageBg },
  safeMap: { backgroundColor: "#DDEFFB" },
  screen: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  scroll: { flex: 1, backgroundColor: driverTheme.pageBg },
  content: { paddingBottom: spacing.xl },
  map: { height: 136 },
  mapBar: { position: "absolute", top: spacing.sm, left: spacing.lg, right: spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  floatButton: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  orderNumber: { overflow: "hidden", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: colors.white, color: colors.text, fontFamily: typography.fonts.semibold, fontSize: 13, lineHeight: 18, fontVariant: ["tabular-nums"] },
  body: { paddingHorizontal: spacing.lg, marginTop: -spacing.xl, gap: spacing.md },
  error: { color: colors.danger, fontFamily: typography.fonts.medium, fontSize: 13, lineHeight: 19 },
  destination: { padding: spacing.md + 2, gap: 2, borderRadius: radius.xl + 12, backgroundColor: colors.white },
  eyebrow: { color: colors.mutedText, fontFamily: typography.fonts.semibold, fontSize: 12, lineHeight: 17, letterSpacing: 0.6, textTransform: "uppercase" },
  address: { color: colors.ink, fontFamily: typography.fonts.bold, fontSize: 23, letterSpacing: -0.5, lineHeight: 29 },
  areaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 },
  area: { color: colors.text, fontFamily: typography.fonts.medium, fontSize: 15, lineHeight: 22 },
  noPin: { color: colors.subtleText, fontFamily: typography.fonts.regular, fontSize: 13, lineHeight: 19 },
  person: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: driverTheme.aquaLine },
  initial: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", backgroundColor: driverTheme.deep },
  initialText: { color: colors.white, fontFamily: typography.fonts.bold, fontSize: 18, lineHeight: 24 },
  personCopy: { flex: 1, gap: 1 },
  personName: { color: colors.ink, fontFamily: typography.fonts.bold, fontSize: 17, lineHeight: 23 },
  personPhone: { color: colors.mutedText, fontFamily: typography.fonts.regular, fontSize: 14, lineHeight: 20, fontVariant: ["tabular-nums"] },
  contactActions: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.sm },
  contactButton: { flex: 1, minHeight: 46, paddingHorizontal: spacing.xs },
  steps: { flexDirection: "row" },
  stepCell: { flex: 1, alignItems: "center", gap: 6 },
  stepRail: { flexDirection: "row", alignItems: "center", alignSelf: "stretch" },
  stepLine: { flex: 1, height: 3, borderRadius: 2, backgroundColor: driverTheme.aquaLine },
  stepLineDone: { backgroundColor: colors.primary },
  stepLineHidden: { backgroundColor: "transparent" },
  stepNode: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.white, borderWidth: 2, borderColor: driverTheme.aquaLine },
  stepNodeDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepNodeCurrent: { borderColor: colors.primary, borderWidth: 3 },
  stepDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: driverTheme.aquaLine },
  stepDotCurrent: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  stepLabel: { color: colors.subtleText, fontFamily: typography.fonts.medium, fontSize: 11, lineHeight: 15 },
  stepLabelDone: { color: colors.text },
  stepLabelCurrent: { color: colors.primary, fontFamily: typography.fonts.bold },
  cancelled: { color: colors.danger, fontFamily: typography.fonts.semibold, fontSize: 14, lineHeight: 20 },
  ticket: { borderRadius: radius.xl + 6, backgroundColor: colors.white, paddingTop: spacing.xs, overflow: "hidden" },
  ticketRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  ticketIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: driverTheme.aqua },
  ticketCopy: { flex: 1, gap: 2 },
  ticketLabel: { color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: 12, lineHeight: 17 },
  ticketText: { color: colors.ink, fontFamily: typography.fonts.bold, fontSize: 15, lineHeight: 21 },
  ticketWindow: { color: colors.primary, fontFamily: typography.fonts.bold, fontSize: 14, lineHeight: 20, fontVariant: ["tabular-nums"] },
  perforation: { flexDirection: "row", alignItems: "center", height: NOTCH, marginVertical: spacing.xs },
  notch: { width: NOTCH, height: NOTCH, borderRadius: NOTCH / 2, backgroundColor: driverTheme.pageBg },
  notchLeft: { marginLeft: -NOTCH / 2 },
  notchRight: { marginRight: -NOTCH / 2 },
  dashes: { flex: 1, height: 0, marginHorizontal: spacing.xs, borderTopWidth: 2, borderStyle: "dashed", borderColor: driverTheme.aquaLine },
  totalRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: spacing.md, paddingHorizontal: spacing.md },
  payState: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: spacing.md, marginTop: spacing.xs, marginBottom: spacing.md },
  payStateDue: { backgroundColor: driverTheme.amberBg, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  payDue: { color: driverTheme.amberText, fontFamily: typography.fonts.bold, fontSize: 13, lineHeight: 18 },
  payMuted: { color: colors.text, fontFamily: typography.fonts.semibold, fontSize: 13, lineHeight: 18 },
  total: { color: driverTheme.deep, fontFamily: typography.fonts.bold, fontSize: 24, letterSpacing: -0.4, lineHeight: 30, fontVariant: ["tabular-nums"] },
  notesBlock: { gap: spacing.xs },
  sectionLabel: { color: colors.ink, fontFamily: typography.fonts.bold, fontSize: 15, lineHeight: 21 },
  bubble: { alignSelf: "flex-start", maxWidth: "92%", gap: 2, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.xl + 4, borderTopLeftRadius: 4, backgroundColor: colors.white, borderWidth: 1, borderColor: driverTheme.aquaLine },
  note: { color: colors.text, fontFamily: typography.fonts.regular, fontSize: 15, lineHeight: 22 },
  noteAuthor: { color: colors.mutedText, fontFamily: typography.fonts.semibold, fontSize: 12, lineHeight: 18 },
  links: { borderRadius: radius.xl + 6, backgroundColor: colors.white, overflow: "hidden" },
  link: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 54, paddingHorizontal: spacing.md },
  linkDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: driverTheme.aquaLine },
  linkPressed: { backgroundColor: driverTheme.pageBg },
  linkText: { color: colors.ink, fontFamily: typography.fonts.semibold, fontSize: 15, lineHeight: 21 },
  linkDanger: { color: colors.danger },
  activity: { gap: spacing.md, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  subtle: { color: colors.mutedText, fontFamily: typography.fonts.regular, fontSize: 13, lineHeight: 19 },
  actionHint: { color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: 13, lineHeight: 19, textAlign: "center" }
});
