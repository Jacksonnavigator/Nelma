import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";
import { haptics } from "../../services/haptics";
import { useAuth } from "../../store/auth-context";
import type { LanguagePreference } from "../../types/user";

const options: Array<{ value: LanguagePreference; short: string; name: string }> = [
  { value: "en", short: "EN", name: "English" },
  { value: "sw", short: "SW", name: "Kiswahili" }
];

/** EN | SW switch: one tap changes the whole app's language and saves it to the account. */
export const LanguageToggle = () => {
  const { updateProfile } = useAuth();
  const { language, t } = useTranslation();
  // Shows the new choice straight away while the server saves it.
  const [pending, setPending] = useState<LanguagePreference | null>(null);
  const current = pending ?? language;

  const choose = async (value: LanguagePreference) => {
    if (value === current) return;
    haptics.selection();
    setPending(value);
    try {
      await updateProfile({ preferredLanguage: value });
    } catch {
      Alert.alert(t("Language"), t("Could not change the language. Please check your connection and try again."));
    } finally {
      setPending(null);
    }
  };

  return (
    <View accessibilityLabel={t("Language")} accessibilityRole="radiogroup" style={styles.group}>
      {options.map((option) => {
        const selected = current === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityLabel={option.name}
            accessibilityRole="radio"
            accessibilityState={{ selected, busy: pending === option.value }}
            disabled={pending !== null}
            hitSlop={4}
            onPress={() => choose(option.value)}
            style={[styles.option, selected ? styles.optionSelected : null]}
          >
            <Text style={[styles.optionText, selected ? styles.optionTextSelected : null]}>{option.short}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  group: {
    backgroundColor: colors.white,
    borderColor: "#CBD7E1",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    height: 36,
    padding: 3
  },
  option: {
    alignItems: "center",
    borderRadius: 11,
    justifyContent: "center",
    minWidth: 34,
    paddingHorizontal: 6
  },
  optionSelected: {
    backgroundColor: colors.primary
  },
  optionText: {
    color: colors.mutedText,
    fontFamily: typography.fonts.bold,
    fontSize: 12,
    lineHeight: 16
  },
  optionTextSelected: {
    color: colors.white
  }
});
