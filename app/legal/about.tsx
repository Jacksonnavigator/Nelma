import { StyleSheet, Text, View } from "react-native";
import { BrandMark, Card, Header, Screen } from "../../components";
import { colors } from "../../constants/colors";
import { radius, spacing, typography } from "../../constants/theme";

export default function AboutScreen() {
  return (
    <Screen>
      <Header title="About NELMA" subtitle="NELMA Drinking Water customer application." />
      <Card style={styles.card}>
        <View style={styles.mark}><BrandMark /></View>
        <Text style={styles.title}>NELMA Drinking Water</Text>
        <Text style={styles.body}>Placeholder pending official NELMA business profile content. This screen is prepared for verified company information from the backend or approved content source.</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: "center", gap: spacing.md },
  mark: {
    alignItems: "center",
    backgroundColor: "#EAF2FF",
    borderRadius: radius.pill,
    height: 72,
    justifyContent: "center",
    width: 72
  },
  title: { color: colors.primary, fontSize: typography.h2, fontWeight: "900", textAlign: "center" },
  body: { color: colors.mutedText, fontSize: typography.body, lineHeight: 23, textAlign: "center" }
});
