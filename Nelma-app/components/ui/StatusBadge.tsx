import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "../../hooks/use-translation";
import { colors } from "../../constants/colors";
import { radius, spacing, typography } from "../../constants/theme";
import type { OrderStatus } from "../../types/order";
import type { PaymentStatus } from "../../types/payment";
import { orderStatusLabel, orderStatusTone, paymentStatusLabel, paymentStatusTone, StatusTone } from "../../utils/status";

type StatusBadgeProps =
  | { type: "order"; status: OrderStatus; compact?: boolean; labelOverride?: string }
  | { type: "payment"; status: PaymentStatus; compact?: boolean; labelOverride?: string };

export const StatusBadge = (props: StatusBadgeProps) => {
  const { t } = useTranslation();
  const tone = props.type === "order" ? orderStatusTone(props.status) : paymentStatusTone(props.status);
  const label = props.labelOverride ?? (props.type === "order" ? orderStatusLabel(props.status) : paymentStatusLabel(props.status));
  const palette = tonePalette[tone];

  return (
    <View style={[styles.badge, props.compact ? styles.compact : null, { backgroundColor: palette.background, borderColor: palette.border }]}>
      <View style={[styles.dot, { backgroundColor: palette.foreground }]} />
      <Text style={[styles.text, { color: palette.foreground }]}>{t(label)}</Text>
    </View>
  );
};

const tonePalette: Record<StatusTone, { foreground: string; background: string; border: string }> = {
  info: { foreground: colors.primary, background: "#EAF2FF", border: "#D7E7FF" },
  success: { foreground: "#237A52", background: "#E8F8EF", border: "#CFEFDC" },
  warning: { foreground: "#946B13", background: colors.warningBg, border: "#F2DCA5" },
  danger: { foreground: colors.danger, background: colors.dangerBg, border: "#F8C8CE" },
  neutral: { foreground: colors.mutedText, background: colors.surfaceAlt, border: colors.border }
};

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 30,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs
  },
  compact: {
    minHeight: 26,
    paddingHorizontal: spacing.xs
  },
  dot: {
    borderRadius: radius.pill,
    height: 7,
    width: 7
  },
  text: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.tiny,
    lineHeight: typography.lineHeight.tiny,
    textTransform: "uppercase"
  }
});