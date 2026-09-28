import { router } from "expo-router";
import { Trash2 } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button, Card, ConfirmDialog, Header, PasswordInput, Screen } from "../../components";
import { colors } from "../../constants/colors";
import { radius, spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";
import { useAuth } from "../../store/auth-context";
import { errorMessage } from "../../utils/errors";

const consequences = [
  "Your name, phone number, email and saved addresses are removed.",
  "You are signed out and cannot sign in to this account again.",
  "NELMA keeps a record of past orders and payments, without your name or contact details, as sales records require.",
  "You can register again later with the same phone number."
];

export default function DeleteAccountScreen() {
  const { deleteAccount } = useAuth();
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteAccount(password);
      setConfirming(false);
      router.replace("/(auth)/login");
    } catch (caught) {
      setConfirming(false);
      setError(errorMessage(caught, "Could not delete your account. Please try again."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Screen>
      <Header title="Delete my account" subtitle="This cannot be undone." />
      <Card style={styles.card}>
        {consequences.map((line) => (
          <View key={line} style={styles.row}>
            <View style={styles.bullet} />
            <Text style={styles.text}>{t(line)}</Text>
          </View>
        ))}
      </Card>
      <Card style={styles.card}>
        <PasswordInput label="Enter your password to confirm" value={password} onChangeText={(value) => { setError(null); setPassword(value); }} />
        {error ? <Text style={styles.error}>{t(error)}</Text> : null}
        <Button title="Delete my account" icon={Trash2} variant="danger" disabled={!password} onPress={() => setConfirming(true)} />
      </Card>
      <ConfirmDialog
        visible={confirming}
        title="Delete your account?"
        message="Your details are removed and you will be signed out."
        confirmLabel="Delete account"
        destructive
        loading={deleting}
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  row: { flexDirection: "row", gap: spacing.sm },
  bullet: { backgroundColor: colors.danger, borderRadius: 3, height: 6, marginTop: 8, width: 6 },
  text: { color: colors.text, flex: 1, fontFamily: typography.fonts.regular, fontSize: typography.body, lineHeight: typography.lineHeight.body },
  error: {
    backgroundColor: colors.dangerBg,
    borderRadius: radius.md,
    color: colors.danger,
    fontFamily: typography.fonts.semibold,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small,
    padding: spacing.sm
  }
});
