import { LockKeyhole } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { Button, Card, Header, Input, Screen } from "../../components";
import { colors } from "../../constants/colors";
import { spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";
import { useAuth } from "../../store/auth-context";
import type { ChangePasswordInput } from "../../types/auth";
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
  const [message, setMessage] = useState<string | null>(null);

  const setField = (key: keyof ChangePasswordInput) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

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
      setMessage("Security settings updated.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Header title="Security" subtitle="Change your password without storing it on this device." />
      <Card style={styles.form}>
        <Input label="Current password" value={form.currentPassword} onChangeText={setField("currentPassword")} secureTextEntry error={errors.currentPassword} />
        <Input label="New password" value={form.newPassword} onChangeText={setField("newPassword")} secureTextEntry error={errors.newPassword} />
        <Input label="Confirm new password" value={form.confirmPassword} onChangeText={setField("confirmPassword")} secureTextEntry error={errors.confirmPassword} />
        {message ? <Text style={styles.message}>{t(message)}</Text> : null}
        <Button title="Update Password" icon={LockKeyhole} onPress={save} loading={saving} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  message: {
    color: colors.success,
    fontSize: typography.small,
    fontWeight: "800"
  }
});
