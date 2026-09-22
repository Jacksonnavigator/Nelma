import { router } from "expo-router";
import { Bell, ChevronRight, CircleHelp, KeyRound, LogOut, Pencil, ShieldCheck, UserRound } from "lucide-react-native";
import { type ComponentType } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppTopBar, Screen } from "../../../components";
import { colors } from "../../../constants/colors";
import { radius, spacing, typography } from "../../../constants/theme";
import { useTranslation } from "../../../hooks/use-translation";
import { haptics } from "../../../services/haptics";
import { useAuth } from "../../../store/auth-context";
import { initialsFromName } from "../../../utils/format";

type IconComponent = ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;

type DriverProfileOption = {
  accent: string;
  icon: IconComponent;
  label: string;
  route: Parameters<typeof router.push>[0];
};

const profileOptions: DriverProfileOption[] = [
  {
    accent: "#E9F7FF",
    icon: UserRound,
    label: "Personal Info",
    route: "/driver/profile/edit"
  },
  {
    accent: "#DFF8F4",
    icon: Bell,
    label: "Notifications",
    route: "/driver/(tabs)/notifications"
  },
  {
    accent: "#FFF6DE",
    icon: KeyRound,
    label: "Security",
    route: "/driver/profile/security"
  },
  {
    accent: "#E9F7FF",
    icon: CircleHelp,
    label: "Help & Support",
    route: "/support"
  }
];

const twoLetterInitials = (name?: string | null) => {
  const initials = initialsFromName(name ?? "NELMA");
  if (initials.length >= 2) {
    return initials.slice(0, 2);
  }
  return (name ?? "NELMA").trim().slice(0, 2).toUpperCase().padEnd(2, "E");
};

export default function DriverProfileScreen() {
  const { logout, user } = useAuth();
  const { t } = useTranslation();
  const initials = twoLetterInitials(user?.fullName);

  const signOut = async () => {
    haptics.selection();
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <Screen safeBottom={false} contentContainerStyle={styles.screen} keyboard={false} padded={false} scroll={false} style={styles.safe}>
      <AppTopBar />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.identityCard}>
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}

          <View style={styles.identityCopy}>
            <Text numberOfLines={1} style={styles.name}>{user?.fullName ?? t("NELMA Driver")}</Text>
            <Text numberOfLines={1} style={styles.meta}>{user?.phone || user?.email || t("Arusha and NM-AIST service area")}</Text>
            <View style={styles.rolePill}>
              <ShieldCheck color={colors.primary} size={14} strokeWidth={2.5} />
              <Text style={styles.roleText}>{t("Role: Driver")}</Text>
            </View>
          </View>

          <Pressable accessibilityLabel={t("Edit profile")} accessibilityRole="button" hitSlop={8} onPress={() => router.push("/driver/profile/edit")} style={styles.editButton}>
            <Pencil color={colors.primary} size={18} strokeWidth={2.4} />
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEyebrow}>{t("ACCOUNT")}</Text>
          <Text style={styles.sectionTitle}>{t("Driver Profile")}</Text>
        </View>

        <View style={styles.optionsList}>
          {profileOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Pressable
                key={option.label}
                accessibilityRole="button"
                onPress={() => router.push(option.route)}
                style={({ pressed }) => [styles.optionRow, { opacity: pressed ? 0.7 : 1 }]}
              >
                <View style={styles.optionIconWrap}>
                  <Icon color={colors.primary} size={20} strokeWidth={2.3} />
                </View>
                <View style={styles.optionCopy}>
                  <Text style={styles.optionLabel}>{t(option.label)}</Text>
                </View>
                <ChevronRight color={colors.mutedText} size={18} />
              </Pressable>
            );
          })}
        </View>

        <Pressable accessibilityRole="button" onPress={signOut} style={({ pressed }) => [styles.signOutButton, { opacity: pressed ? 0.76 : 1 }]}>
          <LogOut color={colors.danger} size={20} strokeWidth={2.4} />
          <Text style={styles.signOutText}>{t("Sign Out")}</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.white },
  screen: { backgroundColor: colors.white, flex: 1 },
  content: {
    paddingBottom: 132,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg
  },
  identityCard: {
    alignItems: "center",
    backgroundColor: colors.black,
    borderRadius: 18,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md
  },
  avatar: {
    borderRadius: 16,
    height: 68,
    width: 68
  },
  avatarFallback: {
    alignItems: "center",
    backgroundColor: colors.primary,
    justifyContent: "center"
  },
  avatarInitials: {
    color: colors.white,
    fontFamily: typography.fonts.bold,
    fontSize: 22,
    letterSpacing: 0,
    lineHeight: 28
  },
  identityCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0
  },
  name: {
    color: colors.white,
    fontFamily: typography.fonts.bold,
    fontSize: 21,
    lineHeight: 28
  },
  meta: {
    color: "#D5E3ED",
    fontFamily: typography.fonts.regular,
    fontSize: 14,
    lineHeight: 20
  },
  rolePill: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 28,
    paddingHorizontal: spacing.sm
  },
  roleText: {
    color: colors.accent,
    fontFamily: typography.fonts.bold,
    fontSize: typography.tiny,
    lineHeight: typography.lineHeight.tiny,
    textTransform: "uppercase"
  },
  editButton: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    height: 38,
    justifyContent: "center",
    width: 38
  },
  sectionHeader: {
    alignItems: "flex-start",
    gap: spacing.xs,
    marginTop: spacing.xl
  },
  sectionEyebrow: {
    color: colors.primary,
    fontFamily: typography.fonts.bold,
    fontSize: typography.tiny,
    letterSpacing: 0.8,
    lineHeight: typography.lineHeight.tiny
  },
  sectionTitle: {
    color: colors.black,
    fontFamily: typography.fonts.bold,
    fontSize: 23,
    letterSpacing: 0,
    lineHeight: 30,
    textAlign: "left"
  },
  optionsList: {
    marginTop: spacing.md
  },
  optionRow: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 62,
    paddingVertical: spacing.sm
  },
  optionIconWrap: {
    alignItems: "center",
    backgroundColor: colors.surfaceBlue,
    borderRadius: 9,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  optionCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0
  },
  optionLabel: {
    color: colors.black,
    fontFamily: typography.fonts.bold,
    fontSize: 16,
    lineHeight: 22
  },
  signOutButton: {
    alignItems: "center",
    borderColor: colors.dangerBg,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    height: 47,
    justifyContent: "center",
    marginTop: spacing.xl
  },
  signOutText: {
    color: colors.danger,
    fontFamily: typography.fonts.bold,
    fontSize: 15,
    lineHeight: 20
  }
});