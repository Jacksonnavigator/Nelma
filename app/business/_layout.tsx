import { Redirect } from "expo-router";
import { LoadingScreen } from "../../components";
import { useAuth } from "../../store/auth-context";
import { mobileLandingForUser } from "../../utils/role-routing";

export default function BusinessLayout() {
  const { status, user } = useAuth();
  if (status === "loading") {
    return <LoadingScreen />;
  }
  if (status === "unauthenticated") {
    return <Redirect href="/(auth)/login" />;
  }
  return <Redirect href={mobileLandingForUser(user)} />;
}
