import { Redirect, router } from "expo-router";
import { ArrowRight, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { BottomActionBar, Button, ErrorState, Header, LoadingScreen, PaymentMethodCard, Screen } from "../../components";
import { useOrders } from "../../store/order-context";

export default function PaymentMethodScreen() {
  const { clearDraft, draft, paymentMethods, loadPaymentMethods, setPaymentMethod } = useOrders();
  const [loadingMethods, setLoadingMethods] = useState(false);

  useEffect(() => {
    if (!paymentMethods.length) {
      setLoadingMethods(true);
      loadPaymentMethods().finally(() => setLoadingMethods(false));
    }
  }, [loadPaymentMethods, paymentMethods.length]);

  // With a single way to pay there is nothing to choose: select it and go straight to the review.
  const usable = paymentMethods.filter((method) => method.enabled !== false);
  const onlyMethod = usable.length === 1 ? usable[0] : null;
  useEffect(() => {
    if (onlyMethod && draft.orderType && draft.deliveryAddress) {
      setPaymentMethod(onlyMethod.id);
      router.replace("/order/summary");
    }
  }, [onlyMethod, draft.orderType, draft.deliveryAddress, setPaymentMethod]);

  if (!draft.orderType) {
    return <Redirect href="/(tabs)/home" />;
  }

  if (!draft.deliveryAddress) {
    return <Redirect href="/order/address" />;
  }

  if (loadingMethods || onlyMethod) {
    return <LoadingScreen message="Loading payment methods" />;
  }

  if (!paymentMethods.length) {
    return <Screen><ErrorState message="No payment methods are currently available from NELMA." onAction={loadPaymentMethods} /></Screen>;
  }

  return (
    <Screen safeBottom={false}>
      <Header title="Payment Method" subtitle="Choose how you want this order to be paid." />
      {[...usable].sort((left, right) => Number(right.type === "cash") - Number(left.type === "cash")).map((method) => (
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
