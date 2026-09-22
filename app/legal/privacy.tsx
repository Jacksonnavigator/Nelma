import { StyleSheet, Text } from "react-native";
import { Card, Header, Screen } from "../../components";
import { colors } from "../../constants/colors";
import { spacing, typography } from "../../constants/theme";

export default function PrivacyScreen() {
  return (
    <Screen>
      <Header title="Privacy Policy" subtitle="Placeholder pending official legal review." />
      <Card style={styles.card}>
        <Text style={styles.heading}>Privacy content placeholder</Text>
        <Text style={styles.body}>NELMA has not supplied final Privacy Policy text yet. Replace this placeholder with approved legal content before production release.</Text>
        <Text style={styles.body}>The app stores authentication tokens in Expo SecureStore and does not store plaintext passwords or payment provider secrets.</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  heading: { color: colors.text, fontSize: typography.h3, fontWeight: "900" },
  body: { color: colors.mutedText, fontSize: typography.body, lineHeight: 23 }
});
