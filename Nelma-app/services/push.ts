import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// While the app is open an alert still pops up and plays its sound, like a chat app.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

export type PushPermission = "granted" | "denied" | "undetermined";

export const pushNotifications = {
  async permission(): Promise<PushPermission> {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return "granted";
    return current.canAskAgain ? "undetermined" : "denied";
  },

  async requestPermission(): Promise<boolean> {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) {
      return true;
    }
    // Android stops showing the system prompt after two refusals; the person must use Settings then.
    if (!current.canAskAgain) {
      return false;
    }
    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  },

  // Must exist before any alert arrives, otherwise Android drops it into a silent default channel.
  async ensureChannel(): Promise<void> {
    if (Platform.OS !== "android") return;
    await Notifications.setNotificationChannelAsync("orders", {
      name: "Order and delivery alerts",
      importance: Notifications.AndroidImportance.MAX,
      sound: "default",
      vibrationPattern: [0, 250, 200, 250],
      enableVibrate: true,
      enableLights: true,
      lightColor: "#0B76C8",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      showBadge: true
    });
  },

  async getExpoPushToken(projectId?: string): Promise<string | null> {
    await this.ensureChannel();
    const granted = await this.requestPermission();
    if (!granted) {
      return null;
    }
    const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    return token.data;
  }
};
