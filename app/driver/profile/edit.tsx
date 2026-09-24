import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, DriverTitle, Input, Screen, Sheet, SkyBackdrop } from "../../../components";
import { colors } from "../../../constants/colors";
import { driverTheme } from "../../../constants/driver-theme";
import { spacing, typography } from "../../../constants/theme";
import { useTranslation } from "../../../hooks/use-translation";
import { useAuth } from "../../../store/auth-context";
import type { UpdateUserInput } from "../../../types/user";
import type { FieldErrors } from "../../../utils/validation";
import { hasErrors, validateProfile } from "../../../utils/validation";

export default function DriverEditProfileScreen() {
  const { user, updateProfile } = useAuth();
  const { t } = useTranslation();
  const [form, setForm] = useState<UpdateUserInput>({ fullName: user?.fullName ?? "", phone: user?.phone ?? "", email: user?.email ?? "" });
  const [errors, setErrors] = useState<FieldErrors<UpdateUserInput>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const setField = (key: keyof UpdateUserInput) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    const nextErrors = validateProfile(form);
    setErrors(nextErrors);
    setMessage(null);
    setSaveError(null);
    if (hasErrors(nextErrors)) {
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ fullName: form.fullName, phone: form.phone, email: form.email });
      setMessage("Profile updated.");
    } catch (caught) {
      setSaveError(typeof (caught as { message?: unknown }).message === "string" ? String((caught as { message: string }).message) : "Unable to update profile right now.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen contentContainerStyle={styles.screen} keyboard padded={false} scroll={false} style={styles.safe}>
      <SkyBackdrop />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <DriverTitle title={t("Personal Info")} backLabel="Back to Profile" onBack={() => router.back()} />
        <Sheet style={styles.form}>
          <Input label="Full name" value={form.fullName} onChangeText={setField("fullName")} error={errors.fullName} />
          <Input label="Phone" value={form.phone} onChangeText={setField("phone")} keyboardType="phone-pad" error={errors.phone} />
          <Input label="Email" value={form.email ?? ""} onChangeText={setField("email")} autoCapitalize="none" keyboardType="email-address" error={errors.email} />
        </Sheet>
        {message ? <Text style={styles.message}>{t(message)}</Text> : null}
        {saveError ? <Text accessibilityRole="alert" style={styles.error}>{t(saveError)}</Text> : null}
        <Button title="Save Changes" onPress={save} loading={saving} />
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
