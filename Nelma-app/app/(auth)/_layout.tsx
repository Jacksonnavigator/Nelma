import { Redirect, Stack } from "expo-router";
import { LoadingScreen } from "../../components";
import { TermsConsent } from "../../components/legal/TermsConsent";
import { useAuth } from "../../store/auth-context";
import { useTermsConsent } from "../../store/terms-consent";
import { mobileLandingForUser } from "../../utils/role-routing";

export default function AuthLayout() {
  const { status, user } = useAuth();
  const consent = useTermsConsent();

  if (status === "loading" || consent.status === "loading") {
    return <LoadingScreen />;
  }

  if (status === "authenticated") {
    return <Redirect href={mobileLandingForUser(user)} />;
  }

  // Covers deep links straight to sign-in or register, and signing in again after the terms change.
  if (consent.status === "needed") {
    return <TermsConsent />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
