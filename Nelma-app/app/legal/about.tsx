import Constants from "expo-constants";
import { router } from "expo-router";
import { ArrowLeft, Clock3, Mail, MapPin, Phone } from "lucide-react-native";
import { type ComponentType } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BrandMark, Card, Screen } from "../../components";
import { colors } from "../../constants/colors";
import { radius, spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";
import { useOrders } from "../../store/order-context";

type IconComponent = ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;

export default function AboutScreen() {
  const { t } = useTranslation();
  const { supportInfo } = useOrders();
  const rows: Array<{ icon: IconComponent; value: string }> = [
    { icon: MapPin, value: supportInfo.address },
    { icon: Clock3, value: supportInfo.operatingHours },
    { icon: Phone, value: supportInfo.phone },
    { icon: Mail, value: supportInfo.email }
  ].filter((row) => row.value);

  return (
    <Screen>
      <Pressable accessibilityRole="button" accessibilityLabel={t("Go back")} hitSlop={8} onPress={() => router.back()} style={styles.back}>
        <ArrowLeft color={colors.text} size={20} />
      </Pressable>
      <View style={styles.hero}>
        <View style={styles.mark}><BrandMark /></View>
        <Text style={styles.title}>{supportInfo.name}</Text>
        <Text style={styles.body}>{t("Clean 20-litre drinking water, delivered to your door in Arusha and NM-AIST.")}</Text>
      </View>
      <Card style={styles.card}>
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <View key={row.value} style={styles.row}>
              <Icon color={colors.primary} size={17} strokeWidth={2.2} />
              <Text style={styles.rowText}>{row.value}</Text>
            </View>
          );
        })}
      </Card>
      <Text style={styles.version}>{t("App version")} {Constants.expoConfig?.version ?? "1.0.0"}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { alignItems: "center", height: 36, justifyContent: "center", width: 36 },
  hero: { alignItems: "center", gap: spacing.sm },
  mark: { alignItems: "center", backgroundColor: colors.surfaceBlue, borderRadius: radius.pill, height: 72, justifyContent: "center", width: 72 },
  title: { color: colors.ink, fontFamily: typography.fonts.bold, fontSize: 22, lineHeight: 28, textAlign: "center" },
  body: { color: colors.mutedText, fontFamily: typography.fonts.regular, fontSize: typography.body, lineHeight: typography.lineHeight.body, textAlign: "center" },
  card: { gap: spacing.md },
  row: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  rowText: { color: colors.text, flex: 1, fontFamily: typography.fonts.medium, fontSize: typography.body, lineHeight: typography.lineHeight.body },
  version: { color: colors.subtleText, fontFamily: typography.fonts.medium, fontSize: typography.tiny, textAlign: "center" }
});
