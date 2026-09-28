type AnalyticsEvent =
  | "app_opened"
  | "login_success"
  | "registration_completed"
  | "order_started"
  | "order_created"
  | "payment_started"
  | "payment_completed"
  | "order_delivered";

type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

export const analytics = {
  track(event: AnalyticsEvent, payload: AnalyticsPayload = {}): void {
    if (__DEV__) {
      console.log("[analytics]", event, payload);
    }
  }
};
