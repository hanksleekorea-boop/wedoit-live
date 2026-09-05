(() => {
  "use strict";
  let promise = null;
  const load = () => {
    if (promise) return promise;
    document.documentElement.dataset.contentStage2Loading = "true";
    promise = import("./content-install-v2712.js")
      .then(() => import("./service-v2712-content.js"))
      .then(() => { document.documentElement.dataset.contentStage2Loaded = "true"; })
      .catch(() => {
        promise = null;
        document.documentElement.dataset.contentStage2Loading = "failed";
        window.__WEDOIT__?.store?.report?.("warn", "콘텐츠 목록을 불러오지 못했어요. 기본 기록은 안전하며 목표·통찰·나 탭을 다시 누르면 재시도합니다.");
      });
    return promise;
  };
  document.addEventListener("click", (event) => {
    if (event.target.closest?.('[data-service-nav="goals"],[data-service-nav="insights"],[data-service-nav="me"]')) load();
  }, { capture: true });
  window.addEventListener("load", () => {
    if ("requestIdleCallback" in window) requestIdleCallback(load, { timeout: 4000 });
    else setTimeout(load, 2000);
  }, { once: true });
  window.__WEDOIT_CONTENT_LOADER__ = Object.freeze({ version: "v27.1.2-stage2", load });
})();
