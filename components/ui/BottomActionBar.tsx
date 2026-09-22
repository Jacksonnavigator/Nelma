import type { ComponentType, ReactNode } from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "../../hooks/use-translation";
import { colors } from "../../constants/colors";
import { shadows, spacing, typography } from "../../constants/theme";
import { formatCurrency } from "../../utils/format";
import { Button } from "./Button";

type BottomActionBarProps = {
  label?: string;
  amount?: number;
  buttonTitle: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;
  leading?: ReactNode;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export const BottomActionBar = ({ label, amount, buttonTitle, onPress, disabled, loading, icon, leading, children, style }: BottomActionBarProps) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.md) }, style]}>
      {children ? <View style={styles.extra}>{children}</View> : null}
      <View style={styles.row}>
        {leading}
        {typeof amount === "number" ? (
          <View style={styles.priceBlock}>
            <Text style={styles.label}>{t(label ?? "Total")}</Text>
            <Text style={styles.amount}>{formatCurrency(amount)}</Text>
          </View>
        ) : null}
        <Button title={buttonTitle} icon={icon} onPress={onPress} disabled={disabled} loading={loading} style={styles.button} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderTopColor: colors.line,
    borderTopWidth: 1,
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    ...shadows.raised
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  priceBlock: {
    flex: 0.78,
    gap: 2
  },
  label: {
    color: colors.mutedText,
    fontFamily: typography.fonts.medium,
    fontSize: typography.tiny,
    lineHeight: typography.lineHeight.tiny,
    textTransform: "uppercase"
  },
  amount: {
    color: colors.text,
    fontFamily: typography.fonts.bold,
    fontSize: typography.h3,
    lineHeight: typography.lineHeight.h3
  },
  button: {
    flex: 1.2
  },
  extra: {
    gap: spacing.xs
  }
});
