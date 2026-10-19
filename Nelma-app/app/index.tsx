import { Redirect } from "expo-router";
import { LoadingScreen } from "../components";
import { TermsConsent } from "../components/legal/TermsConsent";
import { useAuth } from "../store/auth-context";
import { useTermsConsent } from "../store/terms-consent";
import { mobileLandingForUser } from "../utils/role-routing";

export default function Index() {
  const { status, user } = useAuth();
  const consent = useTermsConsent();

  if (status === "loading" || consent.status === "loading") {
    return <LoadingScreen message="Preparing NELMA" />;
  }

  // Nobody gets past the first screen, signed in or not, until they have agreed to the current terms.
  if (consent.status === "needed") {
    return <TermsConsent />;
  }

  return <Redirect href={status === "authenticated" ? mobileLandingForUser(user) : "/(auth)/login"} />;
}
