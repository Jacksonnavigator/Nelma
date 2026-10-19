import { BellOff } from "lucide-react-native";
import { useEffect, useState } from "react";
import { AppState, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/colors";
import { driverTheme } from "../../constants/driver-theme";
import { radius, spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";

// Shown only when alerts are switched off for NELMA, since a driver would then miss new assignments.
export const PushPermissionNotice = () => {
  const { t } = useTranslation();
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") return;
    let active = true;
    const check = async () => {
      try {
        const { default: Constants, ExecutionEnvironment } = await import("expo-constants");
        if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return;
        const { pushNotifications } = await import("../../services/push");
        const state = await pushNotifications.permission();
        if (active) setBlocked(state === "denied");
      } catch {
        // Notifications unavailable here: nothing to warn about.
      }
    };
    void check();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void check();
    });
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  if (!blocked) return null;

  return (
    <View accessibilityRole="alert" style={styles.card}>
      <BellOff color={driverTheme.amberText} size={20} />
      <View style={styles.copy}>
        <Text style={styles.title}>{t("Notifications are off")}</Text>
        <Text style={styles.body}>{t("You will not hear about new deliveries until the app is opened. Turn notifications on for NELMA.")}</Text>
        <Pressable accessibilityRole="button" onPress={() => void Linking.openSettings()} hitSlop={8}>
          <Text style={styles.action}>{t("Open settings")}</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { flexDirection: "row", gap: spacing.md, padding: spacing.md, marginBottom: spacing.md, borderRadius: radius.xl, backgroundColor: driverTheme.amberBg },
  copy: { flex: 1, gap: 2 },
  title: { color: driverTheme.amberText, fontFamily: typography.fonts.bold, fontSize: 15, lineHeight: 21 },
  body: { color: driverTheme.amberText, fontFamily: typography.fonts.regular, fontSize: 13, lineHeight: 19 },
  action: { color: colors.primary, fontFamily: typography.fonts.bold, fontSize: 14, lineHeight: 20, marginTop: spacing.xs }
});
