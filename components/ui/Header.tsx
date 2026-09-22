import type { ReactNode } from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { useTranslation } from "../../hooks/use-translation";
import { colors } from "../../constants/colors";
import { spacing, typography } from "../../constants/theme";

type HeaderProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export const Header = ({ title, subtitle, eyebrow, right, style }: HeaderProps) => {
  const { t } = useTranslation();
  return (
    <View style={[styles.header, style]}>
      <View style={styles.copy}>
        {eyebrow ? <Text style={styles.eyebrow}>{t(eyebrow)}</Text> : null}
        <Text style={styles.title}>{t(title)}</Text>
        {subtitle ? <Text style={styles.subtitle}>{t(subtitle)}</Text> : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  copy: {
    flex: 1,
    gap: spacing.xs
  },
  right: {
    paddingTop: spacing.xs
  },
  eyebrow: {
    color: colors.primary,
    fontFamily: typography.fonts.bold,
    fontSize: typography.tiny,
    letterSpacing: 0,
    lineHeight: typography.lineHeight.tiny,
    textTransform: "uppercase"
  },
  title: {
    color: colors.black,
    fontFamily: typography.fonts.bold,
    fontSize: typography.h1,
    letterSpacing: 0,
    lineHeight: typography.lineHeight.h1
  },
  subtitle: {
    color: colors.black,
    fontFamily: typography.fonts.regular,
    fontSize: typography.body,
    lineHeight: typography.lineHeight.body
  }
});
