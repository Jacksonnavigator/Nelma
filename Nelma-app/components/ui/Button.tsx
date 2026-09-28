import type { ComponentType } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { useTranslation } from "../../hooks/use-translation";
import { colors } from "../../constants/colors";
import { radius, shadows, spacing, typography } from "../../constants/theme";

type IconProps = { color?: string; size?: number; strokeWidth?: number };

type ButtonVariant = "primary" | "secondary" | "accent" | "ghost" | "danger" | "light";

type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: ComponentType<IconProps>;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

export const Button = ({ title, onPress, variant = "primary", disabled = false, loading = false, icon: Icon, style, accessibilityLabel }: ButtonProps) => {
  const { t } = useTranslation();
  const translatedTitle = t(title);
  const isDisabled = disabled || loading;
  const backgroundColor = getBackground(variant, isDisabled);
  const foreground = getForeground(variant, isDisabled);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ? t(accessibilityLabel) : translatedTitle}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        getVariantStyle(variant),
        { backgroundColor, opacity: pressed && !isDisabled ? 0.9 : 1, transform: [{ scale: pressed && !isDisabled ? 0.985 : 1 }] },
        variant === "primary" && !isDisabled ? shadows.button : null,
        style
      ]}
    >
      {loading ? <ActivityIndicator color={foreground} /> : null}
      {!loading && Icon ? <Icon color={foreground} size={20} strokeWidth={2.4} /> : null}
      <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.text, { color: foreground }]}>{translatedTitle}</Text>
    </Pressable>
  );
};

const getBackground = (variant: ButtonVariant, disabled: boolean): string => {
  if (disabled) return colors.disabled;
  const map: Record<ButtonVariant, string> = {
    primary: colors.primary,
    secondary: colors.surfaceAlt,
    accent: colors.mint,
    ghost: "transparent",
    danger: colors.danger,
    light: colors.white
  };
  return map[variant];
};

const getForeground = (variant: ButtonVariant, disabled: boolean): string => {
  if (disabled) return colors.white;
  if (variant === "secondary" || variant === "ghost" || variant === "light") return colors.primary;
  if (variant === "accent") return colors.text;
  return colors.white;
};

const getVariantStyle = (variant: ButtonVariant) => {
  if (variant === "secondary") return styles.secondary;
  if (variant === "ghost") return styles.ghost;
  if (variant === "light") return styles.light;
  return null;
};

export const PrimaryButton = (props: Omit<ButtonProps, "variant">) => <Button {...props} variant="primary" />;
export const SecondaryButton = (props: Omit<ButtonProps, "variant">) => <Button {...props} variant="secondary" />;

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 54,
    minWidth: 44,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  secondary: {
    borderColor: colors.border,
    borderWidth: 1
  },
  ghost: {
    minHeight: 48,
    paddingHorizontal: spacing.md
  },
  light: {
    borderColor: "rgba(255,255,255,0.6)",
    borderWidth: 1
  },
  text: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.body,
    lineHeight: typography.lineHeight.body
  }
});
