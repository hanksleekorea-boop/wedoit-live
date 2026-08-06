export const REMOTE_NETWORK_SCENARIOS_VERSION = "wedoit.remote-network-scenarios.v1";

export const NETWORK_ENV = Object.freeze({
  endpoint: "WEDOIT_BACKEND_ENDPOINT",
  publishableKey: "WEDOIT_BACKEND_PUBLISHABLE_KEY",
  ownerToken: "WEDOIT_REMOTE_OWNER_TOKEN",
  fixtureGoalId: "WEDOIT_NETWORK_PROBE_FIXTURE_GOAL_ID",
  approval: "WEDOIT_NETWORK_PROBE_APPROVAL"
});

const APPROVAL = "RUN_DEDICATED_TEST_FIXTURE";
const SECRET_NAME = /(?:SERVICE[_-]?ROLE|SECRET|ADMIN[_-]?KEY|PRIVATE[_-]?KEY)/i;
const REQUIRED = Object.values(NETWORK_ENV);
const value = (env, name) => String(env?.[name] || "").trim();

function endpoint(raw) {
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:") return null;
    parsed.hash = ""; parsed.search = "";
    return parsed.href.replace(/\/$/, "");
  } catch { return null; }
}

export function inspectRemoteNetworkEnvironment(env = {}) {
  const forbiddenNames = Object.keys(env).filter(name => name.startsWith("WEDOIT_") && SECRET_NAME.test(name) && value(env, name)).sort();
  const missing = REQUIRED.filter(name => !value(env, name));
  const normalizedEndpoint = endpoint(value(env, NETWORK_ENV.endpoint));
  const invalid = [];
  if (value(env, NETWORK_ENV.endpoint) && !normalizedEndpoint) invalid.push(NETWORK_ENV.endpoint);
  if (value(env, NETWORK_ENV.approval) && value(env, NETWORK_ENV.approval) !== APPROVAL) invalid.push(NETWORK_ENV.approval);
  if (forbiddenNames.length) invalid.push("FORBIDDEN_SERVER_SECRET");
  const ready = missing.length === 0 && invalid.length === 0;
  const status = Object.freeze({
    version: REMOTE_NETWORK_SCENARIOS_VERSION,
    outcome: ready ? "READY" : "BLOCKED",
    configured: Boolean(normalizedEndpoint && value(env, NETWORK_ENV.publishableKey)),
    dedicatedFixtureApproved: value(env, NETWORK_ENV.approval) === APPROVAL,
    missing: Object.freeze([...missing]),
    invalid: Object.freeze([...new Set(invalid)]),
    forbiddenNames: Object.freeze(forbiddenNames),
    credentialPresence: Object.freeze({ owner: Boolean(value(env, NETWORK_ENV.ownerToken)) }),
    boundary: Object.freeze({ actualBackend: false, automaticNetwork: false })
  });
  const result = { status };
  Object.defineProperty(result, "runtime", { enumerable: false, value: ready ? Object.freeze({
    endpoint: normalizedEndpoint,
    publishableKey: value(env, NETWORK_ENV.publishableKey),
    ownerToken: value(env, NETWORK_ENV.ownerToken),
    fixtureGoalId: value(env, NETWORK_ENV.fixtureGoalId)
  }) : null });
  return Object.freeze(result);
}

function parseRetryAfter(value, now) {
  if (value == null || value === "") return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.round(seconds * 1000);
  const date = Date.parse(String(value));
  return Number.isFinite(date) ? Math.max(0, date - now) : null;
}

function safeError(error) {
  return String(error?.message || error || "request failed").replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]").slice(0, 240);
}

async function body(response) {
  try { return await response?.json?.() || {}; } catch { return {}; }
}

