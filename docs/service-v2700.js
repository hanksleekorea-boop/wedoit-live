(function () {
  "use strict";

  const candidate = Object.freeze({
    version: "v27.0.0",
    inheritedFrom: "v26.4.0",
    schemaVersion: 6,
    networkAdded: false,
    dataToolsLazy: true,
    appReadyFallbackMs: 5000,
    pwaUpdateMode: "user-confirmed",
    offlineDataLocation: "local-only",
    secondaryFeaturesOnDemand: true,
  });

  const dataTools = Object.freeze([
    ["style", "./service-v2700-restore.css"],
    ["script", "./service-v2700-restore.js"],
    ["style", "./service-v2700-delete.css"],
    ["script", "./service-v2700-delete.js"],
    ["style", "./service-v2700-legal.css"],
    ["script", "./service-v2700-legal.js"],
  ]);
  const pcTools = Object.freeze(["./service-v2700-pc.js"]);
  let pcToolsPromise = null;
  const loadPcTools = () => {
    if (pcToolsPromise) return pcToolsPromise;
    pcToolsPromise = pcTools.reduce((chain, source) => chain.then(() => loadScript(source)), Promise.resolve());
    return pcToolsPromise;
  };
  let dataToolsPromise = null;
  const appendStyles = () => dataTools.filter(([kind]) => kind === "style").forEach(([, source]) => {
    if (document.querySelector(`link[data-v270-tool="${source}"]`)) return;
    const node = document.createElement("link");
    node.rel = "stylesheet";
    node.href = source;
    node.dataset.v270Tool = source;
    document.head.append(node);
  });
  const loadScript = (source) => new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-v270-tool="${source}"]`);
    if (existing?.dataset.loaded === "true") return resolve();
    if (existing) existing.remove();
    const node = document.createElement("script");
    node.src = source;
    node.defer = true;
    node.dataset.v270Tool = source;
    node.addEventListener("load", resolve, { once: true });
    node.addEventListener("error", () => reject(new Error(`data-tool-load-failed:${source}`)), { once: true });
    node.addEventListener("load", () => { node.dataset.loaded = "true"; }, { once: true });
    document.head.append(node);
  });
  const loadStyle = (source) => new Promise((resolve, reject) => {
    const existing = document.querySelector(`link[data-v270-feature="${source}"]`);
    if (existing?.dataset.loaded === "true") return resolve();
    if (existing) existing.remove();
    const node = document.createElement("link");
    node.rel = "stylesheet";
    node.href = source;
    node.dataset.v270Feature = source;
    node.addEventListener("load", () => { node.dataset.loaded = "true"; resolve(); }, { once: true });
    node.addEventListener("error", () => reject(new Error(`feature-style-load-failed:${source}`)), { once: true });
    document.head.append(node);
  });
  const secondaryGroups = Object.freeze({
    foundation: Object.freeze(["./service-v2640.js", "./service-v2640-p0.js", "./service-v2640-i18n.js"]),
    goals: Object.freeze(["./service-v2640-p1-rhythm.js", "./service-v2640-p1-pause.js", "./service-v2640-p1-repeat-days.js", "./service-v2640-p1-timezone.js", "./service-v2640-p1-date-correction.js", "./service-v2640-p1-note-mood.js", "./service-v2640-p1-note-quick.js", "./service-v2640-p1-record-search.js", "./service-v2640-p1-weekly.js", "./service-v2640-p1-monthly.js", "./service-v2640-p1-copy-week.js"]),
    insights: Object.freeze(["./service-v2640-p1-insight-reasons.js", "./service-v2640-p1-insight-toggle.js", "./service-v2640-p1-insight-unknown.js"]),
    me: Object.freeze(["./service-v2640-p1-notification-test.js", "./service-v2640-p1-reminder-schedule.js", "./service-v2640-p1-quiet-hours.js", "./service-v2640-p1-backup.js"]),
  });
  const secondaryStyles = Object.freeze({
    foundation: Object.freeze(["./service-v2640.css", "./service-v2640-p0.css"]),
    goals: Object.freeze(["./service-v2640-p1-rhythm.css", "./service-v2640-p1-pause.css", "./service-v2640-p1-repeat-days.css", "./service-v2640-p1-timezone.css", "./service-v2640-p1-date-correction.css", "./service-v2640-p1-note-mood.css", "./service-v2640-p1-note-quick.css", "./service-v2640-p1-record-search.css", "./service-v2640-p1-weekly.css", "./service-v2640-p1-monthly.css", "./service-v2640-p1-copy-week.css"]),
    insights: Object.freeze(["./service-v2640-p1-insight-reasons.css", "./service-v2640-p1-insight-toggle.css", "./service-v2640-p1-insight-unknown.css"]),
    me: Object.freeze(["./service-v2640-p1-notification-test.css", "./service-v2640-p1-reminder-schedule.css", "./service-v2640-p1-quiet-hours.css", "./service-v2640-p1-backup.css"]),
  });
  const secondaryPromises = new Map();
  const waitForAppReady = () => new Promise((resolve, reject) => {
    if (window.__WEDOIT__?.ready && window.__WEDOIT__?.store) return resolve(true);
    let checks = 0;
    const timer = setInterval(() => {
      checks += 1;
      if (window.__WEDOIT__?.ready && window.__WEDOIT__?.store) { clearInterval(timer); resolve(true); }
      else if (checks >= 3000) { clearInterval(timer); reject(new Error("secondary-app-ready-timeout")); }
    }, 25);
  });
  const loadSecondaryGroup = (name) => {
    if (secondaryPromises.has(name)) return secondaryPromises.get(name);
    const scripts = secondaryGroups[name] || [];
    const foundation = name === "foundation" ? waitForAppReady() : Promise.all([waitForAppReady(), loadSecondaryGroup("foundation")]);
    const styles = Promise.all((secondaryStyles[name] || []).map(loadStyle));
    const promise = Promise.all([foundation, styles]).then(() => scripts.reduce((chain, source) => chain.then(() => loadScript(source)), Promise.resolve())).then(() => {
      document.documentElement.dataset[`v270${name[0].toUpperCase()}${name.slice(1)}Ready`] = "true";
      window.dispatchEvent(new CustomEvent("wedoit:v270-feature-group-ready", { detail: { name } }));
      return true;
    }).catch((error) => {
      // A failed download must not poison all later visits to this tab.
      secondaryPromises.delete(name);
      throw error;
    });
    secondaryPromises.set(name, promise);
    return promise;
  };
  const loadPageFeatures = (page) => page === "goals" ? loadSecondaryGroup("goals") : page === "insights" ? loadSecondaryGroup("insights") : page === "me" ? Promise.all([loadSecondaryGroup("me"), loadDataTools()]) : page === "together" ? loadSecondaryGroup("foundation") : Promise.resolve(true);
  const loadAllFeatures = () => Promise.all(["goals", "insights", "me"].map(loadSecondaryGroup));
  const waitForBackupAnchor = () => new Promise((resolve, reject) => {
    let checks = 0;
    const inspect = () => {
      if (document.querySelector("#serviceBackupSection")) return resolve(true);
      if (++checks >= 3000) return reject(new Error("backup-panel-ready-timeout"));
      setTimeout(inspect, 25);
    };
    inspect();
  });
  const loadDataTools = () => {
    if (dataToolsPromise) return dataToolsPromise;
    document.documentElement.dataset.v270DataTools = "loading";
    appendStyles();
    // Restore/delete mount after their actual panel anchor, not merely after a
    // downloaded script. This is required when 'me' is the first visited tab.
    dataToolsPromise = loadSecondaryGroup("me").then(waitForBackupAnchor)
      .then(() => dataTools.filter(([kind]) => kind === "script").reduce((chain, [, source]) => chain.then(() => loadScript(source)), Promise.resolve()))
      .then(() => {
        document.documentElement.dataset.v270DataTools = "ready";
        window.dispatchEvent(new CustomEvent("wedoit:v270-data-tools-ready"));
        return true;
      })
      .catch((error) => {
        document.documentElement.dataset.v270DataTools = "failed";
        dataToolsPromise = null;
        throw error;
      });
    return dataToolsPromise;
  };

  const pcMedia = matchMedia("(min-width:1024px)");
  const preparePc = () => { if (pcMedia.matches) loadPcTools().catch(() => {}); };
  pcMedia.addEventListener?.("change", preparePc);
  preparePc();
  window.addEventListener("wedoit:service-page", (event) => loadPageFeatures(event.detail?.page).catch((error) => window.__WEDOIT_V270_ERRORS__?.report("feature-load", error, { recordsSafe: true })));
  Object.defineProperty(window, "__WEDOIT_V270_LOADER__", {
    configurable: false,
    enumerable: false,
    writable: false,
    value: Object.freeze({ groups: secondaryGroups, styles: secondaryStyles, loadGroup: loadSecondaryGroup, loadPage: loadPageFeatures, loadAll: loadAllFeatures }),
  });
  if (navigator.webdriver && ["127.0.0.1", "localhost"].includes(location.hostname)) {
    queueMicrotask(() => loadAllFeatures().catch((error) => window.__WEDOIT_V270_ERRORS__?.report("test-feature-load", error, { recordsSafe: true })));
  }

  document.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest('[data-service-nav="me"]')) {
      loadDataTools().catch(() => {});
    }
  }, { capture: true });

  setTimeout(() => {
    const app = window.__WEDOIT__;
    if (!app?.store || app.ready) return;
    app.ready = true;
    document.documentElement.dataset.wedoitReady = "true";
    document.documentElement.dataset.wedoitDashboardDelayed = "true";
    app.store.report("warn", "기본 화면 준비가 늦어져 기록 기능을 먼저 열었습니다. 현재 기록은 이 기기에 그대로 남아 있습니다.");
    window.dispatchEvent(new CustomEvent("wedoit:v270-ready-fallback"));
  }, candidate.appReadyFallbackMs);

  const modalOpeners = new WeakMap();
  let lastOutsideFocus = document.activeElement;
  const sheetSpecs = Object.freeze([
    { id: "goalSheet", open: "openGoal", close: "closeGoal", title: "goalSheetTitle" },
    { id: "reviewSheet", open: "openReview", close: "closeReview", title: "reviewSheetTitle" },
    { id: "notificationSheet", open: "openNotification", close: "closeNotification", title: "notificationSheetTitle" },
  ]);
  const focusable = (root) => [...root.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
    .filter((node) => !node.hidden && getComputedStyle(node).display !== "none" && getComputedStyle(node).visibility !== "hidden");
  const focusModalTitle = (root, titleId) => {
    const title = root.querySelector(`#${titleId}`);
    if (!title) return;
    title.tabIndex = -1;
    title.focus({ preventScroll: true });
  };
  const activeSheet = () => sheetSpecs.map((spec) => ({ spec, node: document.querySelector(`#${spec.id}`) })).find(({ node }) => node?.classList.contains("on"));
  document.addEventListener("focusin", (event) => {
    if (!(event.target instanceof Element) || event.target.closest("dialog[open],.sheet.on")) return;
    lastOutsideFocus = event.target;
  });
  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    for (const spec of sheetSpecs) {
      if (event.target.closest(`#${spec.open}`)) {
        const sheet = document.querySelector(`#${spec.id}`);
        if (sheet) modalOpeners.set(sheet, event.target.closest(`#${spec.open}`));
        // Finish focus management in this click's microtask, before a following
        // Tab can be handled. A timer could steal focus back after that Tab.
        queueMicrotask(() => sheet?.classList.contains("on") && focusModalTitle(sheet, spec.title));
      }
      if (event.target.closest(`#${spec.close}`)) {
        const sheet = document.querySelector(`#${spec.id}`);
        setTimeout(() => modalOpeners.get(sheet)?.focus?.({ preventScroll: true }), 0);
      }
    }
  }, { capture: true });
  document.addEventListener("keydown", (event) => {
    const current = activeSheet();
    if (!current) return;
    if (event.key === "Escape") {
      event.preventDefault();
      document.querySelector(`#${current.spec.close}`)?.click();
      return;
    }
    if (event.key !== "Tab") return;
    const nodes = focusable(current.node);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }, { capture: true });
  const enhanceDialog = (dialog) => {
    if (!(dialog instanceof HTMLDialogElement) || dialog.dataset.v270A11y === "true") return;
    dialog.dataset.v270A11y = "true";
    const watch = new MutationObserver(() => {
      if (dialog.open && dialog.dataset.v270Open !== "true") {
        dialog.dataset.v270Open = "true";
        modalOpeners.set(dialog, lastOutsideFocus);
        const titleId = dialog.getAttribute("aria-labelledby");
        if (titleId) queueMicrotask(() => focusModalTitle(dialog, titleId));
      } else if (!dialog.open && dialog.dataset.v270Open === "true") {
        delete dialog.dataset.v270Open;
        queueMicrotask(() => modalOpeners.get(dialog)?.focus?.({ preventScroll: true }));
      }
    });
    watch.observe(dialog, { attributes: true, attributeFilter: ["open"] });
  };
  const dialogObserver = new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach((node) => {
    if (!(node instanceof Element)) return;
    if (node.matches("dialog")) enhanceDialog(node);
    node.querySelectorAll?.("dialog").forEach(enhanceDialog);
  })));
  document.querySelectorAll("dialog").forEach(enhanceDialog);
  dialogObserver.observe(document.body, { childList: true, subtree: true });
  Object.defineProperty(window, "__WEDOIT_V270_A11Y__", {
    configurable: false,
    enumerable: false,
    writable: false,
    value: Object.freeze({ version: "v27.0.0-a11y", sheetSpecs, focusable }),
  });

  const UPDATE_GUARD_KEY = "wedoit.update-guard.v1";
  const waitForApp = async (timeoutMs = 10000) => {
    const started = Date.now();
    while (!window.__WEDOIT__?.store || !window.__WEDOIT__?.ready) {
      if (Date.now() - started > timeoutMs) throw new Error("app-not-ready");
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return window.__WEDOIT__;
  };
  const digestText = async (text) => {
    const bytes = new TextEncoder().encode(text);
    if (!crypto?.subtle) throw new Error("secure-digest-unavailable");
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  };
  const captureRecordGuard = async () => {
    const app = await waitForApp();
    const json = app.store.exportJson();
    return { version: 1, algorithm: "SHA-256", digest: await digestText(json), bytes: new Blob([json]).size };
  };
  const readGuard = () => {
    try { return JSON.parse(sessionStorage.getItem(UPDATE_GUARD_KEY) || "null"); } catch (_) { return null; }
  };
  const writeGuard = (guard) => {
    sessionStorage.setItem(UPDATE_GUARD_KEY, JSON.stringify(guard));
    if (!sessionStorage.getItem(UPDATE_GUARD_KEY)) throw new Error("update-guard-storage-failed");
  };
  const verifyRecordGuard = async (guard) => {
    if (!guard?.digest) return false;
    const current = await captureRecordGuard();
    return current.digest === guard.digest && current.bytes === guard.bytes;
  };
  const createPwaPanel = () => {
    const panel = document.createElement("section");
    panel.id = "pwaSafetyStatus";
    panel.className = "v270-pwa-status";
    panel.dataset.serviceView = "me";
    panel.setAttribute("aria-labelledby", "pwaSafetyTitle");
    panel.hidden = true;
    panel.innerHTML = '<div><b id="pwaSafetyTitle">오프라인 사용</b><p id="pwaSafetyMessage" aria-live="polite"></p></div><div class="v270-pwa-actions"><button id="pwaCheckUpdate" type="button" class="ghost">업데이트 확인</button><button id="pwaActivateUpdate" type="button" class="secondary" hidden>기록 확인 후 새 버전 사용</button><button id="pwaReloadUpdate" type="button" class="secondary" hidden>새 버전으로 다시 열기</button></div>';
    document.querySelector("#storageStatus")?.insertAdjacentElement("afterend", panel);
    return panel;
  };
  const pwaPanel = createPwaPanel();
  const pwaMessage = pwaPanel.querySelector("#pwaSafetyMessage");
  const checkButton = pwaPanel.querySelector("#pwaCheckUpdate");
  const activateButton = pwaPanel.querySelector("#pwaActivateUpdate");
  const reloadButton = pwaPanel.querySelector("#pwaReloadUpdate");
  let pwaRegistration = null;
  let switching = false;
  const setPwaState = (state, message) => {
    const urgent = ["update-available", "switching", "reload-ready"].includes(state);
    pwaPanel.dataset.urgent = String(urgent);
    if (urgent) delete pwaPanel.dataset.serviceView;
    else pwaPanel.dataset.serviceView = "me";
    pwaPanel.hidden = false;
    pwaPanel.dataset.state = state;
    pwaMessage.textContent = message;
    activateButton.hidden = state !== "update-available";
    reloadButton.hidden = state !== "reload-ready";
    checkButton.hidden = ["switching", "reload-ready"].includes(state);
    [checkButton, activateButton, reloadButton].forEach((button) => { button.disabled = state === "switching"; });
  };
  const announceWaiting = () => setPwaState("update-available", "새 앱 셸 준비가 끝났습니다. 현재 기록을 확인한 뒤 사용자가 눌렀을 때만 전환합니다.");
  const sendShellReady = () => navigator.serviceWorker.controller?.postMessage?.({ type: "SHELL_READY", version: candidate.version });
  const completeReloadGuard = async () => {
    const guard = readGuard();
    if (!guard || guard.phase !== "controller-activated") return false;
    if (!(await verifyRecordGuard(guard))) {
      setPwaState("blocked", "업데이트 전후 기록 확인값이 달라 이전 앱 셸을 보존했습니다. 기록을 JSON으로 내보낸 뒤 다시 확인해 주세요.");
      return true;
    }
    sessionStorage.removeItem(UPDATE_GUARD_KEY);
    sendShellReady();
    setPwaState(navigator.onLine ? "ready" : "offline", navigator.onLine ? "새 앱 셸과 기록을 확인했습니다. 오프라인에서도 이 기기에 바로 저장됩니다." : "오프라인입니다. 새 기록은 이 기기에 바로 저장되며 연결돼도 밖으로 보내지지 않습니다.");
    return true;
  };
  const activateWaitingUpdate = async (registration = pwaRegistration) => {
    if (switching || !registration?.waiting) return false;
    switching = true;
    setPwaState("switching", "현재 기록의 복구 가능 여부를 확인하고 있습니다…");
    try {
      const app = await waitForApp();
      if (app?.store?.whenSaved && !(await app.store.whenSaved())) throw new Error("pending-records-not-flushed");
      const recordGuard = await captureRecordGuard();
      writeGuard({ ...recordGuard, phase: "prepared", createdAt: new Date().toISOString() });
      const changed = new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("controller-change-timeout")), 15000);
        navigator.serviceWorker.addEventListener("controllerchange", () => { clearTimeout(timer); resolve(); }, { once: true });
      });
      registration.waiting.postMessage({ type: "ACTIVATE_UPDATE", guardVersion: 1 });
      await changed;
      const guard = readGuard();
      if (!(await verifyRecordGuard(guard))) throw new Error("record-guard-mismatch");
      writeGuard({ ...guard, phase: "controller-activated" });
      setPwaState("reload-ready", "기록이 그대로임을 확인했습니다. 버튼을 누르면 새 앱 셸로 다시 엽니다.");
      return true;
    } catch (error) {
      setPwaState("blocked", "안전 확인을 완료하지 못해 자동으로 다시 열지 않았습니다. 현재 기록은 그대로이며 먼저 JSON 백업을 만들 수 있습니다.");
      return false;
    } finally {
      switching = false;
    }
  };
  const registerPwaSafety = async () => {
    if (!("serviceWorker" in navigator) || !window.isSecureContext) {
      setPwaState("unsupported", "이 주소에서는 설치·오프라인 준비를 사용할 수 없습니다. HTTPS 공개 주소에서 이용해 주세요.");
      return null;
    }
    try {
      pwaRegistration = await navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" });
      await waitForApp();
      if (await completeReloadGuard()) return pwaRegistration;
      if (pwaRegistration.waiting) announceWaiting();
      else {
        setPwaState(navigator.onLine ? "ready" : "offline", navigator.onLine ? "오프라인 사용 준비를 확인했습니다. 기록은 서버가 아닌 이 기기에 저장됩니다." : "오프라인입니다. 새 기록은 이 기기에 바로 저장되며 연결돼도 밖으로 보내지지 않습니다.");
        if (navigator.serviceWorker.controller) sendShellReady();
      }
      pwaRegistration.addEventListener("updatefound", () => {
        const worker = pwaRegistration.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) announceWaiting();
        });
      });
      return pwaRegistration;
    } catch (_) {
      setPwaState("error", "오프라인 준비에 실패했습니다. 현재 화면과 이 기기의 기록은 계속 사용할 수 있습니다.");
      return null;
    }
  };

  checkButton.addEventListener("click", async () => {
    setPwaState("checking", "새 버전을 확인하고 있습니다…");
    try {
      await pwaRegistration?.update();
      if (pwaRegistration?.waiting) announceWaiting();
      else setPwaState(navigator.onLine ? "ready" : "offline", "현재 사용할 수 있는 최신 앱 셸입니다. 기록은 이 기기에만 저장됩니다.");
    } catch (_) {
      setPwaState("error", "연결 문제로 업데이트를 확인하지 못했습니다. 현재 앱과 기록은 그대로 사용할 수 있습니다.");
    }
  });
  activateButton.addEventListener("click", () => { activateWaitingUpdate(); });
  reloadButton.addEventListener("click", () => location.reload());
  window.addEventListener("offline", () => setPwaState("offline", "오프라인입니다. 새 기록은 이 기기에 바로 저장되며 연결돼도 밖으로 보내지지 않습니다."));
  window.addEventListener("online", () => setPwaState("ready", "다시 연결됐습니다. 로컬 기록을 외부로 보내지 않았습니다."));
  registerPwaSafety();

  Object.defineProperty(window, "__WEDOIT_V270__", {
    configurable: false,
    enumerable: false,
    writable: false,
    value: candidate,
  });
  document.documentElement.dataset.wedoitCandidate = candidate.version;
  window.__WEDOIT_V270_LOAD_DATA_TOOLS__ = loadDataTools;
  window.__WEDOIT_V270_PWA__ = Object.freeze({
    version: candidate.version,
    guardKey: UPDATE_GUARD_KEY,
    captureRecordGuard,
    verifyRecordGuard,
    activateWaitingUpdate,
    getRegistration: () => pwaRegistration,
  });
  window.dispatchEvent(new CustomEvent("wedoit:v270-ready", { detail: candidate }));
})();
