import { PropsWithChildren } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { colors } from "../../constants/colors";
import { radius, shadows, spacing } from "../../constants/theme";

type CardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  quiet?: boolean;
}>;

export const Card = ({ children, style, quiet = false }: CardProps) => <View style={[styles.card, quiet ? styles.quiet : null, style]}>{children}</View>;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    ...shadows.card
  },
  quiet: {
    borderColor: "transparent",
    shadowOpacity: 0,
    elevation: 0
  }
});