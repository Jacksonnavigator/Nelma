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

type Look = { icon: ComponentType<{ color?: string; size?: number }>; tint: string; ink: string };

const stopLook: Look = { icon: Truck, tint: driverTheme.aqua, ink: colors.primary };
const newsLook: Look = { icon: Megaphone, tint: "#EAE8FD", ink: "#4B45B8" };

const lookFor: Partial<Record<NotificationType, Look>> = {
  driver_delivery_assigned: stopLook,
  driver_delivery_reassigned: stopLook,
  driver_schedule_changed: { icon: CalendarClock, tint: driverTheme.amberBg, ink: driverTheme.amberText },
  driver_delivery_note: { icon: MessageSquareText, tint: driverTheme.mintBg, ink: driverTheme.mintText },
  driver_system_message: newsLook,
  system_announcement: newsLook
};

export default function DriverNotificationsScreen() {
  const { t } = useTranslation();
  const { notifications, loading, error, loadNotifications, markRead, markAllRead } = useNotifications();

  useFocusEffect(
    useCallback(() => {
      void loadNotifications();
    }, [loadNotifications])
  );

  // Unread first, so what still needs attention sits above what has been seen.
  const items = useMemo(() => {
    const mine = notifications.filter(isDriverNotification);
    return [...mine.filter((item) => !item.read), ...mine.filter((item) => item.read)];
  }, [notifications]);
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
          renderItem={({ item, index }) => {
            const look = lookFor[item.type] ?? newsLook;
            const Icon = look.icon;
            const startsGroup = index === 0 || items[index - 1].read !== item.read;
            return (
              <View>
                {startsGroup ? <Text style={styles.group}>{t(item.read ? "Earlier" : "New")}</Text> : null}
                <Sheet style={[styles.card, item.read ? styles.cardRead : null]}>
                  <Pressable accessibilityRole="button" onPress={() => void openItem(item)} style={({ pressed }) => [styles.item, pressed ? styles.pressed : null]}>
                    {item.read ? null : <View style={styles.accent} />}
                    <View style={[styles.icon, { backgroundColor: look.tint }]}><Icon color={look.ink} size={19} /></View>
                    <View style={styles.copy}>
                      <View style={styles.titleRow}>
                        <Text style={[styles.title, item.read ? styles.titleRead : null]}>{t(item.title)}</Text>
                        {item.read ? null : <View style={styles.dot} />}
                      </View>
                      <Text style={styles.body}>{t(item.body)}</Text>
                      <Text style={styles.time}>{formatDate(item.createdAt)}</Text>
                    </View>
                  </Pressable>
                </Sheet>
              </View>
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
  group: { color: colors.mutedText, fontFamily: typography.fonts.semibold, fontSize: 12, letterSpacing: 0.6, lineHeight: 17, textTransform: "uppercase", marginTop: spacing.sm, marginBottom: spacing.xs, paddingHorizontal: spacing.xxs },
  card: { borderRadius: radius.xl + 6 },
  cardRead: { backgroundColor: "rgba(255,255,255,0.6)" },
  item: { flexDirection: "row", gap: spacing.md, padding: spacing.md },
  pressed: { backgroundColor: driverTheme.pageBg },
  accent: { position: "absolute", left: 0, top: spacing.md, bottom: spacing.md, width: 4, borderTopRightRadius: 4, borderBottomRightRadius: 4, backgroundColor: colors.primary },
  icon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, gap: 2 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  title: { flexShrink: 1, color: colors.ink, fontFamily: typography.fonts.bold, fontSize: 15, lineHeight: 21 },
  titleRead: { fontFamily: typography.fonts.semibold, color: colors.text },
  body: { color: colors.text, fontFamily: typography.fonts.regular, fontSize: 14, lineHeight: 20 },
  time: { color: colors.subtleText, fontFamily: typography.fonts.regular, fontSize: 12, lineHeight: 18, marginTop: 2 },
  gap: { height: spacing.sm }
});
