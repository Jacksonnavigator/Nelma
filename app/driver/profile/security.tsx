import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, DriverTitle, Input, Screen, Sheet, SkyBackdrop } from "../../../components";
import { colors } from "../../../constants/colors";
import { driverTheme } from "../../../constants/driver-theme";
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
      <SkyBackdrop />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <DriverTitle title={t("Change password")} backLabel="Back to Profile" onBack={() => router.back()} />
        <Sheet style={styles.form}>
          <Input label="Current password" value={form.currentPassword} onChangeText={setField("currentPassword")} secureTextEntry error={errors.currentPassword} />
          <Input label="New password" value={form.newPassword} onChangeText={setField("newPassword")} secureTextEntry error={errors.newPassword} />
          <Input label="Confirm new password" value={form.confirmPassword} onChangeText={setField("confirmPassword")} secureTextEntry error={errors.confirmPassword} />
        </Sheet>
        {message ? <Text style={styles.message}>{t(message)}</Text> : null}
        {saveError ? <Text accessibilityRole="alert" style={styles.error}>{t(saveError)}</Text> : null}
        <Button title="Update Password" onPress={save} loading={saving} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: driverTheme.pageBg },
  screen: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.lg },
  form: { gap: spacing.md, padding: spacing.md },
  message: { color: colors.success, fontFamily: typography.fonts.semibold, fontSize: 14, lineHeight: 20 },
  error: { color: colors.danger, fontFamily: typography.fonts.medium, fontSize: 14, lineHeight: 20 }
});
