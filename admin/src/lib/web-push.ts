import { DATA_MODE, apiRequest } from "@/services/api";

/**
 * Browser alerts for staff: a real notification on this computer or phone when an order arrives, even with the
 * dashboard closed. The server signs and sends them (see backend/app/services/push_service.py); this file only
 * registers the small service worker (public/sw.js) and tells the server which browser to alert.
 */

export type PushStatus =
  | "checking"
  | "unsupported" // this browser cannot show alerts (or the dashboard runs on demo data)
  | "unavailable" // the server has not been set up for alerts yet
  | "blocked" // the person said "Block" in the browser
  | "off"
  | "on";

interface PushConfig {
  enabled: boolean;
  publicKey: string | null;
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    DATA_MODE === "api" &&
    window.isSecureContext &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

// The server's public key arrives as base64url text; the browser wants it as bytes.
function keyToBytes(key: string): Uint8Array<ArrayBuffer> {
  const base64 = (key + "=".repeat((4 - (key.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

const fetchConfig = () => apiRequest<PushConfig>("admin/push/config");

// Pressing "Turn off" is remembered in this browser. Without it, the automatic re-link on opening the dashboard
// would switch alerts straight back on, because the browser's permission stays granted.
const OPTED_OUT_KEY = "nelma.push.optedOut";
const optedOut = (): boolean => {
  try {
    return window.localStorage.getItem(OPTED_OUT_KEY) === "1";
  } catch {
    return false;
  }
};
const setOptedOut = (value: boolean): void => {
  try {
    if (value) window.localStorage.setItem(OPTED_OUT_KEY, "1");
    else window.localStorage.removeItem(OPTED_OUT_KEY);
  } catch {
    // Private browsing can refuse storage; the worst case is alerts coming back after a reload.
  }
};

// The address this browser last registered, kept in memory so signing out can unlink it without any waiting.
let linkedEndpoint: string | null = null;

async function worker(): Promise<ServiceWorkerRegistration> {
  await navigator.serviceWorker.register("/sw.js");
  return navigator.serviceWorker.ready;
}

async function sendToServer(subscription: PushSubscription): Promise<void> {
  const json = subscription.toJSON();
  const p256dh = json.keys?.["p256dh"];
  const auth = json.keys?.["auth"];
  if (!json.endpoint || !p256dh || !auth) throw new Error("Incomplete subscription");
  await apiRequest<void>("admin/push/subscriptions", {
    method: "POST",
    body: { endpoint: json.endpoint, keys: { p256dh, auth } },
  });
  linkedEndpoint = json.endpoint;
}

export async function getPushStatus(): Promise<PushStatus> {
  if (!pushSupported()) return "unsupported";
  const config = await fetchConfig();
  if (!config.enabled) return "unavailable";
  if (Notification.permission === "denied") return "blocked";
  if (Notification.permission !== "granted" || optedOut()) return "off";
  const registration = await navigator.serviceWorker.getRegistration("/sw.js");
  const subscription = await registration?.pushManager.getSubscription();
  return subscription ? "on" : "off";
}

/** Asks permission (if needed), subscribes this browser, and tells the server. Throws a readable Error on failure. */
export async function enablePush(): Promise<void> {
  if (!pushSupported()) throw new Error("This browser cannot show alerts.");
  const config = await fetchConfig();
  if (!config.enabled || !config.publicKey)
    throw new Error("Alerts are not switched on for the server yet.");
  const permission = await Notification.requestPermission();
  if (permission === "denied")
    throw new Error(
      "Notifications are blocked. Allow them for this site in your browser settings.",
    );
  if (permission !== "granted")
    throw new Error("Alerts were not turned on because permission was not given.");
  const registration = await worker();
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyToBytes(config.publicKey),
    });
  }
  await sendToServer(subscription);
  setOptedOut(false);
}

export async function disablePush(): Promise<void> {
  if (!pushSupported()) return;
  // Remember the choice first, so even if the server is unreachable the alerts are not quietly switched back on.
  setOptedOut(true);
  const registration = await navigator.serviceWorker.getRegistration("/sw.js");
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  await apiRequest<void>("admin/push/subscriptions/remove", {
    method: "POST",
    body: { endpoint: subscription.endpoint },
  });
  linkedEndpoint = null;
  await subscription.unsubscribe();
}

/**
 * Runs when the dashboard opens. If this browser already allowed alerts, the server is told again, so the alerts
 * belong to whoever is signed in now and a browser the server dropped is re-added. Never asks for permission.
 */
export async function syncPush(): Promise<void> {
  try {
    if (!pushSupported() || Notification.permission !== "granted" || optedOut()) return;
    const config = await fetchConfig();
    if (!config.enabled || !config.publicKey) return;
    const registration = await worker();
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyToBytes(config.publicKey),
      });
    }
    await sendToServer(subscription);
  } catch {
    // Alerts are a convenience; the dashboard works the same without them.
  }
}

/**
 * Call just before signing out, so the next person on a shared computer does not get this person's alerts.
 * The request starts at once (while the sign-in is still valid), so the caller does not have to wait for it.
 */
export function unlinkPushFromThisBrowser(): Promise<void> {
  const endpoint = linkedEndpoint;
  if (!endpoint) return Promise.resolve();
  linkedEndpoint = null;
  return apiRequest<void>("admin/push/subscriptions/remove", {
    method: "POST",
    body: { endpoint },
    skipRefresh: true,
  }).catch(() => undefined); // Signing out must never be held up by this.
}

export async function sendTestAlert(): Promise<void> {
  await apiRequest<void>("admin/push/test", { method: "POST" });
}
