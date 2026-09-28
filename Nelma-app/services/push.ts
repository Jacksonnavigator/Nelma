import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

export const pushNotifications = {
  async requestPermission(): Promise<boolean> {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) {
      return true;
    }
    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  },

  async getExpoPushToken(projectId?: string): Promise<string | null> {
    const granted = await this.requestPermission();
    if (!granted) {
      return null;
    }
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("orders", {
        name: "Order updates",
        importance: Notifications.AndroidImportance.HIGH
      });
    }
    const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    return token.data;
  }
};
