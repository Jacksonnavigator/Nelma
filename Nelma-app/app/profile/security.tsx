import { router } from "expo-router";
import { ChevronRight, LockKeyhole, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Button, Card, Header, PasswordInput, Screen } from "../../components";
import { colors } from "../../constants/colors";
import { radius, spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";
import { useAuth } from "../../store/auth-context";
import type { ChangePasswordInput } from "../../types/auth";
import { errorMessage } from "../../utils/errors";
import type { FieldErrors } from "../../utils/validation";
import { hasErrors, validatePasswordChange } from "../../utils/validation";

const initialForm: ChangePasswordInput = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: ""
};

export default function SecurityScreen() {
  const { changePassword } = useAuth();
  const { t } = useTranslation();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<FieldErrors<ChangePasswordInput>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const setField = (key: keyof ChangePasswordInput) => (value: string) => {
    setMessage(null);
    setForm((current) => ({ ...current, [key]: value }));
  };

  const save = async () => {
    const nextErrors = validatePasswordChange(form);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      return;
    }
    setSaving(true);
    try {
      await changePassword(form);
      setForm(initialForm);
      setMessage({ ok: true, text: "Password changed. Other phones signed in to your account have been signed out." });
    } catch (error) {
      setMessage({ ok: false, text: errorMessage(error, "Could not change your password. Please try again.") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Header title="Password & security" subtitle="Choose a password only you know." />
      <Card style={styles.form}>
        <PasswordInput label="Current password" value={form.currentPassword} onChangeText={setField("currentPassword")} error={errors.currentPassword} />
        <PasswordInput label="New password" value={form.newPassword} onChangeText={setField("newPassword")} error={errors.newPassword} />
        <PasswordInput label="Confirm new password" value={form.confirmPassword} onChangeText={setField("confirmPassword")} error={errors.confirmPassword} />
        {message ? <Text style={[styles.message, message.ok ? styles.ok : styles.bad]}>{t(message.text)}</Text> : null}
        <Button title="Update Password" icon={LockKeyhole} onPress={save} loading={saving} />
      </Card>

      <Pressable accessibilityRole="button" onPress={() => router.push("/profile/delete-account")} style={({ pressed }) => [styles.danger, { opacity: pressed ? 0.75 : 1 }]}>
        <View style={styles.dangerIcon}>
          <Trash2 color={colors.danger} size={18} strokeWidth={2.3} />
        </View>
        <View style={styles.dangerCopy}>
          <Text style={styles.dangerTitle}>{t("Delete my account")}</Text>
          <Text style={styles.dangerText}>{t("Close your NELMA account and remove your details.")}</Text>
        </View>
        <ChevronRight color={colors.subtleText} size={18} />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  message: { borderRadius: radius.md, fontFamily: typography.fonts.semibold, fontSize: typography.small, lineHeight: typography.lineHeight.small, padding: spacing.sm },
  ok: { backgroundColor: colors.surfaceMint, color: "#237A52" },
  bad: { backgroundColor: colors.dangerBg, color: colors.danger },
  danger: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md
  },
  dangerIcon: { alignItems: "center", backgroundColor: colors.dangerBg, borderRadius: 10, height: 36, justifyContent: "center", width: 36 },
  dangerCopy: { flex: 1, gap: 2 },
  dangerTitle: { color: colors.danger, fontFamily: typography.fonts.bold, fontSize: typography.body, lineHeight: 20 },
  dangerText: { color: colors.mutedText, fontFamily: typography.fonts.regular, fontSize: typography.small, lineHeight: typography.lineHeight.small }
});
