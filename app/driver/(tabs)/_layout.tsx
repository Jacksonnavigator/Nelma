import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Redirect, Tabs } from "expo-router";
import { Clock3, House, User } from "lucide-react-native";
import { LoadingScreen } from "../../../components";
import { colors } from "../../../constants/colors";
import { useTranslation } from "../../../hooks/use-translation";
import { useAuth } from "../../../store/auth-context";

export default function DriverTabsLayout() {
  const { status, user } = useAuth();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 12);

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
      <Tabs.Screen name="deliveries" options={{ title: t("Home"), tabBarIcon: ({ color, size }) => <House color={color} size={size} /> }} />
      <Tabs.Screen name="history" options={{ title: t("History"), tabBarIcon: ({ color, size }) => <Clock3 color={color} size={size} /> }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ title: t("Account"), tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }} />
    </Tabs>
  );
}
