import { router, useFocusEffect } from "expo-router";
import { Bell, ChevronRight, KeyRound, LifeBuoy, LogOut, Truck, UserRound } from "lucide-react-native";
import { type ComponentType, useCallback, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { HeaderBand, Screen, Sheet, WaveEdge } from "../../../components";
import { colors } from "../../../constants/colors";
import { driverTheme, liftShadow, sheetShadow } from "../../../constants/driver-theme";
import { radius, spacing, typography } from "../../../constants/theme";
import { useLightStatusBar } from "../../../hooks/use-light-status-bar";
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

type Row = { label: string; hint: string; icon: ComponentType<{ color?: string; size?: number }>; tint: string; ink: string; route: Parameters<typeof router.push>[0]; badge?: boolean };

const groups: Array<{ title: string; rows: Row[] }> = [
  {
    title: "Your account",
    rows: [
      { label: "Personal Info", hint: "Name, phone and email", icon: UserRound, tint: driverTheme.aqua, ink: colors.primary, route: "/driver/profile/edit" },
      { label: "Security", hint: "Change your password", icon: KeyRound, tint: driverTheme.mintBg, ink: driverTheme.mintText, route: "/driver/profile/security" }
    ]
  },
  {
    title: "Updates and help",
    rows: [
      { label: "Notifications", hint: "New stops and schedule changes", icon: Bell, tint: driverTheme.amberBg, ink: driverTheme.amberText, route: "/driver/(tabs)/notifications", badge: true },
      { label: "Help & Support", hint: "Talk to the NELMA team", icon: LifeBuoy, tint: "#EAE8FD", ink: "#4B45B8", route: "/support" }
    ]
  }
];

export default function DriverProfileScreen() {
  const { logout, user } = useAuth();
  const { t } = useTranslation();
  const { notifications, loadNotifications } = useNotifications();
  const [summary, setSummary] = useState<DriverSummary | null>(null);
  const [period, setPeriod] = useState<SummaryPeriod>("week");
  const stats = summary?.[period];
  const unread = useMemo(() => notifications.filter((item) => isDriverNotification(item) && !item.read).length, [notifications]);
  const memberSince = useMemo(() => (user?.createdAt ? new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" }).format(new Date(user.createdAt)) : null), [user?.createdAt]);
  useLightStatusBar();

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
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <HeaderBand style={styles.band}>
          <View style={styles.identity}>
            <View style={styles.avatarRing}>
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}><Text style={styles.avatarText}>{initialsFromName(user?.fullName ?? "N").slice(0, 2)}</Text></View>
              )}
            </View>
            <View style={styles.identityCopy}>
              <Text numberOfLines={1} style={styles.name}>{user?.fullName ?? t("NELMA Driver")}</Text>
              <Text numberOfLines={1} style={styles.contact}>{user?.phone || user?.email}</Text>
              <View style={styles.roleRow}>
                <View style={styles.role}><Truck color={driverTheme.mintBright} size={13} /><Text style={styles.roleText}>{t("NELMA Driver")}</Text></View>
                {memberSince ? <Text style={styles.since}>{t("Since")} {memberSince}</Text> : null}
              </View>
            </View>
          </View>
          <WaveEdge />
        </HeaderBand>

        <View style={styles.body}>
        {summary ? (
          <Sheet style={[styles.performance, liftShadow]}>
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

        {groups.map((group) => (
          <View key={group.title} style={styles.group}>
            <Text style={styles.groupTitle}>{t(group.title)}</Text>
            <Sheet style={styles.menu}>
              {group.rows.map((row, index) => {
                const Icon = row.icon;
                return (
                  <Pressable key={row.label} accessibilityRole="button" onPress={() => router.push(row.route)} style={({ pressed }) => [styles.row, index < group.rows.length - 1 ? styles.rowDivider : null, pressed ? styles.rowPressed : null]}>
                    <View style={[styles.rowIcon, { backgroundColor: row.tint }]}><Icon color={row.ink} size={18} /></View>
                    <View style={styles.rowCopy}>
                      <Text style={styles.rowLabel}>{t(row.label)}</Text>
                      <Text style={styles.rowHint}>{t(row.hint)}</Text>
                    </View>
                    {row.badge && unread > 0 ? <Text style={styles.unread}>{unread}</Text> : null}
                    <ChevronRight color={colors.subtleText} size={18} />
                  </Pressable>
                );
              })}
            </Sheet>
          </View>
        ))}

        <Pressable accessibilityRole="button" onPress={signOut} style={({ pressed }) => [styles.signOut, pressed ? styles.signOutPressed : null]}>
          <LogOut color={colors.danger} size={18} />
          <Text style={styles.signOutText}>{t("Sign Out")}</Text>
        </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: driverTheme.night },
  screen: { flex: 1 },
  scroll: { backgroundColor: driverTheme.pageBg },
  content: { paddingBottom: spacing.xxxl },
  band: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxxl + spacing.sm },
  identity: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatarRing: { padding: 3, borderRadius: 38, borderWidth: 2, borderColor: driverTheme.mintBright },
  avatar: { width: 62, height: 62, borderRadius: 31 },
  avatarFallback: { alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  avatarText: { color: driverTheme.deep, fontFamily: typography.fonts.bold, fontSize: 22, lineHeight: 28 },
  identityCopy: { flex: 1, gap: 2 },
  name: { color: colors.white, fontFamily: typography.fonts.bold, fontSize: 21, letterSpacing: -0.3, lineHeight: 26 },
  contact: { color: driverTheme.onDark, fontFamily: typography.fonts.medium, fontSize: 14, lineHeight: 20, fontVariant: ["tabular-nums"] },
  roleRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.xxs },
  role: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: driverTheme.glass, borderWidth: 1, borderColor: driverTheme.glassLine },
  roleText: { color: colors.white, fontFamily: typography.fonts.semibold, fontSize: 12, lineHeight: 16 },
  since: { color: driverTheme.onDark, fontFamily: typography.fonts.regular, fontSize: 12, lineHeight: 16 },
  body: { paddingHorizontal: spacing.lg, marginTop: -spacing.xxl, gap: spacing.sm },
  performance: { padding: spacing.sm, gap: spacing.sm, borderRadius: radius.xl + 10 },
  segments: { flexDirection: "row", backgroundColor: driverTheme.aqua, borderRadius: radius.md, padding: 4 },
  segment: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 36, borderRadius: radius.sm },
  segmentActive: { backgroundColor: colors.white },
  segmentText: { color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: 13, lineHeight: 18 },
  segmentTextActive: { color: colors.ink, fontFamily: typography.fonts.bold },
  big: { alignItems: "center" },
  bigNumber: { color: driverTheme.deep, fontFamily: typography.fonts.bold, fontSize: 40, letterSpacing: -1, lineHeight: 46, fontVariant: ["tabular-nums"] },
  bigLabel: { color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: 14, lineHeight: 20 },
  pair: { flexDirection: "row", alignItems: "center", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: driverTheme.aquaLine, paddingTop: spacing.sm, paddingBottom: spacing.xxs },
  pairCell: { flex: 1, alignItems: "center", gap: 2, paddingHorizontal: spacing.xs },
  pairRule: { width: StyleSheet.hairlineWidth, height: 36, backgroundColor: driverTheme.aquaLine },
  pairValue: { color: colors.ink, fontFamily: typography.fonts.bold, fontSize: 20, lineHeight: 26, fontVariant: ["tabular-nums"] },
  pairLabel: { color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: 12, lineHeight: 18 },
  group: { gap: spacing.xs, marginTop: spacing.xxs },
  groupTitle: { color: colors.mutedText, fontFamily: typography.fonts.semibold, fontSize: 12, letterSpacing: 0.6, lineHeight: 17, textTransform: "uppercase", paddingHorizontal: spacing.xxs },
  menu: { borderRadius: radius.xl + 6 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 60, paddingHorizontal: spacing.md },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: driverTheme.aquaLine },
  rowPressed: { backgroundColor: driverTheme.pageBg },
  rowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  rowCopy: { flex: 1, gap: 1 },
  rowLabel: { color: colors.ink, fontFamily: typography.fonts.semibold, fontSize: 15, lineHeight: 21 },
  rowHint: { color: colors.mutedText, fontFamily: typography.fonts.regular, fontSize: 12, lineHeight: 17 },
  unread: { minWidth: 22, paddingHorizontal: 6, borderRadius: 11, overflow: "hidden", textAlign: "center", color: colors.white, backgroundColor: colors.danger, fontFamily: typography.fonts.bold, fontSize: 12, lineHeight: 22 },
  signOut: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs, minHeight: 50, marginTop: spacing.xs, borderRadius: radius.xl + 6, borderWidth: 1, borderColor: "rgba(227,93,106,0.28)", backgroundColor: colors.white },
  signOutPressed: { backgroundColor: colors.dangerBg },
  signOutText: { color: colors.danger, fontFamily: typography.fonts.semibold, fontSize: 15, lineHeight: 21 }
});
