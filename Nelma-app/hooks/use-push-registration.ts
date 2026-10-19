import { router } from "expo-router";
import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { apiClient } from "../services/api";
import { registeredPushToken } from "../services/push-token";
import { useNotifications } from "../store/notification-context";

type PushData = { orderId?: string; type?: string };

// Registers this device for push alerts, so they arrive even when the app is closed (like a chat app),
// and opens the related delivery when an alert is tapped, including when the tap launched the app.
// Best effort: push may be unavailable (web, Expo Go, denied permission) and the app still works by polling.
// The native push modules load lazily so importing a layout never requires them.
export const usePushRegistration = (userId: string | undefined, role: "DRIVER" | "USER"): void => {
  const { loadNotifications } = useNotifications();

  useEffect(() => {
    if (!userId || Platform.OS === "web") return;
    let cancelled = false;
    let responseSub: { remove: () => void } | undefined;
    let receivedSub: { remove: () => void } | undefined;
    let appStateSub: { remove: () => void } | undefined;
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

        const open = (data: PushData | undefined) => {
          if (!data?.orderId) return;
          if (role === "DRIVER") router.push({ pathname: "/driver/delivery/[id]", params: { id: data.orderId } });
          else router.push({ pathname: "/orders/[id]", params: { id: data.orderId } });
        };
        responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
          open(response.notification.request.content.data as PushData | undefined);
        });
        // Alerts that arrive while the app is open also land in the inbox straight away.
        receivedSub = Notifications.addNotificationReceivedListener(() => void loadNotifications());

        // The tap that launched the app from closed happened before the listener above existed.
        const launch = await Notifications.getLastNotificationResponseAsync();
        if (launch && !cancelled) {
          open(launch.notification.request.content.data as PushData | undefined);
          await Notifications.clearLastNotificationResponseAsync?.();
        }

        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        const register = async () => {
          const token = await pushNotifications.getExpoPushToken(projectId);
          if (token && !cancelled && token !== registeredPushToken.get()) {
            await apiClient.post("/users/me/push-tokens", { token, platform: Platform.OS === "ios" ? "ios" : "android" });
            registeredPushToken.set(token);
          }
        };
        await register();
        // Coming back from Settings after switching alerts on (or after a failed attempt) registers then.
        appStateSub = AppState.addEventListener("change", (state) => {
          if (state === "active" && !registeredPushToken.get()) void register().catch(() => undefined);
        });
      } catch {
        // Ignore: alerts fall back to in-app refresh.
      }
    })();
    return () => {
      cancelled = true;
      responseSub?.remove();
      receivedSub?.remove();
      appStateSub?.remove();
    };
  }, [userId, role, loadNotifications]);
};
