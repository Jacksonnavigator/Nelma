import { router, useLocalSearchParams } from "expo-router";
import { LockKeyhole } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { Button, Card, Header, Input, Screen } from "../../components";
import { colors } from "../../constants/colors";
import { spacing, typography } from "../../constants/theme";
import { useAuth } from "../../store/auth-context";
import type { ResetPasswordInput } from "../../types/auth";
import type { FieldErrors } from "../../utils/validation";
import { hasErrors, validateResetPassword } from "../../utils/validation";

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ identifier?: string; resetToken?: string }>();
  const { resetPassword } = useAuth();
  const [form, setForm] = useState<ResetPasswordInput>({
    identifier: params.identifier ?? "",
    resetToken: params.resetToken ?? "",
    newPassword: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState<FieldErrors<ResetPasswordInput>>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const setField = (key: keyof ResetPasswordInput) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    const nextErrors = validateResetPassword(form);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(form);
      setMessage("Password updated. You can sign in with your new password.");
      router.replace("/(auth)/login");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <Header title="New Password" subtitle="Complete verification and choose a new password." />
      <Card style={styles.form}>
        <Input label="Phone or email" value={form.identifier} onChangeText={setField("identifier")} autoCapitalize="none" error={errors.identifier} />
        <Input label="Verification code" value={form.resetToken} onChangeText={setField("resetToken")} error={errors.resetToken} />
        <Input label="New password" value={form.newPassword} onChangeText={setField("newPassword")} secureTextEntry error={errors.newPassword} />
        <Input label="Confirm password" value={form.confirmPassword} onChangeText={setField("confirmPassword")} secureTextEntry error={errors.confirmPassword} />
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <Button title="Update Password" icon={LockKeyhole} onPress={submit} loading={submitting} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg
  },
  message: {
    color: colors.success,
    fontSize: typography.small,
    fontWeight: "800"
  }
});
