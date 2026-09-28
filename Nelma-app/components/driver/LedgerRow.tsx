import { Check, X } from "lucide-react-native";
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
  const confirmed = order.status === "received" || Boolean(order.customerReceivedAt);
  const bottles = bottleCount(order);
  const name = customerDisplayName(order);
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, last ? null : styles.divider, pressed ? styles.pressed : null]}>
      <View style={[styles.initial, cancelled ? styles.initialOff : null]}>
        <Text style={[styles.initialText, cancelled ? styles.initialTextOff : null]}>{name.charAt(0).toUpperCase()}</Text>
        <View style={[styles.mark, cancelled ? styles.markOff : confirmed ? styles.markDone : styles.markWaiting]}>
          {cancelled ? <X color={colors.white} size={9} strokeWidth={3.5} /> : <Check color={colors.white} size={9} strokeWidth={3.5} />}
        </View>
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={[styles.customer, cancelled ? styles.struck : null]}>{name}</Text>
        <Text numberOfLines={1} style={styles.area}>{formatTime(closedTimeLabel(order))}  {"·"}  {deliveryAreaLine(order)}  {"·"}  {bottles} {t(bottles === 1 ? "bottle" : "bottles")}</Text>
      </View>
      <View style={styles.side}>
        {cancelled ? <Text style={styles.cancelled}>{t("Cancelled")}</Text> : <Text style={styles.amount}>{formatCurrency(order.total, "").trim()}</Text>}
        {!cancelled ? <Text style={[styles.state, confirmed ? styles.stateDone : null]}>{t(confirmed ? "Received" : "Delivered")}</Text> : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 66, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: driverTheme.aquaLine },
  pressed: { backgroundColor: driverTheme.pageBg },
  initial: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: driverTheme.aqua },
  initialOff: { backgroundColor: colors.line },
  initialText: { color: colors.primary, fontFamily: typography.fonts.bold, fontSize: 15, lineHeight: 20 },
  initialTextOff: { color: colors.subtleText },
  mark: { position: "absolute", right: -2, bottom: -2, width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.white },
  markDone: { backgroundColor: driverTheme.mintText },
  markWaiting: { backgroundColor: colors.primary },
  markOff: { backgroundColor: colors.danger },
  copy: { flex: 1, gap: 1 },
  customer: { color: colors.ink, fontFamily: typography.fonts.semibold, fontSize: 15, lineHeight: 21 },
  struck: { color: colors.mutedText, textDecorationLine: "line-through" },
  area: { color: colors.mutedText, fontFamily: typography.fonts.regular, fontSize: 12, lineHeight: 18, fontVariant: ["tabular-nums"] },
  side: { alignItems: "flex-end", gap: 1 },
  amount: { color: colors.ink, fontFamily: typography.fonts.bold, fontSize: 15, lineHeight: 21, fontVariant: ["tabular-nums"] },
  state: { color: colors.primary, fontFamily: typography.fonts.medium, fontSize: 11, lineHeight: 15 },
  stateDone: { color: driverTheme.mintText },
  cancelled: { color: colors.danger, fontFamily: typography.fonts.medium, fontSize: 12, lineHeight: 18 }
});
