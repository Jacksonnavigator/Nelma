// Fallback support contacts, used only until the dashboard's System Settings reach the app.
export const appConfig = {
  name: "NELMA Drinking Water",
  shortName: "NELMA",
  currency: "TZS",
  supportPhone: process.env.EXPO_PUBLIC_SUPPORT_PHONE?.trim() || "+255 719 081 401",
  supportWhatsapp: process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP?.trim() || "+255 762 307 425",
  supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim() || "nelma.water@nm-aist.ac.tz",
  address: "WISE-Futures Office, near the cafeteria, NM-AIST, Tengeru, Arusha"
} as const;
