import { Redirect, Stack } from "expo-router";
import { LoadingScreen } from "../../components";
import { useAuth } from "../../store/auth-context";
import { mobileLandingForUser } from "../../utils/role-routing";

export default function AuthLayout() {
  const { status, user } = useAuth();

  if (status === "loading") {
    return <LoadingScreen />;
  }

  if (status === "authenticated") {
    return <Redirect href={mobileLandingForUser(user)} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
