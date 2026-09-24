import { router, useFocusEffect } from "expo-router";
import { Bell, ChevronRight, KeyRound, LifeBuoy, LogOut, UserRound } from "lucide-react-native";
import { type ComponentType, useCallback, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Screen, Sheet, SkyBackdrop } from "../../../components";
import { colors } from "../../../constants/colors";
import { driverTheme, sheetShadow } from "../../../constants/driver-theme";
import { radius, spacing, typography } from "../../../constants/theme";
import { useTranslation } from "../../../hooks/use-translation";
import { repositories } from "../../../repositories";
import { haptics } from "../../../services/haptics";
import { useAuth } from "../../../store/auth-context";
import { useNotifications } from "../../../store/notification-context";
import type { DriverSummary } from "../../../types/driver";
import { isDriverNotification } from "../../../utils/driver-deliveries";
import { formatCurrency, initialsFromName } from "../../../utils/format";

type SummaryPeriod = "today" | "week" | "month" | "allTime";

const periods: Array<{ value: SummaryPeriod; label: string }> = [
  { value: "today", label: "Today" },
  { value: "week", label: "7 days" },
  { value: "month", label: "Month" },
  { value: "allTime", label: "All time" }
];

type Row = { label: string; icon: ComponentType<{ color?: string; size?: number }>; route: Parameters<typeof router.push>[0]; badge?: boolean };

const rows: Row[] = [
  { label: "Personal Info", icon: UserRound, route: "/driver/profile/edit" },
  { label: "Notifications", icon: Bell, route: "/driver/(tabs)/notifications", badge: true },
  { label: "Security", icon: KeyRound, route: "/driver/profile/security" },
  { label: "Help & Support", icon: LifeBuoy, route: "/support" }
];

