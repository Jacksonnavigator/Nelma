import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "../../hooks/use-translation";
import { colors } from "../../constants/colors";
import { radius, spacing, typography } from "../../constants/theme";

const steps = ["Product", "Delivery", "Payment"] as const;

type CheckoutProgressProps = {
  current: 1 | 2 | 3 | 4 | 5;
};

const stepForCurrent = (current: CheckoutProgressProps["current"]) => {
  if (current <= 2) return 0;
  if (current === 3) return 1;
  return 2;
};

export const CheckoutProgress = ({ current }: CheckoutProgressProps) => {
  const active = stepForCurrent(current);
  const { t } = useTranslation();
  return (
    <View style={styles.wrap} accessibilityLabel={`Checkout ${current} of 5`}>
      {steps.map((step, index) => (
        <View key={step} style={[styles.pill, index <= active ? styles.active : null]}>
          <Text style={[styles.text, index <= active ? styles.activeText : null]}>{t(step)}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs
  },
  pill: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  active: {
    backgroundColor: colors.primary
  },
  text: {
    color: colors.mutedText,
    fontFamily: typography.fonts.semibold,
    fontSize: typography.tiny,
    lineHeight: typography.lineHeight.tiny,
    textAlign: "center"
  },
  activeText: {
    color: colors.white
  }
});
