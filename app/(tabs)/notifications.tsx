import { router } from "expo-router";
import { CheckCheck } from "lucide-react-native";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet } from "react-native";
import { Button, EmptyState, ErrorState, Header, LoadingScreen, NotificationCard, Screen } from "../../components";
import { spacing } from "../../constants/theme";
import { useNotifications } from "../../store/notification-context";

export default function NotificationsScreen() {
  const { notifications, unreadCount, loading, error, loadNotifications, markRead, markAllRead } = useNotifications();
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  if (loading && !notifications.length) {
    return <LoadingScreen message="Loading notifications" />;
  }

  if (error && !notifications.length) {
    return <Screen safeBottom={false}><ErrorState message={error} onAction={loadNotifications} /></Screen>;
  }

  return (
    <Screen safeBottom={false} scroll={false}>
      <Header title="Notifications" subtitle="Order, payment, and account updates from NELMA." />
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
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <NotificationCard
            notification={item}
            onPress={async () => {
              await markRead(item.id);
              if (item.orderId) {
                router.push({ pathname: "/orders/[id]", params: { id: item.orderId } });
              }
            }}
          />
        )}
        ListEmptyComponent={<EmptyState title="No notifications yet" message="NELMA updates will appear here." />}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
    paddingBottom: spacing.xxl
  }
});
