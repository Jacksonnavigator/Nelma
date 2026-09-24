import { ShieldCheck } from "lucide-react-native";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/colors";
import { radius, spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";
import { repositories } from "../../repositories";

// Shown while an order is on the way. The customer reads this code to the driver at handover.
export const DeliveryCodeCard = ({ orderId }: { orderId: string }) => {
  const { t } = useTranslation();
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    repositories.orders.getDeliveryCode(orderId).then((value) => { if (!cancelled) setCode(value); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [orderId]);

  if (!code) return null;
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <ShieldCheck color={colors.primary} size={20} />
        <Text style={styles.title}>{t("Your delivery code")}</Text>
      </View>
      <View style={styles.digits}>
        {code.split("").map((digit, index) => (
          <View key={index} style={styles.digitBox}><Text style={styles.digit}>{digit}</Text></View>
        ))}
      </View>
      <Text style={styles.hint}>{t("Tell this code to your driver when your water arrives. Do not share it before.")}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surfaceBlue },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  title: { color: colors.text, fontFamily: typography.fonts.bold, fontSize: 16, lineHeight: 22 },
  digits: { flexDirection: "row", gap: spacing.xs },
  digitBox: { flex: 1, minHeight: 60, alignItems: "center", justifyContent: "center", borderRadius: radius.md, backgroundColor: colors.white },
  digit: { color: colors.primary, fontFamily: typography.fonts.bold, fontSize: 32, lineHeight: 40, fontVariant: ["tabular-nums"] },
  hint: { color: colors.mutedText, fontFamily: typography.fonts.regular, fontSize: 13, lineHeight: 19 }
});