export async function runRemoteNetworkScenarios({ env = {}, fetchImpl = globalThis.fetch, wait = ms => new Promise(resolve => setTimeout(resolve, ms)), now = () => Date.now(), maxRetryAfterMs = 30000 } = {}) {
  const config = inspectRemoteNetworkEnvironment(env);
  const blocked = reason => ({ version: REMOTE_NETWORK_SCENARIOS_VERSION, outcome: "BLOCKED", passed: 0, total: 0, calls: 0, reason, config: config.status, cases: [], boundary: { actualBackend: false, remoteContract: false, automaticNetwork: false } });
  if (config.status.outcome !== "READY") return blocked("configuration or dedicated test-fixture approval is incomplete or unsafe");
  if (typeof fetchImpl !== "function") return blocked("fetch unavailable");

  const runtime = config.runtime, cases = [];
  let calls = 0, transportReached = false;
  const check = (id, pass, detail) => cases.push({ id, pass: Boolean(pass), detail: String(detail) });
  const finish = () => {
    const passed = cases.filter(item => item.pass).length;
    return { version: REMOTE_NETWORK_SCENARIOS_VERSION, outcome: passed === cases.length && cases.length === 9 ? "PASS" : "FAIL", passed, total: cases.length, calls, config: config.status, cases, boundary: { actualBackend: transportReached, remoteContract: passed === 9, automaticNetwork: false } };
  };
  const commonHeaders = { authorization: `Bearer ${runtime.ownerToken}`, "x-wedoit-publishable-key": runtime.publishableKey, "x-wedoit-test-fixture": runtime.fixtureGoalId, accept: "application/json" };
  const request = async (path, options = {}) => {
    calls += 1;
    const response = await fetchImpl(`${runtime.endpoint}${path}`, { cache: "no-store", ...options, headers: { ...commonHeaders, ...(options.headers || {}) } });
    transportReached ||= Number(response?.status) > 0;
    return response;
  };

  try {
    const first429 = await request("/v1/network-probes/retry-after", { method: "GET" });
    const retryAfter = first429?.headers?.get?.("retry-after") ?? null;
    const delayMs = parseRetryAfter(retryAfter, now());
    check("429-received", first429?.status === 429, first429?.status || 0);
    check("retry-after-valid", delayMs !== null && delayMs <= maxRetryAfterMs, delayMs);
    if (first429?.status === 429 && delayMs !== null && delayMs <= maxRetryAfterMs) {
      await wait(delayMs);
      const recovered = await request("/v1/network-probes/retry-after", { method: "GET" });
      check("retry-after-recovered", recovered?.status === 200, recovered?.status || 0);
    } else {
      check("retry-after-recovered", false, "retry suppressed; later write probes not started");
      return finish();
    }

    let offlineDetected = false;
    try { await request("/v1/network-probes/online-recovery", { method: "GET" }); }
    catch (error) { offlineDetected = true; check("offline-detected", true, safeError(error)); }
    if (!offlineDetected) check("offline-detected", false, "transport did not fail");
    if (offlineDetected) {
      await wait(0);
      const restored = await request("/v1/network-probes/online-recovery", { method: "GET" });
      check("online-restored", restored?.status === 200, restored?.status || 0);
    } else check("online-restored", false, "restore not exercised");

    const operationId = `conflict:${runtime.fixtureGoalId}`;
    const stale = await request(`/v1/network-probes/fixtures/${encodeURIComponent(runtime.fixtureGoalId)}`, { method: "PATCH", headers: { "content-type": "application/json", "x-wedoit-client-operation-id": operationId, "idempotency-key": `${operationId}:stale` }, body: JSON.stringify({ expectedVersion: 0, probeOnly: true }) });
    const staleBody = await body(stale), currentVersion = Number(staleBody.currentVersion);
    check("409-received", stale?.status === 409 && Number.isInteger(currentVersion) && currentVersion > 0, `${stale?.status || 0}/${currentVersion}`);
    const refreshed = await request(`/v1/network-probes/fixtures/${encodeURIComponent(runtime.fixtureGoalId)}`, { method: "PATCH", headers: { "content-type": "application/json", "x-wedoit-client-operation-id": operationId, "idempotency-key": `${operationId}:refresh` }, body: JSON.stringify({ expectedVersion: currentVersion, probeOnly: true }) });
    check("409-refresh-recovered", refreshed?.status === 200, refreshed?.status || 0);

    const idempotencyKey = `repeat:${runtime.fixtureGoalId}`;
    const idempotencyOptions = { method: "POST", headers: { "content-type": "application/json", "idempotency-key": idempotencyKey }, body: JSON.stringify({ fixtureGoalId: runtime.fixtureGoalId, probeOnly: true }) };
    const first = await request("/v1/network-probes/idempotency", idempotencyOptions), firstBody = await body(first);
    const second = await request("/v1/network-probes/idempotency", idempotencyOptions), secondBody = await body(second);
    check("idempotency-first-created", first?.status === 201 && Boolean(firstBody.operationId), `${first?.status || 0}/${firstBody.operationId || "none"}`);
    check("idempotency-repeat-replayed", second?.status === 200 && secondBody.replayed === true && secondBody.operationId === firstBody.operationId, `${second?.status || 0}/${secondBody.replayed}`);
  } catch (error) {
    check("scenario-completed", false, safeError(error));
  }

  return finish();
}
