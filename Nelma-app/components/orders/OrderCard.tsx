import { ChevronRight } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "../../hooks/use-translation";
import { colors } from "../../constants/colors";
import type { ProductCatalogItem } from "../../constants/pricing";
import { spacing, typography } from "../../constants/theme";
import type { Order } from "../../types/order";
import { formatCurrency, formatDate } from "../../utils/format";
import { orderStatusLabel, orderStatusTone, type StatusTone } from "../../utils/status";
import { ProductImage } from "./ProductImage";

type OrderCardProps = {
  order: Order;
  product: ProductCatalogItem;
  onPress: () => void;
};

export const toneColors: Record<StatusTone, { fg: string; bg: string }> = {
  info: { fg: colors.primary, bg: "#E6F5FD" },
  success: { fg: "#237A52", bg: "#E8F8EF" },
  warning: { fg: "#946B13", bg: colors.warningBg },
  danger: { fg: colors.danger, bg: colors.dangerBg },
  neutral: { fg: colors.mutedText, bg: colors.surfaceAlt }
};

// One order in the history list: what was bought, when, how much, and where it stands.
export const OrderCard = ({ order, product, onPress }: OrderCardProps) => {
  const { t } = useTranslation();
  const tone = toneColors[orderStatusTone(order.status)];
  const name = order.items[0]?.productName || product.label;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] }]}
    >
      <ProductImage product={product} style={styles.thumb} iconSize={20} />
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.name}>
          {order.quantity} × {t(name)}
        </Text>
        <Text numberOfLines={1} style={styles.meta}>
          #{order.orderNumber} · {formatDate(order.createdAt)}
        </Text>
        <View style={[styles.pill, { backgroundColor: tone.bg }]}>
          <View style={[styles.dot, { backgroundColor: tone.fg }]} />
          <Text style={[styles.pillText, { color: tone.fg }]}>{t(orderStatusLabel(order.status))}</Text>
        </View>
      </View>
      <View style={styles.side}>
        <Text style={styles.total}>{formatCurrency(order.total, order.currency)}</Text>
        <ChevronRight color={colors.subtleText} size={16} />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm
  },
  thumb: {
    backgroundColor: colors.surfaceBlue,
    borderRadius: 12,
    height: 56,
    width: 56
  },
  copy: { flex: 1, gap: 3, minWidth: 0 },
  name: { color: colors.text, fontFamily: typography.fonts.bold, fontSize: 14, lineHeight: 19 },
  meta: { color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: typography.tiny, lineHeight: typography.lineHeight.tiny },
  pill: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 999,
    flexDirection: "row",
    gap: 5,
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  dot: { borderRadius: 3, height: 6, width: 6 },
  pillText: { fontFamily: typography.fonts.bold, fontSize: 10.5, lineHeight: 14 },
  side: { alignItems: "flex-end", alignSelf: "stretch", justifyContent: "space-between", paddingVertical: 2 },
  total: { color: colors.text, fontFamily: typography.fonts.bold, fontSize: 13.5, lineHeight: 18 }
});
