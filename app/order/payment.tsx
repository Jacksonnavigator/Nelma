import { Redirect, router } from "expo-router";
import { ArrowRight, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { BottomActionBar, Button, ErrorState, Header, LoadingScreen, PaymentMethodCard, Screen } from "../../components";
import { colors } from "../../constants/colors";
import { spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";
import { useOrders } from "../../store/order-context";

export default function PaymentMethodScreen() {
  const { clearDraft, draft, paymentMethods, loadPaymentMethods, setPaymentMethod } = useOrders();
  const { t } = useTranslation();
  const [loadingMethods, setLoadingMethods] = useState(false);

  useEffect(() => {
    if (!paymentMethods.length) {
      setLoadingMethods(true);
      loadPaymentMethods().finally(() => setLoadingMethods(false));
    }
  }, [loadPaymentMethods, paymentMethods.length]);

  if (!draft.orderType) {
    return <Redirect href="/(tabs)/home" />;
  }

  if (!draft.deliveryAddress) {
    return <Redirect href="/order/address" />;
  }

  if (loadingMethods) {
    return <LoadingScreen message="Loading payment methods" />;
  }

  if (!paymentMethods.length) {
    return <Screen><ErrorState message="No payment methods are currently available from NELMA." onAction={loadPaymentMethods} /></Screen>;
  }

  return (
    <Screen safeBottom={false}>
      <Header title="Payment Method" subtitle="Choose how you want this order to be paid." />
      <Text style={styles.note}>{t("The app initializes payment through the backend. No payment-provider secrets are stored in the mobile app.")}</Text>
      {[...paymentMethods].sort((left, right) => Number(right.type === "cash") - Number(left.type === "cash")).map((method) => (
        <PaymentMethodCard key={method.id} method={method} selected={draft.paymentMethodId === method.id} onPress={() => setPaymentMethod(method.id)} />
      ))}
      <BottomActionBar
        buttonTitle="Review Order"
        icon={ArrowRight}
        leading={<Button title="Cancel" variant="ghost" icon={X} onPress={() => { clearDraft(); router.replace("/(tabs)/home"); }} />}
        disabled={!draft.paymentMethodId}
        onPress={() => router.push("/order/summary")}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: {
    color: colors.mutedText,
    fontSize: typography.small,
    lineHeight: 19,
    marginBottom: spacing.xs
  }
});
