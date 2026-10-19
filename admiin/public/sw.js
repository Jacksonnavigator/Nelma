// NELMA dashboard service worker. Its only job is to show order alerts that arrive from the server
// while the dashboard is closed or in another tab, and to open the right page when one is clicked.
// It caches nothing and reads no pages, so it cannot serve stale or private data.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// Only paths on this site are followed, so an alert can never send staff to another website.
const safePath = (value) =>
  typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/";

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const tag = typeof data.tag === "string" && data.tag ? data.tag : undefined;
  event.waitUntil(
    self.registration.showNotification(typeof data.title === "string" ? data.title : "NELMA", {
      body: typeof data.body === "string" ? data.body : "",
      icon: "/icon-192.png",
      badge: "/favicon-32x32.png",
      tag,
      // A newer alert with the same tag replaces the old one but still makes a sound.
      renotify: Boolean(tag),
      data: { url: safePath(data.url) },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(safePath(event.notification.data && event.notification.data.url), self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windows) {
        if (new URL(client.url).origin === self.location.origin) {
          await client.focus();
          if ("navigate" in client) await client.navigate(target).catch(() => undefined);
          return;
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});
