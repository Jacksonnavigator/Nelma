import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Redirect, Tabs } from "expo-router";
import { History, Route, User } from "lucide-react-native";
import type { ComponentType } from "react";
import { type ColorValue, StyleSheet, View } from "react-native";
import { LoadingScreen } from "../../../components";
import { colors } from "../../../constants/colors";
import { driverTheme, sheetShadow } from "../../../constants/driver-theme";
import { usePushRegistration } from "../../../hooks/use-push-registration";
import { useTranslation } from "../../../hooks/use-translation";
import { useAuth } from "../../../store/auth-context";

export default function DriverTabsLayout() {
  const { status, user } = useAuth();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 12);
  usePushRegistration(user?.role === "DRIVER" ? user.id : undefined, "DRIVER");

  if (status === "loading") {
    return <LoadingScreen />;
  }

  if (status === "unauthenticated") {
    return <Redirect href="/(auth)/login" />;
  }

  if (user?.role !== "DRIVER") {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedText,
        sceneStyle: { backgroundColor: driverTheme.pageBg },
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 0,
          ...sheetShadow,
          height: 66 + bottomPadding,
          paddingBottom: bottomPadding,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          paddingTop: 10
        },
        tabBarLabelStyle: {
          fontFamily: "PlusJakartaSans_700Bold",
          fontSize: 11,
          marginTop: 4
        }
      }}
    >
      <Tabs.Screen name="deliveries" options={{ title: t("Route"), tabBarIcon: (props) => <TabIcon icon={Route} {...props} /> }} />
      <Tabs.Screen name="history" options={{ title: t("History"), tabBarIcon: (props) => <TabIcon icon={History} {...props} /> }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ title: t("Account"), tabBarIcon: (props) => <TabIcon icon={User} {...props} /> }} />
    </Tabs>
  );
}

// The active tab sits in a soft pill so the current place in the app reads at a glance.
const TabIcon = ({ icon: Icon, focused, color }: { icon: ComponentType<{ color?: string; size?: number; strokeWidth?: number }>; focused: boolean; color: ColorValue }) => (
  <View style={[styles.pill, focused ? styles.pillActive : null]}>
    <Icon color={String(color)} size={21} strokeWidth={focused ? 2.4 : 2} />
  </View>
);

const styles = StyleSheet.create({
  pill: { width: 56, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  pillActive: { backgroundColor: driverTheme.aqua }
});
