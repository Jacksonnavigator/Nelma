import { WifiOff } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "../../hooks/use-translation";
import { colors } from "../../constants/colors";
import { spacing, typography } from "../../constants/theme";
import { useNetwork } from "../../store/network-context";

export const OfflineBanner = () => {
  const { isConnected, isInternetReachable } = useNetwork();
  const { t } = useTranslation();
  if (isConnected && isInternetReachable !== false) {
    return null;
  }
  return (
    <View style={styles.banner}>
      <WifiOff color={colors.white} size={16} />
      <Text style={styles.text}>{t("You are offline. Orders will not be submitted until connection returns.")}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    alignItems: "center",
    backgroundColor: colors.danger,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  text: {
    color: colors.white,
    fontFamily: typography.fonts.semibold,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small,
    textAlign: "center"
  }
});
