import { router } from "expo-router";
import { Send } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { Button, Card, Header, Input, Screen } from "../../components";
import { colors } from "../../constants/colors";
import { spacing, typography } from "../../constants/theme";
import { useAuth } from "../../store/auth-context";
import type { ForgotPasswordInput } from "../../types/auth";
import type { FieldErrors } from "../../utils/validation";
import { hasErrors, validateForgotPassword } from "../../utils/validation";

export default function ForgotPasswordScreen() {
  const { forgotPassword } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [errors, setErrors] = useState<FieldErrors<ForgotPasswordInput>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const input = { identifier };
    const nextErrors = validateForgotPassword(input);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      return;
    }
    setSubmitting(true);
    try {
      const result = await forgotPassword(input);
      setMessage(result.message);
      router.push({ pathname: "/(auth)/reset-password", params: { identifier, resetToken: result.resetToken ?? "" } });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <Header title="Reset Password" subtitle="Enter your phone number or email to start verification." />
      <Card style={styles.form}>
        <Input label="Phone or email" value={identifier} onChangeText={setIdentifier} autoCapitalize="none" keyboardType="email-address" error={errors.identifier} />
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <Button title="Continue" icon={Send} onPress={submit} loading={submitting} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg
  },
  message: {
    color: colors.mutedText,
    fontSize: typography.small,
    lineHeight: 18
  }
});
