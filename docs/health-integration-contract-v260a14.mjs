export const HEALTH_INTEGRATION_CONTRACT_VERSION = "wedoit.health-integration.v1";

const GOAL_READS = Object.freeze({
  walking: Object.freeze({ healthConnect: ["READ_STEPS"], healthKit: ["stepCount"], wear: ["ACTIVITY_RECOGNITION"] }),
  exercise: Object.freeze({ healthConnect: ["READ_EXERCISE"], healthKit: ["workoutType"], wear: ["ACTIVITY_RECOGNITION"] }),
  sleep: Object.freeze({ healthConnect: ["READ_SLEEP"], healthKit: ["sleepAnalysis"], wear: [] })
});
const HEALTH_FIELDS = new Set(["source", "type", "value", "unit", "startedAt", "endedAt", "sourceRecordIdHash"]);
const SOURCES = new Set(["health-connect", "healthkit", "wear-health-services"]);
const TYPES = new Set(["steps", "exercise", "sleep"]);
const text = (value, max = 120) => String(value || "").trim().slice(0, max);
const clone = value => JSON.parse(JSON.stringify(value));

export function planHealthPermissions(input = {}) {
  const goalType = String(input.goalType || ""), platform = String(input.platform || "");
  const configured = GOAL_READS[goalType];
  if (!configured || !["healthConnect", "healthKit", "wear"].includes(platform)) return Object.freeze({ outcome: "NO_PERMISSION", permissions: Object.freeze([]), reason: "goal-does-not-require-health-data", requestInContext: false });
  const permissions = configured[platform];
  if (!permissions.length) return Object.freeze({ outcome: "NO_PERMISSION", permissions: Object.freeze([]), reason: "platform-data-not-needed", requestInContext: false });
  return Object.freeze({
    outcome: "ASK_IN_CONTEXT",
    permissions: Object.freeze([...permissions]),
    access: "read-only",
    requestInContext: true,
    foregroundOnly: true,
    backgroundRead: false,
    fullHistory: false,
    write: false,
    reason: "selected-goal-minimum"
  });
}

export function evaluateHealthConnectAccess(input = {}) {
  if (input.available !== true) return Object.freeze({ outcome: "UNAVAILABLE", sync: false, nextAction: "show-manual-entry" });
  if (input.userSyncEnabled !== true) return Object.freeze({ outcome: "PAUSED", sync: false, nextAction: "none" });
  const required = new Set(Array.isArray(input.required) ? input.required : []), granted = new Set(Array.isArray(input.granted) ? input.granted : []);
  const missing = [...required].filter(permission => !granted.has(permission));
  if (missing.length) return Object.freeze({ outcome: "INSUFFICIENT_ACCESS", sync: false, missing: Object.freeze(missing), nextAction: input.cancelCount >= 2 ? "open-health-connect-settings" : "request-in-context" });
  return Object.freeze({ outcome: "READY", sync: true, windowDays: 30, backgroundRead: false, nextAction: "foreground-read" });
}

export function interpretHealthKitRead(input = {}) {
  if (input.available !== true) return Object.freeze({ outcome: "UNAVAILABLE", samples: Object.freeze([]) });
  if (input.error) return Object.freeze({ outcome: "ERROR", samples: Object.freeze([]), reason: text(input.error?.code || input.error) });
  const samples = Array.isArray(input.samples) ? input.samples : [];
  return Object.freeze({ outcome: samples.length ? "DATA" : "NO_DATA_OR_NO_ACCESS", samples: Object.freeze(clone(samples)), readPermissionInferred: false });
}

export function normalizePrivateHealthEvent(input = {}) {
  const unsupported = Object.keys(input).filter(key => !HEALTH_FIELDS.has(key));
  if (unsupported.length) throw new TypeError(`unsupported health fields: ${unsupported.sort().join(",")}`);
  if (!SOURCES.has(input.source)) throw new TypeError("unsupported health source");
  if (!TYPES.has(input.type)) throw new TypeError("unsupported health type");
  const value = Number(input.value);
  if (!Number.isFinite(value) || value < 0) throw new TypeError("health value must be a non-negative number");
  const startedAt = Number(input.startedAt), endedAt = Number(input.endedAt ?? input.startedAt);
  if (!Number.isFinite(startedAt) || !Number.isFinite(endedAt) || endedAt < startedAt) throw new TypeError("invalid health time range");
  const sourceRecordIdHash = text(input.sourceRecordIdHash, 80);
  if (!/^sha256:[0-9a-f]{16,64}$/i.test(sourceRecordIdHash)) throw new TypeError("source record id must be a hash");
  return Object.freeze({
    source: input.source, type: input.type, value, unit: text(input.unit, 24), startedAt, endedAt, sourceRecordIdHash,
    private: true, socialEligible: false, rankingEligible: false, widgetEligible: false, medicalInterpretation: false
  });
}

