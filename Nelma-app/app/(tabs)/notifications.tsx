import { router } from "expo-router";
import { BellOff, CheckCheck } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { AppTopBar, EmptyState, ErrorState, NotificationCard, Screen } from "../../components";
import { colors } from "../../constants/colors";
import { spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";
import { useNotifications } from "../../store/notification-context";

export default function NotificationsScreen() {
  const { notifications, unreadCount, loading, error, loadNotifications, markRead, markAllRead } = useNotifications();
  const { t } = useTranslation();
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const readAll = async () => {
    setMarkingAll(true);
    try {
      await markAllRead();
    } catch {
      // The list refreshes on the next visit; nothing to undo here.
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <Screen safeBottom={false} contentContainerStyle={styles.screen} keyboard={false} padded={false} scroll={false} style={styles.safe}>
      <AppTopBar />
      {error && !notifications.length ? (
        <View style={styles.center}>
          <ErrorState message={error} onAction={loadNotifications} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.titleRow}>
              <View style={styles.titleCopy}>
                <Text style={styles.title}>{t("Notifications")}</Text>
                <Text style={styles.subtitle}>{unreadCount ? `${unreadCount} ${t("unread")}` : t("You are all caught up")}</Text>
              </View>
              {unreadCount ? (
                <Pressable accessibilityRole="button" disabled={markingAll} onPress={readAll} style={styles.markAll} hitSlop={6}>
                  {markingAll ? <ActivityIndicator color={colors.primary} size="small" /> : <CheckCheck color={colors.primary} size={16} strokeWidth={2.4} />}
                  <Text style={styles.markAllText}>{t("Mark all read")}</Text>
                </Pressable>
              ) : null}
            </View>
          }
          renderItem={({ item }) => (
            <NotificationCard
              notification={item}
              onPress={async () => {
                await markRead(item.id).catch(() => undefined);
                if (item.orderId) {
                  router.push({ pathname: "/orders/[id]", params: { id: item.orderId } });
                }
              }}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.gap} />}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator color={colors.primary} style={styles.loading} />
            ) : (
              <EmptyState
                artwork={<View style={styles.emptyArt}><BellOff color={colors.primary} size={40} strokeWidth={2} /></View>}
                title="No notifications yet"
                message="Order updates and messages from NELMA will appear here."
              />
            )
          }
          refreshControl={<RefreshControl refreshing={loading && notifications.length > 0} onRefresh={loadNotifications} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
          style={styles.flex}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.white },
  screen: { backgroundColor: colors.white, flex: 1 },
  flex: { flex: 1 },
  center: { flex: 1, padding: spacing.lg },
  list: { paddingBottom: 132, paddingHorizontal: spacing.md, paddingTop: spacing.md },
  titleRow: { alignItems: "center", flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  titleCopy: { flex: 1, gap: 2 },
  title: { color: colors.ink, fontFamily: typography.fonts.bold, fontSize: 22, letterSpacing: -0.3, lineHeight: 28 },
  subtitle: { color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: 12, lineHeight: 16 },
  markAll: { alignItems: "center", flexDirection: "row", gap: 4, minHeight: 32 },
  markAllText: { color: colors.primary, fontFamily: typography.fonts.bold, fontSize: 12.5, lineHeight: 16 },
  gap: { height: spacing.xs },
  loading: { paddingVertical: spacing.xxl },
  emptyArt: { alignItems: "center", backgroundColor: colors.surfaceBlue, borderRadius: 16, height: 84, justifyContent: "center", width: 84 }
});
