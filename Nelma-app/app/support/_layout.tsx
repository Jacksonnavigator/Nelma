import { Redirect, Stack } from "expo-router";
import { LoadingScreen } from "../../components";
import { useAuth } from "../../store/auth-context";

export default function SupportLayout() {
  const { status } = useAuth();
  if (status === "loading") {
    return <LoadingScreen />;
  }
  if (status === "unauthenticated") {
    return <Redirect href="/(auth)/login" />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}
