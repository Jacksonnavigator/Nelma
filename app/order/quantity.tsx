import { Redirect, router } from "expo-router";
import { ArrowRight, X } from "lucide-react-native";
import { Image, StyleSheet, Text, View } from "react-native";
import { BottomActionBar, Button, CheckoutProgress, Header, PriceDisplay, QuantityStepper, Screen } from "../../components";
import { colors } from "../../constants/colors";
import { radius, spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";
import { useOrders } from "../../store/order-context";
import { calculateOrderPricing } from "../../utils/order";

export default function QuantityScreen() {
  const { clearDraft, draft, pricingCatalog, setQuantity } = useOrders();
  const { t } = useTranslation();

  if (!draft.orderType) {
    return <Redirect href="/(tabs)/home" />;
  }

  const product = pricingCatalog[draft.orderType];
  const productImage = product.image === "new_bottle" ? require("../../assets/Bottle.jpeg") : require("../../assets/refill.jpg");
  const pricing = calculateOrderPricing(draft.orderType, draft.quantity, [], pricingCatalog);

  return (
    <Screen padded={false} safeBottom={false} contentContainerStyle={styles.screen}>
      <View style={styles.body}>
        <CheckoutProgress current={2} />
        <Header title="How many do you need?" subtitle="Select the number of 20L water units for this delivery." />

        <View style={styles.productPanel}>
          <View style={styles.artWrap}>
            <Image source={productImage} resizeMode="contain" style={styles.productImage} />
          </View>
          <View style={styles.productCopy}>
            <Text style={styles.productLabel}>{t(product.label)}</Text>
            <Text style={styles.productName}>{t(product.productName)}</Text>
            <PriceDisplay amount={pricing.unitPrice} label="Unit price" />
          </View>
        </View>

        <View style={styles.stepperPanel}>
          <Text style={styles.caption}>{t("Quantity")}</Text>
          <QuantityStepper value={draft.quantity} onChange={setQuantity} />
        </View>
        <PriceDisplay amount={pricing.total} label="Total" emphasize align="center" />
      </View>

      <BottomActionBar
        buttonTitle="Delivery Address"
        icon={ArrowRight}
        leading={<Button title="Cancel" variant="ghost" icon={X} onPress={() => { clearDraft(); router.replace("/(tabs)/home"); }} />}
        onPress={() => router.push("/order/address")}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 0,
    justifyContent: "space-between"
  },
  body: {
    gap: spacing.lg,
    padding: spacing.xl
  },
  productPanel: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.lg,
    padding: spacing.lg
  },
  artWrap: {
    alignItems: "center",
    backgroundColor: colors.surfaceBlue,
    borderRadius: radius.lg,
    height: 126,
    justifyContent: "center",
    width: 118
  },
  productImage: {
    height: 136,
    width: 110
  },
  productCopy: {
    flex: 1,
    gap: spacing.xs
  },
  productLabel: {
    color: colors.text,
    fontFamily: typography.fonts.bold,
    fontSize: typography.h3,
    lineHeight: typography.lineHeight.h3
  },
  productName: {
    color: colors.mutedText,
    fontFamily: typography.fonts.regular,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small
  },
  stepperPanel: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.xl,
    padding: spacing.lg
  },
  caption: {
    color: colors.secondary,
    fontFamily: typography.fonts.bold,
    fontSize: typography.tiny,
    lineHeight: typography.lineHeight.tiny,
    textAlign: "center",
    textTransform: "uppercase"
  },
});
