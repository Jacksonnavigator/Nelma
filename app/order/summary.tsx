import { Redirect, router } from "expo-router";
import { CheckCircle2 } from "lucide-react-native";
import { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import { Button, Header, ReceiptSummary, Screen } from "../../components";
import { colors } from "../../constants/colors";
import { catalogItem } from "../../constants/pricing";
import { spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";
import { useNetwork } from "../../store/network-context";
import { useOrders } from "../../store/order-context";
import { calculateOrderPricing } from "../../utils/order";

export default function OrderSummaryScreen() {
  const { draft, paymentMethods, pricingCatalog, loadPaymentMethods, submitOrder, submitting, error } = useOrders();
  const { isConnected, isInternetReachable } = useNetwork();
  const { t } = useTranslation();

  useEffect(() => {
    if (!paymentMethods.length) {
      loadPaymentMethods();
    }
  }, [loadPaymentMethods, paymentMethods.length]);

  const selectedMethod = paymentMethods.find((method) => method.id === draft.paymentMethodId);
  const offline = !isConnected || isInternetReachable === false;

  if (!draft.orderType) {
    return <Redirect href="/(tabs)/home" />;
  }

  if (!draft.deliveryAddress) {
    return <Redirect href="/order/address" />;
  }

  if (!draft.paymentMethodId) {
    return <Redirect href="/order/payment" />;
  }

  const product = catalogItem(pricingCatalog, draft.orderType);
  const pricing = calculateOrderPricing(draft.orderType, draft.quantity, draft.charges ?? [], pricingCatalog);

  const placeOrder = async () => {
    if (offline) {
      return;
    }
    const order = await submitOrder();
    router.replace({ pathname: "/order/success", params: { id: order.id } });
  };

  return (
    <Screen>
      <Header title="Order Summary" subtitle="Review delivery, payment, and pricing before placing the order." />
      <ReceiptSummary
        orderType={draft.orderType}
        orderTypeLabel={product.label}
        productName={product.productName}
        quantity={pricing.quantity}
        unitPrice={pricing.unitPrice}
        subtotal={pricing.subtotal}
        charges={pricing.charges}
        total={pricing.total}
        deliveryAddress={draft.deliveryAddress}
        deliverySchedule={draft.deliverySchedule}
        customerRemarks={draft.customerRemarks}
        paymentMethodLabel={selectedMethod?.label}
        showRemarks={false}
        showTitle={false}
        onEditItems={() => router.push("/order/quantity")}
        onEditDelivery={() => router.push("/order/address")}
        onChangePayment={() => router.push("/order/payment")}
      />
      {error ? <Text style={styles.error}>{t(error)}</Text> : null}
      {offline ? <Text style={styles.error}>{t("Connect to the internet before submitting this order.")}</Text> : null}
      <Button title="Place Order" icon={CheckCircle2} onPress={placeOrder} disabled={offline} loading={submitting} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: {
    color: colors.danger,
    fontSize: typography.small,
    fontWeight: "800",
    lineHeight: 18,
    marginTop: spacing.xs
  }
});
