import { router } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";
import { apiClient } from "../services/api";
import { registeredPushToken } from "../services/push-token";

type PushData = { orderId?: string; type?: string };

// Registers this device for push alerts and opens the related delivery when an alert is tapped.
// Best effort: push may be unavailable (web, Expo Go, denied permission) and the app still works by polling.
// The native push modules load lazily so importing a layout never requires them.
export const usePushRegistration = (userId: string | undefined, role: "DRIVER" | "USER"): void => {
  useEffect(() => {
    if (!userId || Platform.OS === "web") return;
    let cancelled = false;
    let subscription: { remove: () => void } | undefined;
    void (async () => {
      try {
        const { default: Constants, ExecutionEnvironment } = await import("expo-constants");
        // Expo Go (SDK 53+) no longer ships remote push; loading expo-notifications there logs an error.
        if (cancelled || Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return;
        const [Notifications, { pushNotifications }] = await Promise.all([
          import("expo-notifications"),
          import("../services/push")
        ]);
        if (cancelled) return;
        subscription = Notifications.addNotificationResponseReceivedListener((response) => {
          const data = response.notification.request.content.data as PushData | undefined;
          if (!data?.orderId) return;
          if (role === "DRIVER") router.push({ pathname: "/driver/delivery/[id]", params: { id: data.orderId } });
          else router.push({ pathname: "/orders/[id]", params: { id: data.orderId } });
        });
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        const token = await pushNotifications.getExpoPushToken(projectId);
        if (token && !cancelled) {
          await apiClient.post("/users/me/push-tokens", { token, platform: Platform.OS === "ios" ? "ios" : "android" });
          registeredPushToken.set(token);
        }
      } catch {
        // Ignore: alerts fall back to in-app refresh.
      }
    })();
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [userId, role]);
};
