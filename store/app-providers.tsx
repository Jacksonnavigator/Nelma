import { router } from "expo-router";
import { Fragment, PropsWithChildren, useEffect } from "react";
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context";
import { analytics } from "../services/analytics";
import { AuthProvider, useAuth } from "./auth-context";
import { CartProvider } from "./cart-context";
import { FavoritesProvider } from "./favorites-context";
import { NetworkProvider } from "./network-context";
import { NotificationProvider } from "./notification-context";
import { OrderProvider } from "./order-context";

const NotificationDeepLinker = () => {
  useEffect(() => {
    analytics.track("app_opened");
    let cancelled = false;
    let removeListener: (() => void) | undefined;

    void import("expo-constants").then(({ default: Constants }) => {
      if (cancelled || Constants.appOwnership === "expo") {
        return undefined;
      }
      return import("expo-notifications").then((Notifications) => {
        if (cancelled) {
          return;
        }
        const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
          const orderId = response.notification.request.content.data?.orderId;
          if (typeof orderId === "string") {
            router.push({ pathname: "/orders/[id]", params: { id: orderId } });
          }
        });
        removeListener = () => subscription.remove();
      });
    }).catch(() => undefined);

    return () => {
      cancelled = true;
      removeListener?.();
    };
  }, []);

  return null;
};

// Remount all account-owned state when identity changes, including on logout.
export const SessionProviders = ({ children }: PropsWithChildren) => {
  const { status, user } = useAuth();
  return (
    <Fragment key={status === "authenticated" ? user?.id : status}>
      <CartProvider>
        <FavoritesProvider>
          <OrderProvider>
            <NotificationProvider>
              <NotificationDeepLinker />
              {children}
            </NotificationProvider>
          </OrderProvider>
        </FavoritesProvider>
      </CartProvider>
    </Fragment>
  );
};

export const AppProviders = ({ children }: PropsWithChildren) => (
  <SafeAreaProvider initialMetrics={initialWindowMetrics}>
    <NetworkProvider>
      <AuthProvider>
        <SessionProviders>{children}</SessionProviders>
      </AuthProvider>
    </NetworkProvider>
  </SafeAreaProvider>
);
