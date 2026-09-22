import { StyleSheet, Text } from "react-native";
import { Card, Header, Screen } from "../../components";
import { colors } from "../../constants/colors";
import { spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";

const faqs = [
  {
    question: "What products can I order?",
    answer: "NELMA supports first-time 20-liter purchases and 20-liter refills."
  },
  {
    question: "How are totals calculated?",
    answer: "Totals are calculated from the official pricing configuration, delivery charge rules, and the selected quantity."
  },
  {
    question: "When is an order successful?",
    answer: "The app shows confirmation only after the order repository receives a successful response."
  },
  {
    question: "Can I reorder?",
    answer: "Eligible previous orders can be reordered using the current official NELMA pricing."
  }
];

export default function FaqScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <Header title="FAQ" subtitle="Common NELMA customer questions." />
      {faqs.map((item) => (
        <Card key={item.question} style={styles.card}>
          <Text style={styles.question}>{t(item.question)}</Text>
          <Text style={styles.answer}>{t(item.answer)}</Text>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  question: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  answer: {
    color: colors.mutedText,
    fontSize: typography.body,
    lineHeight: 22
  }
});