export default function DriverProfileScreen() {
  const { logout, user } = useAuth();
  const { t } = useTranslation();
  const { notifications, loadNotifications } = useNotifications();
  const [summary, setSummary] = useState<DriverSummary | null>(null);
  const [period, setPeriod] = useState<SummaryPeriod>("week");
  const stats = summary?.[period];
  const unread = useMemo(() => notifications.filter((item) => isDriverNotification(item) && !item.read).length, [notifications]);

  useFocusEffect(useCallback(() => {
    let cancelled = false;
    repositories.driver.getSummary().then((result) => { if (!cancelled) setSummary(result); }).catch(() => undefined);
    void loadNotifications();
    return () => { cancelled = true; };
  }, [loadNotifications]));

  const signOut = async () => {
    haptics.selection();
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <Screen safeBottom={false} contentContainerStyle={styles.screen} keyboard={false} padded={false} scroll={false} style={styles.safe}>
      <SkyBackdrop />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.identity}>
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}><Text style={styles.avatarText}>{initialsFromName(user?.fullName ?? "N").slice(0, 2)}</Text></View>
          )}
          <Text numberOfLines={1} style={styles.name}>{user?.fullName ?? t("NELMA Driver")}</Text>
          <Text numberOfLines={1} style={styles.contact}>{user?.phone || user?.email}</Text>
        </View>

        {summary ? (
          <Sheet style={styles.performance}>
            <View style={styles.segments}>
              {periods.map((item) => {
                const active = period === item.value;
                return (
                  <Pressable key={item.value} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => { haptics.selection(); setPeriod(item.value); }} style={[styles.segment, active ? [styles.segmentActive, sheetShadow] : null]}>
                    <Text style={[styles.segmentText, active ? styles.segmentTextActive : null]}>{t(item.label)}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.big}>
              <Text style={styles.bigNumber}>{stats?.deliveries ?? 0}</Text>
              <Text style={styles.bigLabel}>{t("Deliveries")}</Text>
            </View>
            <View style={styles.pair}>
              <View style={styles.pairCell}>
                <Text style={styles.pairValue}>{stats?.bottles ?? 0}</Text>
                <Text style={styles.pairLabel}>{t("Bottles")}</Text>
              </View>
              <View style={styles.pairRule} />
              <View style={styles.pairCell}>
                <Text numberOfLines={1} adjustsFontSizeToFit style={styles.pairValue}>{formatCurrency(stats?.value ?? 0)}</Text>
                <Text style={styles.pairLabel}>{t("Value delivered")}</Text>
              </View>
            </View>
          </Sheet>
        ) : null}

        <Sheet style={styles.menu}>
          {rows.map((row, index) => {
            const Icon = row.icon;
            return (
              <Pressable key={row.label} accessibilityRole="button" onPress={() => router.push(row.route)} style={({ pressed }) => [styles.row, index < rows.length - 1 ? styles.rowDivider : null, pressed ? styles.rowPressed : null]}>
                <View style={styles.rowIcon}><Icon color={colors.primary} size={18} /></View>
                <Text style={styles.rowLabel}>{t(row.label)}</Text>
                {row.badge && unread > 0 ? <Text style={styles.unread}>{unread}</Text> : null}
                <ChevronRight color={colors.subtleText} size={18} />
              </Pressable>
            );
          })}
        </Sheet>

        <Pressable accessibilityRole="button" onPress={signOut} style={({ pressed }) => [styles.signOut, { opacity: pressed ? 0.6 : 1 }]}>
          <LogOut color={colors.danger} size={18} />
          <Text style={styles.signOutText}>{t("Sign Out")}</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: driverTheme.pageBg },
  screen: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.md },
  identity: { alignItems: "center", gap: 2, paddingBottom: spacing.sm },
  avatar: { width: 84, height: 84, borderRadius: 42, borderWidth: 4, borderColor: colors.white, marginBottom: spacing.xs },
  avatarFallback: { alignItems: "center", justifyContent: "center", backgroundColor: driverTheme.deep },
  avatarText: { color: colors.white, fontFamily: typography.fonts.bold, fontSize: 28, lineHeight: 34 },
  name: { color: colors.ink, fontFamily: typography.fonts.bold, fontSize: 26, letterSpacing: -0.4, lineHeight: 32 },
  contact: { color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: 14, lineHeight: 20, fontVariant: ["tabular-nums"] },
  performance: { padding: spacing.md, gap: spacing.md },
  segments: { flexDirection: "row", backgroundColor: driverTheme.aqua, borderRadius: radius.md, padding: 4 },
  segment: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 36, borderRadius: radius.sm },
  segmentActive: { backgroundColor: colors.white },
  segmentText: { color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: 13, lineHeight: 18 },
  segmentTextActive: { color: colors.ink, fontFamily: typography.fonts.bold },
  big: { alignItems: "center", paddingVertical: spacing.xs },
  bigNumber: { color: driverTheme.deep, fontFamily: typography.fonts.bold, fontSize: 56, letterSpacing: -1.5, lineHeight: 62, fontVariant: ["tabular-nums"] },
  bigLabel: { color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: 14, lineHeight: 20 },
  pair: { flexDirection: "row", alignItems: "center", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: driverTheme.aquaLine, paddingTop: spacing.md },
  pairCell: { flex: 1, alignItems: "center", gap: 2, paddingHorizontal: spacing.xs },
  pairRule: { width: StyleSheet.hairlineWidth, height: 36, backgroundColor: driverTheme.aquaLine },
  pairValue: { color: colors.ink, fontFamily: typography.fonts.bold, fontSize: 20, lineHeight: 26, fontVariant: ["tabular-nums"] },
  pairLabel: { color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: 12, lineHeight: 18 },
  menu: { borderRadius: radius.xl },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: 60, paddingHorizontal: spacing.md },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: driverTheme.aquaLine },
  rowPressed: { backgroundColor: driverTheme.pageBg },
  rowIcon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: driverTheme.aqua },
  rowLabel: { flex: 1, color: colors.ink, fontFamily: typography.fonts.semibold, fontSize: 15, lineHeight: 21 },
  unread: { minWidth: 22, paddingHorizontal: 6, borderRadius: 11, overflow: "hidden", textAlign: "center", color: colors.white, backgroundColor: colors.primary, fontFamily: typography.fonts.bold, fontSize: 12, lineHeight: 22 },
  signOut: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs, minHeight: 52, marginTop: spacing.xs },
  signOutText: { color: colors.danger, fontFamily: typography.fonts.semibold, fontSize: 15, lineHeight: 21 }
});
