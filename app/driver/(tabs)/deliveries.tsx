import { router, useFocusEffect } from "expo-router";
import { Banknote, ChevronRight, Clock3, Droplets, MapPin, Navigation, Phone, RefreshCw, Truck } from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Linking, Platform, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { AppTopBar, Button, DriverDeliveryCard, EmptyState, ErrorState, Screen } from "../../../components";
import { colors } from "../../../constants/colors";
import { radius, shadows, spacing, typography } from "../../../constants/theme";
import { useTranslation } from "../../../hooks/use-translation";
import { repositories } from "../../../repositories";
import { haptics } from "../../../services/haptics";
import { useAuth } from "../../../store/auth-context";
import type { DriverDeliveryGroupFilter, Order } from "../../../types/order";
import { buildExternalMapUrl, canStartDelivery, customerContactPhone, customerDisplayName, deliveryAddressLine, deliveryAreaLine, deliveryTimeLabel, driverActionHint, driverDayStats, driverDeliveryQueue, filterDriverDeliveries, hasDeliveryCoordinates, productSummary } from "../../../utils/driver-deliveries";
import { formatCurrency } from "../../../utils/format";
import { driverDeliveryStatusLabel } from "../../../utils/status";

const groupFilters: Array<{ value: DriverDeliveryGroupFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" }
];

