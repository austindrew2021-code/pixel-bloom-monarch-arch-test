/* Spoonful Body Sync — keeps Fuel pulling after the kitchen is closed. */
const CACHE = "spoonful-sync";
const PENDING = "/__spoonful-pending-sync";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

async function markPending() {
  const cache = await caches.open(CACHE);
  await cache.put(PENDING, new Response(String(Date.now()), { headers: { "content-type": "text/plain" } }));
}

async function pingFuel() {
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of windows) {
    client.postMessage({ type: "spoonful-sync" });
  }
  if (windows.length > 0) return;
  await markPending();
  try {
    await self.registration.showNotification("Fuel kept current", {
      body: "Watch numbers updated while you were away. Open the kitchen to see tonight.",
      tag: "spoonful-fuel",
      renotify: false,
      data: { url: "/" },
    });
  } catch {
    // Notifications may be blocked; pending flag still catches up on next open.
  }
}

self.addEventListener("periodicsync", (event) => {
  if (event.tag === "spoonful-fuel") event.waitUntil(pingFuel());
});

self.addEventListener("sync", (event) => {
  if (event.tag === "spoonful-fuel") event.waitUntil(pingFuel());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      if (windows[0]) {
        await windows[0].focus();
        return;
      }
      await self.clients.openWindow("/");
    })(),
  );
});
