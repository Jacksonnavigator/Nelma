import { router, useFocusEffect } from "expo-router";
import { ChevronRight, Clock3, Droplets, MapPin, Phone, RefreshCw } from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { AppTopBar, Button, DriverDeliveryCard, EmptyState, ErrorState, Screen } from "../../../components";
import { colors } from "../../../constants/colors";
import { radius, spacing, typography } from "../../../constants/theme";
import { useTranslation } from "../../../hooks/use-translation";
import { repositories } from "../../../repositories";
import { haptics } from "../../../services/haptics";
import { useAuth } from "../../../store/auth-context";
import type { Order } from "../../../types/order";
import { canStartDelivery, customerDisplayName, deliveryAddressLine, deliveryAreaLine, deliveryTimeLabel, driverActionHint, driverDeliveryQueue, productSummary } from "../../../utils/driver-deliveries";
import { driverDeliveryStatusLabel } from "../../../utils/status";

export default function DriverDeliveriesScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestVersion = useRef(0);
  const queue = useMemo(() => driverDeliveryQueue(orders), [orders]);
  const [nextDelivery, ...remaining] = queue;
  const readyCount = queue.filter(canStartDelivery).length;
  const firstName = user?.fullName?.trim().split(/\s+/)[0];
  const continuing = nextDelivery?.status === "out_for_delivery" || nextDelivery?.status === "delivered";

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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadDeliveries} tintColor={colors.primary} colors={[colors.primary]} />}
          ListHeaderComponent={
            <View>
              <View style={styles.heading}>
                <View style={styles.headingCopy}>
                  <Text style={styles.greeting}>{t("Hello")}{firstName ? ", " + firstName : ""}</Text>
                  <Text style={styles.title}>{t("Your deliveries")}</Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel={t("Refresh Assignments")} disabled={refreshing} onPress={loadDeliveries} style={styles.refresh}>
                  {refreshing ? <ActivityIndicator color={colors.primary} /> : <RefreshCw color={colors.primary} size={21} />}
                </Pressable>
              </View>
              {error ? <Text accessibilityRole="alert" style={styles.error}>{t(error)}</Text> : null}
              <View style={styles.overview}>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>{queue.length}</Text>
                  <Text style={styles.statLabel}>{t("On your list")}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>{readyCount}</Text>
                  <Text style={styles.statLabel}>{t("Ready to start")}</Text>
                </View>
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
                  <Button title={continuing ? "Continue delivery" : "View pickup"} onPress={() => openDelivery(nextDelivery)} />
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
  heading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, marginBottom: spacing.lg },
  headingCopy: { flex: 1, gap: spacing.xxs },
  greeting: { color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: 14, lineHeight: 22 },
  title: { color: colors.text, fontFamily: typography.fonts.bold, fontSize: 28, lineHeight: 36 },
  refresh: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" },
  overview: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, paddingVertical: spacing.md, marginBottom: spacing.xl },
  stat: { flex: 1, paddingHorizontal: spacing.md, gap: spacing.xxs },
  statNumber: { color: colors.text, fontFamily: typography.fonts.bold, fontSize: 26, lineHeight: 32 },
  statLabel: { color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: 12, lineHeight: 18 },
  statDivider: { width: 1, height: 36, backgroundColor: colors.border },
  next: { padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, gap: spacing.md, backgroundColor: colors.white },
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
  listHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.xl },
  listTitle: { color: colors.text, fontFamily: typography.fonts.bold, fontSize: 18, lineHeight: 26 },
  listCount: { color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: 13, lineHeight: 20 },
  footer: { marginTop: spacing.xl, gap: spacing.lg },
  refreshHint: { color: colors.mutedText, fontFamily: typography.fonts.regular, fontSize: 12, lineHeight: 18, textAlign: "center" },
  support: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: spacing.md, minHeight: 60 },
  supportCopy: { flex: 1, gap: spacing.xxs },
  supportTitle: { color: colors.text, fontFamily: typography.fonts.semibold, fontSize: 14, lineHeight: 22 },
  error: { color: colors.danger, backgroundColor: colors.dangerBg, padding: spacing.sm, borderRadius: radius.sm, marginBottom: spacing.sm },
  state: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg, gap: spacing.sm }
});
