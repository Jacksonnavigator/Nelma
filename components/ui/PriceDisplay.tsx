import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "../../hooks/use-translation";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/theme";
import { formatCurrency } from "../../utils/format";

type PriceDisplayProps = {
  amount: number;
  label?: string;
  emphasize?: boolean;
  align?: "left" | "right" | "center";
};

export const PriceDisplay = ({ amount, label, emphasize = false, align = "left" }: PriceDisplayProps) => {
  const { t } = useTranslation();
  return (
    <View>
      {label ? <Text style={[styles.label, { textAlign: align }]}>{t(label)}</Text> : null}
      <Text style={[styles.price, emphasize ? styles.emphasized : null, { textAlign: align }]}>{formatCurrency(amount)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    color: colors.mutedText,
    fontFamily: typography.fonts.medium,
    fontSize: typography.tiny,
    lineHeight: typography.lineHeight.tiny,
    textTransform: "uppercase"
  },
  price: {
    color: colors.text,
    fontFamily: typography.fonts.bold,
    fontSize: typography.body,
    lineHeight: typography.lineHeight.body
  },
  emphasized: {
    color: colors.primary,
    fontSize: typography.h2,
    lineHeight: typography.lineHeight.h2
  }
});
