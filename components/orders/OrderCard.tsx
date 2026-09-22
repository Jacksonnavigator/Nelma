import { CalendarClock, ChevronRight } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "../../hooks/use-translation";
import { colors } from "../../constants/colors";
import { radius, spacing, typography } from "../../constants/theme";
import type { Order } from "../../types/order";
import { formatCurrency, formatDate } from "../../utils/format";
import { getOrderTypeLabel } from "../../utils/order";
import { orderStatusLabel } from "../../utils/status";
import { StatusBadge } from "../ui/StatusBadge";

type OrderCardProps = {
  order: Order;
  onPress: () => void;
  compact?: boolean;
};

export const OrderCard = ({ order, onPress, compact = false }: OrderCardProps) => {
  const { t } = useTranslation();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, compact ? styles.compact : null, { opacity: pressed ? 0.78 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] }]}> 
      <View style={styles.copy}>
        <View style={styles.topRow}>
          <Text style={styles.date}>{formatDate(order.createdAt)}</Text>
          <ChevronRight color={colors.mutedText} size={18} />
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.meta} numberOfLines={1}>{t(getOrderTypeLabel(order.orderType))} - {t("Qty")} {order.quantity}</Text>
          <Text style={styles.total}>{formatCurrency(order.total)}</Text>
        </View>
        {order.deliverySchedule ? (
          <View style={styles.scheduleRow}>
            <CalendarClock color={colors.mutedText} size={14} strokeWidth={2.3} />
            <Text style={styles.scheduleText} numberOfLines={1}>{t(order.deliverySchedule.label)} - {t(order.deliverySchedule.window)}</Text>
          </View>
        ) : null}
        <View style={styles.badges}>
          <StatusBadge type="order" status={order.status} compact />
          {!compact ? <StatusBadge type="payment" status={order.paymentStatus} compact /> : <Text style={styles.statusText}>{t(orderStatusLabel(order.status))}</Text>}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: "flex-start",
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg
  },
  compact: {
    padding: spacing.md
  },
  copy: {
    flex: 1,
    gap: spacing.xxs
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "space-between"
  },
  date: {
    color: colors.mutedText,
    fontFamily: typography.fonts.regular,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small
  },
  detailRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    paddingTop: spacing.xs
  },
  meta: {
    color: colors.text,
    flex: 1,
    fontFamily: typography.fonts.medium,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small
  },
  scheduleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    paddingTop: spacing.xs
  },
  scheduleText: {
    color: colors.mutedText,
    flex: 1,
    fontFamily: typography.fonts.medium,
    fontSize: typography.tiny,
    lineHeight: typography.lineHeight.tiny
  },
  total: {
    color: colors.primary,
    fontFamily: typography.fonts.bold,
    fontSize: typography.body,
    lineHeight: typography.lineHeight.body
  },
  badges: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    paddingTop: spacing.xs
  },
  statusText: {
    color: colors.mutedText,
    fontFamily: typography.fonts.medium,
    fontSize: typography.tiny,
    lineHeight: typography.lineHeight.tiny
  }
});
