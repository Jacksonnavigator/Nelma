import { Platform } from "react-native";
import { colors } from "./colors";

export const driverTheme = {
  pageBg: "#F1F8FD",
  skyTop: "#D6EEFB",
  aqua: "#E3F3FC",
  aquaLine: "#D3E8F5",
  deep: "#0A3FA6",
  night: "#062461",
  brandGradient: ["#0A3FA6", "#0A6FD2", "#00A6E8"] as const,
  // Darker, calmer blue for full-bleed headers so white type and the progress ring stay crisp.
  headerGradient: ["#062461", "#0A3FA6", "#0A6FD2"] as const,
  fillGradient: ["#00B8F0", "#0A6FD2"] as const,
  glass: "rgba(255,255,255,0.14)",
  glassLine: "rgba(255,255,255,0.22)",
  onDark: "rgba(255,255,255,0.78)",
  amberBg: "#FFF1CF",
  amberText: "#8A6100",
  mintBg: "#DDF6EF",
  mintText: "#1B7F6F",
  mintBright: "#7CF2C8"
} as const;

export const sheetShadow = Platform.select({
  ios: { shadowColor: colors.deepShadow, shadowOpacity: 0.09, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  android: { elevation: 2 },
  default: { boxShadow: "0 8px 20px rgba(10, 63, 166, 0.09)" }
});

// For the one card per screen that floats over a header.
export const liftShadow = Platform.select({
  ios: { shadowColor: colors.deepShadow, shadowOpacity: 0.18, shadowRadius: 28, shadowOffset: { width: 0, height: 14 } },
  android: { elevation: 8 },
  default: { boxShadow: "0 14px 32px rgba(6, 36, 97, 0.18)" }
});
