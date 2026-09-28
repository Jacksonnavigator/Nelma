import { router, useFocusEffect } from "expo-router";
import { Banknote, Clock3, Droplet, Navigation, Phone, RefreshCw } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, FlatList, Linking, Platform, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Button, DropletArt, ErrorState, HeaderBand, LiveDot, ProgressRing, RouteStop, Screen } from "../../../components";
import { colors } from "../../../constants/colors";
import { driverTheme, liftShadow } from "../../../constants/driver-theme";
import { radius, spacing, typography } from "../../../constants/theme";
import { useLightStatusBar } from "../../../hooks/use-light-status-bar";
import { useTranslation } from "../../../hooks/use-translation";
import { useAuth } from "../../../store/auth-context";
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
  const { user } = useAuth();
  useLightStatusBar();
  const firstName = user?.fullName?.trim().split(/\s+/)[0];
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
  const today = useMemo(() => new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" }).format(new Date()), []);
  const progress = stats.totalToday > 0 ? stats.completedToday / stats.totalToday : 0;

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
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      ) : error && !orders.length ? (
        <View style={styles.center}><ErrorState message={error} onAction={() => void loadDeliveries()} /></View>
      ) : (
        <FlatList
          data={remaining}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadDeliveries()} tintColor={colors.white} colors={[colors.primary]} progressBackgroundColor={colors.white} />}
          ListHeaderComponent={
            <View>
              <HeaderBand style={styles.band}>
                <View style={styles.bandTop}>
                  <View style={styles.bandGreeting}>
                    <Text numberOfLines={1} style={styles.hello}>{firstName ? t("Habari") + ", " + firstName : t("Habari")}</Text>
                    <Text numberOfLines={1} style={styles.eyebrow}>{today}</Text>
                  </View>
                  {serverTotals ? (
                    <Pressable
                      accessibilityRole="switch"
                      accessibilityState={{ checked: onDuty, busy: switchingDuty }}
                      accessibilityLabel={t("On duty")}
                      disabled={switchingDuty}
                      hitSlop={6}
                      onPress={() => void toggleDuty()}
                      style={styles.duty}
                    >
                      <Text style={styles.dutyLabel}>{switchingDuty ? t("Updating…") : t(onDuty ? "On duty" : "Off duty")}</Text>
                      <View style={[styles.track, onDuty ? styles.trackOn : null]}>
                        <View style={[styles.knob, onDuty ? styles.knobOn : null]} />
                      </View>
                    </Pressable>
                  ) : null}
                  <Pressable accessibilityRole="button" accessibilityLabel={t("Refresh Assignments")} disabled={refreshing} hitSlop={8} onPress={() => void loadDeliveries()} style={styles.refresh}>
                    {refreshing ? <ActivityIndicator color={colors.white} size="small" /> : <RefreshCw color={colors.white} size={16} />}
                  </Pressable>
                </View>

                <View style={styles.dayRow}>
                  <ProgressRing value={progress} size={62} stroke={7}>
                    <Text style={styles.ringValue}>{stats.completedToday}/{stats.totalToday}</Text>
                  </ProgressRing>
                  <View style={styles.dayCopy}>
                    <Text accessibilityRole="header" style={styles.title}>
                      {stats.remaining === 0 ? t("All caught up") : stats.remaining + " " + t(stats.remaining === 1 ? "stop left" : "stops left")}
                    </Text>
                    {stats.bottlesToDeliver > 0 || stats.cashToCollect > 0 ? (
                      <View style={styles.dayFacts}>
                        {stats.bottlesToDeliver > 0 ? (
                          <View style={styles.dayFact}>
                            <Droplet color={driverTheme.mintBright} size={13} />
                            <Text style={styles.dayFactText}>{stats.bottlesToDeliver} {t("bottles")}</Text>
                          </View>
                        ) : null}
                        {stats.cashToCollect > 0 ? (
                          <View style={styles.dayFact}>
                            <Banknote color={driverTheme.mintBright} size={13} />
                            <Text style={styles.dayFactText}>{formatCurrency(stats.cashToCollect)}</Text>
                          </View>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                </View>
              </HeaderBand>

              <View style={styles.body}>
                {error ? <Text accessibilityRole="alert" style={[styles.notice, styles.error]}>{t(error)}</Text> : null}
                {offline || outbox.pending.length ? (
                  <View style={[styles.notice, styles.sync]}>
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
                  <Pressable accessibilityRole="button" onPress={() => driverOutbox.dismissFailures()} style={[styles.notice, styles.rejected]}>
                    {outbox.failures.map((failure) => (
                      <Text key={failure.orderId + failure.action} style={styles.rejectedText}>
                        {failure.orderNumber ?? t("A delivery")}: {t(failure.message)}
                      </Text>
                    ))}
                    <Text style={styles.rejectedDismiss}>{t("Dismiss")}</Text>
                  </Pressable>
                ) : null}
                {newStops > 0 ? (
                  <Pressable accessibilityRole="button" onPress={() => setNewStops(0)} style={[styles.notice, styles.newStops]}>
                    <LiveDot />
                    <Text style={styles.newStopsText}>{newStops === 1 ? t("1 new stop assigned to you") : newStops + " " + t("new stops assigned to you")}</Text>
                    <Text style={styles.newStopsDismiss}>{t("Dismiss")}</Text>
                  </Pressable>
                ) : null}

                {current ? (
                  <Animated.View style={[styles.job, liftShadow, { opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
                    <View style={styles.jobHead}>
                      <View style={[styles.jobBadge, live ? styles.jobBadgeLive : null]}>
                        {live ? <LiveDot color={driverTheme.mintText} /> : null}
                        <Text style={[styles.jobBadgeText, live ? styles.jobBadgeTextLive : null]}>{t(continuing ? "Current delivery" : isNewStop ? "New stop" : "Next delivery")}</Text>
                      </View>
                      <Text style={styles.jobStatus}>{t(driverDeliveryStatusLabel(current.status))}</Text>
                    </View>

                    <View style={styles.jobBody}>
                      <Text style={styles.jobAddress}>{deliveryAddressLine(current)}</Text>
                      <Text style={styles.jobArea}>{deliveryAreaLine(current)}  {"·"}  {customerDisplayName(current)}</Text>

                      <View style={styles.docket}>
                        <View style={[styles.docketCell, styles.docketCellTight]}>
                          <Droplet color={colors.primary} size={16} />
                          <Text style={styles.docketValue}>{bottles} x 20L</Text>
                        </View>
                        <View style={styles.docketRule} />
                        <View style={styles.docketCell}>
                          <Clock3 color={colors.primary} size={16} />
                          <Text style={styles.docketValue}>{t(deliveryWindowLabel(current))}</Text>
                        </View>
                      </View>
                      {due > 0 ? (
                        <View style={styles.due}>
                          <Banknote color={driverTheme.amberText} size={18} />
                          <Text style={styles.dueText}>{t("Collect")} {formatCurrency(due, current.currency)}</Text>
                        </View>
                      ) : null}

                      <Text style={styles.jobHint}>{t(driverActionHint(current))}</Text>
                      <View style={styles.jobActions}>
                        <Pressable accessibilityRole="button" accessibilityLabel={t("Call")} disabled={!phone} onPress={call} style={[styles.jobIcon, !phone ? styles.jobIconOff : null]}>
                          <Phone color={colors.primary} size={20} />
                        </Pressable>
                        <Pressable accessibilityRole="button" accessibilityLabel={t("Navigate")} disabled={!canNavigate} onPress={navigate} style={[styles.jobIcon, !canNavigate ? styles.jobIconOff : null]}>
                          <Navigation color={colors.primary} size={20} />
                        </Pressable>
                        <Button title={continuing ? "Continue delivery" : isNewStop ? "Review and accept" : canStartDelivery(current) ? "View pickup" : "View delivery"} onPress={() => open(current)} style={styles.jobButton} />
                      </View>
                    </View>
                  </Animated.View>
                ) : (
                  <View style={[styles.empty, liftShadow]}>
                    <DropletArt size={112} />
                    <Text style={styles.emptyTitle}>{t(onDuty ? "No stops right now" : "You are off duty")}</Text>
                    <Text style={styles.emptyBody}>
                      {t(onDuty ? "New assignments show up here as soon as dispatch sends them. Pull down to check." : "Dispatch will not send you new stops. Switch to On duty when you are ready to drive.")}
                    </Text>
                  </View>
                )}

                {remaining.length ? (
                  <View style={styles.sectionRow}>
                    <Text style={styles.sectionLabel}>{t("Up next")}</Text>
                    <Text style={styles.sectionCount}>{remaining.length} {t(remaining.length === 1 ? "stop" : "stops")}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          }
          renderItem={({ item, index }) => (
            <View style={styles.stop}>
              <RouteStop order={item} position={index + 2} first={index === 0} last={index === remaining.length - 1} onPress={() => open(item)} />
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: driverTheme.night },
  screen: { flex: 1 },
  list: { backgroundColor: driverTheme.pageBg },
  content: { paddingBottom: spacing.xxxl },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg, backgroundColor: driverTheme.pageBg },
  band: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxxl + spacing.xxs, gap: spacing.md },
  bandTop: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  bandGreeting: { flex: 1 },
  eyebrow: { color: driverTheme.onDark, fontFamily: typography.fonts.medium, fontSize: 12, lineHeight: 17 },
  hello: { color: colors.white, fontFamily: typography.fonts.semibold, fontSize: 15, lineHeight: 21 },
  refresh: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: driverTheme.glass, borderWidth: 1, borderColor: driverTheme.glassLine },
  dayRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  ringValue: { color: colors.white, fontFamily: typography.fonts.bold, fontSize: 15, lineHeight: 19, fontVariant: ["tabular-nums"] },
  dayCopy: { flex: 1, gap: 2 },
  title: { color: colors.white, fontFamily: typography.fonts.bold, fontSize: 25, letterSpacing: -0.5, lineHeight: 30 },
  dayFacts: { flexDirection: "row", flexWrap: "wrap", columnGap: spacing.md, rowGap: 2 },
  dayFact: { flexDirection: "row", alignItems: "center", gap: 5 },
  dayFactText: { color: driverTheme.onDark, fontFamily: typography.fonts.medium, fontSize: 13, lineHeight: 18, fontVariant: ["tabular-nums"] },
  duty: { flexDirection: "row", alignItems: "center", gap: spacing.xs, borderRadius: 999, paddingLeft: spacing.sm, paddingRight: 4, paddingVertical: 4, backgroundColor: driverTheme.glass, borderWidth: 1, borderColor: driverTheme.glassLine },
  dutyLabel: { color: colors.white, fontFamily: typography.fonts.semibold, fontSize: 12, lineHeight: 16 },
  track: { width: 36, height: 22, borderRadius: 11, padding: 2, justifyContent: "center", backgroundColor: "rgba(255,255,255,0.22)" },
  trackOn: { backgroundColor: driverTheme.mintBright },
  knob: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.white },
  knobOn: { alignSelf: "flex-end" },
  body: { paddingHorizontal: spacing.lg, marginTop: -spacing.xxl, gap: spacing.sm },
  notice: { borderRadius: radius.md + 2, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  error: { color: colors.danger, backgroundColor: colors.white, fontFamily: typography.fonts.medium, fontSize: 13, lineHeight: 19 },
  sync: { gap: 2, backgroundColor: driverTheme.amberBg },
  syncTitle: { color: driverTheme.amberText, fontFamily: typography.fonts.bold, fontSize: 13, lineHeight: 19 },
  syncBody: { color: colors.text, fontFamily: typography.fonts.regular, fontSize: 12, lineHeight: 18 },
  rejected: { gap: 4, borderLeftWidth: 4, borderLeftColor: colors.danger, backgroundColor: colors.white },
  rejectedText: { color: colors.ink, fontFamily: typography.fonts.medium, fontSize: 13, lineHeight: 19 },
  rejectedDismiss: { color: colors.primary, fontFamily: typography.fonts.semibold, fontSize: 12, lineHeight: 18 },
  newStops: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: driverTheme.night },
  newStopsText: { flex: 1, color: colors.white, fontFamily: typography.fonts.bold, fontSize: 14, lineHeight: 20 },
  newStopsDismiss: { color: driverTheme.onDark, fontFamily: typography.fonts.medium, fontSize: 12, lineHeight: 18 },
  job: { borderRadius: radius.xl + 12, backgroundColor: colors.white },
  jobHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, paddingHorizontal: spacing.md + 2, paddingTop: spacing.md },
  jobBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: driverTheme.aqua, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  jobBadgeLive: { backgroundColor: driverTheme.mintBg },
  jobBadgeText: { color: colors.primary, fontFamily: typography.fonts.bold, fontSize: 12, lineHeight: 17 },
  jobBadgeTextLive: { color: driverTheme.mintText },
  jobStatus: { color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: 12, lineHeight: 18 },
  jobBody: { padding: spacing.md + 2, paddingTop: spacing.xs, gap: spacing.xs },
  jobAddress: { color: colors.ink, fontFamily: typography.fonts.bold, fontSize: 24, letterSpacing: -0.5, lineHeight: 29 },
  jobArea: { color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: 15, lineHeight: 22 },
  docket: { flexDirection: "row", alignItems: "center", marginTop: spacing.xxs, borderRadius: radius.md + 2, backgroundColor: driverTheme.pageBg, borderWidth: 1, borderColor: driverTheme.aquaLine },
  docketCell: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.xs },
  docketCellTight: { flexGrow: 0, flexShrink: 0, flexBasis: "auto", paddingHorizontal: spacing.md },
  docketRule: { width: 1, alignSelf: "stretch", marginVertical: spacing.xs, backgroundColor: driverTheme.aquaLine },
  docketValue: { flexShrink: 1, color: colors.ink, fontFamily: typography.fonts.bold, fontSize: 14, lineHeight: 20, fontVariant: ["tabular-nums"] },
  due: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: radius.md + 2, backgroundColor: driverTheme.amberBg, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2 },
  dueText: { color: driverTheme.amberText, fontFamily: typography.fonts.bold, fontSize: 15, lineHeight: 21 },
  jobHint: { color: colors.subtleText, fontFamily: typography.fonts.regular, fontSize: 12, lineHeight: 17 },
  jobActions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.xs, marginTop: spacing.xxs },
  jobIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: driverTheme.aqua },
  jobIconOff: { opacity: 0.4 },
  // Grows beside the round buttons; on narrow phones it drops to its own full-width row instead of truncating.
  jobButton: { flexGrow: 1, flexBasis: 170, minHeight: 50, paddingHorizontal: spacing.sm },
  empty: { alignItems: "center", gap: spacing.xs, paddingVertical: spacing.xl, paddingHorizontal: spacing.lg, borderRadius: radius.xl + 12, backgroundColor: colors.white },
  emptyTitle: { color: colors.ink, fontFamily: typography.fonts.bold, fontSize: 20, lineHeight: 26, marginTop: spacing.xs },
  emptyBody: { color: colors.mutedText, fontFamily: typography.fonts.regular, fontSize: 15, lineHeight: 22, textAlign: "center", maxWidth: 300 },
  sectionRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginTop: spacing.md, marginBottom: spacing.xxs },
  sectionLabel: { color: colors.ink, fontFamily: typography.fonts.bold, fontSize: 19, lineHeight: 25 },
  sectionCount: { color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: 13, lineHeight: 18 },
  stop: { paddingLeft: spacing.xs, paddingRight: spacing.lg }
});