const greetingFor = (hour: number): string => {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

export default function DriverDeliveriesScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [group, setGroup] = useState<DriverDeliveryGroupFilter>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestVersion = useRef(0);
  const stats = useMemo(() => driverDayStats(orders), [orders]);
  const queue = useMemo(() => driverDeliveryQueue(filterDriverDeliveries(orders, { group })), [orders, group]);
  const [nextDelivery, ...remaining] = queue;
  const firstName = user?.fullName?.trim().split(/\s+/)[0];
  const continuing = nextDelivery?.status === "out_for_delivery" || nextDelivery?.status === "delivered";
  const progress = stats.totalToday > 0 ? Math.min(1, stats.completedToday / stats.totalToday) : 0;
  const nextPhone = nextDelivery ? customerContactPhone(nextDelivery) : null;
  const nextCanNavigate = nextDelivery ? hasDeliveryCoordinates(nextDelivery) : false;
  const todayLabel = useMemo(() => new Intl.DateTimeFormat("en-TZ", { weekday: "long", day: "numeric", month: "long" }).format(new Date()), []);

  const loadDeliveries = useCallback(async () => {
    const version = ++requestVersion.current;
    setRefreshing(true);
    setError(null);
    try {
      const result = await repositories.driver.listDeliveries();
      if (version === requestVersion.current) setOrders(result);
    } catch {
      if (version === requestVersion.current) setError("Unable to load assigned deliveries right now.");
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

  const openDelivery = (order: Order) => {
    haptics.selection();
    router.push({ pathname: "/driver/delivery/[id]", params: { id: order.id } });
  };

  const callNext = () => {
    if (!nextPhone) return;
    haptics.selection();
    void Linking.openURL("tel:" + nextPhone.replace(/[^+\d]/g, "")).catch(() => undefined);
  };

  const navigateNext = () => {
    if (!nextDelivery) return;
    const platform = Platform.OS === "ios" || Platform.OS === "android" ? Platform.OS : "web";
    const url = buildExternalMapUrl(nextDelivery.deliveryAddress.latitude, nextDelivery.deliveryAddress.longitude, platform, deliveryAreaLine(nextDelivery));
    if (!url) return;
    haptics.selection();
    void Linking.openURL(url).catch(() => undefined);
  };

  return (
    <Screen safeBottom={false} keyboard={false} padded={false} scroll={false} contentContainerStyle={styles.screen}>
      <AppTopBar />
      {loading ? (
        <View style={styles.state}><ActivityIndicator color={colors.primary} /><Text style={styles.muted}>{t("Loading assigned deliveries")}</Text></View>
      ) : error && !orders.length ? (
        <View style={styles.state}><ErrorState message={error} onAction={loadDeliveries} /></View>
      ) : (
        <FlatList
          data={remaining}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadDeliveries} tintColor={colors.primary} colors={[colors.primary]} />}
          ListHeaderComponent={
            <View>
              <View style={styles.hero}>
                <View style={styles.heroTop}>
                  <View style={styles.headingCopy}>
                    <Text style={styles.heroDate}>{todayLabel}</Text>
                    <Text style={styles.heroTitle}>{t(greetingFor(new Date().getHours()))}{firstName ? ", " + firstName : ""}</Text>
                  </View>
                  <Pressable accessibilityRole="button" accessibilityLabel={t("Refresh Assignments")} disabled={refreshing} onPress={loadDeliveries} style={styles.refresh}>
                    {refreshing ? <ActivityIndicator color={colors.white} /> : <RefreshCw color={colors.white} size={20} />}
                  </Pressable>
                </View>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>{t("Today's progress")}</Text>
                  <Text style={styles.progressValue}>{stats.completedToday} / {stats.totalToday}</Text>
                </View>
                <View style={styles.track}><View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} /></View>
                <Text style={styles.progressHint}>
                  {stats.totalToday === 0 ? t("No deliveries yet today") : stats.remaining === 0 ? t("All deliveries done. Great work!") : stats.remaining + " " + t("left to deliver")}
                </Text>
              </View>

              {error ? <Text accessibilityRole="alert" style={styles.error}>{t(error)}</Text> : null}

              <View style={styles.tiles}>
                <View style={styles.tile}>
                  <View style={[styles.tileIcon, { backgroundColor: colors.surfaceBlue }]}><Truck color={colors.primary} size={18} /></View>
                  <Text style={styles.tileNumber}>{stats.remaining}</Text>
                  <Text style={styles.tileLabel}>{stats.inProgress > 0 ? stats.inProgress + " " + t("on the way") : t("On your list")}</Text>
                </View>
                <View style={styles.tile}>
                  <View style={[styles.tileIcon, { backgroundColor: colors.surfaceMint }]}><Droplets color="#1F8A7C" size={18} /></View>
                  <Text style={styles.tileNumber}>{stats.bottlesToDeliver}</Text>
                  <Text style={styles.tileLabel}>{t("Bottles to deliver")}</Text>
                </View>
                <View style={styles.tile}>
                  <View style={[styles.tileIcon, { backgroundColor: colors.warningBg }]}><Banknote color="#9A6B00" size={18} /></View>
                  <Text numberOfLines={1} adjustsFontSizeToFit style={styles.tileNumber}>{stats.cashToCollect > 0 ? formatCurrency(stats.cashToCollect, "").trim() : "0"}</Text>
                  <Text style={styles.tileLabel}>{t("TZS to collect")}</Text>
                </View>
              </View>

              <View style={styles.chipRow}>
                {groupFilters.map((item) => {
                  const active = group === item.value;
                  return (
                    <Pressable key={item.value} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => { haptics.selection(); setGroup(item.value); }} style={[styles.chip, active ? styles.chipActive : null]}>
                      <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{t(item.label)}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {nextDelivery ? (
                <View style={styles.next}>
                  <View style={styles.nextHeading}>
                    <Text style={styles.eyebrow}>{t(continuing ? "Current delivery" : "Next delivery")}</Text>
                    <View style={styles.statusPill}>
                      <Text style={styles.status}>{t(driverDeliveryStatusLabel(nextDelivery.status))}</Text>
                    </View>
                  </View>
                  <View style={styles.destination}>
                    <MapPin color={colors.primary} size={23} />
                    <View style={styles.destinationCopy}>
                      <Text style={styles.address}>{deliveryAddressLine(nextDelivery)}</Text>
                      <Text style={styles.muted}>{deliveryAreaLine(nextDelivery)}</Text>
                    </View>
                  </View>
                  <Text style={styles.customer}>{customerDisplayName(nextDelivery)}</Text>
                  <View style={styles.summary}>
                    <View style={styles.summaryRow}><Droplets color={colors.mutedText} size={18} /><Text style={styles.product}>{productSummary(nextDelivery)}</Text></View>
                    <View style={styles.summaryRow}><Clock3 color={colors.mutedText} size={18} /><Text style={styles.schedule}>{t(deliveryTimeLabel(nextDelivery))}</Text></View>
                  </View>
                  <View style={styles.instruction}>
                    <Text style={styles.instructionText}>{t(driverActionHint(nextDelivery))}</Text>
                  </View>
                  <View style={styles.quickRow}>
                    <Button title="Call" icon={Phone} variant="secondary" disabled={!nextPhone} onPress={callNext} style={styles.quickButton} />
                    <Button title="Navigate" icon={Navigation} variant="secondary" disabled={!nextCanNavigate} onPress={navigateNext} style={styles.quickButton} />
                  </View>
                  <Button title={continuing ? "Continue delivery" : canStartDelivery(nextDelivery) ? "View pickup" : "View delivery"} onPress={() => openDelivery(nextDelivery)} />
                </View>
              ) : (
                <EmptyState title="No assigned deliveries yet" message="Your next delivery will appear here when it is assigned." />
              )}
              {remaining.length ? (
                <View style={styles.listHeading}>
                  <Text style={styles.listTitle}>{t("Up next")}</Text>
                  <Text style={styles.listCount}>{remaining.length}</Text>
                </View>
              ) : null}
            </View>
          }
          renderItem={({ item }) => <DriverDeliveryCard order={item} onPress={() => openDelivery(item)} />}
          ListFooterComponent={
            <View style={styles.footer}>
              <Text style={styles.refreshHint}>{t("Pull down to check for updates.")}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={t("Contact NELMA")} onPress={() => router.push("/support/contact")} style={({ pressed }) => [styles.support, { opacity: pressed ? 0.7 : 1 }]}>
                <Phone color={colors.primary} size={20} />
                <View style={styles.supportCopy}>
                  <Text style={styles.supportTitle}>{t("Need a hand?")}</Text>
                  <Text style={styles.muted}>{t("Contact NELMA")}</Text>
                </View>
                <ChevronRight color={colors.mutedText} size={20} />
              </Pressable>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  hero: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm, marginBottom: spacing.md, ...(shadows.raised ?? {}) },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  headingCopy: { flex: 1, gap: spacing.xxs },
  heroDate: { color: "rgba(255,255,255,0.85)", fontFamily: typography.fonts.medium, fontSize: 13, lineHeight: 20 },
  heroTitle: { color: colors.white, fontFamily: typography.fonts.bold, fontSize: 24, lineHeight: 32 },
  refresh: { width: 42, height: 42, borderRadius: radius.sm, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  progressHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.xs },
  progressLabel: { color: colors.white, fontFamily: typography.fonts.semibold, fontSize: 14, lineHeight: 20 },
  progressValue: { color: colors.white, fontFamily: typography.fonts.bold, fontSize: 16, lineHeight: 22 },
  track: { height: 10, borderRadius: radius.pill, backgroundColor: "rgba(255,255,255,0.28)", overflow: "hidden" },
  fill: { height: 10, borderRadius: radius.pill, backgroundColor: colors.accent },
  progressHint: { color: "rgba(255,255,255,0.92)", fontFamily: typography.fonts.medium, fontSize: 12, lineHeight: 18 },
  tiles: { flexDirection: "row", gap: spacing.xs, marginBottom: spacing.md },
  tile: { flex: 1, backgroundColor: colors.white, borderColor: colors.line, borderWidth: 1, borderRadius: radius.md, padding: spacing.sm, gap: spacing.xxs },
  tileIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: spacing.xxs },
  tileNumber: { color: colors.text, fontFamily: typography.fonts.bold, fontSize: 22, lineHeight: 28 },
  tileLabel: { color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: 11, lineHeight: 16 },
  chipRow: { flexDirection: "row", gap: spacing.xs, marginBottom: spacing.md },
  chip: { minHeight: 38, paddingHorizontal: spacing.md, alignItems: "center", justifyContent: "center", borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontFamily: typography.fonts.bold, fontSize: 13, lineHeight: 18 },
  chipTextActive: { color: colors.white },
  next: { padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, gap: spacing.md, backgroundColor: colors.white, ...(shadows.card ?? {}) },
  nextHeading: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between", gap: spacing.xs },
  eyebrow: { color: colors.text, fontFamily: typography.fonts.semibold, fontSize: 13, lineHeight: 20 },
  statusPill: { paddingHorizontal: spacing.xs, paddingVertical: spacing.xxs, backgroundColor: colors.surfaceBlue, borderRadius: radius.xs },
  status: { color: colors.text, fontFamily: typography.fonts.semibold, fontSize: 11, lineHeight: 18 },
  destination: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  destinationCopy: { flex: 1, gap: spacing.xxs },
  address: { color: colors.text, fontFamily: typography.fonts.bold, fontSize: 23, lineHeight: 31 },
  customer: { color: colors.text, fontFamily: typography.fonts.semibold, fontSize: 16, lineHeight: 24 },
  muted: { color: colors.mutedText, fontFamily: typography.fonts.regular, fontSize: 13, lineHeight: 20 },
  summary: { gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.md },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  product: { flex: 1, color: colors.text, fontFamily: typography.fonts.medium, fontSize: 14, lineHeight: 22 },
  schedule: { flex: 1, color: colors.mutedText, fontFamily: typography.fonts.regular, fontSize: 13, lineHeight: 20 },
  instruction: { backgroundColor: colors.surfaceBlue, borderRadius: radius.xs, padding: spacing.sm },
  instructionText: { color: colors.text, fontFamily: typography.fonts.regular, fontSize: 13, lineHeight: 20 },
  quickRow: { flexDirection: "row", gap: spacing.sm },
  quickButton: { flex: 1, minHeight: 48, paddingHorizontal: spacing.xs },
  listHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.xl, marginBottom: spacing.sm },
  listTitle: { color: colors.text, fontFamily: typography.fonts.bold, fontSize: 18, lineHeight: 26 },
  listCount: { color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: 13, lineHeight: 20 },
  separator: { height: spacing.sm },
  footer: { marginTop: spacing.xl, gap: spacing.lg },
  refreshHint: { color: colors.mutedText, fontFamily: typography.fonts.regular, fontSize: 12, lineHeight: 18, textAlign: "center" },
  support: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: spacing.md, minHeight: 60 },
  supportCopy: { flex: 1, gap: spacing.xxs },
  supportTitle: { color: colors.text, fontFamily: typography.fonts.semibold, fontSize: 14, lineHeight: 22 },
  error: { color: colors.danger, backgroundColor: colors.dangerBg, padding: spacing.sm, borderRadius: radius.sm, marginBottom: spacing.sm },
  state: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg, gap: spacing.sm }
});
