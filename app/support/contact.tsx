import { Mail, MessageCircle, Phone } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { Button, Card, Header, Input, Screen } from "../../components";
import { appConfig } from "../../config/app";
import { colors } from "../../constants/colors";
import { radius, spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";

export default function ContactScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <Header title="Contact NELMA" subtitle="Send details to customer support when the backend support endpoint is connected." />
      <Card style={styles.quickCard}>
        <View style={styles.quickRow}><Phone color={colors.primary} size={20} /><Text style={styles.quickText}>{appConfig.supportPhone}</Text></View>
        <View style={styles.quickRow}><Mail color={colors.primary} size={20} /><Text style={styles.quickText}>{appConfig.supportEmail}</Text></View>
      </Card>
      <Card style={styles.form}>
        <Input label="Subject" placeholder="Order, payment, or account issue" editable={false} />
        <Input label="Message" placeholder="Support message will be submitted through the backend endpoint." editable={false} multiline style={styles.messageInput} />
        <Button title="Submit Support Request" icon={MessageCircle} disabled />
        <Text style={styles.note}>{t("The form is intentionally disabled until NELMA provides the production support endpoint.")}</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  quickCard: { gap: spacing.md },
  quickRow: { alignItems: "center", flexDirection: "row", gap: spacing.md },
  quickText: { color: colors.text, fontSize: typography.body, fontWeight: "800" },
  form: { gap: spacing.lg },
  messageInput: { minHeight: 96, textAlignVertical: "top" },
  note: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    color: colors.mutedText,
    fontSize: typography.small,
    lineHeight: 19,
    padding: spacing.md
  }
});
