(function () {
  "use strict";

  const VERSION = "v27.0.0-delete";
  const STATE_KEY = "wedoit.app.v6";
  const NOTES_KEY = "wedoit.v264.record-notes";
  const RECEIPT_KEY = "wedoit.v270.delete-receipt";
  const PREFERENCE_KEYS = Object.freeze([
    "wedoit.v264.trust", "wedoit.v264.rhythm", "wedoit.v264.pause",
    "wedoit.v264.repeat-days", "wedoit.v264.timezone", "wedoit.v264.date-corrections",
    NOTES_KEY, "wedoit.v264.week-plans", "wedoit.v264.insight-sentences",
    "wedoit.v264.reminder-schedule", "wedoit.v264.quiet-hours",
    "wedoit.v271.account-preferences",
  ]);
  const SCOPE_IDS = Object.freeze(["goals", "events", "notes", "weeklyReviews", "settings"]);
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const readObject = (storage, key) => {
    try {
      const raw = storage.getItem(key);
      if (raw === null) return null;
      const value = JSON.parse(raw);
      return value && typeof value === "object" ? value : null;
    } catch (_) {
      return null;
    }
  };

  function inspectDeletion(state, storage = localStorage) {
    const notes = readObject(storage, NOTES_KEY);
    const settingKeys = PREFERENCE_KEYS.filter((key) => key !== NOTES_KEY && storage.getItem(key) !== null);
    return Object.freeze({
      goals: Array.isArray(state?.goals) ? state.goals.length : 0,
      events: Array.isArray(state?.events) ? state.events.length : 0,
      notes: notes ? Object.keys(notes).length : storage.getItem(NOTES_KEY) === null ? 0 : 1,
      weeklyReviews: Array.isArray(state?.weeklyReviews) ? state.weeklyReviews.length : 0,
      settings: settingKeys.length,
    });
  }

  function buildDeletionPlan(currentState, selectedScopes, { storage = localStorage } = {}) {
    const selected = [...new Set(selectedScopes || [])].filter((id) => SCOPE_IDS.includes(id));
    if (!selected.length) throw Object.assign(new Error("no-delete-scope"), { code: "no-delete-scope" });
    const before = inspectDeletion(currentState, storage);
    const nextState = clone(currentState);
    let stateChanged = false;
    for (const field of ["goals", "events", "weeklyReviews"]) {
      if (!selected.includes(field)) continue;
      nextState[field] = [];
      stateChanged = true;
    }
    if (stateChanged) nextState.revision = (Number(nextState.revision) || 0) + 1;
    const removals = [];
    if (selected.includes("notes")) removals.push(NOTES_KEY);
    if (selected.includes("settings")) removals.push(...PREFERENCE_KEYS.filter((key) => key !== NOTES_KEY));
    const counts = Object.fromEntries(selected.map((id) => [id, before[id]]));
    return Object.freeze({
      selected: Object.freeze(selected),
      counts: Object.freeze(counts),
      total: Object.values(counts).reduce((sum, value) => sum + value, 0),
      state: Object.freeze(nextState),
      stateChanged,
      removals: Object.freeze([...new Set(removals)]),
    });
  }

  function applyDeletionPlanAtomically(plan, { storage = localStorage, stateKey = STATE_KEY, now = () => new Date() } = {}) {
    const keys = [...new Set([...(plan.stateChanged ? [stateKey] : []), ...plan.removals])];
    const snapshot = Object.fromEntries(keys.map((key) => [key, storage.getItem(key)]));
    const expectedState = plan.stateChanged ? JSON.stringify(plan.state) : null;
    try {
      if (plan.stateChanged) storage.setItem(stateKey, expectedState);
      for (const key of plan.removals) storage.removeItem(key);
      if (plan.stateChanged && storage.getItem(stateKey) !== expectedState) throw new Error("delete-state-verification-failed");
      if (plan.removals.some((key) => storage.getItem(key) !== null)) throw new Error("delete-removal-verification-failed");
      return Object.freeze({
        ok: true,
        deletedAt: now().toISOString(),
        scopes: Object.freeze([...plan.selected]),
        counts: Object.freeze({ ...plan.counts }),
        total: plan.total,
      });
    } catch (error) {
      let rollbackFailed = false;
      for (const key of keys) {
        try {
          if (snapshot[key] === null) storage.removeItem(key);
          else storage.setItem(key, snapshot[key]);
        } catch (_) {
          rollbackFailed = true;
        }
      }
      const restored = keys.every((key) => storage.getItem(key) === snapshot[key]);
      if (rollbackFailed || !restored) throw Object.assign(new Error("delete-rollback-failed"), { code: "delete-rollback-failed", cause: error });
      throw Object.assign(new Error("delete-apply-failed"), { code: "delete-apply-failed", cause: error, rolledBack: true });
    }
  }

  function prepareBackup(app) {
    const api = window.__WEDOIT_V264_P1_BACKUP__;
    if (!api?.buildBackup || !api?.serializeBackup) throw Object.assign(new Error("backup-unavailable"), { code: "backup-unavailable" });
    const backup = api.buildBackup(app);
    const serialized = api.serializeBackup(backup);
    const blob = new Blob([serialized.text], { type: "application/json" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `wedoit-backup-before-delete-${backup.generatedAt.replace(/[:.]/g, "-")}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return Object.freeze({ name: link.download, bytes: serialized.bytes });
  }

  const copy = () => document.documentElement.lang === "en" ? {
    kicker: "Delete with a safety check", title: "Delete on-device data", intro: "Choose exactly what to remove from this browser. Nothing is sent to a server.",
    scopes: { goals: "Goals", events: "Records", notes: "Notes and mood", weeklyReviews: "Weekly reviews", settings: "App settings" },
    count: (value) => `${value} stored`, backup: "Download a backup first (recommended)", backupHelp: "If backup preparation fails, deletion is blocked.", preview: "Review deletion", reset: "Cancel and clear selection", status: "Nothing is selected. Current data is unchanged.", noScope: "Select at least one data type.",
    dialogTitle: "Confirm exact deletion scope", irreversible: "I understand that the selected on-device data cannot be recovered by HappyScan.", noBackup: "Continue without a backup. I understand there may be no recovery copy.", final: "Delete selected data", close: "Cancel deletion", warning: "Only the selected data in this browser will be deleted.",
    backupFailed: "A backup could not be prepared, so nothing was deleted.", failed: "Deletion failed and the original on-device data was restored.", working: "Checking and deleting the selected data…", receipt: (r) => `Deleted ${r.total} selected items at ${new Date(r.deletedAt).toLocaleString("en-US")}.`, reloading: " Reloading to show the verified result.",
  } : {
    kicker: "삭제 전 안전 확인", title: "이 기기의 데이터 삭제", intro: "이 브라우저에서 지울 범위를 정확히 고릅니다. 서버로 보내지는 내용은 없습니다.",
    scopes: { goals: "목표", events: "기록", notes: "메모와 기분", weeklyReviews: "주간 검토", settings: "앱 설정" },
    count: (value) => `${value}개 저장됨`, backup: "먼저 백업 파일 받기(권장)", backupHelp: "백업 준비가 실패하면 삭제를 기본 차단합니다.", preview: "삭제 범위 확인", reset: "삭제 취소·선택 지우기", status: "선택한 항목이 없습니다. 현재 데이터는 그대로입니다.", noScope: "삭제할 데이터 종류를 하나 이상 고르세요.",
    dialogTitle: "정확한 삭제 범위 최종 확인", irreversible: "선택한 기기 안 데이터는 HappyScan에서 되살릴 수 없음을 이해했습니다.", noBackup: "백업 없이 계속합니다. 복구 사본이 없을 수 있음을 이해했습니다.", final: "선택한 데이터 삭제", close: "삭제하지 않고 돌아가기", warning: "선택한 이 브라우저의 데이터만 삭제합니다.",
    backupFailed: "백업 파일을 준비하지 못해 아무것도 삭제하지 않았습니다.", failed: "삭제에 실패해 기기 안 원본을 다시 돌려놓았습니다.", working: "선택 범위를 확인하고 삭제하는 중…", receipt: (r) => `${new Date(r.deletedAt).toLocaleString("ko-KR")}에 선택한 ${r.total}개를 삭제했습니다.`, reloading: " 검증된 결과를 표시하도록 새로 엽니다.",
  };

  function mount(app) {
    if (document.querySelector("#serviceDeleteSection")) return true;
    const anchor = document.querySelector("#serviceRestoreSection") || document.querySelector("#serviceBackupSection");
    const host = document.querySelector("main.app");
    if (!anchor || !host) return false;
    const root = document.createElement("section");
    root.id = "serviceDeleteSection";
    root.className = "section service-delete";
    root.dataset.serviceView = "me";
    root.setAttribute("aria-labelledby", "serviceDeleteTitle");
    anchor.insertAdjacentElement("afterend", root);
    const dialog = document.createElement("dialog");
    dialog.id = "serviceDeleteDialog";
    dialog.className = "service-delete-dialog";
    dialog.setAttribute("aria-labelledby", "serviceDeleteDialogTitle");
    host.append(dialog);
    let status = "";
    let receipt = null;
    let busy = false;
    try {
      const raw = sessionStorage.getItem(RECEIPT_KEY);
      sessionStorage.removeItem(RECEIPT_KEY);
      if (raw) receipt = JSON.parse(raw);
    } catch (_) { /* A blocked session store does not block deletion. */ }

    const selected = () => [...root.querySelectorAll('[name="serviceDeleteScope"]:checked')].map((node) => node.value);
    const render = () => {
      const t = copy();
      const state = JSON.parse(app.store.exportJson());
      const counts = inspectDeletion(state);
      const priorSelection = new Set(selected());
      const backupFirst = root.querySelector("#serviceDeleteBackup")?.checked ?? true;
      root.innerHTML = `<header><span class="service-section-kicker">${t.kicker}</span><h2 id="serviceDeleteTitle">${t.title}</h2><p>${t.intro}</p></header>
        <div class="service-delete-grid">${SCOPE_IDS.map((id) => `<label class="service-delete-scope"><input name="serviceDeleteScope" type="checkbox" value="${id}" ${priorSelection.has(id) ? "checked" : ""}><span><b>${t.scopes[id]}</b><small>${t.count(counts[id])}</small></span></label>`).join("")}</div>
        <label class="service-delete-backup"><input id="serviceDeleteBackup" type="checkbox" ${backupFirst ? "checked" : ""}><span><b>${t.backup}</b><br><small>${t.backupHelp}</small></span></label>
        <div class="service-delete-actions"><button id="serviceDeletePreview" class="service-delete-danger" type="button">${t.preview}</button><button id="serviceDeleteReset" type="button">${t.reset}</button></div>
        <p id="serviceDeleteStatus" class="service-delete-status" role="status" aria-live="polite">${status || t.status}</p>
        ${receipt ? `<div class="service-delete-receipt" role="status">${t.receipt(receipt)}</div>` : ""}`;
      root.querySelector("#serviceDeletePreview").addEventListener("click", openPreview);
      root.querySelector("#serviceDeleteReset").addEventListener("click", () => {
        root.querySelectorAll('[name="serviceDeleteScope"]').forEach((input) => { input.checked = false; });
        status = t.status;
        receipt = null;
        render();
      });
    };

    function openPreview() {
      const t = copy();
      const scopes = selected();
      if (!scopes.length) { status = t.noScope; render(); return; }
      const backupFirst = root.querySelector("#serviceDeleteBackup").checked;
      const state = JSON.parse(app.store.exportJson());
      const plan = buildDeletionPlan(state, scopes);
      dialog.innerHTML = `<article><h2 id="serviceDeleteDialogTitle">${t.dialogTitle}</h2><p class="service-delete-warning">${t.warning}</p>
        <div class="service-delete-preview">${plan.selected.map((id) => `<p><b>${t.scopes[id]}</b> · ${t.count(plan.counts[id])}</p>`).join("")}<p><b>${t.count(plan.total)}</b></p></div>
        ${backupFirst ? "" : `<label class="service-delete-confirm"><input id="serviceDeleteNoBackup" type="checkbox"><span>${t.noBackup}</span></label>`}
        <label class="service-delete-confirm"><input id="serviceDeleteIrreversible" type="checkbox"><span>${t.irreversible}</span></label>
        <div class="service-delete-dialog-actions"><button id="serviceDeleteApply" class="service-delete-danger" type="button" disabled>${t.final}</button><button id="serviceDeleteClose" type="button">${t.close}</button></div></article>`;
      const update = () => {
        const irreversible = dialog.querySelector("#serviceDeleteIrreversible").checked;
        const noBackup = dialog.querySelector("#serviceDeleteNoBackup")?.checked ?? true;
        dialog.querySelector("#serviceDeleteApply").disabled = busy || !irreversible || !noBackup;
      };
      dialog.querySelectorAll('input[type="checkbox"]').forEach((input) => input.addEventListener("change", update));
      dialog.querySelector("#serviceDeleteClose").addEventListener("click", () => dialog.close());
      dialog.querySelector("#serviceDeleteApply").addEventListener("click", () => applySelected(plan, backupFirst));
      dialog.showModal();
      dialog.querySelector("#serviceDeleteDialogTitle").setAttribute("tabindex", "-1");
      dialog.querySelector("#serviceDeleteDialogTitle").focus();
    }

    async function applySelected(previewPlan, backupFirst) {
      if (busy) return;
      busy = true;
      const applyButton = dialog.querySelector("#serviceDeleteApply");
      if (applyButton) applyButton.disabled = true;
      const t = copy();
      status = t.working;
      let completed = false;
      try {
        receipt = await app.store.exclusive((latest, storage) => {
          if (backupFirst) {
            try { prepareBackup(app); }
            catch (error) { throw Object.assign(new Error("delete-backup-failed"), { cause: error }); }
          }
          const plan = buildDeletionPlan(latest, previewPlan.selected);
          return applyDeletionPlanAtomically(plan, { storage });
        });
        completed = true;
        status = t.receipt(receipt) + t.reloading;
        try { sessionStorage.setItem(RECEIPT_KEY, JSON.stringify(receipt)); } catch (_) { /* Receipt is optional and non-sensitive. */ }
        dialog.close();
        render();
        if (!window.__WEDOIT_V270_DELETE_TEST_NO_RELOAD__) setTimeout(() => location.reload(), 350);
      } catch (error) {
        status = error.message === "delete-backup-failed" ? t.backupFailed : t.failed;
        dialog.close();
        render();
      } finally {
        busy = completed;
      }
    }

    window.addEventListener("wedoit:languagechange", render);
    render();
    document.documentElement.dataset.deleteReady = "true";
    return true;
  }

  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    const app = window.__WEDOIT__;
    if (app?.ready && app.store && mount(app) || tries > 250) clearInterval(timer);
  }, 40);
  window.__WEDOIT_V270_DELETE__ = Object.freeze({
    version: VERSION,
    stateKey: STATE_KEY,
    notesKey: NOTES_KEY,
    preferenceKeys: PREFERENCE_KEYS,
    scopeIds: SCOPE_IDS,
    inspectDeletion,
    buildDeletionPlan,
    applyDeletionPlanAtomically,
    prepareBackup,
  });
})();
