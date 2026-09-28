import { Platform } from "react-native";
import { colors } from "./colors";

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48
} as const;

export const radius = {
  xs: 8,
  sm: 12,
  md: 14,
  lg: 14,
  xl: 14,
  pill: 999
} as const;

export const fonts = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold"
} as const;

export const typography = {
  title: 34,
  display: 34,
  h1: 28,
  h2: 21,
  h3: 18,
  body: 15,
  small: 13,
  tiny: 11,
  fonts,
  lineHeight: {
    title: 40,
    h1: 34,
    h2: 28,
    h3: 24,
    body: 22,
    small: 18,
    tiny: 15
  }
} as const;

export const layout = {
  screenPadding: spacing.xl,
  maxPhoneWidth: 430,
  minTouchTarget: 44
} as const;

export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: colors.black,
      shadowOpacity: 0.05,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 }
    },
    android: { elevation: 2 },
    default: {}
  }),
  raised: Platform.select({
    ios: {
      shadowColor: colors.black,
      shadowOpacity: 0.08,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 }
    },
    android: { elevation: 3 },
    default: {}
  }),
  button: Platform.select({
    ios: {
      shadowColor: colors.primary,
      shadowOpacity: 0.22,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 }
    },
    android: { elevation: 2 },
    default: {}
  })
} as const;
