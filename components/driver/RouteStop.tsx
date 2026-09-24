import { Banknote, Droplet } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/colors";
import { driverTheme } from "../../constants/driver-theme";
import { spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";
import type { Order } from "../../types/order";
import { bottleCount, cashDueAmount, customerDisplayName, deliveryAddressLine, deliveryWindowLabel } from "../../utils/driver-deliveries";
import { formatCurrency } from "../../utils/format";

type RouteStopProps = { order: Order; position: number; last: boolean; onPress: () => void };

export const RouteStop = ({ order, position, last, onPress }: RouteStopProps) => {
  const { t } = useTranslation();
  const due = cashDueAmount(order);
  const bottles = bottleCount(order);
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, last ? null : styles.divider, pressed ? styles.pressed : null]}>
      <View style={styles.node}><Text style={styles.nodeText}>{position}</Text></View>
      <View style={styles.body}>
        <View style={styles.top}>
          <Text numberOfLines={1} style={styles.customer}>{customerDisplayName(order)}</Text>
          <Text style={styles.window}>{t(deliveryWindowLabel(order))}</Text>
        </View>
        <Text numberOfLines={1} style={styles.address}>{deliveryAddressLine(order)}</Text>
        <View style={styles.chips}>
          <View style={styles.chip}>
            <Droplet color={colors.primary} size={12} />
            <Text style={styles.chipText}>{bottles} {t(bottles === 1 ? "bottle" : "bottles")}</Text>
          </View>
          {due > 0 ? (
            <View style={[styles.chip, styles.chipDue]}>
              <Banknote color={driverTheme.amberText} size={12} />
              <Text style={[styles.chipText, styles.chipDueText]}>{formatCurrency(due, order.currency)}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.md, padding: spacing.md },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: driverTheme.aquaLine },
  pressed: { backgroundColor: driverTheme.pageBg },
  node: { alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 16, backgroundColor: driverTheme.aqua },
  nodeText: { color: colors.primary, fontFamily: typography.fonts.bold, fontSize: 14, lineHeight: 18 },
  body: { flex: 1, gap: 2 },
  top: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: spacing.sm },
  customer: { flex: 1, color: colors.ink, fontFamily: typography.fonts.bold, fontSize: 16, lineHeight: 22 },
  window: { color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: 12, lineHeight: 18, fontVariant: ["tabular-nums"] },
  address: { color: colors.text, fontFamily: typography.fonts.regular, fontSize: 14, lineHeight: 20 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.xs },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: driverTheme.aqua, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  chipText: { color: colors.primary, fontFamily: typography.fonts.semibold, fontSize: 12, lineHeight: 17 },
  chipDue: { backgroundColor: driverTheme.amberBg },
  chipDueText: { color: driverTheme.amberText }
});
