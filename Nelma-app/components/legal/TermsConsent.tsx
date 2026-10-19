import { Link } from "expo-router";
import { Check, ShieldCheck } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/colors";
import { radius, spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";
import { useTermsConsent } from "../../store/terms-consent";
import { BrandMark } from "../brand/BrandMark";
import { Button } from "../ui/Button";
import { Screen } from "../ui/Screen";

const points = [
  "NELMA is for people aged 18 and over. If you are younger, ask a parent or guardian to use the app with you.",
  "We use your name, phone number and delivery address only to take and deliver your water orders.",
  "We never sell your information, and you can delete your account at any time."
];

// Shown once, before anything else, until the person agrees to the current Terms and Privacy Policy.
export const TermsConsent = () => {
  const { t } = useTranslation();
  const { accept } = useTermsConsent();
  const [agreed, setAgreed] = useState(false);

  return (
    <Screen contentContainerStyle={styles.screen}>
      <View style={styles.hero}>
        <BrandMark />
        <Text style={styles.title}>{t("Before you start")}</Text>
        <Text style={styles.subtitle}>{t("Please read and agree to continue.")}</Text>
      </View>

      <View style={styles.panel}>
        {points.map((point) => (
          <View key={point} style={styles.point}>
            <ShieldCheck color={colors.primary} size={18} />
            <Text style={styles.pointText}>{t(point)}</Text>
          </View>
        ))}
        <Text style={styles.links}>
          {t("Read the full")}{" "}
          <Link href="/legal/terms" style={styles.link}>{t("Terms & Conditions")}</Link>
          {" "}{t("and")}{" "}
          <Link href="/legal/privacy" style={styles.link}>{t("Privacy Policy")}</Link>.
        </Text>
      </View>

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: agreed }}
        onPress={() => setAgreed((value) => !value)}
        style={styles.agreeRow}
      >
        <View style={[styles.box, agreed ? styles.boxOn : null]}>{agreed ? <Check color={colors.white} size={16} strokeWidth={3} /> : null}</View>
        <Text style={styles.agreeText}>
          {t("I am 18 or older, or I have a parent or guardian's permission, and I agree to the Terms & Conditions and Privacy Policy.")}
        </Text>
      </Pressable>

      <Button title="Agree and continue" onPress={() => void accept()} disabled={!agreed} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: { justifyContent: "center", gap: spacing.lg },
  hero: { alignItems: "center", gap: spacing.sm },
  title: { color: colors.text, fontFamily: typography.fonts.bold, fontSize: typography.h1, lineHeight: typography.lineHeight.h1, marginTop: spacing.sm, textAlign: "center" },
  subtitle: { color: colors.mutedText, fontFamily: typography.fonts.regular, fontSize: typography.body, lineHeight: typography.lineHeight.body, textAlign: "center" },
  panel: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.xl, borderWidth: 1, gap: spacing.md, padding: spacing.lg },
  point: { flexDirection: "row", gap: spacing.sm },
  pointText: { flex: 1, color: colors.text, fontFamily: typography.fonts.regular, fontSize: typography.body, lineHeight: typography.lineHeight.body },
  links: { color: colors.mutedText, fontFamily: typography.fonts.regular, fontSize: typography.small, lineHeight: typography.lineHeight.small },
  link: { color: colors.primary, fontFamily: typography.fonts.semibold },
  agreeRow: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  box: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: colors.primary, alignItems: "center", justifyContent: "center", marginTop: 1 },
  boxOn: { backgroundColor: colors.primary },
  agreeText: { flex: 1, color: colors.text, fontFamily: typography.fonts.medium, fontSize: typography.small, lineHeight: typography.lineHeight.small }
});
