// Migraine Forecast — Service Worker
// Handles push events and shows rich notifications

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// Push event — fired by server when risk crosses threshold
self.addEventListener("push", (e) => {
  if (!e.data) return;
  const data = e.data.json();
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/badge-72.png",
      tag: "migraine-risk",         // replaces duplicate notifications
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: data.url || "/" },
      actions: [
        { action: "view",    title: "See forecast" },
        { action: "dismiss", title: "Dismiss"      },
      ],
    })
  );
});

// Notification click — open app or focus existing tab
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  if (e.action === "dismiss") return;
  const targetUrl = e.notification.data?.url || "/";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin));
      if (existing) { existing.focus(); existing.navigate(targetUrl); }
      else self.clients.openWindow(targetUrl);
    })
  );
});
