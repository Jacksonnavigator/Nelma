import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator, StyleSheet, Text } from "react-native";
import { useTranslation } from "../../hooks/use-translation";
import { colors } from "../../constants/colors";
import { spacing, typography } from "../../constants/theme";

type LoadingScreenProps = { message?: string };

export const LoadingScreen = ({ message = "Loading" }: LoadingScreenProps) => {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.container}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.message}>{t(message)}</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.md,
    justifyContent: "center",
    padding: spacing.xl
  },
  message: {
    color: colors.mutedText,
    fontFamily: typography.fonts.medium,
    fontSize: typography.body,
    lineHeight: typography.lineHeight.body
  }
});
