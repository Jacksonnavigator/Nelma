import { Bell, ChevronRight } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/colors";
import { radius, spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";
import type { Notification } from "../../types/notification";
import { formatDate } from "../../utils/format";

type NotificationCardProps = {
  notification: Notification;
  onPress: () => void;
};

export const NotificationCard = ({ notification, onPress }: NotificationCardProps) => {
  const { t } = useTranslation();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, !notification.read ? styles.unread : null, { opacity: pressed ? 0.78 : 1 }]}> 
      <View style={[styles.iconWrap, !notification.read ? styles.unreadIcon : null]}>
        <Bell color={!notification.read ? colors.primary : colors.mutedText} size={20} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{t(notification.title)}</Text>
        <Text style={styles.body}>{t(notification.body)}</Text>
        <Text style={styles.date}>{formatDate(notification.createdAt)}</Text>
      </View>
      {notification.orderId ? <ChevronRight color={colors.mutedText} size={18} /> : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg
  },
  unread: {
    borderColor: colors.primary
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  unreadIcon: {
    backgroundColor: "#EAF2FF"
  },
  copy: {
    flex: 1,
    gap: spacing.xs
  },
  title: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  body: {
    color: colors.mutedText,
    fontSize: typography.small,
    lineHeight: 18
  },
  date: {
    color: colors.secondary,
    fontSize: typography.tiny,
    fontWeight: "800"
  }
});