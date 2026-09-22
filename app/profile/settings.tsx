import { Check, Languages, Save } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Button, Card, Header, Screen } from "../../components";
import { colors } from "../../constants/colors";
import { radius, spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";
import { useAuth } from "../../store/auth-context";
import type { LanguagePreference, NotificationPreferences } from "../../types/user";

const languageOptions: Array<{ value: LanguagePreference; title: string; subtitle: string }> = [
  { value: "en", title: "English", subtitle: "App language" },
  { value: "sw", title: "Swahili", subtitle: "Lugha ya Kiswahili" }
];

const preferenceLabels: Array<{ key: keyof NotificationPreferences; label: string; description: string }> = [
  { key: "orderUpdates", label: "Order updates", description: "Status changes for active NELMA orders." },
  { key: "paymentUpdates", label: "Payment updates", description: "Payment status and receipt updates." },
  { key: "promotions", label: "Promotions", description: "Optional promotional messages." },
  { key: "systemAnnouncements", label: "System announcements", description: "Important account and service messages." }
];

export default function SettingsScreen() {
  const { user, updateProfile } = useAuth();
  const { t } = useTranslation();
  const [preferredLanguage, setPreferredLanguage] = useState<LanguagePreference>(user?.preferredLanguage ?? "en");
  const [preferences, setPreferences] = useState<NotificationPreferences>(user?.notificationPreferences ?? {
    orderUpdates: true,
    paymentUpdates: true,
    promotions: false,
    systemAnnouncements: true
  });
  const [saving, setSaving] = useState(false);

  const toggle = (key: keyof NotificationPreferences) => setPreferences((current) => ({ ...current, [key]: !current[key] }));

  const save = async () => {
    setSaving(true);
    try {
      await updateProfile({ preferredLanguage, notificationPreferences: preferences });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Header title="Account Settings" subtitle="Control language, notification preferences, and account behavior." />
      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <Languages color={colors.primary} size={20} />
          </View>
          <View style={styles.sectionCopy}>
            <Text style={styles.sectionTitle}>{t("Language")}</Text>
            <Text style={styles.prefText}>{t("Choose how the app should serve you.")}</Text>
          </View>
        </View>
        <View style={styles.optionRow}>
          {languageOptions.map((option) => {
            const selected = preferredLanguage === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setPreferredLanguage(option.value)}
                style={({ pressed }) => [styles.languageOption, selected ? styles.languageOptionSelected : null, { opacity: pressed ? 0.78 : 1 }]}
              >
                <View style={[styles.optionCheck, selected ? styles.optionCheckSelected : null]}>{selected ? <Check color={colors.white} size={14} strokeWidth={3} /> : null}</View>
                <Text style={styles.prefTitle}>{t(option.title)}</Text>
                <Text style={styles.prefText}>{t(option.subtitle)}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>{t("Notifications")}</Text>
        {preferenceLabels.map((item) => (
          <Pressable key={item.key} accessibilityRole="switch" accessibilityState={{ checked: preferences[item.key] }} onPress={() => toggle(item.key)} style={styles.prefRow}>
            <View style={styles.prefCopy}>
              <Text style={styles.prefTitle}>{t(item.label)}</Text>
              <Text style={styles.prefText}>{t(item.description)}</Text>
            </View>
            <View style={[styles.switch, preferences[item.key] ? styles.switchOn : null]}>
              <View style={[styles.knob, preferences[item.key] ? styles.knobOn : null]} />
            </View>
          </Pressable>
        ))}
      </Card>
      <Button title="Save Preferences" icon={Save} onPress={save} loading={saving} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  sectionIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceBlue,
    borderRadius: radius.pill,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  sectionCopy: { flex: 1, gap: 2 },
  sectionTitle: {
    color: colors.text,
    fontFamily: typography.fonts.bold,
    fontSize: typography.h3,
    lineHeight: typography.lineHeight.h3
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  languageOption: {
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xxs,
    minHeight: 92,
    minWidth: 128,
    padding: spacing.md
  },
  languageOptionSelected: {
    backgroundColor: colors.surfaceBlue,
    borderColor: colors.primary,
    borderWidth: 2
  },
  optionCheck: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 22,
    justifyContent: "center",
    width: 22
  },
  optionCheckSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  prefRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 62
  },
  prefCopy: { flex: 1, gap: spacing.xs },
  prefTitle: {
    color: colors.text,
    fontFamily: typography.fonts.bold,
    fontSize: typography.body,
    lineHeight: typography.lineHeight.body
  },
  prefText: {
    color: colors.mutedText,
    fontFamily: typography.fonts.regular,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small
  },
  switch: {
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    height: 30,
    justifyContent: "center",
    padding: 3,
    width: 54
  },
  switchOn: { backgroundColor: colors.success },
  knob: {
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    height: 24,
    width: 24
  },
  knobOn: { alignSelf: "flex-end" }
});
