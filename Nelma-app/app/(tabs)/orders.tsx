import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ChevronRight, PackageCheck } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, SectionList, StyleSheet, Text, View } from "react-native";
import { AppTopBar, EmptyState, ErrorState, OrderCard, ProductImage, Screen } from "../../components";
import { colors } from "../../constants/colors";
import { catalogItem } from "../../constants/pricing";
import { spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";
import { haptics } from "../../services/haptics";
import { useOrders } from "../../store/order-context";
import type { Order, OrderFilter, OrderStatus } from "../../types/order";
import { formatCurrency } from "../../utils/format";
import { filterOrders } from "../../utils/order";
import { orderStatusLabel } from "../../utils/status";

const filters: Array<{ value: OrderFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" }
];

const steps = ["Placed", "Confirmed", "On the way", "Delivered"];

const stepIndex = (status: OrderStatus): number => {
  if (status === "pending") return 0;
  if (status === "confirmed" || status === "processing") return 1;
  if (status === "out_for_delivery") return 2;
  return 3;
};

const monthKey = (iso: string) => iso.slice(0, 7);
const monthLabel = (key: string) => new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(new Date(`${key}-01T00:00:00`));

export default function OrdersScreen() {
  const { orders, status, error, loadOrders, startOrder, activeOrder, pricingCatalog } = useOrders();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<OrderFilter>("all");

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const counts = useMemo(
    () => Object.fromEntries(filters.map((option) => [option.value, filterOrders(orders, option.value).length])) as Record<OrderFilter, number>,
    [orders]
  );
  const spent = useMemo(() => orders.filter((order) => order.status !== "cancelled").reduce((sum, order) => sum + order.total, 0), [orders]);

  // The live order is pinned above the list, so it is left out of "All" to avoid showing it twice.
  const sections = useMemo(() => {
    const visible = filterOrders(orders, filter).filter((order) => filter !== "all" || order.id !== activeOrder?.id);
    const groups = new Map<string, Order[]>();
    for (const order of visible) {
      const key = monthKey(order.createdAt);
      groups.set(key, [...(groups.get(key) ?? []), order]);
    }
    return [...groups.entries()].map(([key, data]) => ({ key, title: monthLabel(key), data }));
  }, [orders, filter, activeOrder]);

  const openOrder = (id: string) => {
    haptics.selection();
    router.push({ pathname: "/orders/[id]", params: { id } });
  };

  const start = () => {
    haptics.selection();
    startOrder();
    router.push("/(tabs)/home");
  };

  if (status === "error" && !orders.length) {
    return (
      <Screen safeBottom={false} contentContainerStyle={styles.screen} keyboard={false} padded={false} scroll={false} style={styles.safe}>
        <AppTopBar />
        <View style={styles.errorWrap}>
          <ErrorState message={error ?? "Unable to load orders."} onAction={loadOrders} />
        </View>
      </Screen>
    );
  }

  const showActive = Boolean(activeOrder) && filter === "all";
  const activeProduct = activeOrder ? catalogItem(pricingCatalog, activeOrder.orderType) : null;
  const current = activeOrder ? stepIndex(activeOrder.status) : 0;
  // Delivered but not yet confirmed by the customer: the card asks them to confirm instead of track.
  const awaitingConfirm = activeOrder?.status === "delivered";

  const header = (
    <View style={styles.headerBlock}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{t("My orders")}</Text>
        {orders.length ? (
          <Text style={styles.summary}>
            {orders.length} {t(orders.length === 1 ? "order" : "orders")} · {formatCurrency(spent)}
          </Text>
        ) : null}
      </View>

      {showActive && activeOrder && activeProduct ? (
        <Pressable accessibilityRole="button" onPress={() => openOrder(activeOrder.id)} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
          <LinearGradient colors={["#00A6E8", "#0077C8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.live}>
            <View style={styles.liveTop}>
              <ProductImage product={activeProduct} style={styles.liveThumb} iconSize={20} />
              <View style={styles.liveCopy}>
                <Text style={styles.liveEyebrow}>{t(awaitingConfirm ? "DID IT ARRIVE?" : "IN PROGRESS")}</Text>
                <Text numberOfLines={1} style={styles.liveName}>
                  {activeOrder.quantity} × {t(activeOrder.items[0]?.productName || activeProduct.label)}
                </Text>
                <Text style={styles.liveMeta}>
                  #{activeOrder.orderNumber} · {t(orderStatusLabel(activeOrder.status))}
                </Text>
              </View>
              <View style={styles.liveTrack}>
                <Text style={styles.liveTrackText}>{t(awaitingConfirm ? "Confirm" : "Track")}</Text>
                <ChevronRight color={colors.white} size={14} strokeWidth={2.6} />
              </View>
            </View>
            <View style={styles.progress}>
              {steps.map((step, index) => (
                <View key={step} style={styles.step}>
                  <View style={[styles.bar, index <= current ? styles.barOn : null]} />
                  <Text style={[styles.stepText, index <= current ? styles.stepTextOn : null]}>{t(step)}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </Pressable>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {filters.map((option) => {
          const selected = option.value === filter;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => {
                haptics.selection();
                setFilter(option.value);
              }}
              style={[styles.chip, selected ? styles.chipOn : null]}
            >
              <Text style={[styles.chipText, selected ? styles.chipTextOn : null]}>{t(option.label)}</Text>
              <View style={[styles.count, selected ? styles.countOn : null]}>
                <Text style={[styles.countText, selected ? styles.countTextOn : null]}>{counts[option.value]}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {status === "error" && orders.length ? <Text style={styles.errorText}>{t(error ?? "Unable to refresh orders.")}</Text> : null}
    </View>
  );

  const emptyFiltered = filter !== "all";
  const onlyActive = filter === "all" && Boolean(activeOrder) && orders.length === 1;

  return (
    <Screen safeBottom={false} contentContainerStyle={styles.screen} keyboard={false} padded={false} scroll={false} style={styles.safe}>
      <AppTopBar />
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => <Text style={styles.sectionTitle}>{section.title}</Text>}
        renderItem={({ item }) => <OrderCard order={item} product={catalogItem(pricingCatalog, item.orderType)} onPress={() => openOrder(item.id)} />}
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        ListEmptyComponent={
          onlyActive ? null : status === "loading" ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.helper}>{t("Loading orders...")}</Text>
            </View>
          ) : (
            <EmptyState
              actionLabel={emptyFiltered ? undefined : "Order Water"}
              artwork={
                <View style={styles.emptyArtwork}>
                  <PackageCheck color={colors.primary} size={44} strokeWidth={2} />
                </View>
              }
              message={emptyFiltered ? "Try a different filter." : "Your NELMA deliveries will appear here."}
              onAction={emptyFiltered ? undefined : start}
              title={emptyFiltered ? "No matching orders" : "No orders yet"}
            />
          )
        }
        refreshControl={<RefreshControl refreshing={status === "loading" && orders.length > 0} onRefresh={loadOrders} tintColor={colors.primary} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        style={styles.flex}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.white },
  screen: { backgroundColor: colors.white, flex: 1 },
  flex: { flex: 1 },
  errorWrap: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  list: { paddingBottom: 132, paddingHorizontal: spacing.md },
  headerBlock: { gap: spacing.sm, paddingTop: spacing.md },
  titleRow: { alignItems: "baseline", flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  title: { color: colors.ink, fontFamily: typography.fonts.bold, fontSize: 22, lineHeight: 28, letterSpacing: -0.3 },
  summary: { color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: 12, lineHeight: 16 },
  live: { borderRadius: 18, gap: spacing.sm, padding: spacing.sm },
  liveTop: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  liveThumb: { backgroundColor: colors.white, borderRadius: 12, height: 52, width: 52 },
  liveCopy: { flex: 1, gap: 1, minWidth: 0 },
  liveEyebrow: { color: "rgba(255,255,255,0.8)", fontFamily: typography.fonts.bold, fontSize: 10, letterSpacing: 0.8, lineHeight: 13 },
  liveName: { color: colors.white, fontFamily: typography.fonts.bold, fontSize: 15, lineHeight: 20 },
  liveMeta: { color: "rgba(255,255,255,0.88)", fontFamily: typography.fonts.medium, fontSize: 11.5, lineHeight: 15 },
  liveTrack: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 999,
    flexDirection: "row",
    gap: 2,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 5
  },
  liveTrackText: { color: colors.white, fontFamily: typography.fonts.bold, fontSize: 11.5, lineHeight: 15 },
  progress: { flexDirection: "row", gap: 4 },
  step: { flex: 1, gap: 4 },
  bar: { backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 2, height: 4 },
  barOn: { backgroundColor: colors.white },
  stepText: { color: "rgba(255,255,255,0.65)", fontFamily: typography.fonts.medium, fontSize: 10, lineHeight: 13 },
  stepTextOn: { color: colors.white, fontFamily: typography.fonts.bold },
  chips: { gap: 6, paddingVertical: 2 },
  chip: {
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 5
  },
  chipOn: { backgroundColor: colors.ink },
  chipText: { color: colors.mutedText, fontFamily: typography.fonts.bold, fontSize: 12, lineHeight: 16 },
  chipTextOn: { color: colors.white },
  count: { alignItems: "center", backgroundColor: colors.white, borderRadius: 999, minWidth: 20, paddingHorizontal: 5 },
  countOn: { backgroundColor: "rgba(255,255,255,0.18)" },
  countText: { color: colors.mutedText, fontFamily: typography.fonts.bold, fontSize: 10.5, lineHeight: 16 },
  countTextOn: { color: colors.white },
  sectionTitle: {
    color: colors.subtleText,
    fontFamily: typography.fonts.bold,
    fontSize: 11,
    letterSpacing: 0.6,
    lineHeight: 14,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
    textTransform: "uppercase"
  },
  gap: { height: spacing.xs },
  helper: {
    color: colors.mutedText,
    fontFamily: typography.fonts.medium,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small,
    textAlign: "center"
  },
  errorText: {
    backgroundColor: colors.dangerBg,
    borderRadius: 12,
    color: colors.danger,
    fontFamily: typography.fonts.bold,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small,
    padding: spacing.sm
  },
  loading: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xxl },
  emptyArtwork: { alignItems: "center", backgroundColor: colors.surfaceBlue, borderRadius: 16, height: 84, justifyContent: "center", width: 84 }
});
