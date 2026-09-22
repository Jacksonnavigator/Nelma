import { router } from "expo-router";
import { ArrowLeft, Save } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppTopBar, Button, Card, Header, Input, Screen } from "../../../components";
import { colors } from "../../../constants/colors";
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
      <AppTopBar />
      <View style={styles.localHeader}>
        <Pressable accessibilityLabel={t("Back to Profile")} accessibilityRole="button" onPress={() => router.back()} style={styles.headerIconButton}>
          <ArrowLeft size={22} color={colors.black} />
        </Pressable>
        <Text style={styles.headerTitle}>{t("Personal Info")}</Text>
        <View style={styles.headerIconButton} />
      </View>

      <View style={styles.content}>
        <Header title="Personal Info" subtitle="Update driver contact details NELMA is allowed to keep in-app." />
        <Card style={styles.form}>
          <Input label="Full name" value={form.fullName} onChangeText={setField("fullName")} error={errors.fullName} />
          <Input label="Phone" value={form.phone} onChangeText={setField("phone")} keyboardType="phone-pad" error={errors.phone} />
          <Input label="Email" value={form.email ?? ""} onChangeText={setField("email")} autoCapitalize="none" keyboardType="email-address" error={errors.email} />
          {message ? <Text style={styles.message}>{t(message)}</Text> : null}
          {saveError ? <Text style={styles.error}>{t(saveError)}</Text> : null}
          <Button title="Save Changes" icon={Save} onPress={save} loading={saving} />
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