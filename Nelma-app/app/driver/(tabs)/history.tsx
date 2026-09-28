import { router, useFocusEffect } from "expo-router";
import { Search } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { DriverTitle, DropletArt, ErrorState, HeaderBand, LedgerRow, Screen, Sheet, SkyBackdrop, WeekBars } from "../../../components";
import { colors } from "../../../constants/colors";
import { driverTheme, liftShadow, sheetShadow } from "../../../constants/driver-theme";
import { radius, spacing, typography } from "../../../constants/theme";
import { useTranslation } from "../../../hooks/use-translation";
import { repositories } from "../../../repositories";
import { haptics } from "../../../services/haptics";
import type { DriverSummary } from "../../../types/driver";
import type { Order } from "../../../types/order";
import { currentDateKey, filterDriverHistory, groupHistoryByDay } from "../../../utils/driver-deliveries";
import { formatCurrency, formatDayHeading } from "../../../utils/format";

const pageSize = 30;

export default function DriverHistoryScreen() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<DriverSummary | null>(null);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayKey = useMemo(() => currentDateKey(), []);
  const matches = useMemo(() => filterDriverHistory(orders, search, "all", todayKey), [orders, search, todayKey]);
  const days = useMemo(() => {
    return groupHistoryByDay(matches).map((day) => {
      const heading = formatDayHeading(day.key, todayKey);
      return { ...day, title: heading.kind === "date" ? heading.label : t(heading.label) };
    });
  }, [matches, todayKey, t]);
  const week = useMemo(() => {
    return (summary?.daily ?? []).map((point) => ({
      key: point.date,
      count: point.deliveries,
      today: point.date === todayKey,
      label: new Intl.DateTimeFormat("en-GB", { weekday: "narrow" }).format(new Date(point.date + "T00:00:00"))
    }));
  }, [summary, todayKey]);
  const weekTotal = week.reduce((sum, point) => sum + point.count, 0);

  const loadHistory = useCallback(async (initial = false) => {
    if (initial) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);
    try {
      const [first, totals] = await Promise.all([
        repositories.driver.listHistory(1, pageSize),
        Promise.resolve().then(() => repositories.driver.getSummary()).catch(() => null)
      ]);
      setOrders(first.items);
      setNextPage(first.hasNext ? 2 : null);
      if (totals) setSummary(totals);
    } catch {
      setError("Unable to load delivery history right now.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Older pages come from the server on demand, so history never silently stops at a fixed count.
  const loadMore = useCallback(async () => {
    if (nextPage === null || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await repositories.driver.listHistory(nextPage, pageSize);
      setOrders((current) => [...current, ...page.items.filter((item) => !current.some((existing) => existing.id === item.id))]);
      setNextPage(page.hasNext ? nextPage + 1 : null);
    } catch {
      setError("Unable to load older deliveries right now.");
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, nextPage]);

  useEffect(() => {
    // Searching looks through everything loaded, so pull in the rest first.
    if (search.trim() && nextPage !== null && !loadingMore) void loadMore();
  }, [search, nextPage, loadingMore, loadMore]);

  const hasLoaded = useRef(false);
  useFocusEffect(
    useCallback(() => {
      void loadHistory(!hasLoaded.current).then(() => { hasLoaded.current = true; });
    }, [loadHistory])
  );

  const open = (order: Order) => {
    haptics.selection();
    router.push({ pathname: "/driver/delivery/[id]", params: { id: order.id } });
  };

  return (
    <Screen safeBottom={false} contentContainerStyle={styles.screen} keyboard={false} padded={false} scroll={false} style={styles.safe}>
      <SkyBackdrop />
      {loading && !orders.length ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      ) : error && !orders.length ? (
        <View style={styles.center}><ErrorState message={error} onAction={() => void loadHistory(true)} /></View>
      ) : (
        <FlatList
          data={days}
          keyExtractor={(day) => day.key}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadHistory(false)} tintColor={colors.primary} colors={[colors.primary]} />}
          ListHeaderComponent={
            <View style={styles.header}>
              <DriverTitle title={t("History")} />
              {week.length ? (
                <HeaderBand style={[styles.weekCard, liftShadow]}>
                  <View style={styles.weekTop}>
                    <View style={styles.weekLead}>
                      <Text style={styles.weekEyebrow}>{t("Last 7 days")}</Text>
                      <View style={styles.weekFigure}>
                        <Text style={styles.weekTotal}>{weekTotal}</Text>
                        <Text style={styles.weekUnit}>{t(weekTotal === 1 ? "delivery" : "deliveries")}</Text>
                      </View>
                    </View>
                    {summary ? (
                      <View style={styles.weekSide}>
                        <Text numberOfLines={1} style={styles.weekValue}>{formatCurrency(summary.week.value)}</Text>
                        <Text style={styles.weekEyebrow}>{summary.week.bottles} {t(summary.week.bottles === 1 ? "bottle" : "bottles")}</Text>
                      </View>
                    ) : null}
                  </View>
                  <WeekBars days={week} tone="dark" />
                </HeaderBand>
              ) : null}
              <View style={[styles.search, sheetShadow]}>
                <Search color={colors.mutedText} size={18} />
                <TextInput
                  accessibilityLabel={t("Search history")}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={setSearch}
                  placeholder={t("Search by customer or place")}
                  placeholderTextColor={colors.subtleText}
                  returnKeyType="search"
                  style={styles.searchInput}
                  value={search}
                />
              </View>
              {error ? <Text accessibilityRole="alert" style={styles.error}>{t(error)}</Text> : null}
            </View>
          }
          renderItem={({ item: day }) => (
            <View style={styles.day}>
              <View style={styles.dayHeader}>
                <View style={styles.dayCopy}>
                  <Text style={styles.dayTitle}>{day.title}</Text>
                  <Text style={styles.dayMeta}>{day.deliveries} {t(day.deliveries === 1 ? "delivery" : "deliveries")}  {"·"}  {day.bottles} {t(day.bottles === 1 ? "bottle" : "bottles")}</Text>
                </View>
                <Text style={styles.dayValue}>{formatCurrency(day.data.reduce((sum, order) => sum + (order.status === "cancelled" ? 0 : order.total), 0))}</Text>
              </View>
              <Sheet style={styles.daySheet}>
                {day.data.map((order, index) => <LedgerRow key={order.id} order={order} last={index === day.data.length - 1} onPress={() => open(order)} />)}
              </Sheet>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <DropletArt size={110} />
              <Text style={styles.emptyText}>{t(search ? "Nothing matches that search." : "Finished deliveries will be listed here, newest first.")}</Text>
            </View>
          }
          ListFooterComponent={
            nextPage !== null ? (
              <Pressable accessibilityRole="button" disabled={loadingMore} onPress={() => void loadMore()} style={styles.more}>
                {loadingMore ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.moreText}>{t("Show older")}</Text>}
              </Pressable>
            ) : null
          }
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
  header: { gap: spacing.sm },
  weekCard: { borderRadius: radius.xl + 10, padding: spacing.md + 2, gap: spacing.sm },
  weekTop: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: spacing.md },
  weekLead: { gap: 2 },
  weekEyebrow: { color: driverTheme.onDark, fontFamily: typography.fonts.medium, fontSize: 13, lineHeight: 18 },
  weekFigure: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  weekTotal: { color: colors.white, fontFamily: typography.fonts.bold, fontSize: 30, letterSpacing: -0.8, lineHeight: 36, fontVariant: ["tabular-nums"] },
  weekUnit: { color: driverTheme.onDark, fontFamily: typography.fonts.semibold, fontSize: 15, lineHeight: 21 },
  weekSide: { flexShrink: 1, alignItems: "flex-end", gap: 2, paddingBottom: 4 },
  weekValue: { color: driverTheme.mintBright, fontFamily: typography.fonts.bold, fontSize: 16, lineHeight: 22, fontVariant: ["tabular-nums"] },
  search: { flexDirection: "row", alignItems: "center", gap: spacing.xs, minHeight: 48, paddingHorizontal: spacing.md, borderRadius: radius.md + 4, backgroundColor: colors.white },
  searchInput: { flex: 1, color: colors.ink, fontFamily: typography.fonts.regular, fontSize: 15, minHeight: 48, paddingVertical: 0 },
  error: { color: colors.danger, fontFamily: typography.fonts.medium, fontSize: 13, lineHeight: 19 },
  day: { marginTop: spacing.md },
  dayHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: spacing.sm, marginBottom: spacing.xs, paddingHorizontal: spacing.xxs },
  dayCopy: { flex: 1 },
  dayTitle: { color: colors.ink, fontFamily: typography.fonts.bold, fontSize: 17, lineHeight: 24 },
  dayMeta: { color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: 12, lineHeight: 18 },
  dayValue: { color: driverTheme.deep, fontFamily: typography.fonts.bold, fontSize: 15, lineHeight: 21, fontVariant: ["tabular-nums"] },
  daySheet: { borderRadius: radius.xl },
  empty: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xxl },
  emptyText: { color: colors.mutedText, fontFamily: typography.fonts.regular, fontSize: 15, lineHeight: 22, textAlign: "center", maxWidth: 280 },
  more: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: spacing.md },
  moreText: { color: colors.primary, fontFamily: typography.fonts.semibold, fontSize: 14, lineHeight: 20 }
});
