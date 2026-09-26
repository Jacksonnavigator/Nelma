import { router, useFocusEffect } from "expo-router";
import { Clock3, Droplet, Navigation, Phone, RefreshCw } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, FlatList, Linking, Platform, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { BrandGradient, Button, DriverTitle, DropletArt, ErrorState, LiveDot, RouteStop, Ripples, Screen, Sheet, SkyBackdrop, WaterProgress } from "../../../components";
import { colors } from "../../../constants/colors";
import { driverTheme, sheetShadow } from "../../../constants/driver-theme";
import { radius, spacing, typography } from "../../../constants/theme";
import { useTranslation } from "../../../hooks/use-translation";
import { repositories } from "../../../repositories";
import { haptics } from "../../../services/haptics";
import { useLivePolling } from "../../../hooks/use-live-polling";
import { useDriverOutbox } from "../../../hooks/use-driver-outbox";
import { driverDuty } from "../../../services/driver-duty";
import { applyPending, driverOutbox } from "../../../services/driver-outbox";
import type { DriverSummary } from "../../../types/driver";
import type { Order } from "../../../types/order";
import { bottleCount, buildExternalMapUrl, canStartDelivery, cashDueAmount, customerContactPhone, customerDisplayName, deliveryAddressLine, deliveryAreaLine, deliveryWindowLabel, driverActionHint, driverDayStats, driverDeliveryQueue, hasDeliveryCoordinates, isConnectionError, needsAcceptance } from "../../../utils/driver-deliveries";
import { formatCurrency } from "../../../utils/format";
import { driverDeliveryStatusLabel } from "../../../utils/status";

