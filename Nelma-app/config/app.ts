// Fallback support contacts, used only until the dashboard's System Settings reach the app.
export const appConfig = {
  name: "NELMA Drinking Water",
  shortName: "NELMA",
  currency: "TZS",
  supportPhone: process.env.EXPO_PUBLIC_SUPPORT_PHONE?.trim() || "+255 700 000 000",
  supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim() || "support@nelma.co.tz"
} as const;
