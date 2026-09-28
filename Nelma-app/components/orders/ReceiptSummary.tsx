import { Edit3 } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "../../hooks/use-translation";
import { colors } from "../../constants/colors";
import { radius, spacing, typography } from "../../constants/theme";
import type { DeliveryAddress } from "../../types/address";
import type { DeliverySchedule, OrderCharge, OrderType } from "../../types/order";
import { hasCoordinates } from "../../utils/address";
import { formatCurrency } from "../../utils/format";
import { getOrderProductName, getOrderTypeLabel } from "../../utils/order";
import { Card } from "../ui/Card";

type ReceiptSummaryProps = {
  orderType: OrderType;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  charges: OrderCharge[];
  total: number;
  deliveryAddress?: DeliveryAddress;
  deliverySchedule?: DeliverySchedule;
  customerRemarks?: string;
  paymentMethodLabel?: string;
  date?: string;
  orderTypeLabel?: string;
  productName?: string;
  onEditItems?: () => void;
  onEditDelivery?: () => void;
  onChangePayment?: () => void;
  showRemarks?: boolean;
  showTitle?: boolean;
};

export const ReceiptSummary = ({
  orderType,
  quantity,
  unitPrice,
  subtotal,
  charges,
  total,
  deliveryAddress,
  deliverySchedule,
  customerRemarks,
  paymentMethodLabel,
  date,
  orderTypeLabel,
  productName,
  onEditItems,
  onEditDelivery,
  onChangePayment,
  showRemarks = true,
  showTitle = true
}: ReceiptSummaryProps) => {
  const { t } = useTranslation();
  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.brandName}>NELMA</Text>
      </View>
      {showTitle ? (
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{t("Order summary")}</Text>
          {date ? <Text style={styles.date}>{date}</Text> : <Text style={styles.date}>{t("Please review before placing the order.")}</Text>}
        </View>
      ) : null}

      <Section title="Water order" actionLabel={onEditItems ? "Edit" : undefined} onAction={onEditItems}>
        <Row label="Order type" value={t(orderTypeLabel ?? getOrderTypeLabel(orderType))} />
        <Row label="Product" value={t(productName ?? getOrderProductName(orderType))} />
        <Row label="Quantity" value={quantity + " x " + formatCurrency(unitPrice)} />
        <Row label="Subtotal" value={formatCurrency(subtotal)} strong />
      </Section>

      {deliveryAddress ? (
        <Section title="Delivery" actionLabel={onEditDelivery ? "Change" : undefined} onAction={onEditDelivery} tone="green">
          <Text style={styles.addressLine}>{deliveryAddress.deliveryAddress}</Text>
          <Text style={styles.metaLine}>{deliveryAddress.phone}</Text>
          {deliveryAddress.deliveryInstructions ? <Text style={styles.instructions}>{deliveryAddress.deliveryInstructions}</Text> : null}
          <Text style={styles.locationNote}>{t(hasCoordinates(deliveryAddress) ? "Precise location attached" : "Manual address only")}</Text>
        </Section>
      ) : null}

      {deliverySchedule ? (
        <Section title="Delivery time" tone="green">
          <Row label="Day" value={t(deliverySchedule.label)} />
          <Row label="Window" value={t(deliverySchedule.window)} />
        </Section>
      ) : null}

      {showRemarks && customerRemarks?.trim() ? (
        <Section title="Remarks">
          <Text style={styles.instructions}>{customerRemarks.trim()}</Text>
        </Section>
      ) : null}

      <Section title="Payment" actionLabel={onChangePayment ? "Change" : undefined} onAction={onChangePayment}>
        <Row label="Method" value={t(paymentMethodLabel ?? "Not selected")} />
        {charges.length ? (
          charges.map((charge) => <Row key={charge.id} label={charge.label} value={formatCurrency(charge.amount)} />)
        ) : (
          <Text style={styles.metaLine}>{t("No additional fees on this order.")}</Text>
        )}
      </Section>

      <View style={styles.totalRow}>
        <View>
          <Text style={styles.totalLabel}>{t("Total")}</Text>
          <Text style={styles.totalHint}>{t("Includes selected quantity and any fees shown above.")}</Text>
        </View>
        <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
      </View>
    </Card>
  );
};

