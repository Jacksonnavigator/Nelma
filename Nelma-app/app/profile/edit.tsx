import { router } from "expo-router";
import { Save } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { Button, Card, Header, Input, Screen } from "../../components";
import { colors } from "../../constants/colors";
import { spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";
import { useAuth } from "../../store/auth-context";
import type { UpdateUserInput } from "../../types/user";
import type { FieldErrors } from "../../utils/validation";
import { hasErrors, validateProfile } from "../../utils/validation";
import { errorMessage } from "../../utils/errors";

export default function EditProfileScreen() {
  const { user, updateProfile } = useAuth();
  const { t } = useTranslation();
  const [form, setForm] = useState<UpdateUserInput>({ fullName: user?.fullName ?? "", phone: user?.phone ?? "", email: user?.email ?? "" });
  const [errors, setErrors] = useState<FieldErrors<UpdateUserInput>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const setField = (key: keyof UpdateUserInput) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    const nextErrors = validateProfile(form);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await updateProfile(form);
      setMessage({ ok: true, text: "Profile updated." });
    } catch (error) {
      setMessage({ ok: false, text: errorMessage(error, "Could not save your details. Please try again.") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Header title="Edit profile" subtitle="Your name and how NELMA can reach you." />
      <Card style={styles.form}>
        <Input label="Full name" value={form.fullName} onChangeText={setField("fullName")} error={errors.fullName} />
        <Input label="Phone" value={form.phone} onChangeText={setField("phone")} keyboardType="phone-pad" error={errors.phone} />
        <Input label="Email" value={form.email ?? ""} onChangeText={setField("email")} autoCapitalize="none" keyboardType="email-address" error={errors.email} />
        {message ? <Text style={[styles.message, message.ok ? null : styles.messageError]}>{t(message.text)}</Text> : null}
        <Button title="Save Changes" icon={Save} onPress={save} loading={saving} />
      </Card>
      <Button title="Back to Profile" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  messageError: { color: colors.danger },
  message: {
    color: colors.success,
    fontSize: typography.small,
    fontWeight: "800"
  }
});
