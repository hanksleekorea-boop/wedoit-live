export const ANDROID_PLATFORM_CONTRACT_VERSION = "wedoit.android-platform.v1";

export const ANDROID_CHANNELS = Object.freeze([
  Object.freeze({ id: "action", purpose: "user-selected next actions" }),
  Object.freeze({ id: "direct-social", purpose: "direct replies and cheers" }),
  Object.freeze({ id: "general-social", purpose: "non-urgent social summary" }),
  Object.freeze({ id: "active-session", purpose: "user-started active session" }),
  Object.freeze({ id: "system", purpose: "account and data safety" })
]);

const PERMISSIONS = new Set(["granted", "denied", "unknown", "not-required"]);
const WIDGET_FIELDS = new Set(["consent", "goalLabel", "nextAction", "progress", "source"]);
const safeText = (value, max) => String(value || "").trim().replace(/\s+/g, " ").slice(0, max);
const copy = value => JSON.parse(JSON.stringify(value));

function assertInteger(value, name, min = 0) {
  if (!Number.isInteger(value) || value < min) throw new TypeError(`${name} must be an integer >= ${min}`);
}

export function planAndroidNotification(input = {}) {
  const sdkInt = Number(input.sdkInt);
  assertInteger(sdkInt, "sdkInt", 21);
  const permission = String(input.permission || "unknown");
  if (!PERMISSIONS.has(permission)) throw new TypeError("unsupported notification permission state");
  const dailySent = Number(input.dailySent ?? 0), dailyCap = Number(input.dailyCap ?? 2);
  assertInteger(dailySent, "dailySent"); assertInteger(dailyCap, "dailyCap", 1);

  if (sdkInt >= 33 && permission !== "granted") {
    return Object.freeze({ outcome: "IN_APP_ONLY", postSystemNotification: false, schedule: "none", nextAction: permission === "denied" ? "open-system-notification-settings" : "explain-then-request-post-notifications", reason: "post-notifications-not-granted" });
  }
  if (input.channelEnabled === false) return Object.freeze({ outcome: "IN_APP_ONLY", postSystemNotification: false, schedule: "none", nextAction: "open-channel-settings", reason: "system-channel-disabled" });
  if (input.withinQuietHours === true) return Object.freeze({ outcome: "DIGEST", postSystemNotification: false, schedule: "digest", nextAction: "keep-in-inbox", reason: "quiet-hours" });
  if (dailySent >= dailyCap) return Object.freeze({ outcome: "DIGEST", postSystemNotification: false, schedule: "digest", nextAction: "keep-in-inbox", reason: "daily-cap" });

  return Object.freeze({
    outcome: input.userRequestedExact === true ? "INEXACT_FALLBACK" : "READY",
    postSystemNotification: true,
    schedule: input.userRequestedExact === true ? "set-window" : "work-manager-or-inexact-alarm",
    nextAction: input.userRequestedExact === true ? "explain-approximate-delivery" : "schedule",
    reason: input.userRequestedExact === true ? "exact-alarm-special-access-not-declared" : "permission-and-policy-allow"
  });
}

export function createAndroidWidgetPayload(input = {}) {
  const unsupported = Object.keys(input).filter(key => !WIDGET_FIELDS.has(key));
  if (unsupported.length) throw new TypeError(`unsupported widget fields: ${unsupported.sort().join(",")}`);
  if (input.consent !== true) return Object.freeze({ mode: "private", title: "위두잇", action: "앱에서 다음 행동 보기", progress: null, source: "hidden" });
  const source = ["manual", "timer", "health"].includes(input.source) ? input.source : "manual";
  return Object.freeze({
    mode: "selected",
    title: safeText(input.goalLabel, 48) || "선택한 목표",
    action: safeText(input.nextAction, 64) || "다음 작은 행동",
    progress: source === "health" ? null : (Number.isFinite(Number(input.progress)) ? Math.max(0, Number(input.progress)) : null),
    source: source === "health" ? "health-hidden" : source
  });
}

export function planAndroidBootRestore(input = {}) {
  const action = String(input.action || "");
  if (action !== "android.intent.action.BOOT_COMPLETED") return Object.freeze({ outcome: "IGNORED", enqueue: [], network: false, postNotification: false, reason: "unsupported-action" });
  if (input.appLaunchedBefore !== true) return Object.freeze({ outcome: "NOT_ELIGIBLE", enqueue: [], network: false, postNotification: false, reason: "app-not-launched-before" });
  if (input.userUnlocked !== true) return Object.freeze({ outcome: "WAIT_FOR_UNLOCK", enqueue: [], network: false, postNotification: false, reason: "credential-storage-locked" });
  if (input.backgroundRestricted === true) return Object.freeze({ outcome: "WAIT_FOR_APP_OPEN", enqueue: [], network: false, postNotification: false, reason: "background-restricted" });
  const schedules = Array.isArray(input.persistedSchedules) ? input.persistedSchedules : [];
  const enqueue = schedules.filter(item => item && item.enabled === true && safeText(item.scheduleId, 80)).map(item => `wedoit-reminder:${safeText(item.scheduleId, 80)}`);
  return Object.freeze({ outcome: "RECONCILE", enqueue: Object.freeze([...new Set(enqueue)]), network: false, postNotification: false, reason: enqueue.length ? "persisted-schedules-only" : "nothing-persisted" });
}