export function planHealthDisconnect(input = {}) {
  return Object.freeze({ sync: false, revokeInSystemSettings: true, deleteSourceData: false, importedData: input.deleteImported === true ? "delete-local-imports" : "retain-private-with-source-label", socialChange: "none" });
}

export function createHealthEvidenceLedger(input = {}) {
  const actual = key => input[key] === true && /^device:/.test(text(input[`${key}Evidence`], 180));
  const healthConnect = actual("healthConnect"), wear = actual("wear"), healthKit = actual("healthKit");
  return Object.freeze({ version: HEALTH_INTEGRATION_CONTRACT_VERSION, contract: input.contract === true, healthConnect, wear, healthKit, physicalDevice: healthConnect || wear || healthKit, D: healthConnect || wear || healthKit ? "PARTIAL" : "UNKNOWN", boundary: Object.freeze({ webIsHealthEvidence: false, automaticHealthSync: false, healthToSocial: false, medicalAdvice: false }) });
}

export async function runHealthIntegrationReadback() {
  const cases = [], check = (id, condition, detail) => cases.push({ id, pass: Boolean(condition), detail: String(detail) });
  const walk = planHealthPermissions({ goalType: "walking", platform: "healthConnect" });
  check("walking-steps-only", walk.permissions.length === 1 && walk.permissions[0] === "READ_STEPS", walk.permissions.join(","));
  check("read-only-foreground-default", walk.access === "read-only" && walk.foregroundOnly && !walk.backgroundRead && !walk.fullHistory && !walk.write, walk.access);
  check("unrelated-goal-no-permission", planHealthPermissions({ goalType: "money", platform: "healthConnect" }).outcome === "NO_PERMISSION", "none");
  check("wear-walking-no-heart-location", planHealthPermissions({ goalType: "walking", platform: "wear" }).permissions.join(",") === "ACTIVITY_RECOGNITION", "activity-only");
  check("health-connect-unavailable-manual", evaluateHealthConnectAccess({ available: false }).nextAction === "show-manual-entry", "manual");
  check("sync-toggle-pauses", evaluateHealthConnectAccess({ available: true, userSyncEnabled: false }).outcome === "PAUSED", "paused");
  check("missing-permission-in-context", evaluateHealthConnectAccess({ available: true, userSyncEnabled: true, required: ["READ_STEPS"], granted: [] }).nextAction === "request-in-context", "request");
  check("cancel-twice-settings", evaluateHealthConnectAccess({ available: true, userSyncEnabled: true, required: ["READ_STEPS"], granted: [], cancelCount: 2 }).nextAction === "open-health-connect-settings", "settings");
  const ready = evaluateHealthConnectAccess({ available: true, userSyncEnabled: true, required: ["READ_STEPS"], granted: ["READ_STEPS"] });
  check("health-connect-30d-foreground", ready.sync && ready.windowDays === 30 && !ready.backgroundRead, ready.windowDays);
  check("healthkit-empty-not-denied", interpretHealthKitRead({ available: true, samples: [] }).outcome === "NO_DATA_OR_NO_ACCESS", "ambiguous");
  const event = normalizePrivateHealthEvent({ source: "health-connect", type: "steps", value: 1200, unit: "count", startedAt: 1000, endedAt: 2000, sourceRecordIdHash: "sha256:0123456789abcdef" });
  check("health-event-private", event.private && !event.socialEligible && !event.rankingEligible && !event.widgetEligible, event.private);
  check("health-event-no-medical-claim", event.medicalInterpretation === false, event.medicalInterpretation);
  check("raw-device-metadata-rejected", (() => { try { normalizePrivateHealthEvent({ source: "health-connect", type: "steps", value: 1, startedAt: 1, sourceRecordIdHash: "sha256:0123456789abcdef", deviceSerial: "raw" }); return false; } catch { return true; } })(), "rejected");
  const disconnect = planHealthDisconnect({ deleteImported: true });
  check("disconnect-never-deletes-source", !disconnect.sync && !disconnect.deleteSourceData && disconnect.importedData === "delete-local-imports", disconnect.importedData);
  const ledger = createHealthEvidenceLedger({ contract: true });
  check("web-health-evidence-separated", ledger.D === "UNKNOWN" && !ledger.physicalDevice && !ledger.boundary.webIsHealthEvidence, ledger.D);
  check("no-automatic-health-to-social", !ledger.boundary.automaticHealthSync && !ledger.boundary.healthToSocial && !ledger.boundary.medicalAdvice, "false/false/false");
  return { version: HEALTH_INTEGRATION_CONTRACT_VERSION, passed: cases.filter(item => item.pass).length, total: cases.length, cases: clone(cases), ledger, boundary: { actualHealthConnect: false, actualWearHealthServices: false, actualHealthKit: false, physicalDevice: false, automaticHealthSync: false, healthToSocial: false, medicalAdvice: false } };
}

