import { Platform } from "react-native";
import { colors } from "./colors";

export const driverTheme = {
  pageBg: "#F1F8FD",
  skyTop: "#D6EEFB",
  aqua: "#E3F3FC",
  aquaLine: "#D3E8F5",
  deep: "#0A3FA6",
  brandGradient: ["#0A3FA6", "#0A6FD2", "#00A6E8"] as const,
  fillGradient: ["#00B8F0", "#0A6FD2"] as const,
  amberBg: "#FFF1CF",
  amberText: "#8A6100",
  mintBg: "#DDF6EF",
  mintText: "#1B7F6F"
} as const;

export const sheetShadow = Platform.select({
  ios: { shadowColor: colors.deepShadow, shadowOpacity: 0.09, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  android: { elevation: 2 },
  default: { boxShadow: "0 8px 20px rgba(10, 63, 166, 0.09)" }
});
