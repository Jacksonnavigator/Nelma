import { ChevronDown } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Header, Screen } from "../../components";
import { colors } from "../../constants/colors";
import { radius, spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";

const faqs = [
  {
    question: "What can I order?",
    answer: "Everything on the Home screen: a new 20L bottle with water for your first order, refills for a NELMA bottle you already have, and any other products NELMA adds."
  },
  {
    question: "How much is delivery?",
    answer: "It depends on where you are. The delivery fee is shown on the address step and included in the total before you confirm."
  },
  {
    question: "How do I pay?",
    answer: "Pay cash to the driver when your water arrives. Please have the exact amount ready if you can."
  },
  {
    question: "When will my water arrive?",
    answer: "Choose the day and time window when you order. You can follow your order in Orders and we send you an update when it is on the way."
  },
  {
    question: "Can I cancel an order?",
    answer: "Yes, from the order screen, until NELMA starts preparing it. After that, message us from the order or contact support."
  },
  {
    question: "What does \"Confirm received\" mean?",
    answer: "After the driver hands over your water, confirm in the app that you got it. This closes the order and helps us make sure every delivery is complete."
  },
  {
    question: "How do I order the same thing again?",
    answer: "Tap Order again on the Home screen. It uses today's prices."
  },
  {
    question: "How do I change my address or phone number?",
    answer: "Go to Profile. Saved addresses holds your delivery places, and Edit profile changes your name, phone number and email."
  }
];

export default function FaqScreen() {
  const { t } = useTranslation();
  const [open, setOpen] = useState<string | null>(faqs[0].question);
  return (
    <Screen>
      <Header title="Questions & answers" subtitle="Quick answers about ordering with NELMA." />
      <View style={styles.list}>
        {faqs.map((item, index) => {
          const expanded = open === item.question;
          return (
            <Pressable
              key={item.question}
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              onPress={() => setOpen(expanded ? null : item.question)}
              style={[styles.item, index > 0 ? styles.divider : null]}
            >
              <View style={styles.row}>
                <Text style={styles.question}>{t(item.question)}</Text>
                <ChevronDown color={colors.subtleText} size={18} style={expanded ? styles.flip : undefined} />
              </View>
              {expanded ? <Text style={styles.answer}>{t(item.answer)}</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, overflow: "hidden" },
  item: { gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  divider: { borderTopColor: colors.line, borderTopWidth: 1 },
  row: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  question: { color: colors.text, flex: 1, fontFamily: typography.fonts.semibold, fontSize: typography.body, lineHeight: 21 },
  answer: { color: colors.mutedText, fontFamily: typography.fonts.regular, fontSize: 14, lineHeight: 21 },
  flip: { transform: [{ rotate: "180deg" }] }
});
