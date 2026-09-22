import { Banknote, CheckCircle2, Smartphone } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "../../hooks/use-translation";
import { colors } from "../../constants/colors";
import { radius, spacing, typography } from "../../constants/theme";
import type { PaymentMethod } from "../../types/payment";

type PaymentMethodCardProps = {
  method: PaymentMethod;
  selected: boolean;
  onPress: () => void;
};

const friendlyDescription = (method: PaymentMethod) => {
  if (method.type === "cash") return "Pay when your delivery arrives, if NELMA has enabled cash for this order.";
  if (method.type === "mobile_money") return "Use your mobile money account for a fast payment step.";
  return method.description;
};

export const PaymentMethodCard = ({ method, selected, onPress }: PaymentMethodCardProps) => {
  const { t } = useTranslation();
  const underConstruction = method.type === "mobile_money";
  const Icon = method.type === "cash" ? Banknote : Smartphone;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled: !method.enabled || underConstruction }}
      disabled={!method.enabled || underConstruction}
      onPress={onPress}
      style={({ pressed }) => [styles.card, selected ? styles.selected : null, !method.enabled ? styles.disabled : null, { opacity: pressed ? 0.84 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] }]}
    >
      <View style={[styles.iconWrap, selected ? styles.iconSelected : null]}>
        <Icon color={selected ? colors.white : colors.primary} size={22} strokeWidth={2.35} />
      </View>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text style={styles.label}>{t(underConstruction ? "Mobile money (Under construction)" : method.label)}</Text>
          {selected ? <CheckCircle2 color={colors.green} size={21} /> : null}
        </View>
        <Text style={styles.description}>{t(friendlyDescription(method))}</Text>
      </View>
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
    minHeight: 92,
    padding: spacing.lg
  },
  selected: {
    borderColor: colors.primary,
    borderWidth: 2
  },
  disabled: {
    opacity: 0.5
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  iconSelected: {
    backgroundColor: colors.primary
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
    fontSize: typography.body,
    lineHeight: typography.lineHeight.body
  },
  description: {
    color: colors.mutedText,
    fontFamily: typography.fonts.regular,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small
  }
});
