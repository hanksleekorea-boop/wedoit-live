(function () {
  "use strict";

  const VERSION = "v27.0.0-restore";
  const FORMAT = "wedoit.local-backup";
  const FORMAT_VERSION = 1;
  const SCHEMA_VERSION = 6;
  const MAX_BYTES = 10 * 1024 * 1024;
  const PREFERENCE_KEYS = Object.freeze([
    "wedoit.v264.trust",
    "wedoit.v264.rhythm",
    "wedoit.v264.pause",
    "wedoit.v264.repeat-days",
    "wedoit.v264.timezone",
    "wedoit.v264.date-corrections",
    "wedoit.v264.record-notes",
    "wedoit.v264.week-plans",
    "wedoit.v264.insight-sentences",
    "wedoit.v264.reminder-schedule",
    "wedoit.v264.quiet-hours",
    "wedoit.v271.account-preferences",
  ]);
  const BLOCKED_KEY = /^(?:__proto__|prototype|constructor|password|secret|token|accessToken|refreshToken|authorization|cookie|privateKey|apiKey|credential)$/i;
  const ARRAY_TYPES = Object.freeze([
    ["goal", "goals"],
    ["event", "events"],
    ["review", "weeklyReviews"],
  ]);
  const CLASSIFICATIONS = Object.freeze(["add", "same", "update", "conflict", "ignored", "invalid"]);

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const utf8Size = (value) => new TextEncoder().encode(String(value)).byteLength;
  const isPlainObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
  const stableValue = (value) => {
    if (Array.isArray(value)) return value.map(stableValue);
    if (isPlainObject(value)) {
      return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
    }
    return value;
  };
  const stable = (value) => JSON.stringify(stableValue(value));
  const hasBlockedKey = (value) => {
    if (Array.isArray(value)) return value.some(hasBlockedKey);
    if (!isPlainObject(value)) return false;
    return Object.entries(value).some(([key, item]) => BLOCKED_KEY.test(key) || hasBlockedKey(item));
  };
  const timestamp = (value) => {
    if (!isPlainObject(value)) return 0;
    return Math.max(
      0,
      ...["updatedAt", "changedAt", "createdAt", "occurredAt", "replacedAt"]
        .map((key) => Number(value[key]))
        .filter(Number.isFinite),
    );
  };
  const classify = (current, incoming) => {
    if (current === undefined) return "add";
    if (stable(current) === stable(incoming)) return "same";
    const currentTime = timestamp(current);
    const incomingTime = timestamp(incoming);
    return incomingTime > 0 && incomingTime > currentTime ? "update" : "conflict";
  };
  const itemLabel = (type, value, fallback) => {
    if (type === "goal") return String(value?.name || fallback || "이름 없는 목표").slice(0, 80);
    if (type === "event") return String(value?.type || fallback || "기록").slice(0, 80);
    if (type === "review") return String(value?.weekKey || fallback || "주간 검토").slice(0, 80);
    if (type === "preference") return String(fallback || "로컬 설정").replace(/^wedoit\.v264\./, "");
    return String(fallback || "앱 정책").slice(0, 80);
  };
  const makeRecord = ({ type, id, current, incoming, classification, reason = "" }) => Object.freeze({
    key: `${type}:${id}`,
    type,
    id: String(id),
    label: itemLabel(type, incoming || current, id),
    current: current === undefined ? undefined : clone(current),
    incoming: incoming === undefined ? undefined : clone(incoming),
    classification,
    reason,
    defaultChoice: classification === "add" || classification === "update" ? "backup" : classification === "conflict" ? "current" : "skip",
  });

  function normalizeBackupData(input) {
    const text = typeof input === "string" ? input : JSON.stringify(input);
    if (utf8Size(text) > MAX_BYTES) throw Object.assign(new Error("backup-too-large"), { code: "backup-too-large" });
    let envelope;
    try {
      envelope = typeof input === "string" ? JSON.parse(input) : clone(input);
    } catch (_) {
      throw Object.assign(new Error("invalid-json"), { code: "invalid-json" });
    }
    if (envelope?.format !== FORMAT) throw Object.assign(new Error("invalid-backup-format"), { code: "invalid-backup-format" });
    if (envelope?.formatVersion !== FORMAT_VERSION) throw Object.assign(new Error("unsupported-backup-version"), { code: "unsupported-backup-version" });
    if (!isPlainObject(envelope?.data?.state) || !isPlainObject(envelope?.data?.localPreferences)) {
      throw Object.assign(new Error("invalid-backup-data"), { code: "invalid-backup-data" });
    }
    if (envelope.data.state.schemaVersion !== SCHEMA_VERSION) {
      throw Object.assign(new Error("unsupported-schema-version"), { code: "unsupported-schema-version" });
    }
    if (hasBlockedKey(envelope.data)) throw Object.assign(new Error("blocked-sensitive-key"), { code: "blocked-sensitive-key" });
    const state = clone(envelope.data.state);
    const valid = { goals: [], events: [], weeklyReviews: [] };
    const invalid = [];
    for (const [type, field] of ARRAY_TYPES) {
      if (!Array.isArray(state[field])) throw Object.assign(new Error(`invalid-${field}`), { code: `invalid-${field}` });
      const seen = new Set();
      state[field].forEach((item, index) => {
        const id = typeof item?.id === "string" ? item.id.trim() : "";
        if (!isPlainObject(item) || !id || id.length > 128 || seen.has(id)) {
          invalid.push(makeRecord({ type, id: id || `row-${index + 1}`, incoming: item || null, classification: "invalid", reason: seen.has(id) ? "duplicate-id" : "missing-or-invalid-id" }));
          return;
        }
        seen.add(id);
        valid[field].push(clone(item));
      });
    }
    const preferences = {};
    const ignoredPreferences = [];
    for (const [key, value] of Object.entries(envelope.data.localPreferences)) {
      if (!PREFERENCE_KEYS.includes(key)) {
        ignoredPreferences.push(makeRecord({ type: "preference", id: key, incoming: value, classification: "ignored", reason: "unlisted-preference" }));
      } else {
        preferences[key] = clone(value);
      }
    }
    const core = Object.fromEntries(
      Object.entries(state).filter(([key]) => !["goals", "events", "weeklyReviews", "schemaVersion"].includes(key)),
    );
    return Object.freeze({ envelope, state: Object.freeze({ schemaVersion: SCHEMA_VERSION, ...valid, core }), preferences: Object.freeze(preferences), invalid: Object.freeze(invalid), ignoredPreferences: Object.freeze(ignoredPreferences) });
  }

  function compareBackupToCurrent(normalized, currentState, currentPreferences = {}) {
    const records = [];
    for (const [type, field] of ARRAY_TYPES) {
      const currentItems = Array.isArray(currentState?.[field]) ? currentState[field] : [];
      const currentMap = new Map(currentItems.filter((item) => item?.id).map((item) => [item.id, item]));
      const incomingMap = new Map(normalized.state[field].map((item) => [item.id, item]));
      for (const item of normalized.state[field]) {
        const current = currentMap.get(item.id);
        records.push(makeRecord({ type, id: item.id, current, incoming: item, classification: classify(current, item) }));
      }
      for (const item of currentItems) {
        if (item?.id && !incomingMap.has(item.id)) records.push(makeRecord({ type, id: item.id, current: item, classification: "ignored", reason: "current-only-preserved" }));
      }
    }
    const currentCore = Object.fromEntries(
      Object.entries(currentState || {}).filter(([key]) => !["goals", "events", "weeklyReviews", "schemaVersion"].includes(key)),
    );
    records.push(makeRecord({ type: "policy", id: "app-policy", current: currentCore, incoming: normalized.state.core, classification: classify(currentCore, normalized.state.core) }));
    for (const key of PREFERENCE_KEYS) {
      if (!(key in normalized.preferences)) continue;
      const current = key in currentPreferences ? currentPreferences[key] : undefined;
      records.push(makeRecord({ type: "preference", id: key, current, incoming: normalized.preferences[key], classification: classify(current, normalized.preferences[key]) }));
    }
    records.push(...normalized.invalid, ...normalized.ignoredPreferences);
    const summary = Object.fromEntries(CLASSIFICATIONS.map((name) => [name, records.filter((record) => record.classification === name).length]));
    return Object.freeze({ records: Object.freeze(records), summary: Object.freeze(summary), hasBlockingInvalid: summary.invalid > 0 });
  }

  function buildRestorePlan(currentState, comparison, choices = {}) {
    if (comparison.hasBlockingInvalid) throw Object.assign(new Error("invalid-records-block-restore"), { code: "invalid-records-block-restore" });
    const nextState = clone(currentState);
    nextState.schemaVersion = SCHEMA_VERSION;
    for (const [, field] of ARRAY_TYPES) if (!Array.isArray(nextState[field])) nextState[field] = [];
    const preferenceWrites = {};
    let stateChanges = 0;
    let preferenceChanges = 0;
    for (const record of comparison.records) {
      const choice = choices[record.key] || record.defaultChoice;
      if (choice !== "backup" || record.incoming === undefined) continue;
      const pair = ARRAY_TYPES.find(([type]) => type === record.type);
      if (pair) {
        const field = pair[1];
        const index = nextState[field].findIndex((item) => item?.id === record.id);
        if (index < 0) nextState[field].push(clone(record.incoming));
        else nextState[field][index] = clone(record.incoming);
        stateChanges += 1;
      } else if (record.type === "policy") {
        Object.assign(nextState, clone(record.incoming));
        nextState.schemaVersion = SCHEMA_VERSION;
        stateChanges += 1;
      } else if (record.type === "preference" && PREFERENCE_KEYS.includes(record.id)) {
        preferenceWrites[record.id] = clone(record.incoming);
        preferenceChanges += 1;
      }
    }
    if (stateChanges) nextState.revision = Math.max(Number(currentState?.revision) || 0, Number(nextState.revision) || 0) + 1;
    return Object.freeze({ state: Object.freeze(nextState), preferenceWrites: Object.freeze(preferenceWrites), stateChanges, preferenceChanges, totalChanges: stateChanges + preferenceChanges });
  }

  function applyRestorePlanAtomically(plan, { storage = localStorage, stateKey = "wedoit.app.v6" } = {}) {
    const keys = [stateKey, ...Object.keys(plan.preferenceWrites)];
    const snapshot = Object.fromEntries(keys.map((key) => [key, storage.getItem(key)]));
    const writes = { [stateKey]: JSON.stringify(plan.state), ...Object.fromEntries(Object.entries(plan.preferenceWrites).map(([key, value]) => [key, JSON.stringify(value)])) };
    try {
      for (const [key, value] of Object.entries(writes)) storage.setItem(key, value);
      for (const [key, value] of Object.entries(writes)) if (storage.getItem(key) !== value) throw new Error("restore-verification-failed");
      return Object.freeze({ ok: true, stateChanges: plan.stateChanges, preferenceChanges: plan.preferenceChanges, totalChanges: plan.totalChanges });
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
      if (rollbackFailed || !restored) throw Object.assign(new Error("restore-rollback-failed"), { code: "restore-rollback-failed", cause: error });
      throw Object.assign(new Error("restore-apply-failed"), { code: "restore-apply-failed", cause: error, rolledBack: true });
    }
  }

  const readCurrentPreferences = (storage = localStorage) => Object.fromEntries(
    PREFERENCE_KEYS.flatMap((key) => {
      try {
        const raw = storage.getItem(key);
        return raw === null ? [] : [[key, JSON.parse(raw)]];
      } catch (_) {
        return [];
      }
    }),
  );
  const copy = () => document.documentElement.lang === "en" ? {
    kicker: "Compare before restoring", title: "Restore a backup safely", intro: "Choose a HappyScan backup. Additions, updates, conflicts, ignored items, and errors are shown before anything changes.", file: "Backup JSON file", inspect: "Compare file", review: "Review selected changes", cancel: "Cancel without changes", apply: "Apply selected restore", reload: "Reload with restored data", confirm: "I checked the selected changes and understand that this device's data will be updated.", idle: "No file has been read. Current records are unchanged.", ready: "Comparison is ready. Conflicts keep the current device by default.", invalid: "This backup contains invalid records. Nothing can be applied.", reviewing: "Check the final selection, then confirm to enable restore.", success: (count) => `Restored ${count} selected changes. Reload to use the restored data.`, failed: "Restore failed and the original on-device data was put back.", note: "Current-only records are preserved. Unknown settings are ignored. Nothing is uploaded.", choices: { current: "Keep current", backup: "Use backup", skip: "Skip" }, classes: { add: "Add", same: "Same", update: "Update", conflict: "Conflict", ignored: "Ignored", invalid: "Invalid" }, types: { goal: "Goal", event: "Record", review: "Weekly review", preference: "Setting", policy: "App policy" }, error: (code) => `Could not read the backup (${code}). Current records are unchanged.`
  } : {
    kicker: "복원 전에 비교", title: "백업을 안전하게 복원하기", intro: "HappyScan 백업을 고르면 추가·수정·충돌·무시·오류를 먼저 보여 줍니다. 확인 전에는 아무것도 바꾸지 않습니다.", file: "백업 JSON 파일", inspect: "파일 비교하기", review: "선택한 변경 검토", cancel: "변경 없이 취소", apply: "선택한 복원 적용", reload: "복원한 데이터로 새로 열기", confirm: "선택한 변경을 확인했으며 이 기기의 데이터가 갱신되는 것을 이해했습니다.", idle: "읽은 파일이 없습니다. 현재 기록은 바뀌지 않았습니다.", ready: "비교가 끝났습니다. 충돌은 기본적으로 현재 기기 내용을 유지합니다.", invalid: "잘못된 항목이 있어 이 백업은 적용할 수 없습니다. 현재 기록은 바뀌지 않았습니다.", reviewing: "최종 선택을 확인한 뒤 확인란을 선택하면 복원을 적용할 수 있습니다.", success: (count) => `선택한 변경 ${count}건을 복원했습니다. 새로 열면 복원한 데이터를 사용합니다.`, failed: "복원에 실패해 기기 안 원본을 다시 돌려놓았습니다.", note: "현재 기기에만 있는 기록은 보존하고, 허용 목록 밖 설정은 무시합니다. 어디에도 업로드하지 않습니다.", choices: { current: "현재 내용 유지", backup: "백업 내용 사용", skip: "건너뛰기" }, classes: { add: "추가", same: "동일", update: "수정", conflict: "충돌", ignored: "무시", invalid: "오류" }, types: { goal: "목표", event: "기록", review: "주간 검토", preference: "설정", policy: "앱 정책" }, error: (code) => `백업을 읽지 못했습니다(${code}). 현재 기록은 바뀌지 않았습니다.`
  };

  function mount(app) {
    if (document.querySelector("#serviceRestoreSection")) return true;
    const anchor = document.querySelector("#serviceBackupSection");
    if (!anchor) return false;
    const root = document.createElement("section");
    root.id = "serviceRestoreSection";
    root.className = "section service-restore";
    root.dataset.serviceView = "me";
    root.dataset.state = "idle";
    anchor.insertAdjacentElement("afterend", root);
    let normalized = null;
    let comparison = null;
    let currentState = null;
    let choices = {};
    let status = "";

    const staticRender = () => {
      const t = copy();
      root.innerHTML = `<header><span class="service-section-kicker">${t.kicker}</span><h2 id="serviceRestoreTitle">${t.title}</h2><p>${t.intro}</p></header><div class="service-restore-controls"><label class="service-restore-file">${t.file}<input id="serviceRestoreFile" type="file" accept="application/json,.json"></label><button id="serviceRestoreInspect" class="primary" type="button">${t.inspect}</button></div><div id="serviceRestoreSummary" class="service-restore-summary" hidden></div><div id="serviceRestoreList" class="service-restore-list" hidden></div><div class="service-restore-actions"><button id="serviceRestoreCancel" class="secondary" type="button" hidden>${t.cancel}</button><button id="serviceRestoreReview" class="primary" type="button" hidden>${t.review}</button><button id="serviceRestoreReload" class="primary" type="button" hidden>${t.reload}</button></div><div id="serviceRestoreConfirm" class="service-restore-confirm"><p id="serviceRestoreConfirmSummary"></p><label><input id="serviceRestoreUnderstand" type="checkbox"> <span>${t.confirm}</span></label><button id="serviceRestoreApply" class="primary" type="button" disabled>${t.apply}</button></div><p id="serviceRestoreStatus" class="service-restore-status" role="status" aria-live="polite">${status || t.idle}</p><p class="service-restore-note">${t.note}</p>`;
      bind();
      if (comparison) renderComparison();
    };
    const selectedChoices = () => ({ ...choices });
    const reset = () => {
      normalized = null;
      comparison = null;
      currentState = null;
      choices = {};
      status = copy().idle;
      root.dataset.state = "cancelled";
      staticRender();
    };
    const renderComparison = () => {
      const t = copy();
      const summary = root.querySelector("#serviceRestoreSummary");
      const list = root.querySelector("#serviceRestoreList");
      summary.hidden = false;
      list.hidden = false;
      summary.replaceChildren(...CLASSIFICATIONS.map((name) => {
        const box = document.createElement("div");
        const count = document.createElement("b");
        const label = document.createElement("span");
        count.textContent = String(comparison.summary[name]);
        label.textContent = t.classes[name];
        box.append(count, label);
        return box;
      }));
      list.replaceChildren();
      for (const record of comparison.records.slice(0, 50)) {
        const item = document.createElement("article");
        item.className = "service-restore-item";
        const badge = document.createElement("span");
        badge.className = "service-restore-badge";
        badge.textContent = t.classes[record.classification];
        const detail = document.createElement("div");
        const title = document.createElement("strong");
        const meta = document.createElement("small");
        title.textContent = record.label;
        meta.textContent = `${t.types[record.type]} · ${record.reason || record.id}`;
        detail.append(title, meta);
        item.append(badge, detail);
        if (["add", "update", "conflict"].includes(record.classification)) {
          const select = document.createElement("select");
          select.className = "service-restore-choice";
          select.setAttribute("aria-label", `${record.label} 선택`);
          const options = record.classification === "conflict" ? ["current", "backup", "skip"] : ["backup", "skip"];
          for (const value of options) {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = t.choices[value];
            select.append(option);
          }
          select.value = choices[record.key] || record.defaultChoice;
          select.addEventListener("change", () => { choices[record.key] = select.value; });
          item.append(select);
        }
        list.append(item);
      }
      root.querySelector("#serviceRestoreCancel").hidden = false;
      root.querySelector("#serviceRestoreReview").hidden = comparison.hasBlockingInvalid;
      root.dataset.state = comparison.hasBlockingInvalid ? "error-blocking" : "preview";
      status = comparison.hasBlockingInvalid ? t.invalid : t.ready;
      root.querySelector("#serviceRestoreStatus").textContent = status;
    };
    const inspect = async () => {
      const file = root.querySelector("#serviceRestoreFile").files?.[0];
      if (!file) return;
      root.dataset.state = "validating";
      try {
        if (file.size > MAX_BYTES) throw Object.assign(new Error("backup-too-large"), { code: "backup-too-large" });
        normalized = normalizeBackupData(await file.text());
        currentState = JSON.parse(app.store.exportJson());
        comparison = compareBackupToCurrent(normalized, currentState, readCurrentPreferences());
        choices = Object.fromEntries(comparison.records.map((record) => [record.key, record.defaultChoice]));
        renderComparison();
      } catch (error) {
        normalized = null;
        comparison = null;
        root.dataset.state = "error-blocking";
        status = copy().error(error?.code || "invalid-file");
        root.querySelector("#serviceRestoreStatus").textContent = status;
      }
    };
    const review = () => {
      const plan = buildRestorePlan(currentState, comparison, selectedChoices());
      root.dataset.state = "confirming";
      root.querySelector("#serviceRestoreConfirm").classList.add("on");
      root.querySelector("#serviceRestoreConfirmSummary").textContent = `${plan.totalChanges}건을 적용합니다. 현재 기기에만 있는 기록은 보존합니다.`;
      root.querySelector("#serviceRestoreStatus").textContent = copy().reviewing;
      root.querySelector("#serviceRestoreUnderstand").focus();
    };
    const apply = async () => {
      const t = copy();
      root.dataset.state = "applying";
      try {
        const result = await app.store.exclusive((latest, storage) => {
          const plan = buildRestorePlan(latest, comparison, selectedChoices());
          return applyRestorePlanAtomically(plan, { stateKey: app.store.constants.key, storage });
        });
        root.dataset.state = "success";
        status = t.success(result.totalChanges);
        root.querySelector("#serviceRestoreStatus").textContent = status;
        root.querySelector("#serviceRestoreConfirm").classList.remove("on");
        root.querySelector("#serviceRestoreReload").hidden = false;
        root.querySelector("#serviceRestoreReview").hidden = true;
        root.querySelector("#serviceRestoreCancel").hidden = true;
        document.documentElement.dataset.restoreApplied = "true";
      } catch (_) {
        root.dataset.state = "error-blocking";
        status = t.failed;
        root.querySelector("#serviceRestoreStatus").textContent = status;
      }
    };
    function bind() {
      root.querySelector("#serviceRestoreInspect").addEventListener("click", inspect);
      root.querySelector("#serviceRestoreCancel").addEventListener("click", reset);
      root.querySelector("#serviceRestoreReview").addEventListener("click", review);
      root.querySelector("#serviceRestoreUnderstand").addEventListener("change", (event) => { root.querySelector("#serviceRestoreApply").disabled = !event.target.checked; });
      root.querySelector("#serviceRestoreApply").addEventListener("click", apply, { once: true });
      root.querySelector("#serviceRestoreReload").addEventListener("click", () => location.reload());
    }
    window.addEventListener("wedoit:languagechange", staticRender);
    staticRender();
    document.documentElement.dataset.restoreReady = "true";
    return true;
  }

  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    const app = window.__WEDOIT__;
    if ((app?.ready && app.store && mount(app)) || tries > 250) clearInterval(timer);
  }, 40);

  window.__WEDOIT_V270_RESTORE__ = Object.freeze({
    version: VERSION,
    format: FORMAT,
    formatVersion: FORMAT_VERSION,
    schemaVersion: SCHEMA_VERSION,
    maxBytes: MAX_BYTES,
    preferenceKeys: PREFERENCE_KEYS,
    classifications: CLASSIFICATIONS,
    normalizeBackupData,
    compareBackupToCurrent,
    buildRestorePlan,
    applyRestorePlanAtomically,
    readCurrentPreferences,
    stable,
  });
})();
