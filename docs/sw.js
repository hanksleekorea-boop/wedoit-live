"use strict";

const VERSION = "v29.0.0";
const SHELL_REVISION = "20260904-happyscan-stage3-r1";
const CACHE = `wedoit-shell-${VERSION}-${SHELL_REVISION}`;
const SHELL = [
  "./happyscan-stage2.mjs", "./happyscan-stage2-ui.mjs", "./happyscan-stage3.mjs", "./happyscan-stage3-ui.mjs",
  "./happyscan-app.mjs", "./happyscan-data.mjs", "./happyscan-store.mjs", "./happyscan-stage1.mjs", "./happyscan-stage1-ui.mjs", "./happyscan.css", "./happyscan-layout.css", "./happyscan-mark.svg", "./practice.html", "./happyscan-practice.css", "./happyscan-practice.js",
  "./", "./index.html", "./manifest.webmanifest", "./pwa-icon-192.png", "./pwa-icon-512.png",
  "./service-v2610.css", "./service-v2610.js", "./service-v2620.css", "./service-v2620.js",
  "./service-v2630.css", "./service-v2630.js", "./service-v2640.css", "./service-v2640.js",
  "./service-v2640-p0.css", "./service-v2640-p0.js", "./service-v2640-p1-rhythm.css", "./service-v2640-p1-rhythm.js",
  "./service-v2640-p1-pause.css", "./service-v2640-p1-pause.js", "./service-v2640-p1-repeat-days.css", "./service-v2640-p1-repeat-days.js",
  "./service-v2640-p1-timezone.css", "./service-v2640-p1-timezone.js", "./service-v2640-p1-date-correction.css", "./service-v2640-p1-date-correction.js",
  "./service-v2640-p1-note-mood.css", "./service-v2640-p1-note-mood.js", "./service-v2640-p1-note-quick.css", "./service-v2640-p1-note-quick.js",
  "./service-v2640-p1-record-search.css", "./service-v2640-p1-record-search.js", "./service-v2640-p1-notification-test.css", "./service-v2640-p1-notification-test.js",
  "./service-v2640-p1-reminder-schedule.css", "./service-v2640-p1-reminder-schedule.js", "./service-v2640-p1-quiet-hours.css", "./service-v2640-p1-quiet-hours.js",
  "./service-v2640-p1-backup.css", "./service-v2640-p1-backup.js", "./service-v2640-p1-weekly.css", "./service-v2640-p1-weekly.js",
  "./service-v2640-p1-monthly.css", "./service-v2640-p1-monthly.js", "./service-v2640-p1-copy-week.css", "./service-v2640-p1-copy-week.js",
  "./service-v2640-p1-insight-reasons.css", "./service-v2640-p1-insight-reasons.js", "./service-v2640-p1-insight-toggle.css", "./service-v2640-p1-insight-toggle.js",
  "./service-v2640-p1-insight-unknown.css", "./service-v2640-p1-insight-unknown.js", "./service-v2640-i18n.js",
  "./app-shell-v260a1.js", "./core-v260a1.js", "./storage-journal-v2700.js", "./dashboard-v260a1.js", "./social-v260a2.js", "./identity-v260a3.js",
  "./rls-policy-v260a4.js", "./backend-emulator-v260a5.js", "./authenticated-sync-v260a6.js", "./retry-policy-v260a7.js", "./circle-lab-v260a8.js",
  "./cloud-social-v2710.js", "./cloud-social-v2710.css", "./supabase-v2.112.4.umd.js", "./supabase-LICENSE.txt",
  "./content-v2711.js", "./content-v2712.js", "./content-install-v2712.js", "./service-v2712-loader.js", "./service-v2712-content.js", "./service-v2712-content.css",
  "./service-v2700.css", "./service-v2700.js", "./service-v2700-errors.css", "./service-v2700-errors.js", "./service-v2700-pc.css", "./service-v2700-pc.js", "./service-v2700-restore.css", "./service-v2700-restore.js", "./service-v2700-delete.css", "./service-v2700-delete.js", "./service-v2700-legal.css", "./service-v2700-legal.js",
  "./legal/legal.css", "./legal/terms.html", "./legal/privacy.html", "./legal/delete.html", "./legal/support.html", "./legal/status.html", "./legal/changelog.html",
  "./backend-schema-v260a4.sql", "./qr.png"
];
const SHELL_URLS = new Set(SHELL.map((entry) => new URL(entry, self.location.href).href));

async function installCompleteShell() {
  await caches.delete(CACHE);
  try {
    const cache = await caches.open(CACHE);
    const requests = SHELL.map((url) => new Request(url, { cache: "reload" }));
    await cache.addAll(requests);
    const stored = await Promise.all(requests.map((request) => cache.match(request)));
    if (stored.some((response) => !response || !response.ok)) throw new Error("shell-verification-failed");
  } catch (error) {
    await caches.delete(CACHE);
    throw error;
  }
}

async function removeRetiredShells() {
  const keys = await caches.keys();
  const retired = keys.filter((key) => key !== CACHE && (key.startsWith("wedoit-shell-") || /^wedoit-v\d/.test(key)));
  await Promise.all(retired.map((key) => caches.delete(key)));
  return retired;
}

self.addEventListener("install", (event) => {
  event.waitUntil(installCompleteShell());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  const message = event.data || {};
  if (message.type === "CHECK_UPDATE_CLIENTS") {
    event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(clients=>{
      const own=clients.filter(c=>c.url.startsWith(self.registration.scope));
      event.ports[0]?.postMessage({otherClients:own.filter(c=>c.id!==event.source?.id).length});
    }));
    return;
  }
  if (message.type === "ACTIVATE_UPDATE") {
    event.waitUntil(self.skipWaiting());
    return;
  }
  if (message.type === "SHELL_READY" && message.version === VERSION) {
    event.waitUntil((async () => {
      const removed = await removeRetiredShells();
      event.source?.postMessage?.({ type: "SHELL_CLEANED", version: VERSION, removed: removed.length });
    })());
    return;
  }
  if (message.type === "GET_VERSION") {
    const reply = { type: "VERSION", version: VERSION, revision: SHELL_REVISION, cache: CACHE };
    if (event.ports?.[0]) event.ports[0].postMessage(reply);
    else event.source?.postMessage?.(reply);
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  let url;
  try { url = new URL(request.url); } catch (_) { return; }
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith("/runtime-config.json")) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (request.mode === "navigate") {
      const requested = new URL(request.url); requested.search = "";
      const shell = await cache.match(requested.href) || (requested.pathname.endsWith("/") ? await cache.match("./index.html") : null);
      if (shell) return shell;
      try { return await fetch(request); } catch (_) { return new Response("오프라인 사본이 없습니다.", { status: 503 }); }
    }
    if (SHELL_URLS.has(url.href)) {
      const cached = await cache.match(request);
      if (cached) return cached;
    }
    try {
      const fresh = await fetch(request);
      if (fresh.ok && SHELL_URLS.has(url.href)) await cache.put(request, fresh.clone());
      return fresh;
    } catch (_) {
      return (await cache.match(request)) || new Response("offline", { status: 503 });
    }
  })());
});