export default function DriverDeliveriesScreen() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverTotals, setServerTotals] = useState<DriverSummary | null>(null);
  const [newStops, setNewStops] = useState(0);
  const [switchingDuty, setSwitchingDuty] = useState(false);
  const [offline, setOffline] = useState(false);
  const outbox = useDriverOutbox();
  const onDuty = serverTotals?.onDuty ?? true;
  const requestVersion = useRef(0);
  const knownIds = useRef<Set<string> | null>(null);
  const entrance = useRef(new Animated.Value(0)).current;
  const stats = useMemo(() => {
    const base = driverDayStats(orders);
    const completedToday = serverTotals?.today.deliveries ?? 0;
    return { ...base, completedToday, totalToday: completedToday + base.remaining };
  }, [orders, serverTotals]);
  const queue = useMemo(() => driverDeliveryQueue(orders), [orders]);
  const [current, ...remaining] = queue;
  const live = current?.status === "out_for_delivery";
  const isNewStop = current ? needsAcceptance(current) : false;
  const continuing = live || current?.status === "delivered";
  const phone = current ? customerContactPhone(current) : null;
  const canNavigate = current ? hasDeliveryCoordinates(current) : false;
  const due = current ? cashDueAmount(current) : 0;
  const bottles = current ? bottleCount(current) : 0;
  const today = useMemo(() => new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(new Date()), []);
  const progress = stats.totalToday > 0 ? stats.completedToday / stats.totalToday : 0;

  const summary = [
    stats.bottlesToDeliver > 0 ? stats.bottlesToDeliver + " " + t("bottles to go") : null,
    stats.cashToCollect > 0 ? formatCurrency(stats.cashToCollect) + " " + t("to collect") : null
  ].filter(Boolean).join("  ·  ");

  // Silent loads (background polling) never show spinners or errors; they only update what is on screen.
  const loadDeliveries = useCallback(async (silent = false) => {
    const version = ++requestVersion.current;
    if (!silent) {
      setRefreshing(true);
      setError(null);
    }
    try {
      // Send anything done without signal first, so the list below already reflects it.
      await driverOutbox.flush().catch(() => undefined);
      const [result, totals] = await Promise.all([
        repositories.driver.listActive(),
        Promise.resolve().then(() => repositories.driver.getSummary()).catch(() => null)
      ]);
      if (version !== requestVersion.current) return;
      const known = knownIds.current;
      const fresh = known ? result.filter((order) => !known.has(order.id)).length : 0;
      knownIds.current = new Set(result.map((order) => order.id));
      if (fresh > 0) {
        haptics.success();
        setNewStops((count) => count + fresh);
      }
      void driverOutbox.saveRoute(result);
      setOrders(result.map((order) => applyPending(order)));
      setOffline(false);
      if (totals) setServerTotals(totals);
    } catch (caught) {
      if (version !== requestVersion.current) return;
      const saved = isConnectionError(caught) ? await driverOutbox.savedRoute() : null;
      if (version !== requestVersion.current) return;
      if (saved) {
        setOrders(saved.map((order) => applyPending(order)));
        setOffline(true);
      } else if (!silent) {
        setError("Unable to load assigned deliveries right now.");
      }
    } finally {
      if (version === requestVersion.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void loadDeliveries();
    return () => { requestVersion.current += 1; };
  }, [loadDeliveries]));

  useLivePolling(() => void loadDeliveries(true), 30000);

  useEffect(() => {
    // Older backends do not report duty; leave the location beacon off for them.
    if (serverTotals) driverDuty.set(serverTotals.onDuty ?? null);
  }, [serverTotals]);

  useEffect(() => {
    if (loading) return;
    entrance.setValue(0);
    Animated.timing(entrance, { toValue: 1, duration: 420, useNativeDriver: true }).start();
  }, [entrance, loading, current?.id]);

  const toggleDuty = async () => {
    if (switchingDuty || !serverTotals) return;
    haptics.selection();
    setSwitchingDuty(true);
    setError(null);
    try {
      const next = await repositories.driver.setDuty(!onDuty);
      setServerTotals((totals) => (totals ? { ...totals, onDuty: next } : totals));
    } catch (caught) {
      const message = (caught as { message?: unknown }).message;
      setError(typeof message === "string" ? message : "Unable to change your duty status right now.");
    } finally {
      setSwitchingDuty(false);
    }
  };

  const open = (order: Order) => {
    haptics.selection();
    router.push({ pathname: "/driver/delivery/[id]", params: { id: order.id } });
  };

  const call = () => {
    if (!phone) return;
    haptics.selection();
    void Linking.openURL("tel:" + phone.replace(/[^+\d]/g, "")).catch(() => undefined);
  };

  const navigate = () => {
    if (!current) return;
    const platform = Platform.OS === "ios" || Platform.OS === "android" ? Platform.OS : "web";
    const url = buildExternalMapUrl(current.deliveryAddress.latitude, current.deliveryAddress.longitude, platform, deliveryAreaLine(current));
    if (!url) return;
    haptics.selection();
    void Linking.openURL(url).catch(() => undefined);
  };

  return (
    <Screen safeBottom={false} keyboard={false} padded={false} scroll={false} contentContainerStyle={styles.screen} style={styles.safe}>
      <SkyBackdrop />
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      ) : error && !orders.length ? (
        <View style={styles.center}><ErrorState message={error} onAction={() => void loadDeliveries()} /></View>
      ) : (
        <FlatList
          data={remaining}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadDeliveries()} tintColor={colors.primary} colors={[colors.primary]} />}
          ListHeaderComponent={
            <View>
              <DriverTitle
                eyebrow={today}
                title={stats.remaining === 0 ? t("All caught up") : stats.remaining + " " + t(stats.remaining === 1 ? "stop left" : "stops left")}
                right={
                  <Pressable accessibilityRole="button" accessibilityLabel={t("Refresh Assignments")} disabled={refreshing} hitSlop={8} onPress={() => void loadDeliveries()} style={[styles.refresh, sheetShadow]}>
                    {refreshing ? <ActivityIndicator color={colors.primary} size="small" /> : <RefreshCw color={colors.primary} size={18} />}
                  </Pressable>
                }
              />
              {serverTotals ? (
                <Pressable
                  accessibilityRole="switch"
                  accessibilityState={{ checked: onDuty, busy: switchingDuty }}
                  accessibilityLabel={t("On duty")}
                  disabled={switchingDuty}
                  onPress={() => void toggleDuty()}
                  style={[styles.duty, onDuty ? styles.dutyOn : styles.dutyOff]}
                >
                  <View style={[styles.dutyDot, onDuty ? styles.dutyDotOn : null]} />
                  <Text style={[styles.dutyLabel, onDuty ? styles.dutyLabelOn : null]}>{t(onDuty ? "On duty" : "Off duty")}</Text>
                  <Text style={styles.dutyHint}>
                    {switchingDuty ? t("Updating…") : t(onDuty ? "Tap to stop new stops" : "Tap when you are ready")}
                  </Text>
                </Pressable>
              ) : null}
              {error ? <Text accessibilityRole="alert" style={styles.error}>{t(error)}</Text> : null}
              {offline || outbox.pending.length ? (
                <View style={styles.sync}>
                  <Text style={styles.syncTitle}>{t(offline ? "No signal. This is your saved route." : "Sending your updates…")}</Text>
                  {outbox.pending.length ? (
                    <Text style={styles.syncBody}>
                      {outbox.pending.length === 1 ? t("1 update is saved on this phone") : outbox.pending.length + " " + t("updates are saved on this phone")}
                      {"  ·  "}{t("They send by themselves when the signal is back.")}
                    </Text>
                  ) : null}
                </View>
              ) : null}
              {outbox.failures.length ? (
                <Pressable accessibilityRole="button" onPress={() => driverOutbox.dismissFailures()} style={styles.rejected}>
                  {outbox.failures.map((failure) => (
                    <Text key={failure.orderId + failure.action} style={styles.rejectedText}>
                      {failure.orderNumber ?? t("A delivery")}: {t(failure.message)}
                    </Text>
                  ))}
                  <Text style={styles.rejectedDismiss}>{t("Dismiss")}</Text>
                </Pressable>
              ) : null}
              {newStops > 0 ? (
                <Pressable accessibilityRole="button" onPress={() => setNewStops(0)} style={styles.newStops}>
                  <Text style={styles.newStopsText}>{newStops === 1 ? t("1 new stop assigned to you") : newStops + " " + t("new stops assigned to you")}</Text>
                  <Text style={styles.newStopsDismiss}>{t("Dismiss")}</Text>
                </Pressable>
              ) : null}

              {stats.totalToday > 0 ? (
                <View style={styles.progress}>
                  <View style={styles.progressTop}>
                    <Text style={styles.progressLabel}>{t("Today's progress")}</Text>
                    <Text style={styles.progressValue}>{stats.completedToday} / {stats.totalToday}</Text>
                  </View>
                  <WaterProgress value={progress} />
                  {summary ? <Text style={styles.summary}>{summary}</Text> : null}
                </View>
              ) : null}

              {current ? (
                <Animated.View style={{ opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>
                  <BrandGradient style={styles.job}>
                    <Ripples size={300} style={styles.ripples} />
                    <View style={styles.jobTop}>
                      <View style={styles.jobBadge}>
                        {live ? <LiveDot /> : null}
                        <Text style={styles.jobBadgeText}>{t(continuing ? "Current delivery" : isNewStop ? "New stop" : "Next delivery")}</Text>
                      </View>
                      <Text style={styles.jobStatus}>{t(driverDeliveryStatusLabel(current.status))}</Text>
                    </View>
                    <Text style={styles.jobAddress}>{deliveryAddressLine(current)}</Text>
                    <Text style={styles.jobArea}>{deliveryAreaLine(current)}  {"·"}  {customerDisplayName(current)}</Text>
                    <View style={styles.jobChips}>
                      <View style={styles.glass}><Droplet color={colors.white} size={14} /><Text style={styles.glassText}>{bottles} x 20L</Text></View>
                      <View style={styles.glass}><Clock3 color={colors.white} size={14} /><Text style={styles.glassText}>{t(deliveryWindowLabel(current))}</Text></View>
                    </View>
                    {due > 0 ? (
                      <View style={styles.due}><Text style={styles.dueText}>{t("Collect")} {formatCurrency(due, current.currency)}</Text></View>
                    ) : null}
                    <Text style={styles.jobHint}>{t(driverActionHint(current))}</Text>
                    <View style={styles.jobActions}>
                      <Pressable accessibilityRole="button" accessibilityLabel={t("Call")} disabled={!phone} onPress={call} style={[styles.jobIcon, !phone ? styles.jobIconOff : null]}>
                        <Phone color={colors.white} size={20} />
                      </Pressable>
                      <Pressable accessibilityRole="button" accessibilityLabel={t("Navigate")} disabled={!canNavigate} onPress={navigate} style={[styles.jobIcon, !canNavigate ? styles.jobIconOff : null]}>
                        <Navigation color={colors.white} size={20} />
                      </Pressable>
                      <Button title={continuing ? "Continue delivery" : isNewStop ? "Review and accept" : canStartDelivery(current) ? "View pickup" : "View delivery"} variant="light" onPress={() => open(current)} style={styles.jobButton} />
                    </View>
                  </BrandGradient>
                </Animated.View>
              ) : (
                <View style={styles.empty}>
                  <DropletArt />
                  <Text style={styles.emptyTitle}>{t(onDuty ? "No stops right now" : "You are off duty")}</Text>
                  <Text style={styles.emptyBody}>
                    {t(onDuty ? "New assignments show up here as soon as dispatch sends them. Pull down to check." : "Dispatch will not send you new stops. Switch to On duty when you are ready to drive.")}
                  </Text>
                </View>
              )}

              {remaining.length ? (
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionLabel}>{t("Up next")}</Text>
                  <Text style={styles.sectionCount}>{remaining.length}</Text>
                </View>
              ) : null}
            </View>
          }
          renderItem={({ item, index }) => (
            <Sheet style={styles.stopSheet}>
              <RouteStop order={item} position={index + 2} last onPress={() => open(item)} />
            </Sheet>
          )}
          ItemSeparatorComponent={() => <View style={styles.gap} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: driverTheme.pageBg },
  screen: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  refresh: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  sync: { gap: 2, borderRadius: radius.md, backgroundColor: driverTheme.amberBg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: spacing.md },
  syncTitle: { color: driverTheme.amberText, fontFamily: typography.fonts.bold, fontSize: 13, lineHeight: 19 },
  syncBody: { color: colors.text, fontFamily: typography.fonts.regular, fontSize: 12, lineHeight: 18 },
  rejected: { gap: 4, borderRadius: radius.md, borderLeftWidth: 4, borderLeftColor: colors.danger, backgroundColor: colors.white, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: spacing.md },
  rejectedText: { color: colors.ink, fontFamily: typography.fonts.medium, fontSize: 13, lineHeight: 19 },
  rejectedDismiss: { color: colors.primary, fontFamily: typography.fonts.semibold, fontSize: 12, lineHeight: 18 },
  duty: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 8, borderRadius: 999, borderWidth: 1, paddingLeft: 12, paddingRight: 14, paddingVertical: 7, marginBottom: spacing.md },
  dutyOn: { backgroundColor: driverTheme.mintBg, borderColor: "rgba(27,127,111,0.22)" },
  dutyOff: { backgroundColor: colors.white, borderColor: driverTheme.aquaLine },
  dutyDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.mutedText },
  dutyDotOn: { backgroundColor: driverTheme.mintText },
  dutyLabel: { color: colors.ink, fontFamily: typography.fonts.bold, fontSize: 13, lineHeight: 18 },
  dutyLabelOn: { color: driverTheme.mintText },
  dutyHint: { color: colors.mutedText, fontFamily: typography.fonts.regular, fontSize: 12, lineHeight: 17 },
  error: { color: colors.danger, fontFamily: typography.fonts.medium, fontSize: 13, lineHeight: 19, marginBottom: spacing.sm },
  newStops: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: spacing.md },
  newStopsText: { flex: 1, color: colors.white, fontFamily: typography.fonts.bold, fontSize: 14, lineHeight: 20 },
  newStopsDismiss: { color: "rgba(255,255,255,0.85)", fontFamily: typography.fonts.medium, fontSize: 12, lineHeight: 18 },
  progress: { gap: spacing.xs, marginBottom: spacing.lg },
  progressTop: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  progressLabel: { color: colors.ink, fontFamily: typography.fonts.semibold, fontSize: 14, lineHeight: 20 },
  progressValue: { color: colors.primary, fontFamily: typography.fonts.bold, fontSize: 14, lineHeight: 20, fontVariant: ["tabular-nums"] },
  summary: { color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: 12, lineHeight: 18, marginTop: 2 },
  job: { padding: spacing.lg, gap: spacing.xs },
  ripples: { position: "absolute", right: -90, bottom: -110 },
  jobTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  jobBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  jobBadgeText: { color: colors.white, fontFamily: typography.fonts.semibold, fontSize: 12, lineHeight: 17 },
  jobStatus: { color: "rgba(255,255,255,0.78)", fontFamily: typography.fonts.medium, fontSize: 12, lineHeight: 18 },
  jobAddress: { color: colors.white, fontFamily: typography.fonts.bold, fontSize: 28, letterSpacing: -0.5, lineHeight: 34, marginTop: spacing.sm },
  jobArea: { color: "rgba(255,255,255,0.82)", fontFamily: typography.fonts.medium, fontSize: 15, lineHeight: 22 },
  jobChips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.md },
  glass: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.16)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  glassText: { color: colors.white, fontFamily: typography.fonts.semibold, fontSize: 13, lineHeight: 18 },
  due: { alignSelf: "flex-start", backgroundColor: driverTheme.amberBg, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, marginTop: spacing.xs },
  dueText: { color: driverTheme.amberText, fontFamily: typography.fonts.bold, fontSize: 14, lineHeight: 20 },
  jobHint: { color: "rgba(255,255,255,0.75)", fontFamily: typography.fonts.regular, fontSize: 13, lineHeight: 19, marginTop: spacing.md },
  jobActions: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.sm },
  jobIcon: { width: 52, height: 52, borderRadius: radius.md, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.18)" },
  jobIconOff: { opacity: 0.4 },
  jobButton: { flex: 1 },
  sectionRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.xl, marginBottom: spacing.sm },
  sectionLabel: { color: colors.ink, fontFamily: typography.fonts.bold, fontSize: 18, lineHeight: 24 },
  sectionCount: { minWidth: 24, paddingHorizontal: 8, borderRadius: 12, overflow: "hidden", textAlign: "center", color: colors.primary, backgroundColor: driverTheme.aqua, fontFamily: typography.fonts.bold, fontSize: 12, lineHeight: 24 },
  stopSheet: { borderRadius: radius.xl },
  gap: { height: spacing.sm },
  empty: { alignItems: "center", gap: spacing.xs, paddingVertical: spacing.xxl },
  emptyTitle: { color: colors.ink, fontFamily: typography.fonts.bold, fontSize: 20, lineHeight: 26, marginTop: spacing.sm },
  emptyBody: { color: colors.mutedText, fontFamily: typography.fonts.regular, fontSize: 15, lineHeight: 22, textAlign: "center", maxWidth: 300 }
});
