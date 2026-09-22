import { Redirect, router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Button, LoadingScreen, Screen } from "../components";
import { colors } from "../constants/colors";
import { spacing, typography } from "../constants/theme";
import { useTranslation } from "../hooks/use-translation";
import { useAuth } from "../store/auth-context";

export default function CheckoutScreen() {
  const { status, user } = useAuth();
  const { t } = useTranslation();

  if (status === "loading") {
    return <LoadingScreen />;
  }
  if (status === "unauthenticated") {
    return <Redirect href="/(auth)/login" />;
  }
  if (user?.role === "DRIVER") {
    return <Redirect href="/driver/(tabs)/deliveries" />;
  }

  return (
    <Screen padded={false} scroll={false}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={t("Go Back")} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t("Checkout")}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{t("Use the NELMA order flow")}</Text>
        <Text style={styles.body}>{t("Choose product, quantity, delivery pin, delivery time, payment method, then review the final charge before submitting.")}</Text>
        <Button title="Order NELMA Water" onPress={() => router.replace("/(tabs)/home")} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md
  },
  headerTitle: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: "700"
  },
  headerSpacer: {
    width: 24
  },
  content: {
    flex: 1,
    gap: spacing.lg,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl
  },
  title: {
    color: colors.text,
    fontFamily: typography.fonts.bold,
    fontSize: typography.h2,
    lineHeight: typography.lineHeight.h2,
    textAlign: "center"
  },
  body: {
    color: colors.mutedText,
    fontFamily: typography.fonts.regular,
    fontSize: typography.body,
    lineHeight: typography.lineHeight.body,
    textAlign: "center"
  }
});
