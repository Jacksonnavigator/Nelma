import { Redirect, Stack } from "expo-router";
import { LoadingScreen } from "../../components";
import { useAuth } from "../../store/auth-context";

export default function ProfileLayout() {
  const { status, user } = useAuth();
  if (status === "loading") {
    return <LoadingScreen />;
  }
  if (status === "unauthenticated") {
    return <Redirect href="/(auth)/login" />;
  }
  if (user?.role === "DRIVER") {
    return <Redirect href="/driver/(tabs)/profile" />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}