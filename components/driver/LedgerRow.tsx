import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/colors";
import { driverTheme } from "../../constants/driver-theme";
import { spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";
import type { Order } from "../../types/order";
import { bottleCount, closedTimeLabel, customerDisplayName, deliveryAreaLine } from "../../utils/driver-deliveries";
import { formatCurrency, formatTime } from "../../utils/format";

type LedgerRowProps = { order: Order; last: boolean; onPress: () => void };

export const LedgerRow = ({ order, last, onPress }: LedgerRowProps) => {
  const { t } = useTranslation();
  const cancelled = order.status === "cancelled";
  const bottles = bottleCount(order);
  const name = customerDisplayName(order);
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, last ? null : styles.divider, pressed ? styles.pressed : null]}>
      <View style={[styles.initial, cancelled ? styles.initialOff : null]}>
        <Text style={[styles.initialText, cancelled ? styles.initialTextOff : null]}>{name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={[styles.customer, cancelled ? styles.struck : null]}>{name}</Text>
        <Text numberOfLines={1} style={styles.area}>{formatTime(closedTimeLabel(order))}  {"·"}  {deliveryAreaLine(order)}  {"·"}  {bottles} {t(bottles === 1 ? "bottle" : "bottles")}</Text>
      </View>
      {cancelled ? <Text style={styles.cancelled}>{t("Cancelled")}</Text> : <Text style={styles.amount}>{formatCurrency(order.total, "").trim()}</Text>}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 64, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: driverTheme.aquaLine },
  pressed: { backgroundColor: driverTheme.pageBg },
  initial: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: driverTheme.aqua },
  initialOff: { backgroundColor: colors.line },
  initialText: { color: colors.primary, fontFamily: typography.fonts.bold, fontSize: 15, lineHeight: 20 },
  initialTextOff: { color: colors.subtleText },
  copy: { flex: 1, gap: 1 },
  customer: { color: colors.ink, fontFamily: typography.fonts.semibold, fontSize: 15, lineHeight: 21 },
  struck: { color: colors.mutedText, textDecorationLine: "line-through" },
  area: { color: colors.mutedText, fontFamily: typography.fonts.regular, fontSize: 12, lineHeight: 18, fontVariant: ["tabular-nums"] },
  amount: { color: colors.ink, fontFamily: typography.fonts.bold, fontSize: 15, lineHeight: 21, fontVariant: ["tabular-nums"] },
  cancelled: { color: colors.danger, fontFamily: typography.fonts.medium, fontSize: 12, lineHeight: 18 }
});
