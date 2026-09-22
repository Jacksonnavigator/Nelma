import { router } from "expo-router";
import { ArrowLeft, LockKeyhole } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppTopBar, Button, Card, Header, Input, Screen } from "../../../components";
import { colors } from "../../../constants/colors";
import { spacing, typography } from "../../../constants/theme";
import { useTranslation } from "../../../hooks/use-translation";
import { useAuth } from "../../../store/auth-context";
import type { ChangePasswordInput } from "../../../types/auth";
import type { FieldErrors } from "../../../utils/validation";
import { hasErrors, validatePasswordChange } from "../../../utils/validation";

const initialForm: ChangePasswordInput = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: ""
};

export default function DriverSecurityScreen() {
  const { changePassword } = useAuth();
  const { t } = useTranslation();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<FieldErrors<ChangePasswordInput>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const setField = (key: keyof ChangePasswordInput) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    const nextErrors = validatePasswordChange(form);
    setErrors(nextErrors);
    setMessage(null);
    setSaveError(null);
    if (hasErrors(nextErrors)) {
      return;
    }
    setSaving(true);
    try {
      await changePassword(form);
      setForm(initialForm);
      setMessage("Security settings updated.");
    } catch (caught) {
      setSaveError(typeof (caught as { message?: unknown }).message === "string" ? String((caught as { message: string }).message) : "Unable to update security right now.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen contentContainerStyle={styles.screen} keyboard padded={false} scroll={false} style={styles.safe}>
      <AppTopBar />
      <View style={styles.localHeader}>
        <Pressable accessibilityLabel={t("Back to Profile")} accessibilityRole="button" onPress={() => router.back()} style={styles.headerIconButton}>
          <ArrowLeft size={22} color={colors.black} />
        </Pressable>
        <Text style={styles.headerTitle}>{t("Security")}</Text>
        <View style={styles.headerIconButton} />
      </View>

      <View style={styles.content}>
        <Header title="Security" subtitle="Change your password without storing it on this device." />
        <Card style={styles.form}>
          <Input label="Current password" value={form.currentPassword} onChangeText={setField("currentPassword")} secureTextEntry error={errors.currentPassword} />
          <Input label="New password" value={form.newPassword} onChangeText={setField("newPassword")} secureTextEntry error={errors.newPassword} />
          <Input label="Confirm new password" value={form.confirmPassword} onChangeText={setField("confirmPassword")} secureTextEntry error={errors.confirmPassword} />
          {message ? <Text style={styles.message}>{t(message)}</Text> : null}
          {saveError ? <Text style={styles.error}>{t(saveError)}</Text> : null}
          <Button title="Update Password" icon={LockKeyhole} onPress={save} loading={saving} />
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.white },
  screen: { backgroundColor: colors.white, flex: 1 },
  localHeader: {
    alignItems: "center",
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  headerIconButton: {
    alignItems: "center",
    height: 42,
    justifyContent: "center",
    width: 42
  },
  headerTitle: {
    color: colors.black,
    flex: 1,
    fontFamily: typography.fonts.bold,
    fontSize: 17,
    lineHeight: 23,
    textAlign: "center"
  },
  content: {
    flex: 1,
    gap: spacing.lg,
    padding: spacing.lg
  },
  form: { gap: spacing.lg },
  message: {
    color: colors.success,
    fontFamily: typography.fonts.bold,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small
  },
  error: {
    backgroundColor: colors.dangerBg,
    borderRadius: 12,
    color: colors.danger,
    fontFamily: typography.fonts.bold,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small,
    padding: spacing.md
  }
});