import { useLocalSearchParams } from "expo-router";
import { ChevronRight, Mail, MessageCircle, Phone } from "lucide-react-native";
import { type ComponentType, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Header, Screen } from "../../components";
import { useOrders } from "../../store/order-context";
import { colors } from "../../constants/colors";
import { radius, spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";
import { haptics } from "../../services/haptics";

type IconComponent = ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;

const digits = (value: string) => value.replace(/[^\d]/g, "");

export default function ContactScreen() {
  const { t } = useTranslation();
  const { order: orderNumber } = useLocalSearchParams<{ order?: string }>();
  const { supportInfo } = useOrders();
  const [error, setError] = useState<string | null>(null);
  // WhatsApp can be a different number, set per build; otherwise it is the support phone from the dashboard.
  const whatsapp = process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP?.trim() || supportInfo.phone;
  const topic = orderNumber ? `${t("About my order")} ${orderNumber}` : t("Help with NELMA");

  const open = async (url: string, fallback: string) => {
    haptics.selection();
    setError(null);
    await Linking.openURL(url).catch(() => setError(fallback));
  };

  const channels: Array<{ key: string; icon: IconComponent; tint: string; title: string; value: string; onPress: () => void }> = [
    {
      key: "call",
      icon: Phone,
      tint: colors.primary,
      title: "Call us",
      value: supportInfo.phone,
      onPress: () => void open(`tel:+${digits(supportInfo.phone)}`, "Unable to open the phone app. Please call the number shown.")
    },
    {
      key: "whatsapp",
      icon: MessageCircle,
      tint: "#1FA855",
      title: "WhatsApp",
      value: whatsapp,
      onPress: () => void open(`https://wa.me/${digits(whatsapp)}?text=${encodeURIComponent(topic)}`, "Unable to open WhatsApp. Please message the number shown.")
    },
    {
      key: "email",
      icon: Mail,
      tint: "#7C5CE0",
      title: "Email",
      value: supportInfo.email,
      onPress: () => void open(`mailto:${supportInfo.email}?subject=${encodeURIComponent(topic)}`, "Unable to open your email app. Please write to the address shown.")
    }
  ];

  return (
    <Screen>
      <Header title="Contact NELMA" subtitle="Pick the easiest way to reach us." />
      {orderNumber ? <Text style={styles.orderNote}>{t("About my order")} {orderNumber}</Text> : null}
      <View style={styles.list}>
        {channels.map((channel) => {
          const Icon = channel.icon;
          return (
            <Pressable key={channel.key} accessibilityRole="button" onPress={channel.onPress} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.75 : 1 }]}>
              <View style={[styles.icon, { backgroundColor: `${channel.tint}1A` }]}>
                <Icon color={channel.tint} size={20} strokeWidth={2.3} />
              </View>
              <View style={styles.copy}>
                <Text style={styles.title}>{t(channel.title)}</Text>
                <Text numberOfLines={1} style={styles.value}>{channel.value}</Text>
              </View>
              <ChevronRight color={colors.subtleText} size={18} />
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={styles.error}>{t(error)}</Text> : null}
      {supportInfo.operatingHours ? <Text style={styles.hours}>{t("Open")}: {supportInfo.operatingHours}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  orderNote: {
    backgroundColor: colors.surfaceBlue,
    borderRadius: radius.md,
    color: colors.text,
    fontFamily: typography.fonts.medium,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  list: { gap: spacing.xs },
  row: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  icon: { alignItems: "center", borderRadius: 12, height: 42, justifyContent: "center", width: 42 },
  copy: { flex: 1, gap: 2, minWidth: 0 },
  title: { color: colors.text, fontFamily: typography.fonts.bold, fontSize: typography.body, lineHeight: 20 },
  value: { color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: typography.small, lineHeight: typography.lineHeight.small },
  error: {
    backgroundColor: colors.dangerBg,
    borderRadius: radius.md,
    color: colors.danger,
    fontFamily: typography.fonts.bold,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small,
    padding: spacing.sm
  },
  hours: { color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: typography.small, lineHeight: typography.lineHeight.small, textAlign: "center" }
});
