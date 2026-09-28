import { ArrowLeft } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/colors";
import { spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";

type DriverTitleProps = { eyebrow?: string; title: string; right?: ReactNode; onBack?: () => void; backLabel?: string };

export const DriverTitle = ({ eyebrow, title, right, onBack, backLabel = "Back" }: DriverTitleProps) => {
  const { t } = useTranslation();
  return (
    <View>
      {onBack ? (
        <Pressable accessibilityRole="button" accessibilityLabel={t(backLabel)} hitSlop={10} onPress={onBack} style={styles.back}>
          <ArrowLeft color={colors.ink} size={22} />
        </Pressable>
      ) : null}
      <View style={[styles.row, onBack ? styles.rowAfterBack : null]}>
        <View style={styles.copy}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
        </View>
        {right}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  back: { width: 44, height: 44, marginTop: spacing.xs, marginLeft: -spacing.xs, justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.md },
  rowAfterBack: { paddingTop: spacing.xs },
  copy: { flex: 1, gap: 2 },
  eyebrow: { color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: 13, lineHeight: 18 },
  title: { color: colors.ink, fontFamily: typography.fonts.bold, fontSize: 30, letterSpacing: -0.6, lineHeight: 36 }
});
