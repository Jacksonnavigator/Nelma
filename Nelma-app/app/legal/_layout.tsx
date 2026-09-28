import { Stack } from "expo-router";

// Terms, privacy and about are readable before signing up, so this stack has no sign-in guard.
export default function LegalLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
