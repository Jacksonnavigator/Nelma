import { CheckCircle2, PackagePlus, RefreshCw } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "../../hooks/use-translation";
import { colors } from "../../constants/colors";
import { catalogItem, productCatalog, type ProductCatalogItem } from "../../constants/pricing";
import { radius, spacing, typography } from "../../constants/theme";
import type { OrderType } from "../../types/order";
import { PriceDisplay } from "../ui/PriceDisplay";

type ProductOptionCardProps = {
  orderType: OrderType;
  product?: ProductCatalogItem;
  selected: boolean;
  onPress: () => void;
};

export const ProductOptionCard = ({ orderType, product, selected, onPress }: ProductOptionCardProps) => {
  const { t } = useTranslation();
  const item = product ?? catalogItem(productCatalog, orderType);
  const Icon = orderType === "first_purchase" ? PackagePlus : RefreshCw;
  const accent = orderType === "first_purchase" ? colors.primary : colors.green;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.card, selected ? [styles.selected, { borderColor: accent }] : null, { opacity: pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: selected ? accent : colors.surfaceAlt }]}> 
        <Icon color={selected ? colors.white : accent} size={23} strokeWidth={2.35} />
      </View>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text style={styles.label}>{t(item.label)}</Text>
          {selected ? <CheckCircle2 color={accent} size={22} strokeWidth={2.5} /> : null}
        </View>
        <Text style={styles.product}>{t(item.productName)}</Text>
        <Text style={styles.description}>{t(item.description)}</Text>
      </View>
      <PriceDisplay amount={item.unitPrice} align="right" />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 132,
    padding: spacing.lg
  },
  selected: {
    backgroundColor: "#FBFEFF",
    borderWidth: 2
  },
  iconWrap: {
    alignItems: "center",
    borderRadius: radius.pill,
    height: 52,
    justifyContent: "center",
    width: 52
  },
  copy: {
    flex: 1,
    gap: spacing.xxs
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs
  },
  label: {
    color: colors.text,
    fontFamily: typography.fonts.bold,
    fontSize: typography.h3,
    lineHeight: typography.lineHeight.h3
  },
  product: {
    color: colors.primary,
    fontFamily: typography.fonts.semibold,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small
  },
  description: {
    color: colors.mutedText,
    fontFamily: typography.fonts.regular,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small
  }
});
