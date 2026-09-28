import { AlertCircle } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "../../hooks/use-translation";
import { colors } from "../../constants/colors";
import { spacing, typography } from "../../constants/theme";
import { Button } from "./Button";

type ErrorStateProps = {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export const ErrorState = ({ title = "Something went wrong", message, actionLabel = "Try Again", onAction }: ErrorStateProps) => {
  const { t } = useTranslation();
  return (
    <View style={styles.container} accessibilityRole="alert">
      <AlertCircle color={colors.danger} size={34} />
      <Text style={styles.title}>{t(title)}</Text>
      <Text style={styles.message}>{t(message)}</Text>
      {onAction ? <Button title={actionLabel} onPress={onAction} variant="secondary" /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.xl
  },
  title: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: "900",
    textAlign: "center"
  },
  message: {
    color: colors.mutedText,
    fontSize: typography.body,
    lineHeight: 22,
    textAlign: "center"
  }
});
