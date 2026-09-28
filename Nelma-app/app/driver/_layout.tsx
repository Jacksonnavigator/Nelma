import { Redirect, Stack } from "expo-router";
import { LoadingScreen } from "../../components";
import { useLocationBeacon } from "../../hooks/use-location-beacon";
import { useAuth } from "../../store/auth-context";

export default function DriverLayout() {
  const { status, user } = useAuth();
  useLocationBeacon();

  if (status === "loading") {
    return <LoadingScreen />;
  }

  if (status === "unauthenticated") {
    return <Redirect href="/(auth)/login" />;
  }

  if (user?.role !== "DRIVER") {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
