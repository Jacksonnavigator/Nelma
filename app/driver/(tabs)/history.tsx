import { router, useFocusEffect } from "expo-router";
import { CalendarDays, Clock3, PackageCheck, Search } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { AppTopBar, Button, DriverDeliveryCard, EmptyState, ErrorState, Input, Screen } from "../../../components";
import { colors } from "../../../constants/colors";
import { radius, spacing, typography } from "../../../constants/theme";
import { useTranslation } from "../../../hooks/use-translation";
import { repositories } from "../../../repositories";
import { haptics } from "../../../services/haptics";
import type { Order } from "../../../types/order";
import { closedTimeLabel, currentDateKey, filterDriverHistory, type DriverHistoryDateFilter } from "../../../utils/driver-deliveries";

const pageSize = 12;

const dateFilters: Array<{ value: DriverHistoryDateFilter; label: string }> = [
  { value: "all", label: "All dates" },
  { value: "today", label: "Today" },
  { value: "week", label: "Last 7 days" }
];

function DateChip({ value, label, active, onPress }: { value: DriverHistoryDateFilter; label: string; active: boolean; onPress: (value: DriverHistoryDateFilter) => void }) {
  const { t } = useTranslation();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => onPress(value)} style={({ pressed }) => [styles.chip, active ? styles.chipActive : null, { opacity: pressed ? 0.75 : 1 }]}>
      <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{t(label)}</Text>
    </Pressable>
  );
}

export default function DriverHistoryScreen() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DriverHistoryDateFilter>("all");
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayKey = useMemo(() => currentDateKey(), []);
  const filtered = useMemo(() => {
    return filterDriverHistory(orders, search, dateFilter, todayKey).sort((first, second) => closedTimeLabel(second).localeCompare(closedTimeLabel(first)));
  }, [dateFilter, orders, search, todayKey]);
  const visibleOrders = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [dateFilter, search]);

  const loadHistory = useCallback(async (initial = false) => {
    if (initial) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);
    try {
      setOrders(await repositories.driver.listDeliveries());
    } catch {
      setError("Unable to load delivery history right now.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadHistory(orders.length === 0);
    }, [loadHistory, orders.length])
  );

  const openDelivery = (order: Order) => {
    haptics.selection();
    router.push({ pathname: "/driver/delivery/[id]", params: { id: order.id } });
  };

  const header = (
    <View style={styles.headerStack}>
      <View style={styles.headerPanel}>
        <View style={styles.iconWrap}>
          <Clock3 color={colors.primary} size={22} strokeWidth={2.5} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{t("Delivery History")}</Text>
          <Text style={styles.subtitle}>{t("Completed driver deliveries assigned to this account.")}</Text>
        </View>
      </View>

      <View style={styles.searchPanel}>
        <Input
          label="Search history"
          placeholder="Customer, product, or location"
          value={search}
          onChangeText={setSearch}
          right={<Search color={colors.mutedText} size={18} strokeWidth={2.2} />}
        />
        <View style={styles.chipRow}>
          {dateFilters.map((item) => (
            <DateChip key={item.value} value={item.value} label={item.label} active={dateFilter === item.value} onPress={setDateFilter} />
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <Screen safeBottom={false} contentContainerStyle={styles.screen} keyboard={false} padded={false} scroll={false} style={styles.safe}>
      <AppTopBar />
      {loading && !orders.length ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>{t("Loading delivery history")}</Text>
        </View>
      ) : error && !orders.length ? (
        <View style={styles.stateWrap}>
          <ErrorState message={error} onAction={() => void loadHistory(true)} />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={visibleOrders}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={header}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <EmptyState
              artwork={
                <View style={styles.emptyArtwork}>
                  <PackageCheck color={colors.primary} size={44} strokeWidth={2.3} />
                </View>
              }
              title="No completed deliveries yet"
              message="Delivered and customer-received assignments will be kept here."
            />
          }
          ListFooterComponent={visibleOrders.length < filtered.length ? <Button title="Load More" icon={CalendarDays} variant="secondary" onPress={() => setVisibleCount((current) => current + pageSize)} style={styles.loadMoreButton} /> : null}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadHistory(false)} tintColor={colors.primary} colors={[colors.primary]} />}
          renderItem={({ item }) => <DriverDeliveryCard order={item} mode="history" onPress={() => openDelivery(item)} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.white },
  screen: { backgroundColor: colors.white, flex: 1 },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 132
  },
  headerStack: {
    gap: spacing.md,
    marginBottom: spacing.md
  },
  headerPanel: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    paddingBottom: spacing.xs,
    paddingTop: spacing.xs
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: "transparent",
    height: 30,
    justifyContent: "center",
    width: 30
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0
  },
  title: {
    color: colors.black,
    fontFamily: typography.fonts.bold,
    fontSize: 22,
    lineHeight: 28
  },
  subtitle: {
    color: colors.black,
    fontFamily: typography.fonts.regular,
    fontSize: typography.body,
    lineHeight: typography.lineHeight.body
  },
  searchPanel: {
    gap: spacing.md,
    paddingTop: spacing.xs
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  chip: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    minHeight: 38,
    paddingHorizontal: spacing.md,
    justifyContent: "center"
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  chipText: {
    color: colors.black,
    fontFamily: typography.fonts.bold,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small
  },
  chipTextActive: {
    color: colors.white
  },
  separator: {
    height: spacing.md
  },
  loadMoreButton: {
    marginTop: spacing.md
  },
  stateWrap: {
    flex: 1,
    justifyContent: "center"
  },
  loadingWrap: {
    alignItems: "center",
    flex: 1,
    gap: spacing.md,
    justifyContent: "center",
    padding: spacing.xl
  },
  loadingText: {
    color: colors.black,
    fontFamily: typography.fonts.bold,
    fontSize: typography.body,
    lineHeight: typography.lineHeight.body
  },
  emptyArtwork: {
    alignItems: "center",
    backgroundColor: colors.surfaceBlue,
    borderRadius: 18,
    height: 96,
    justifyContent: "center",
    width: 96
  }
});