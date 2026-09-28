import { router } from "expo-router";
import { Check, ShieldCheck } from "lucide-react-native";
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

// Mirrors validatePasswordChange so the driver sees each rule tick off while typing.
const rules: Array<{ label: string; test: (form: ChangePasswordInput) => boolean }> = [
  { label: "At least 8 characters", test: (form) => form.newPassword.length >= 8 },
  { label: "Both new passwords match", test: (form) => form.newPassword.length > 0 && form.newPassword === form.confirmPassword }
];

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
        <View style={styles.intro}>
          <View style={styles.shield}><ShieldCheck color={driverTheme.mintText} size={24} /></View>
          <Text style={styles.introText}>{t("Only you should know this password. Dispatch will never ask for it.")}</Text>
        </View>
        <Sheet style={styles.form}>
          <Input label="Current password" value={form.currentPassword} onChangeText={setField("currentPassword")} secureTextEntry error={errors.currentPassword} />
          <Input label="New password" value={form.newPassword} onChangeText={setField("newPassword")} secureTextEntry error={errors.newPassword} />
          <Input label="Confirm new password" value={form.confirmPassword} onChangeText={setField("confirmPassword")} secureTextEntry error={errors.confirmPassword} />
          <View style={styles.rules}>
            {rules.map((rule) => {
              const met = rule.test(form);
              return (
                <View key={rule.label} style={styles.rule}>
                  <View style={[styles.ruleMark, met ? styles.ruleMarkMet : null]}>{met ? <Check color={colors.white} size={11} strokeWidth={3.2} /> : null}</View>
                  <Text style={[styles.ruleText, met ? styles.ruleTextMet : null]}>{t(rule.label)}</Text>
                </View>
              );
            })}
          </View>
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
  intro: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: -spacing.xs },
  shield: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: driverTheme.mintBg },
  introText: { flex: 1, color: colors.text, fontFamily: typography.fonts.regular, fontSize: 14, lineHeight: 20 },
  form: { gap: spacing.md, padding: spacing.md },
  rules: { gap: spacing.xs, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: driverTheme.aquaLine },
  rule: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  ruleMark: { width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: colors.border },
  ruleMarkMet: { backgroundColor: driverTheme.mintText, borderColor: driverTheme.mintText },
  ruleText: { color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: 13, lineHeight: 18 },
  ruleTextMet: { color: driverTheme.mintText },
  message: { color: colors.success, fontFamily: typography.fonts.semibold, fontSize: 14, lineHeight: 20 },
  error: { color: colors.danger, fontFamily: typography.fonts.medium, fontSize: 14, lineHeight: 20 }
});
