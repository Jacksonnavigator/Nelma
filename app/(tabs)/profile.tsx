import { router } from "expo-router";
import { ChevronRight, CircleHelp, KeyRound, LogOut, MapPin, Pencil, SlidersHorizontal } from "lucide-react-native";
import { type ComponentType } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppTopBar, Screen } from "../../components";
import { colors } from "../../constants/colors";
import { radius, spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";
import { haptics } from "../../services/haptics";
import { useAuth } from "../../store/auth-context";
import { initialsFromName } from "../../utils/format";

const jotformBlue = "#009FE3";

type IconComponent = ComponentType<{
  color?: string;
  size?: number;
  strokeWidth?: number;
}>;

type ProfileOption = {
  accent: string;
  description: string;
  icon: IconComponent;
  label: string;
  route: Parameters<typeof router.push>[0];
};

const profileOptions: ProfileOption[] = [
  {
    accent: "#DFF8F4",
    description: "Save and edit Arusha or NM-AIST delivery spots.",
    icon: MapPin,
    label: "Saved Addresses",
    route: "/profile/addresses"
  },
  {
    accent: "#FFF6DE",
    description: "Change language and notification preferences.",
    icon: SlidersHorizontal,
    label: "Settings",
    route: "/profile/settings"
  },
  {
    accent: "#FFF6DE",
    description: "Change your password and keep access secure.",
    icon: KeyRound,
    label: "Security",
    route: "/profile/security"
  },
  {
    accent: "#E9F7FF",
    description: "Get help with orders, addresses, and payments.",
    icon: CircleHelp,
    label: "Help",
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

export default function ProfileScreen() {
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
            <Text numberOfLines={1} style={styles.name}>{user?.fullName ?? t("NELMA Customer")}</Text>
            <Text numberOfLines={1} style={styles.meta}>{user?.phone || user?.email || t("Arusha and NM-AIST service area")}</Text>
          </View>

          <Pressable accessibilityLabel={t("Edit profile")} accessibilityRole="button" hitSlop={8} onPress={() => router.push("/profile/edit")} style={styles.editButton}>
            <Pencil color={jotformBlue} size={18} strokeWidth={2.4} />
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("Profile")}</Text>
          <Text style={styles.sectionSubtitle}>{t("Your key account tools for NELMA delivery.")}</Text>
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
                <View style={[styles.optionIconWrap, { backgroundColor: option.accent }]}> 
                  <Icon color={option.accent === "#FFF6DE" ? colors.warning : jotformBlue} size={22} strokeWidth={2.3} />
                </View>
                <View style={styles.optionCopy}>
                  <Text style={styles.optionLabel}>{t(option.label)}</Text>
                  <Text numberOfLines={2} style={styles.optionDescription}>{t(option.description)}</Text>
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
  safe: {
    backgroundColor: colors.white
  },
  screen: {
    backgroundColor: colors.white,
    flex: 1
  },
  content: {
    paddingBottom: 132,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg
  },
  identityCard: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: "#D3DFE8",
    borderRadius: 14,
    borderWidth: 1,
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
    backgroundColor: jotformBlue,
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
    color: colors.black,
    fontFamily: typography.fonts.bold,
    fontSize: 21,
    lineHeight: 28
  },
  meta: {
    color: colors.black,
    fontFamily: typography.fonts.regular,
    fontSize: 14,
    lineHeight: 20
  },
  editButton: {
    alignItems: "center",
    backgroundColor: "#E9F7FF",
    borderRadius: radius.pill,
    height: 38,
    justifyContent: "center",
    width: 38
  },
  sectionHeader: {
    alignItems: "center",
    marginTop: spacing.xl
  },
  sectionTitle: {
    color: colors.black,
    fontFamily: typography.fonts.bold,
    fontSize: 23,
    letterSpacing: 0,
    lineHeight: 30,
    textAlign: "center"
  },
  sectionSubtitle: {
    color: colors.black,
    fontFamily: typography.fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
    textAlign: "center"
  },
  optionsList: {
    gap: spacing.md,
    marginTop: spacing.lg
  },
  optionRow: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: "#D3DFE8",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 82,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm
  },
  optionIconWrap: {
    alignItems: "center",
    borderRadius: 10,
    height: 54,
    justifyContent: "center",
    width: 54
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
  optionDescription: {
    color: colors.black,
    fontFamily: typography.fonts.regular,
    fontSize: 13,
    lineHeight: 18
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
