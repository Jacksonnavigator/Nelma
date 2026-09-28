import { Banknote, ChevronRight, Droplet } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/colors";
import { driverTheme, sheetShadow } from "../../constants/driver-theme";
import { radius, spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";
import type { Order } from "../../types/order";
import { bottleCount, cashDueAmount, customerDisplayName, deliveryAddressLine, deliveryWindowLabel } from "../../utils/driver-deliveries";
import { formatCurrency } from "../../utils/format";

type RouteStopProps = { order: Order; position: number; first?: boolean; last: boolean; onPress: () => void };

// One stop on the itinerary: arrival time on the left, a rail joining the stops, the stop itself on the right.
export const RouteStop = ({ order, position, first = false, last, onPress }: RouteStopProps) => {
  const { t } = useTranslation();
  const due = cashDueAmount(order);
  const bottles = bottleCount(order);
  const [from, to] = (order.deliverySchedule?.window ?? "").split(/\s*[-–]\s*/);
  return (
    <View style={styles.row}>
      <View style={styles.time}>
        {from ? (
          <>
            <Text style={styles.from}>{from}</Text>
            {to ? <Text style={styles.to}>{to}</Text> : null}
          </>
        ) : (
          <Text style={styles.to}>{t(deliveryWindowLabel(order))}</Text>
        )}
      </View>
      <View style={styles.rail}>
        <View style={[styles.line, first ? styles.lineHidden : null]} />
        <View style={styles.node}><Text style={styles.nodeText}>{position}</Text></View>
        <View style={[styles.line, styles.lineFill, last ? styles.lineHidden : null]} />
      </View>
      <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, sheetShadow, pressed ? styles.pressed : null]}>
        <View style={styles.body}>
          <Text numberOfLines={1} style={styles.customer}>{customerDisplayName(order)}</Text>
          <Text numberOfLines={1} style={styles.address}>{deliveryAddressLine(order)}</Text>
          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Droplet color={colors.primary} size={13} />
              <Text style={styles.metaText}>{bottles} {t(bottles === 1 ? "bottle" : "bottles")}</Text>
            </View>
            {due > 0 ? (
              <View style={[styles.metaItem, styles.due]}>
                <Banknote color={driverTheme.amberText} size={13} />
                <Text style={[styles.metaText, styles.dueText]}>{formatCurrency(due, order.currency)}</Text>
              </View>
            ) : null}
          </View>
        </View>
        <ChevronRight color={colors.subtleText} size={18} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "stretch" },
  time: { width: 50, paddingTop: spacing.md + 2, alignItems: "flex-end" },
  from: { color: colors.ink, fontFamily: typography.fonts.bold, fontSize: 15, lineHeight: 20, fontVariant: ["tabular-nums"] },
  to: { color: colors.subtleText, fontFamily: typography.fonts.medium, fontSize: 12, lineHeight: 17, fontVariant: ["tabular-nums"], textAlign: "right" },
  rail: { width: 40, alignItems: "center" },
  line: { width: 2, height: spacing.md + 2, backgroundColor: driverTheme.aquaLine },
  lineFill: { flex: 1, height: undefined },
  lineHidden: { backgroundColor: "transparent" },
  node: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: colors.white, borderWidth: 2, borderColor: colors.primary },
  nodeText: { color: colors.primary, fontFamily: typography.fonts.bold, fontSize: 12, lineHeight: 16 },
  card: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.xs, marginBottom: spacing.sm, padding: spacing.md, borderRadius: radius.xl + 4, backgroundColor: colors.white },
  pressed: { backgroundColor: driverTheme.aqua },
  body: { flex: 1, gap: 2 },
  customer: { color: colors.ink, fontFamily: typography.fonts.bold, fontSize: 16, lineHeight: 22 },
  address: { color: colors.mutedText, fontFamily: typography.fonts.regular, fontSize: 14, lineHeight: 20 },
  meta: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xxs },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { color: colors.primary, fontFamily: typography.fonts.semibold, fontSize: 12, lineHeight: 17 },
  due: { backgroundColor: driverTheme.amberBg, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 1 },
  dueText: { color: driverTheme.amberText }
});
