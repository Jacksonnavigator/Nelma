import { router } from "expo-router";
import { PackageCheck } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { AppTopBar, EmptyState, ErrorState, ListFilterTabs, OrderCard, Screen } from "../../components";
import { colors } from "../../constants/colors";
import { spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";
import { haptics } from "../../services/haptics";
import { useOrders } from "../../store/order-context";
import type { OrderFilter } from "../../types/order";
import { filterOrders } from "../../utils/order";

const jotformBlue = "#009FE3";

export default function OrdersScreen() {
  const { orders, status, error, loadOrders, startOrder } = useOrders();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<OrderFilter>("all");

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const visibleOrders = useMemo(() => filterOrders(orders, filter), [filter, orders]);

  const start = () => {
    haptics.selection();
    startOrder();
    router.push("/(tabs)/home");
  };

  if (status === "error" && !orders.length) {
    return (
      <Screen safeBottom={false} contentContainerStyle={styles.screen} keyboard={false} padded={false} scroll={false} style={styles.safe}>
        <AppTopBar />
        <View style={styles.body}>
          <ErrorState message={error ?? "Unable to load orders."} onAction={loadOrders} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeBottom={false} contentContainerStyle={styles.screen} keyboard={false} padded={false} scroll={false} style={styles.safe}>
      <AppTopBar />
      <View style={styles.body}>
        <ListFilterTabs onChange={setFilter} value={filter} />

        {status === "loading" && orders.length ? <Text style={styles.helper}>{t("Updating orders...")}</Text> : null}
        {status === "error" && orders.length ? <Text style={styles.errorText}>{t(error ?? "Unable to refresh orders.")}</Text> : null}

        <FlatList
          contentContainerStyle={[styles.list, visibleOrders.length === 0 ? styles.emptyList : null]}
          data={visibleOrders}
          ItemSeparatorComponent={() => <View style={styles.listGap} />}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            status === "loading" ? (
              <View style={styles.loadingState}>
                <ActivityIndicator color={jotformBlue} />
                <Text style={styles.helper}>{t("Loading orders...")}</Text>
              </View>
            ) : (
              <EmptyState
                actionLabel={filter !== "all" ? undefined : "Order Water"}
                artwork={
                  <View style={styles.emptyArtwork}>
                    <PackageCheck color={jotformBlue} size={52} strokeWidth={2} />
                  </View>
                }
                message={filter !== "all" ? "Try a different filter." : "Your NELMA deliveries will appear here."}
                onAction={filter !== "all" ? undefined : start}
                title={filter !== "all" ? "No matching orders" : "No orders yet"}
              />
            )
          }
          renderItem={({ item }) => <OrderCard order={item} onPress={() => router.push({ pathname: "/orders/[id]", params: { id: item.id } })} />}
          showsVerticalScrollIndicator={false}
          style={styles.orderList}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.white
  },
  screen: {
    backgroundColor: colors.white,
    flex: 1
  },
  body: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg
  },
  helper: {
    color: colors.mutedText,
    fontFamily: typography.fonts.medium,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small,
    marginTop: spacing.sm,
    textAlign: "center"
  },
  errorText: {
    backgroundColor: colors.dangerBg,
    borderRadius: 14,
    color: colors.danger,
    fontFamily: typography.fonts.bold,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small,
    marginTop: spacing.sm,
    padding: spacing.sm
  },
  orderList: {
    flex: 1,
    marginTop: spacing.md
  },
  list: {
    paddingBottom: 132
  },
  listGap: {
    height: spacing.md
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center"
  },
  loadingState: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xxl
  },
  emptyArtwork: {
    alignItems: "center",
    backgroundColor: "#E9F7FF",
    borderRadius: 16,
    height: 96,
    justifyContent: "center",
    width: 96
  }
});