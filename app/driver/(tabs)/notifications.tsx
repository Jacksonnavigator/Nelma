import { router, useFocusEffect } from "expo-router";
import { BellRing, CheckCheck, PackageCheck } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { AppTopBar, Button, EmptyState, ErrorState, NotificationCard, Screen } from "../../../components";
import { colors } from "../../../constants/colors";
import { spacing, typography } from "../../../constants/theme";
import { useTranslation } from "../../../hooks/use-translation";
import { useNotifications } from "../../../store/notification-context";
import type { Notification } from "../../../types/notification";

const isDriverNotification = (notification: Notification): boolean => notification.type.startsWith("driver_") || notification.type === "system_announcement";

export default function DriverNotificationsScreen() {
  const { t } = useTranslation();
  const { notifications, loading, error, loadNotifications, markRead, markAllRead } = useNotifications();
  const [markingAll, setMarkingAll] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void loadNotifications();
    }, [loadNotifications])
  );

  const driverNotifications = useMemo(() => notifications.filter(isDriverNotification), [notifications]);
  const unreadCount = useMemo(() => driverNotifications.filter((notification) => !notification.read).length, [driverNotifications]);

  if (loading && !driverNotifications.length) {
    return (
      <Screen safeBottom={false} contentContainerStyle={styles.screen} keyboard={false} padded={false} scroll={false} style={styles.safe}>
        <AppTopBar />
        <View style={styles.stateWrap}>
          <View style={styles.loadingIcon}>
            <BellRing color={colors.primary} size={42} strokeWidth={2.4} />
          </View>
          <Text style={styles.loadingText}>{t("Loading driver notifications")}</Text>
        </View>
      </Screen>
    );
  }

  if (error && !driverNotifications.length) {
    return (
      <Screen safeBottom={false} contentContainerStyle={styles.screen} keyboard={false} padded={false} scroll={false} style={styles.safe}>
        <AppTopBar />
        <View style={styles.stateWrap}>
          <ErrorState message={error} onAction={loadNotifications} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeBottom={false} contentContainerStyle={styles.screen} keyboard={false} padded={false} scroll={false} style={styles.safe}>
      <AppTopBar />
      <FlatList
        contentContainerStyle={styles.listContent}
        data={driverNotifications}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.headerStack}>
            <View style={styles.headerPanel}>
              <View style={styles.headerIcon}>
                <BellRing color={colors.primary} size={23} strokeWidth={2.4} />
              </View>
              <View style={styles.headerCopy}>
                <Text style={styles.title}>{t("Driver Notifications")}</Text>
                <Text style={styles.subtitle}>{t("Assignments, schedule changes, and NELMA driver updates.")}</Text>
              </View>
            </View>
            {unreadCount ? (
              <Button
                title="Mark All Read"
                icon={CheckCheck}
                variant="secondary"
                loading={markingAll}
                onPress={async () => {
                  setMarkingAll(true);
                  try {
                    await markAllRead();
                  } finally {
                    setMarkingAll(false);
                  }
                }}
              />
            ) : null}
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState
            artwork={
              <View style={styles.emptyArtwork}>
                <PackageCheck color={colors.primary} size={44} strokeWidth={2.3} />
              </View>
            }
            title="No driver notifications yet"
            message="Assignment and schedule updates from NELMA will appear here."
          />
        }
        renderItem={({ item }) => (
          <NotificationCard
            notification={item}
            onPress={async () => {
              await markRead(item.id);
              if (item.orderId) {
                router.push({ pathname: "/driver/delivery/[id]", params: { id: item.orderId } });
              }
            }}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.white },
  screen: { backgroundColor: colors.white, flex: 1 },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 132
  },
  headerStack: {
    gap: spacing.md,
    marginBottom: spacing.md
  },
  headerPanel: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    paddingBottom: spacing.xs,
    paddingTop: spacing.xs
  },
  headerIcon: {
    alignItems: "center",
    backgroundColor: "transparent",
    height: 30,
    justifyContent: "center",
    width: 30
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0
  },
  title: {
    color: colors.black,
    fontFamily: typography.fonts.bold,
    fontSize: 22,
    lineHeight: 28
  },
  subtitle: {
    color: colors.black,
    fontFamily: typography.fonts.regular,
    fontSize: typography.body,
    lineHeight: typography.lineHeight.body
  },
  separator: {
    height: spacing.md
  },
  stateWrap: {
    alignItems: "center",
    flex: 1,
    gap: spacing.md,
    justifyContent: "center",
    padding: spacing.xl
  },
  loadingIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceBlue,
    borderRadius: 18,
    height: 96,
    justifyContent: "center",
    width: 96
  },
  loadingText: {
    color: colors.black,
    fontFamily: typography.fonts.bold,
    fontSize: typography.body,
    lineHeight: typography.lineHeight.body,
    textAlign: "center"
  },
  emptyArtwork: {
    alignItems: "center",
    backgroundColor: colors.surfaceBlue,
    borderRadius: 18,
    height: 96,
    justifyContent: "center",
    width: 96
  }
});