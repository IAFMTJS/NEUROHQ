// Minimal service worker for Web Push subscription and delivery.
self.addEventListener("push", function (event) {
  const data = event.data?.json() ?? {};
  const title = data.title ?? "NEUROHQ";
  const options = {
    body: data.body ?? "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag ?? "neurohq",
    data: data.url ? { url: data.url } : {},
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = event.notification.data?.url ?? "/dashboard";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      if (clientList.length) clientList[0].focus();
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
