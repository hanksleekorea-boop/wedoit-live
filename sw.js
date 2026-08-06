"use strict";
const VERSION = "v26.4.0";
const CACHE = "wedoit-" + VERSION;
const SHELL = ["./", "./index.html", "./service-v2610.css", "./service-v2610.js", "./service-v2620.css", "./service-v2620.js", "./service-v2630.css", "./service-v2630.js", "./service-v2640.css", "./service-v2640.js", "./service-v2640-p0.css", "./service-v2640-p0.js", "./service-v2640-p1-rhythm.css", "./service-v2640-p1-rhythm.js", "./service-v2640-p1-pause.css", "./service-v2640-p1-pause.js", "./service-v2640-p1-repeat-days.css", "./service-v2640-p1-repeat-days.js", "./service-v2640-p1-timezone.css", "./service-v2640-p1-timezone.js", "./service-v2640-i18n.js", "./app-shell-v260a1.js", "./core-v260a1.js", "./dashboard-v260a1.js", "./social-v260a2.js", "./identity-v260a3.js", "./rls-policy-v260a4.js", "./backend-emulator-v260a5.js", "./authenticated-sync-v260a6.js", "./retry-policy-v260a7.js", "./circle-lab-v260a8.js", "./backend-schema-v260a4.sql", "./qr.png"];
self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => Promise.allSettled(SHELL.map(url => cache.add(new Request(url, { cache: "reload" }))))).catch(() => {}));
});
self.addEventListener("activate", event => event.waitUntil((async () => {
  try { await Promise.all((await caches.keys()).filter(key => key !== CACHE).map(key => caches.delete(key))); } catch (_) {}
  await self.clients.claim();
})()));
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  let url; try { url = new URL(request.url); } catch (_) { return; }
  if (url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    try {
      const fresh = await fetch(request);
      if (fresh.ok) caches.open(CACHE).then(cache => cache.put(request, fresh.clone())).catch(() => {});
      return fresh;
    } catch (_) {
      const cached = await caches.match(request);
      if (cached) return cached;
      if (request.mode === "navigate") return (await caches.match("./index.html")) || new Response("오프라인 사본이 없습니다.", { status: 503 });
      return new Response("offline", { status: 503 });
    }
  })());
});
