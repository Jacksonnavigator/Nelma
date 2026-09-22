import type { ComponentType } from "react";
import { Pressable, StyleSheet } from "react-native";
import { useTranslation } from "../../hooks/use-translation";
import { colors } from "../../constants/colors";
import { radius } from "../../constants/theme";

type IconProps = { color?: string; size?: number; strokeWidth?: number };

type IconButtonProps = {
  icon: ComponentType<IconProps>;
  label: string;
  onPress?: () => void;
  color?: string;
  backgroundColor?: string;
  disabled?: boolean;
};

export const IconButton = ({ icon: Icon, label, onPress, color = colors.text, backgroundColor = colors.surfaceAlt, disabled = false }: IconButtonProps) => {
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t(label)}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, { backgroundColor, opacity: pressed && !disabled ? 0.72 : disabled ? 0.5 : 1, transform: [{ scale: pressed && !disabled ? 0.96 : 1 }] }]}
    >
      <Icon color={color} size={21} strokeWidth={2.3} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: radius.pill,
    height: 44,
    justifyContent: "center",
    width: 44
  }
});
