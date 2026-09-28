import { useEffect } from "react";
import { AppState } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Redirect, Tabs } from "expo-router";
import { Home, ReceiptText, User } from "lucide-react-native";
import { LoadingScreen } from "../../components";
import { colors } from "../../constants/colors";
import { usePushRegistration } from "../../hooks/use-push-registration";
import { useTranslation } from "../../hooks/use-translation";
import { useAuth } from "../../store/auth-context";
import { useNotifications } from "../../store/notification-context";

export default function TabsLayout() {
  const { status, user } = useAuth();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 12);
  usePushRegistration(user?.role === "USER" ? user.id : undefined, "USER");
  const { loadNotifications } = useNotifications();

  // Keep the bell's unread count fresh: on opening, and each time the app comes back to the front.
  useEffect(() => {
    if (user?.role !== "USER") return;
    loadNotifications().catch(() => undefined);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") loadNotifications().catch(() => undefined);
    });
    return () => subscription.remove();
  }, [loadNotifications, user?.role]);

  if (status === "loading") {
    return <LoadingScreen />;
  }

  if (status === "unauthenticated") {
    return <Redirect href="/(auth)/login" />;
  }

  if (user?.role === "DRIVER") {
    return <Redirect href="/driver/(tabs)/deliveries" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#009FE3",
        tabBarInactiveTintColor: colors.mutedText,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: "#D3DFE8",
          height: 60 + bottomPadding,
          paddingBottom: bottomPadding,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          paddingTop: 8
        },
        tabBarLabelStyle: {
          fontFamily: "PlusJakartaSans_700Bold",
          fontSize: 12
        }
      }}
    >
      <Tabs.Screen name="home" options={{ title: t("Home"), tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }} />
      <Tabs.Screen name="orders" options={{ title: t("Orders"), tabBarIcon: ({ color, size }) => <ReceiptText color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: t("Profile"), tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}
