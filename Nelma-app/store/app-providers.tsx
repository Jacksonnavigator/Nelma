import { Fragment, PropsWithChildren, useEffect } from "react";
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context";
import { analytics } from "../services/analytics";
import { AuthProvider, useAuth } from "./auth-context";
import { NetworkProvider } from "./network-context";
import { NotificationProvider } from "./notification-context";
import { OrderProvider } from "./order-context";

// Tapping a push alert is handled once, by usePushRegistration in the customer and driver tab layouts.
const AppOpenTracker = () => {
  useEffect(() => {
    analytics.track("app_opened");
  }, []);
  return null;
};

// Remount all account-owned state when identity changes, including on logout.
export const SessionProviders = ({ children }: PropsWithChildren) => {
  const { status, user } = useAuth();
  return (
    <Fragment key={status === "authenticated" ? user?.id : status}>
      <OrderProvider>
        <NotificationProvider>{children}</NotificationProvider>
      </OrderProvider>
    </Fragment>
  );
};

export const AppProviders = ({ children }: PropsWithChildren) => (
  <SafeAreaProvider initialMetrics={initialWindowMetrics}>
    <NetworkProvider>
      <AuthProvider>
        <AppOpenTracker />
        <SessionProviders>{children}</SessionProviders>
      </AuthProvider>
    </NetworkProvider>
  </SafeAreaProvider>
);
