import { router } from "expo-router";
import { CreditCard, HelpCircle, MessageCircle, PackageSearch } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card, Header, Screen } from "../../components";
import { colors } from "../../constants/colors";
import { radius, spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";

const supportItems = [
  { title: "Order problem", body: "Get help with an active or previous order.", icon: PackageSearch, route: "/support/contact" },
  { title: "Payment problem", body: "Ask about failed, pending, or recorded payments.", icon: CreditCard, route: "/support/contact" },
  { title: "General support", body: "Contact NELMA customer care.", icon: MessageCircle, route: "/support/contact" },
  { title: "FAQ", body: "Read common ordering and account answers.", icon: HelpCircle, route: "/support/faq" }
] as const;

export default function SupportScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <Header title="Help & Support" subtitle="Choose the type of help you need." />
      {supportItems.map((item) => {
        const Icon = item.icon;
        return (
          <Pressable key={item.title} accessibilityRole="button" onPress={() => router.push(item.route)} style={({ pressed }) => [styles.item, { opacity: pressed ? 0.75 : 1 }]}> 
            <View style={styles.icon}><Icon color={colors.primary} size={24} /></View>
            <View style={styles.copy}>
              <Text style={styles.title}>{t(item.title)}</Text>
              <Text style={styles.body}>{t(item.body)}</Text>
            </View>
          </Pressable>
        );
      })}
      <Card>
        <Text style={styles.note}>{t("Support information can be supplied dynamically by the FastAPI backend when available.")}</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg
  },
  icon: {
    alignItems: "center",
    backgroundColor: "#EAF2FF",
    borderRadius: radius.pill,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  copy: { flex: 1, gap: spacing.xs },
  title: { color: colors.text, fontSize: typography.body, fontWeight: "900" },
  body: { color: colors.mutedText, fontSize: typography.small, lineHeight: 18 },
  note: { color: colors.mutedText, fontSize: typography.small, lineHeight: 19 }
});
