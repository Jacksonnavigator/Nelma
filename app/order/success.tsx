import { router, useLocalSearchParams } from "expo-router";
import { CheckCircle2, ReceiptText } from "lucide-react-native";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button, Card, Header, LoadingScreen, Screen, StatusBadge } from "../../components";
import { colors } from "../../constants/colors";
import { radius, spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";
import { useOrders } from "../../store/order-context";
import type { Order } from "../../types/order";
import { formatCurrency } from "../../utils/format";

export default function OrderSuccessScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getOrder } = useOrders();
  const { t } = useTranslation();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (id) {
      getOrder(id).then(setOrder).catch(() => undefined);
    }
  }, [getOrder, id]);

  if (!order) {
    return <LoadingScreen message="Opening order" />;
  }

  return (
    <Screen>
      <View style={styles.successMark}>
        <CheckCircle2 color={colors.white} size={44} strokeWidth={2.5} />
      </View>
      <Header title="Order Confirmed" subtitle="NELMA received your order through the service layer." />
      <Card style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>{t("Total")}</Text>
          <Text style={styles.total}>{formatCurrency(order.total)}</Text>
        </View>
        {order.deliverySchedule ? (
          <View style={styles.row}>
            <Text style={styles.label}>{t("Delivery time")}</Text>
            <Text style={styles.value}>{t(order.deliverySchedule.label)}</Text>
          </View>
        ) : null}
        <View style={styles.badges}>
          <StatusBadge type="order" status={order.status} />
          <StatusBadge type="payment" status={order.paymentStatus} />
        </View>
      </Card>
      <Button title="Track Order" icon={ReceiptText} onPress={() => router.replace({ pathname: "/orders/[id]", params: { id: order.id } })} />
      <Button title="Back Home" variant="ghost" onPress={() => router.replace("/(tabs)/home")} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  successMark: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.success,
    borderRadius: radius.pill,
    height: 94,
    justifyContent: "center",
    marginTop: spacing.xl,
    width: 94
  },
  card: {
    gap: spacing.md
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  label: {
    color: colors.mutedText,
    fontSize: typography.body
  },
  value: {
    color: colors.text,
    flex: 1,
    fontSize: typography.body,
    fontWeight: "900",
    textAlign: "right"
  },
  total: {
    color: colors.primary,
    fontSize: typography.h2,
    fontWeight: "900"
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  }
});
