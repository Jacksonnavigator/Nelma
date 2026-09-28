import { Link, router } from "expo-router";
import { LogIn } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { BrandMark, Button, Input, PasswordInput, Screen } from "../../components";
import { colors } from "../../constants/colors";
import { radius, spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";
import { haptics } from "../../services/haptics";
import { useAuth } from "../../store/auth-context";
import { mobileLandingForUser } from "../../utils/role-routing";
import type { FieldErrors } from "../../utils/validation";
import { hasErrors, validateLogin } from "../../utils/validation";

export default function LoginScreen() {
  const { login, error } = useAuth();
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors<{ identifier: string; password: string }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submit = async () => {
    const input = { identifier, password };
    const nextErrors = validateLogin(input);
    setErrors(nextErrors);
    setSubmitError(Object.values(nextErrors).find(Boolean) ?? null);
    if (hasErrors(nextErrors)) {
      haptics.light();
      return;
    }
    setSubmitting(true);
    try {
      const nextUser = await login(input);
      haptics.success();
      router.replace(mobileLandingForUser(nextUser));
    } catch {
      haptics.light();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen contentContainerStyle={styles.screen}>
      <View style={styles.hero}>
        <BrandMark />
        <View style={styles.heroCopy}>
          <Text style={styles.title}>{t("Welcome back")}</Text>
        </View>
      </View>

      <View style={styles.form}>
        <Input label={t("Phone or email")} value={identifier} onChangeText={setIdentifier} autoCapitalize="none" keyboardType="email-address" error={errors.identifier ? t(errors.identifier) : undefined} />
        <PasswordInput label={t("Password")} value={password} onChangeText={setPassword} error={errors.password ? t(errors.password) : undefined} />
        {submitError || error ? <Text accessibilityRole="alert" style={styles.error}>{t(submitError || error || "")}</Text> : null}
        <Button title="Sign In" icon={LogIn} onPress={submit} loading={submitting} />
        <Link href="/(auth)/forgot-password" style={styles.link}>{t("Forgot password?")}</Link>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>{t("New to NELMA?")}</Text>
        <Link href="/(auth)/register" style={styles.footerLink}>{t("Create account")}</Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: "center"
  },
  hero: {
    alignItems: "center",
    gap: spacing.lg,
    paddingBottom: spacing.md
  },
  heroCopy: {
    gap: spacing.sm
  },
  title: {
    color: colors.text,
    fontFamily: typography.fonts.bold,
    fontSize: typography.h1,
    lineHeight: typography.lineHeight.h1,
    textAlign: "center"
  },
  subtitle: {
    color: colors.mutedText,
    fontFamily: typography.fonts.regular,
    fontSize: typography.body,
    lineHeight: typography.lineHeight.body,
    textAlign: "center"
  },
  form: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg
  },
  error: {
    backgroundColor: colors.dangerBg,
    borderRadius: radius.md,
    color: colors.danger,
    fontFamily: typography.fonts.bold,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small,
    padding: spacing.md
  },
  link: {
    color: colors.primary,
    fontFamily: typography.fonts.bold,
    fontSize: typography.body,
    lineHeight: typography.lineHeight.body,
    textAlign: "center"
  },
  footerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center"
  },
  footerText: {
    color: colors.mutedText,
    fontFamily: typography.fonts.regular,
    fontSize: typography.body,
    lineHeight: typography.lineHeight.body
  },
  footerLink: {
    color: colors.primary,
    fontFamily: typography.fonts.bold,
    fontSize: typography.body,
    lineHeight: typography.lineHeight.body
  }
});
