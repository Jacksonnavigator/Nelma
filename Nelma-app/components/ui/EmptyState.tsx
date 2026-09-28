import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "../../hooks/use-translation";
import { colors } from "../../constants/colors";
import { radius, spacing, typography } from "../../constants/theme";
import { Button } from "./Button";

type EmptyStateProps = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  artwork?: ReactNode;
};

export const EmptyState = ({ title, message, actionLabel, onAction, artwork }: EmptyStateProps) => {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      {artwork ? <View style={styles.art}>{artwork}</View> : null}
      <Text style={styles.title}>{t(title)}</Text>
      <Text style={styles.message}>{t(message)}</Text>
      {actionLabel && onAction ? <Button title={actionLabel} onPress={onAction} style={styles.button} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl
  },
  art: {
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xl,
    minHeight: 136,
    justifyContent: "center",
    width: "100%"
  },
  title: {
    color: colors.text,
    fontFamily: typography.fonts.bold,
    fontSize: typography.h3,
    lineHeight: typography.lineHeight.h3,
    textAlign: "center"
  },
  message: {
    color: colors.mutedText,
    fontFamily: typography.fonts.regular,
    fontSize: typography.body,
    lineHeight: typography.lineHeight.body,
    textAlign: "center"
  },
  button: {
    marginTop: spacing.xs,
    minWidth: 170
  }
});
