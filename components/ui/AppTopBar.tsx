import { router } from "expo-router";
import { useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/colors";
import { spacing, typography } from "../../constants/theme";
import { haptics } from "../../services/haptics";
import { useAuth } from "../../store/auth-context";

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

  const openHome = () => {
    haptics.selection();
    router.push(isDriver ? "/driver/(tabs)/deliveries" : "/(tabs)/home");
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