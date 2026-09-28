import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/colors";
import { spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";
import { Screen } from "../ui/Screen";

export type LegalSection = { heading: string; paragraphs: string[] };

type LegalDocumentProps = {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

// A plain, readable page for the terms, privacy notice and similar documents.
export const LegalDocument = ({ title, updated, intro, sections }: LegalDocumentProps) => {
  const { t } = useTranslation();
  return (
    <Screen>
      <Pressable accessibilityRole="button" accessibilityLabel={t("Go back")} hitSlop={8} onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} style={styles.back}>
        <ArrowLeft color={colors.text} size={20} />
      </Pressable>
      <Text style={styles.title}>{t(title)}</Text>
      <Text style={styles.updated}>{t("Last updated")} {updated}</Text>
      <Text style={styles.intro}>{t(intro)}</Text>
      {sections.map((section, index) => (
        <View key={section.heading} style={styles.section}>
          <Text style={styles.heading}>
            {index + 1}. {t(section.heading)}
          </Text>
          {section.paragraphs.map((paragraph) => (
            <Text key={paragraph} style={styles.body}>{t(paragraph)}</Text>
          ))}
        </View>
      ))}
    </Screen>
  );
};

const styles = StyleSheet.create({
  back: { alignItems: "center", height: 36, justifyContent: "center", width: 36 },
  title: { color: colors.ink, fontFamily: typography.fonts.bold, fontSize: 24, letterSpacing: -0.3, lineHeight: 30 },
  updated: { color: colors.subtleText, fontFamily: typography.fonts.medium, fontSize: typography.tiny, lineHeight: typography.lineHeight.tiny },
  intro: { color: colors.text, fontFamily: typography.fonts.regular, fontSize: typography.body, lineHeight: typography.lineHeight.body },
  section: { gap: spacing.xs },
  heading: { color: colors.text, fontFamily: typography.fonts.bold, fontSize: 16, lineHeight: 22 },
  body: { color: colors.mutedText, fontFamily: typography.fonts.regular, fontSize: 14, lineHeight: 21 }
});