export function createAndroidEvidenceLedger(input = {}) {
  if (input.physicalDevice === true && (input.source !== "adb-physical-device" || !safeText(input.deviceFingerprint, 180))) throw new TypeError("physical device evidence requires adb source and fingerprint");
  if (input.nativeBuild === true && !safeText(input.artifactSha256, 64).match(/^[0-9a-f]{64}$/i)) throw new TypeError("native build evidence requires artifact sha256");
  return Object.freeze({
    version: ANDROID_PLATFORM_CONTRACT_VERSION,
    webContract: input.webContract === true,
    nativeReference: input.nativeReference === true,
    nativeBuild: input.nativeBuild === true,
    emulator: input.emulator === true,
    physicalDevice: input.physicalDevice === true,
    notificationDelivered: input.physicalDevice === true && input.notificationDelivered === true,
    widgetRendered: input.physicalDevice === true && input.widgetRendered === true,
    rebootRecovered: input.physicalDevice === true && input.rebootRecovered === true,
    D: input.physicalDevice === true ? "PASS" : "UNKNOWN",
    boundary: Object.freeze({ webIsNativeEvidence: false, automaticNotification: false, actualAndroidBuild: input.nativeBuild === true })
  });
}

export async function runAndroidPlatformReadback() {
  const cases = [], check = (id, condition, detail) => cases.push({ id, pass: Boolean(condition), detail: String(detail) });
  const sdk32 = planAndroidNotification({ sdkInt: 32, permission: "not-required", channelEnabled: true, dailySent: 0, dailyCap: 2 });
  check("api32-no-runtime-prompt", sdk32.outcome === "READY", sdk32.outcome);
  const unknown = planAndroidNotification({ sdkInt: 33, permission: "unknown", channelEnabled: true });
  check("api33-explain-before-request", unknown.outcome === "IN_APP_ONLY" && unknown.nextAction === "explain-then-request-post-notifications", unknown.nextAction);
  const denied = planAndroidNotification({ sdkInt: 35, permission: "denied", channelEnabled: true });
  check("permission-denied-fallback", denied.outcome === "IN_APP_ONLY" && denied.nextAction === "open-system-notification-settings", denied.nextAction);
  const channelOff = planAndroidNotification({ sdkInt: 35, permission: "granted", channelEnabled: false });
  check("channel-off-respected", channelOff.outcome === "IN_APP_ONLY" && channelOff.nextAction === "open-channel-settings", channelOff.nextAction);
  check("quiet-hours-digest", planAndroidNotification({ sdkInt: 35, permission: "granted", channelEnabled: true, withinQuietHours: true }).reason === "quiet-hours", "digest");
  check("daily-cap-digest", planAndroidNotification({ sdkInt: 35, permission: "granted", channelEnabled: true, dailySent: 2, dailyCap: 2 }).reason === "daily-cap", "digest");
  const exact = planAndroidNotification({ sdkInt: 35, permission: "granted", channelEnabled: true, userRequestedExact: true });
  check("exact-alarm-not-assumed", exact.outcome === "INEXACT_FALLBACK" && exact.schedule === "set-window", exact.schedule);
  check("stable-channel-count", ANDROID_CHANNELS.length === 5 && new Set(ANDROID_CHANNELS.map(item => item.id)).size === 5, ANDROID_CHANNELS.length);
  const privateWidget = createAndroidWidgetPayload({ consent: false });
  check("widget-private-default", privateWidget.mode === "private" && privateWidget.progress === null, privateWidget.mode);
  const selectedWidget = createAndroidWidgetPayload({ consent: true, goalLabel: "저녁 산책", nextAction: "10분 걷기", progress: 2, source: "manual" });
  check("widget-selected-minimum", selectedWidget.title === "저녁 산책" && selectedWidget.progress === 2, selectedWidget.title);
  const healthWidget = createAndroidWidgetPayload({ consent: true, goalLabel: "걸음", nextAction: "조금 걷기", progress: 1200, source: "health" });
  check("health-widget-value-hidden", healthWidget.progress === null && healthWidget.source === "health-hidden", healthWidget.source);
  check("boot-other-action-ignored", planAndroidBootRestore({ action: "other" }).outcome === "IGNORED", "ignored");
  check("boot-before-unlock-waits", planAndroidBootRestore({ action: "android.intent.action.BOOT_COMPLETED", appLaunchedBefore: true, userUnlocked: false }).outcome === "WAIT_FOR_UNLOCK", "wait");
  check("restricted-background-waits", planAndroidBootRestore({ action: "android.intent.action.BOOT_COMPLETED", appLaunchedBefore: true, userUnlocked: true, backgroundRestricted: true }).outcome === "WAIT_FOR_APP_OPEN", "wait");
  const restored = planAndroidBootRestore({ action: "android.intent.action.BOOT_COMPLETED", appLaunchedBefore: true, userUnlocked: true, persistedSchedules: [{ scheduleId: "goal-1", enabled: true }, { scheduleId: "goal-1", enabled: true }, { scheduleId: "off", enabled: false }] });
  check("boot-persisted-unique", restored.outcome === "RECONCILE" && restored.enqueue.length === 1 && !restored.network && !restored.postNotification, restored.enqueue.length);
  const ledger = createAndroidEvidenceLedger({ webContract: true, nativeReference: true });
  check("web-native-evidence-separated", ledger.D === "UNKNOWN" && !ledger.nativeBuild && !ledger.physicalDevice && !ledger.boundary.webIsNativeEvidence, ledger.D);
  return { version: ANDROID_PLATFORM_CONTRACT_VERSION, passed: cases.filter(item => item.pass).length, total: cases.length, cases: copy(cases), ledger, boundary: { nativeBuild: false, emulator: false, physicalDevice: false, automaticNotification: false, webIsNativeEvidence: false } };
}

