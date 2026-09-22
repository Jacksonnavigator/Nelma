import { Check, Circle, Dot } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "../../hooks/use-translation";
import { colors } from "../../constants/colors";
import { spacing, typography } from "../../constants/theme";
import type { OrderStatus, OrderTimelineEvent } from "../../types/order";

const timelineStatuses: OrderStatus[] = ["pending", "confirmed", "processing", "out_for_delivery", "delivered", "received"];
const terminalStatuses: OrderStatus[] = ["delivered", "received", "cancelled"];

type OrderTimelineProps = {
  events: OrderTimelineEvent[];
  currentStatus: OrderStatus;
};

export const OrderTimeline = ({ events, currentStatus }: OrderTimelineProps) => {
  const { t } = useTranslation();
  return (
    <View style={styles.wrapper}>
      {events.map((event, index) => {
        const currentIndex = timelineStatuses.indexOf(currentStatus);
        const eventIndex = timelineStatuses.indexOf(event.status);
        const isComplete = currentStatus === "cancelled" ? event.status === "pending" : eventIndex >= 0 && eventIndex < currentIndex;
        const isCurrent = event.status === currentStatus && !terminalStatuses.includes(currentStatus);
        return (
          <View key={event.id} style={styles.row}>
            <View style={styles.iconColumn}>
              <View style={[styles.circle, isComplete ? styles.complete : isCurrent ? styles.current : styles.pending]}>
                {isComplete ? <Check color={colors.white} size={14} strokeWidth={3} /> : isCurrent ? <Dot color={colors.primary} size={24} strokeWidth={3} /> : <Circle color={colors.border} size={11} />}
              </View>
              {index < events.length - 1 ? <View style={[styles.line, isComplete ? styles.lineComplete : null]} /> : null}
            </View>
            <View style={styles.copy}>
              <Text style={[styles.label, isCurrent ? styles.currentLabel : null]}>{t(event.status === "received" ? "Customer Received" : event.label)}</Text>
              <Text style={styles.meta}>{t(isComplete ? "Completed" : isCurrent ? "In progress" : "Not started")}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 56
  },
  iconColumn: {
    alignItems: "center"
  },
  circle: {
    alignItems: "center",
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
    width: 28
  },
  complete: {
    backgroundColor: colors.green
  },
  current: {
    backgroundColor: colors.white,
    borderColor: colors.primary,
    borderWidth: 2
  },
  pending: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1
  },
  line: {
    backgroundColor: colors.line,
    flex: 1,
    width: 2
  },
  lineComplete: {
    backgroundColor: colors.green
  },
  copy: {
    flex: 1,
    gap: 2,
    paddingBottom: spacing.md
  },
  label: {
    color: colors.text,
    fontFamily: typography.fonts.semibold,
    fontSize: typography.body,
    lineHeight: typography.lineHeight.body
  },
  currentLabel: {
    color: colors.primary,
    fontFamily: typography.fonts.bold
  },
  meta: {
    color: colors.mutedText,
    fontFamily: typography.fonts.regular,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small
  }
});