const Section = ({
  title,
  actionLabel,
  onAction,
  tone = "blue",
  children
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: "blue" | "green";
  children: React.ReactNode;
}) => {
  const { t } = useTranslation();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>{t(title)}</Text>
        </View>
        {actionLabel && onAction ? (
          <Pressable accessibilityRole="button" onPress={onAction} style={({ pressed }) => [styles.action, { opacity: pressed ? 0.7 : 1 }]}>
            <Edit3 color={colors.primary} size={14} />
            <Text style={styles.actionText}>{t(actionLabel)}</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
};

const Row = ({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) => {
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{t(label)}</Text>
      <Text style={[styles.rowValue, strong ? styles.strongValue : null]}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  brandName: {
    color: colors.primary,
    fontFamily: typography.fonts.bold,
    fontSize: typography.h3,
    lineHeight: typography.lineHeight.h3
  },
  titleBlock: {
    gap: spacing.xs
  },
  title: {
    color: colors.text,
    fontFamily: typography.fonts.bold,
    fontSize: typography.h2,
    lineHeight: typography.lineHeight.h2
  },
  date: {
    color: colors.mutedText,
    fontFamily: typography.fonts.regular,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small
  },
  section: {
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden"
  },
  sectionHeader: {
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  sectionTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  sectionIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceBlue,
    borderRadius: radius.pill,
    height: 30,
    justifyContent: "center",
    width: 30
  },
  greenIcon: {
    backgroundColor: colors.surfaceMint
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: typography.fonts.bold,
    fontSize: typography.body,
    lineHeight: typography.lineHeight.body
  },
  action: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 34,
    paddingHorizontal: spacing.xs
  },
  actionText: {
    color: colors.primary,
    fontFamily: typography.fonts.bold,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small
  },
  sectionBody: {
    gap: spacing.sm,
    padding: spacing.md
  },
  row: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  rowLabel: {
    color: colors.mutedText,
    flex: 0.86,
    fontFamily: typography.fonts.medium,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small
  },
  rowValue: {
    color: colors.text,
    flex: 1.14,
    fontFamily: typography.fonts.bold,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small,
    textAlign: "right"
  },
  strongValue: {
    color: colors.primary
  },
  addressLine: {
    color: colors.text,
    fontFamily: typography.fonts.bold,
    fontSize: typography.body,
    lineHeight: typography.lineHeight.body
  },
  metaLine: {
    color: colors.mutedText,
    fontFamily: typography.fonts.regular,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small
  },
  instructions: {
    backgroundColor: colors.surfaceMint,
    borderRadius: radius.md,
    color: colors.text,
    fontFamily: typography.fonts.medium,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small,
    padding: spacing.sm
  },
  locationNote: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceMint,
    borderRadius: radius.pill,
    color: colors.success,
    fontFamily: typography.fonts.bold,
    fontSize: typography.tiny,
    lineHeight: typography.lineHeight.tiny,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    textTransform: "uppercase"
  },
  totalRow: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    padding: spacing.lg
  },
  totalLabel: {
    color: colors.white,
    fontFamily: typography.fonts.bold,
    fontSize: typography.body,
    lineHeight: typography.lineHeight.body
  },
  totalHint: {
    color: "rgba(255,255,255,0.76)",
    fontFamily: typography.fonts.regular,
    fontSize: typography.tiny,
    lineHeight: typography.lineHeight.tiny,
    marginTop: 2,
    maxWidth: 170
  },
  totalValue: {
    color: colors.white,
    fontFamily: typography.fonts.bold,
    fontSize: typography.h2,
    lineHeight: typography.lineHeight.h2,
    textAlign: "right"
  }
});
