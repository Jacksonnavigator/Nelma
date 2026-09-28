import { Minus, Plus } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "../../hooks/use-translation";
import { colors } from "../../constants/colors";
import { radius, spacing, typography } from "../../constants/theme";
import { haptics } from "../../services/haptics";
import { IconButton } from "../ui/IconButton";

type QuantityStepperProps = {
  value: number;
  onChange: (value: number) => void;
};

export const QuantityStepper = ({ value, onChange }: QuantityStepperProps) => {
  const { t } = useTranslation();
  const update = (next: number) => {
    haptics.selection();
    onChange(Math.max(1, next));
  };
  return (
    <View style={styles.wrapper} accessibilityLabel={t("Order quantity selector")}>
      <IconButton icon={Minus} label={t("Decrease quantity")} onPress={() => update(value - 1)} color={colors.primary} backgroundColor={colors.white} disabled={value <= 1} />
      <View style={styles.valueBox}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.caption}>{t("20L units")}</Text>
      </View>
      <IconButton icon={Plus} label={t("Increase quantity")} onPress={() => update(value + 1)} color={colors.white} backgroundColor={colors.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.lg,
    justifyContent: "center"
  },
  valueBox: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radius.xl,
    borderWidth: 1,
    minWidth: 136,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg
  },
  value: {
    color: colors.text,
    fontFamily: typography.fonts.bold,
    fontSize: 42,
    lineHeight: 48
  },
  caption: {
    color: colors.mutedText,
    fontFamily: typography.fonts.medium,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small
  }
});
