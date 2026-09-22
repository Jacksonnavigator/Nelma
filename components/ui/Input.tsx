import type { ReactNode } from "react";
import { useState } from "react";
import { StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from "react-native";
import { useTranslation } from "../../hooks/use-translation";
import { colors } from "../../constants/colors";
import { radius, spacing, typography } from "../../constants/theme";

type InputProps = TextInputProps & {
  label: string;
  error?: string;
  helper?: string;
  right?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
};

export const Input = ({ label, error, helper, placeholder, style, right, containerStyle, onFocus, onBlur, ...props }: InputProps) => {
  const [focused, setFocused] = useState(false);
  const { t } = useTranslation();
  return (
    <View style={[styles.wrapper, containerStyle]}>
      <Text style={styles.label}>{t(label)}</Text>
      <View style={[styles.inputFrame, focused ? styles.inputFocused : null, error ? styles.inputError : null, props.editable === false ? styles.disabled : null]}>
        <TextInput
          placeholderTextColor={colors.subtleText}
          placeholder={placeholder ? t(placeholder) : undefined}
          style={[styles.input, style]}
          accessibilityLabel={t(label)}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...props}
        />
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
      {error ? <Text style={styles.error}>{t(error)}</Text> : helper ? <Text style={styles.helper}>{t(helper)}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs
  },
  label: {
    color: colors.text,
    fontFamily: typography.fonts.semibold,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small
  },
  inputFrame: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 54,
    overflow: "hidden"
  },
  inputFocused: {
    backgroundColor: colors.white,
    borderColor: colors.primary,
    borderWidth: 1.5
  },
  inputError: {
    borderColor: colors.danger
  },
  disabled: {
    backgroundColor: colors.surfaceAlt
  },
  input: {
    color: colors.text,
    flex: 1,
    fontFamily: typography.fonts.regular,
    fontSize: typography.body,
    lineHeight: typography.lineHeight.body,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  right: {
    paddingRight: spacing.sm
  },
  error: {
    color: colors.danger,
    fontFamily: typography.fonts.semibold,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small
  },
  helper: {
    color: colors.mutedText,
    fontFamily: typography.fonts.regular,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small
  }
});
