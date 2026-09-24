import { router, useFocusEffect } from "expo-router";
import { CalendarClock, Megaphone, MessageSquareText, Truck } from "lucide-react-native";
import { type ComponentType, useCallback, useMemo } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { DriverTitle, DropletArt, ErrorState, Screen, Sheet, SkyBackdrop } from "../../../components";
import { colors } from "../../../constants/colors";
import { driverTheme } from "../../../constants/driver-theme";
import { radius, spacing, typography } from "../../../constants/theme";
import { useTranslation } from "../../../hooks/use-translation";
import { useNotifications } from "../../../store/notification-context";
import type { Notification, NotificationType } from "../../../types/notification";
import { isDriverNotification } from "../../../utils/driver-deliveries";
import { formatDate } from "../../../utils/format";

const iconFor: Partial<Record<NotificationType, ComponentType<{ color?: string; size?: number }>>> = {
  driver_delivery_assigned: Truck,
  driver_delivery_reassigned: Truck,
  driver_schedule_changed: CalendarClock,
  driver_delivery_note: MessageSquareText,
  driver_system_message: Megaphone,
  system_announcement: Megaphone
};

export default function DriverNotificationsScreen() {
  const { t } = useTranslation();
  const { notifications, loading, error, loadNotifications, markRead, markAllRead } = useNotifications();

  useFocusEffect(
    useCallback(() => {
      void loadNotifications();
    }, [loadNotifications])
  );

  const items = useMemo(() => notifications.filter(isDriverNotification), [notifications]);
  const unread = useMemo(() => items.filter((item) => !item.read).length, [items]);

  const openItem = async (item: Notification) => {
    await markRead(item.id);
    if (item.orderId) {
      router.push({ pathname: "/driver/delivery/[id]", params: { id: item.orderId } });
    }
  };

  return (
    <Screen safeBottom={false} contentContainerStyle={styles.screen} keyboard={false} padded={false} scroll={false} style={styles.safe}>
      <SkyBackdrop />
      {loading && !items.length ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      ) : error && !items.length ? (
        <View style={styles.center}><ErrorState message={error} onAction={loadNotifications} /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={false} onRefresh={loadNotifications} tintColor={colors.primary} colors={[colors.primary]} />}
          ListHeaderComponent={
            <DriverTitle
              title={t("Notifications")}
              backLabel="Account"
              onBack={() => router.replace("/driver/(tabs)/profile")}
              right={unread > 0 ? (
                <Pressable accessibilityRole="button" hitSlop={10} onPress={() => void markAllRead()}>
                  <Text style={styles.markAll}>{t("Mark all read")}</Text>
                </Pressable>
              ) : undefined}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <DropletArt size={110} />
              <Text style={styles.emptyText}>{t("Assignments and schedule changes from dispatch will show up here.")}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const Icon = iconFor[item.type] ?? Megaphone;
            return (
              <Sheet style={[styles.card, item.read ? null : styles.cardUnread]}>
                <Pressable accessibilityRole="button" onPress={() => void openItem(item)} style={({ pressed }) => [styles.item, pressed ? styles.pressed : null]}>
                  <View style={[styles.icon, item.read ? null : styles.iconUnread]}><Icon color={item.read ? colors.mutedText : colors.white} size={18} /></View>
                  <View style={styles.copy}>
                    <Text style={[styles.title, item.read ? styles.titleRead : null]}>{t(item.title)}</Text>
                    <Text style={styles.body}>{t(item.body)}</Text>
                    <Text style={styles.time}>{formatDate(item.createdAt)}</Text>
                  </View>
                </Pressable>
              </Sheet>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.gap} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: driverTheme.pageBg },
  screen: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  markAll: { color: colors.primary, fontFamily: typography.fonts.semibold, fontSize: 14, lineHeight: 20, paddingBottom: 6 },
  empty: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xxl },
  emptyText: { color: colors.mutedText, fontFamily: typography.fonts.regular, fontSize: 15, lineHeight: 22, textAlign: "center", maxWidth: 280 },
  card: { borderRadius: radius.xl },
  cardUnread: { borderWidth: 1, borderColor: driverTheme.aquaLine },
  item: { flexDirection: "row", gap: spacing.md, padding: spacing.md },
  pressed: { backgroundColor: driverTheme.pageBg },
  icon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: colors.line },
  iconUnread: { backgroundColor: colors.primary },
  copy: { flex: 1, gap: 2 },
  title: { color: colors.ink, fontFamily: typography.fonts.bold, fontSize: 15, lineHeight: 21 },
  titleRead: { fontFamily: typography.fonts.semibold },
  body: { color: colors.text, fontFamily: typography.fonts.regular, fontSize: 14, lineHeight: 20 },
  time: { color: colors.subtleText, fontFamily: typography.fonts.regular, fontSize: 12, lineHeight: 18, marginTop: 2 },
  gap: { height: spacing.sm }
});
