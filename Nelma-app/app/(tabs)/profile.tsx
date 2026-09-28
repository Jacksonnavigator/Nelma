import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  ChevronRight,
  CircleHelp,
  FileText,
  Headset,
  Info,
  KeyRound,
  Languages,
  LogOut,
  MapPin,
  Pencil,
  ShieldCheck,
  SlidersHorizontal,
  UserRound
} from "lucide-react-native";
import { type ComponentType, useEffect, useMemo } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppTopBar, Screen } from "../../components";
import { colors } from "../../constants/colors";
import { spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";
import { haptics } from "../../services/haptics";
import { useAuth } from "../../store/auth-context";
import { useOrders } from "../../store/order-context";
import { initialsFromName } from "../../utils/format";
import { languageLabel } from "../../utils/i18n";

type IconComponent = ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;

type Row = {
  icon: IconComponent;
  tint: string;
  label: string;
  value?: string;
  route: Parameters<typeof router.push>[0];
};

const twoLetterInitials = (name?: string | null) => {
  const initials = initialsFromName(name ?? "NELMA");
  if (initials.length >= 2) {
    return initials.slice(0, 2);
  }
  return (name ?? "NELMA").trim().slice(0, 2).toUpperCase().padEnd(2, "E");
};

const memberSince = (iso?: string) => {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" }).format(date);
};

export default function ProfileScreen() {
  const { logout, user } = useAuth();
  const { orders, savedAddresses, loadOrders, loadSavedAddresses } = useOrders();
  const { t, language } = useTranslation();
  const initials = twoLetterInitials(user?.fullName);
  const since = memberSince(user?.createdAt);

  useEffect(() => {
    loadOrders();
    loadSavedAddresses();
  }, [loadOrders, loadSavedAddresses]);

  const delivered = useMemo(() => orders.filter((order) => order.status === "delivered" || order.status === "received").length, [orders]);

  const groups: Array<{ title: string; rows: Row[] }> = [
    {
      title: "Account",
      rows: [
        { icon: UserRound, tint: colors.primary, label: "Edit profile", route: "/profile/edit" },
        { icon: MapPin, tint: "#12A594", label: "Saved addresses", value: savedAddresses.length ? String(savedAddresses.length) : undefined, route: "/profile/addresses" },
        { icon: KeyRound, tint: "#D98A00", label: "Password & security", route: "/profile/security" }
      ]
    },
    {
      title: "Preferences",
      rows: [
        { icon: Languages, tint: "#7C5CE0", label: "Language", value: languageLabel(language), route: "/profile/settings" },
        { icon: SlidersHorizontal, tint: "#5B6B80", label: "Notifications & settings", route: "/profile/settings" }
      ]
    },
    {
      title: "Support",
      rows: [
        { icon: CircleHelp, tint: colors.primary, label: "Help & FAQ", route: "/support" },
        { icon: Headset, tint: "#1FA855", label: "Contact NELMA", route: "/support/contact" }
      ]
    },
    {
      title: "Legal",
      rows: [
        { icon: FileText, tint: "#5B6B80", label: "Terms & Conditions", route: "/legal/terms" },
        { icon: ShieldCheck, tint: "#5B6B80", label: "Privacy Policy", route: "/legal/privacy" },
        { icon: Info, tint: "#5B6B80", label: "About NELMA", route: "/legal/about" }
      ]
    }
  ];

  const stats: Array<{ label: string; value: number; route: Parameters<typeof router.push>[0] }> = [
    { label: "Orders", value: orders.length, route: "/(tabs)/orders" },
    { label: "Delivered", value: delivered, route: "/(tabs)/orders" },
    { label: "Addresses", value: savedAddresses.length, route: "/profile/addresses" }
  ];

  const go = (route: Parameters<typeof router.push>[0]) => {
    haptics.selection();
    router.push(route);
  };

  const signOut = async () => {
    haptics.selection();
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <Screen safeBottom={false} contentContainerStyle={styles.screen} keyboard={false} padded={false} scroll={false} style={styles.safe}>
      <AppTopBar />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={["#00A6E8", "#0077C8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroRow}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={styles.heroCopy}>
              <Text numberOfLines={1} style={styles.name}>{user?.fullName ?? t("NELMA Customer")}</Text>
              <Text numberOfLines={1} style={styles.meta}>{user?.phone || user?.email || ""}</Text>
              {since ? <Text style={styles.since}>{t("Customer since")} {since}</Text> : null}
            </View>
            <Pressable accessibilityLabel={t("Edit profile")} accessibilityRole="button" hitSlop={8} onPress={() => go("/profile/edit")} style={styles.editButton}>
              <Pencil color={colors.white} size={15} strokeWidth={2.4} />
            </Pressable>
          </View>

          <View style={styles.stats}>
            {stats.map((stat, index) => (
              <Pressable key={stat.label} accessibilityRole="button" onPress={() => go(stat.route)} style={[styles.stat, index > 0 ? styles.statDivider : null]}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{t(stat.label)}</Text>
              </Pressable>
            ))}
          </View>
        </LinearGradient>

        {groups.map((group) => (
          <View key={group.title} style={styles.group}>
            <Text style={styles.groupTitle}>{t(group.title)}</Text>
            <View style={styles.card}>
              {group.rows.map((row, index) => {
                const Icon = row.icon;
                return (
                  <Pressable
                    key={row.label}
                    accessibilityRole="button"
                    onPress={() => go(row.route)}
                    style={({ pressed }) => [styles.row, index > 0 ? styles.rowDivider : null, pressed ? styles.rowPressed : null]}
                  >
                    <View style={[styles.rowIcon, { backgroundColor: `${row.tint}1A` }]}>
                      <Icon color={row.tint} size={17} strokeWidth={2.3} />
                    </View>
                    <Text numberOfLines={1} style={styles.rowLabel}>{t(row.label)}</Text>
                    {row.value ? <Text style={styles.rowValue}>{t(row.value)}</Text> : null}
                    <ChevronRight color={colors.subtleText} size={16} />
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        <Pressable accessibilityRole="button" onPress={signOut} style={({ pressed }) => [styles.signOut, { opacity: pressed ? 0.75 : 1 }]}>
          <LogOut color={colors.danger} size={17} strokeWidth={2.4} />
          <Text style={styles.signOutText}>{t("Sign Out")}</Text>
        </Pressable>

        <Text style={styles.version}>NELMA · v{Constants.expoConfig?.version ?? "1.0.0"}</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.white },
  screen: { backgroundColor: colors.white, flex: 1 },
  content: { gap: spacing.md, paddingBottom: 132, paddingHorizontal: spacing.md, paddingTop: spacing.md },
  hero: { borderRadius: 20, gap: spacing.md, padding: spacing.md },
  heroRow: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  avatar: { borderColor: "rgba(255,255,255,0.7)", borderRadius: 30, borderWidth: 2, height: 60, width: 60 },
  avatarFallback: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.22)", justifyContent: "center" },
  avatarInitials: { color: colors.white, fontFamily: typography.fonts.bold, fontSize: 20, lineHeight: 26 },
  heroCopy: { flex: 1, gap: 1, minWidth: 0 },
  name: { color: colors.white, fontFamily: typography.fonts.bold, fontSize: 18, lineHeight: 24 },
  meta: { color: "rgba(255,255,255,0.9)", fontFamily: typography.fonts.medium, fontSize: 13, lineHeight: 17 },
  since: { color: "rgba(255,255,255,0.72)", fontFamily: typography.fonts.medium, fontSize: 11, lineHeight: 15 },
  editButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  stats: { backgroundColor: "rgba(255,255,255,0.14)", borderRadius: 14, flexDirection: "row", paddingVertical: spacing.xs },
  stat: { alignItems: "center", flex: 1, gap: 1 },
  statDivider: { borderLeftColor: "rgba(255,255,255,0.22)", borderLeftWidth: 1 },
  statValue: { color: colors.white, fontFamily: typography.fonts.bold, fontSize: 17, lineHeight: 22 },
  statLabel: { color: "rgba(255,255,255,0.8)", fontFamily: typography.fonts.medium, fontSize: 11, lineHeight: 14 },
  group: { gap: 6 },
  groupTitle: {
    color: colors.subtleText,
    fontFamily: typography.fonts.bold,
    fontSize: 11,
    letterSpacing: 0.6,
    lineHeight: 14,
    paddingHorizontal: 4,
    textTransform: "uppercase"
  },
  card: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  row: { alignItems: "center", flexDirection: "row", gap: spacing.sm, minHeight: 50, paddingHorizontal: spacing.sm },
  rowDivider: { borderTopColor: colors.line, borderTopWidth: 1 },
  rowPressed: { backgroundColor: colors.surfaceAlt },
  rowIcon: { alignItems: "center", borderRadius: 10, height: 32, justifyContent: "center", width: 32 },
  rowLabel: { color: colors.text, flex: 1, fontFamily: typography.fonts.semibold, fontSize: 14, lineHeight: 19 },
  rowValue: { color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: 12.5, lineHeight: 17 },
  signOut: {
    alignItems: "center",
    backgroundColor: colors.dangerBg,
    borderRadius: 14,
    flexDirection: "row",
    gap: spacing.xs,
    height: 46,
    justifyContent: "center"
  },
  signOutText: { color: colors.danger, fontFamily: typography.fonts.bold, fontSize: 14, lineHeight: 19 },
  version: { color: colors.subtleText, fontFamily: typography.fonts.medium, fontSize: 11, lineHeight: 14, textAlign: "center" }
});
