// Service Worker for Web Push Notifications — DiDauGio
// Place in web/public/sw.js (served from root)

/* eslint-disable no-restricted-globals */

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch {
    data = { title: "Di Đâu Giờ", body: "Bạn có thông báo mới" };
  }

  const title = data.title || "Di Đâu Giờ";
  const options = {
    body: data.body || "",
    icon: data.icon || "/logo192.png",
    badge: "/logo192.png",
    data: data.data || {},
    vibrate: [200, 100, 200],
    tag: "didaugio-notification",
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/admin/business";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // Otherwise open new window
        return self.clients.openWindow(targetUrl);
      })
  );
});
