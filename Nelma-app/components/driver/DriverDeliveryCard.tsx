import { Banknote, ChevronRight, Clock3, Droplets, MapPin, Navigation, Phone } from "lucide-react-native";
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/colors";
import { radius, shadows, spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";
import { haptics } from "../../services/haptics";
import type { Order } from "../../types/order";
import { bottleCount, buildExternalMapUrl, cashDueAmount, closedTimeLabel, customerContactPhone, customerDisplayName, deliveryAddressLine, deliveryAreaLine, deliveryTimeLabel, hasDeliveryCoordinates } from "../../utils/driver-deliveries";
import { formatCurrency, formatDate } from "../../utils/format";
import { driverDeliveryStatusLabel, orderStatusTone } from "../../utils/status";

type DriverDeliveryCardProps = { order: Order; mode?: "active" | "history"; onPress: () => void };

const toneColors = {
  info: { bg: colors.surfaceBlue, fg: colors.primary },
  success: { bg: colors.surfaceMint, fg: "#1F8A7C" },
  warning: { bg: colors.warningBg, fg: "#9A6B00" },
  danger: { bg: colors.dangerBg, fg: colors.danger },
  neutral: { bg: colors.surfaceAlt, fg: colors.mutedText }
} as const;

export const DriverDeliveryCard = ({ order, mode = "active", onPress }: DriverDeliveryCardProps) => {
  const { t } = useTranslation();
  const tone = toneColors[orderStatusTone(order.status)];
  const phone = customerContactPhone(order);
  const canNavigate = hasDeliveryCoordinates(order);
  const cashDue = cashDueAmount(order);
  const showActions = mode === "active" && (Boolean(phone) || canNavigate);

  const call = () => {
    if (!phone) return;
    haptics.selection();
    void Linking.openURL("tel:" + phone.replace(/[^+\d]/g, "")).catch(() => undefined);
  };

  const navigate = () => {
    const platform = Platform.OS === "ios" || Platform.OS === "android" ? Platform.OS : "web";
    const url = buildExternalMapUrl(order.deliveryAddress.latitude, order.deliveryAddress.longitude, platform, deliveryAreaLine(order));
    if (!url) return;
    haptics.selection();
    void Linking.openURL(url).catch(() => undefined);
  };

  return (
    <View style={styles.card}>
      <Pressable accessibilityRole="button" accessibilityLabel={customerDisplayName(order) + ", " + deliveryAddressLine(order)} onPress={onPress} style={({ pressed }) => [styles.main, { opacity: pressed ? 0.75 : 1 }]}>
        <View style={styles.topRow}>
          <View style={[styles.pill, { backgroundColor: tone.bg }]}>
            <Text style={[styles.pillText, { color: tone.fg }]}>{t(driverDeliveryStatusLabel(order.status))}</Text>
          </View>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        </View>

        <View style={styles.bodyRow}>
          <View style={styles.copy}>
            <Text numberOfLines={1} style={styles.customer}>{customerDisplayName(order)}</Text>
            <View style={styles.line}>
              <MapPin color={colors.mutedText} size={15} />
              <Text numberOfLines={2} style={styles.address}>{deliveryAddressLine(order)}</Text>
            </View>
            <View style={styles.line}>
              <Clock3 color={colors.mutedText} size={15} />
              <Text numberOfLines={1} style={styles.meta}>{mode === "history" ? formatDate(closedTimeLabel(order)) : t(deliveryTimeLabel(order))}</Text>
            </View>
          </View>
          <View style={styles.bottles}>
            <Droplets color={colors.primary} size={18} />
            <Text style={styles.bottleNumber}>{bottleCount(order)}</Text>
            <Text style={styles.bottleLabel}>{t("bottles")}</Text>
          </View>
          <ChevronRight color={colors.mutedText} size={20} />
        </View>

        {mode === "active" && cashDue > 0 ? (
          <View style={styles.cashChip}>
            <Banknote color="#9A6B00" size={16} />
            <Text style={styles.cashText}>{t("Payment due")} {"·"} {formatCurrency(cashDue, order.currency)}</Text>
          </View>
        ) : null}
      </Pressable>

      {showActions ? (
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" accessibilityLabel={t("Call")} disabled={!phone} onPress={call} style={({ pressed }) => [styles.action, !phone ? styles.actionDisabled : null, { opacity: pressed ? 0.7 : 1 }]}>
            <Phone color={phone ? colors.primary : colors.disabled} size={18} />
            <Text style={[styles.actionText, !phone ? styles.actionTextDisabled : null]}>{t("Call")}</Text>
          </Pressable>
          <View style={styles.actionDivider} />
          <Pressable accessibilityRole="button" accessibilityLabel={t("Navigate")} disabled={!canNavigate} onPress={navigate} style={({ pressed }) => [styles.action, !canNavigate ? styles.actionDisabled : null, { opacity: pressed ? 0.7 : 1 }]}>
            <Navigation color={canNavigate ? colors.primary : colors.disabled} size={18} />
            <Text style={[styles.actionText, !canNavigate ? styles.actionTextDisabled : null]}>{t("Navigate")}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, overflow: "hidden", ...(shadows.card ?? {}) },
  main: { padding: spacing.md, gap: spacing.sm },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.xs },
  pill: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  pillText: { fontFamily: typography.fonts.bold, fontSize: 11, lineHeight: 16 },
  orderNumber: { color: colors.subtleText, fontFamily: typography.fonts.medium, fontSize: 12, lineHeight: 18 },
  bodyRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  copy: { flex: 1, gap: spacing.xxs, minWidth: 0 },
  customer: { color: colors.text, fontFamily: typography.fonts.bold, fontSize: 17, lineHeight: 24 },
  line: { flexDirection: "row", alignItems: "flex-start", gap: spacing.xxs },
  address: { flex: 1, color: colors.text, fontFamily: typography.fonts.regular, fontSize: 14, lineHeight: 20 },
  meta: { flex: 1, color: colors.mutedText, fontFamily: typography.fonts.regular, fontSize: 12, lineHeight: 18 },
  bottles: { alignItems: "center", backgroundColor: colors.surfaceBlue, borderRadius: radius.sm, minWidth: 54, paddingVertical: spacing.xs, paddingHorizontal: spacing.xs },
  bottleNumber: { color: colors.text, fontFamily: typography.fonts.bold, fontSize: 18, lineHeight: 22 },
  bottleLabel: { color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: 10, lineHeight: 14 },
  cashChip: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: spacing.xs, backgroundColor: colors.warningBg, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  cashText: { color: "#9A6B00", fontFamily: typography.fonts.bold, fontSize: 12, lineHeight: 18 },
  actions: { flexDirection: "row", borderTopColor: colors.line, borderTopWidth: 1 },
  action: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs, minHeight: 46 },
  actionDisabled: { opacity: 0.6 },
  actionText: { color: colors.primary, fontFamily: typography.fonts.bold, fontSize: 14, lineHeight: 20 },
  actionTextDisabled: { color: colors.disabled },
  actionDivider: { width: 1, backgroundColor: colors.line }
});
