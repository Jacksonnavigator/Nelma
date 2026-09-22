import { ChevronRight } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/colors";
import { spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";
import type { Order } from "../../types/order";
import { closedTimeLabel, customerDisplayName, deliveryAddressLine, deliveryTimeLabel, productSummary } from "../../utils/driver-deliveries";
import { formatDate } from "../../utils/format";
import { driverDeliveryStatusLabel } from "../../utils/status";

type DriverDeliveryCardProps = { order: Order; mode?: "active" | "history"; onPress: () => void };

export const DriverDeliveryCard = ({ order, mode = "active", onPress }: DriverDeliveryCardProps) => {
  const { t } = useTranslation();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}>
      <View style={styles.copy}>
        <Text style={styles.status}>{t(driverDeliveryStatusLabel(order.status))}</Text>
        <Text style={styles.customer}>{customerDisplayName(order)}</Text>
        <Text style={styles.address} numberOfLines={2}>{deliveryAddressLine(order)}</Text>
        <Text style={styles.meta}>{productSummary(order)}</Text>
        <Text style={styles.meta}>{mode === "history" ? formatDate(closedTimeLabel(order)) : t(deliveryTimeLabel(order))}</Text>
      </View>
      <ChevronRight color={colors.mutedText} size={20} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.line, minHeight: 64 },
  copy: { flex: 1, gap: spacing.xxs, minWidth: 0 },
  status: { color: colors.primary, fontFamily: typography.fonts.medium, fontSize: 12, lineHeight: 18 },
  customer: { color: colors.text, fontFamily: typography.fonts.bold, fontSize: 17, lineHeight: 24 },
  address: { color: colors.text, fontFamily: typography.fonts.regular, fontSize: 14, lineHeight: 21 },
  meta: { color: colors.mutedText, fontFamily: typography.fonts.regular, fontSize: 12, lineHeight: 18 }
});
