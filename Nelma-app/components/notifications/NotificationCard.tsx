import { Bell, ChevronRight } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/colors";
import { spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";
import type { Notification } from "../../types/notification";
import { formatDate } from "../../utils/format";

type NotificationCardProps = {
  notification: Notification;
  onPress: () => void;
};

export const NotificationCard = ({ notification, onPress }: NotificationCardProps) => {
  const { t } = useTranslation();
  const unread = !notification.read;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, unread ? styles.unread : null, { opacity: pressed ? 0.8 : 1 }]}>
      <View style={[styles.iconWrap, unread ? styles.unreadIcon : null]}>
        <Bell color={unread ? colors.primary : colors.mutedText} size={17} strokeWidth={2.3} />
        {unread ? <View style={styles.dot} /> : null}
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={[styles.title, unread ? styles.titleUnread : null]}>{t(notification.title)}</Text>
        <Text numberOfLines={2} style={styles.body}>{t(notification.body)}</Text>
        <Text style={styles.date}>{formatDate(notification.createdAt)}</Text>
      </View>
      {notification.orderId ? <ChevronRight color={colors.subtleText} size={16} /> : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm
  },
  unread: { backgroundColor: "#F5FBFF", borderColor: "#CFE9F8" },
  iconWrap: { alignItems: "center", backgroundColor: colors.surfaceAlt, borderRadius: 12, height: 38, justifyContent: "center", width: 38 },
  unreadIcon: { backgroundColor: colors.surfaceBlue },
  dot: { backgroundColor: colors.danger, borderColor: colors.white, borderRadius: 5, borderWidth: 1.5, height: 10, position: "absolute", right: 6, top: 6, width: 10 },
  copy: { flex: 1, gap: 2, minWidth: 0 },
  title: { color: colors.text, fontFamily: typography.fonts.semibold, fontSize: 14, lineHeight: 19 },
  titleUnread: { fontFamily: typography.fonts.bold },
  body: { color: colors.mutedText, fontFamily: typography.fonts.regular, fontSize: 12.5, lineHeight: 17 },
  date: { color: colors.subtleText, fontFamily: typography.fonts.medium, fontSize: typography.tiny, lineHeight: typography.lineHeight.tiny }
});
