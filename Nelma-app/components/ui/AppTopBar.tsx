import { router } from "expo-router";
import { Bell } from "lucide-react-native";
import { useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/colors";
import { spacing, typography } from "../../constants/theme";
import { haptics } from "../../services/haptics";
import { useAuth } from "../../store/auth-context";
import { useNotifications } from "../../store/notification-context";
import { LanguageToggle } from "./LanguageToggle";

const nelmaIcon = require("../../assets/nelma-icon.png");

const initialsForName = (name?: string | null): string => {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }

  return (parts[0] ?? "NE").slice(0, 2).toUpperCase().padEnd(2, "E");
};

export const NelmaIcon = ({ size = 31 }: { size?: number }) => (
  <Image accessibilityLabel="NELMA icon" source={nelmaIcon} resizeMode="contain" style={{ height: size, width: size }} />
);

export const AppTopBar = () => {
  const { user } = useAuth();
  const initials = useMemo(() => initialsForName(user?.fullName), [user?.fullName]);
  const isDriver = user?.role === "DRIVER";
  const { unreadCount } = useNotifications();

  const openHome = () => {
    haptics.selection();
    router.push(isDriver ? "/driver/(tabs)/deliveries" : "/(tabs)/home");
  };

  const openNotifications = () => {
    haptics.selection();
    router.push("/(tabs)/notifications");
  };

  const openProfile = () => {
    haptics.selection();
    router.push(isDriver ? "/driver/(tabs)/profile" : "/(tabs)/profile");
  };

  return (
    <View style={styles.topBar}>
      <Pressable
        accessibilityLabel={isDriver ? "Deliveries" : "Home"}
        accessibilityRole="button"
        onPress={openHome}
        style={({ pressed }) => [styles.brandLockup, { opacity: pressed ? 0.72 : 1 }]}
      >
        <NelmaIcon size={31} />
        <Text numberOfLines={1} style={styles.brandText}>
          {isDriver ? "DISPATCH" : "NELMA"}
        </Text>
      </Pressable>

      <View style={styles.topActions}>
        <LanguageToggle />
        {!isDriver ? (
          <Pressable
            accessibilityLabel={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
            accessibilityRole="button"
            hitSlop={6}
            onPress={openNotifications}
            style={({ pressed }) => [styles.bellButton, { opacity: pressed ? 0.72 : 1 }]}
          >
            <Bell color={colors.black} size={19} strokeWidth={2.2} />
            {unreadCount ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}
        <Pressable
          accessibilityLabel="Profile"
          accessibilityRole="button"
          onPress={openProfile}
          style={({ pressed }) => [styles.initialsButton, { opacity: pressed ? 0.72 : 1 }]}
        >
          <Text style={styles.initialsText}>{initials}</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderBottomColor: "#E9EEF2",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    height: 66,
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    zIndex: 3
  },
  brandLockup: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minWidth: 0
  },
  brandText: {
    color: colors.black,
    fontFamily: typography.fonts.bold,
    fontSize: 20,
    letterSpacing: 0,
    lineHeight: 25
  },
  topActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  bellButton: {
    alignItems: "center",
    borderColor: "#CBD7E1",
    borderRadius: 14,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 40
  },
  badge: {
    alignItems: "center",
    backgroundColor: colors.danger,
    borderColor: colors.white,
    borderRadius: 9,
    borderWidth: 1.5,
    height: 18,
    justifyContent: "center",
    minWidth: 18,
    paddingHorizontal: 3,
    position: "absolute",
    right: -5,
    top: -5
  },
  badgeText: {
    color: colors.white,
    fontFamily: typography.fonts.bold,
    fontSize: 10,
    lineHeight: 12
  },
  initialsButton: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: "#CBD7E1",
    borderRadius: 14,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    minWidth: 52,
    paddingHorizontal: spacing.sm
  },
  initialsText: {
    color: colors.black,
    fontFamily: typography.fonts.bold,
    fontSize: 14,
    lineHeight: 18
  }
});