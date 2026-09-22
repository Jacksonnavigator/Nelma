import { StyleSheet, Text } from "react-native";
import { Card, Header, Screen } from "../../components";
import { colors } from "../../constants/colors";
import { spacing, typography } from "../../constants/theme";

export default function TermsScreen() {
  return (
    <Screen>
      <Header title="Terms & Conditions" subtitle="Placeholder pending official legal review." />
      <Card style={styles.card}>
        <Text style={styles.heading}>Legal content placeholder</Text>
        <Text style={styles.body}>NELMA has not supplied final Terms & Conditions text yet. Replace this placeholder with approved legal content before production release.</Text>
        <Text style={styles.body}>The application architecture keeps this content isolated so it can later be served by the backend or updated through an approved release.</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  heading: { color: colors.text, fontSize: typography.h3, fontWeight: "900" },
  body: { color: colors.mutedText, fontSize: typography.body, lineHeight: 23 }
});
