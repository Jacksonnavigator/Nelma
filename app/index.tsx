import { Redirect } from "expo-router";
import { LoadingScreen } from "../components";
import { useAuth } from "../store/auth-context";
import { mobileLandingForUser } from "../utils/role-routing";

export default function Index() {
  const { status, user } = useAuth();

  if (status === "loading") {
    return <LoadingScreen message="Preparing NELMA" />;
  }

  return <Redirect href={status === "authenticated" ? mobileLandingForUser(user) : "/(auth)/login"} />;
}
