import { createSafetyApiClient } from "../v26.0-alpha.11_source/safety-api-v260a11.mjs";

export const REMOTE_SAFETY_PROBE_VERSION = "wedoit.remote-safety-probe.v1";
const APPROVAL = "RUN_DEDICATED_SAFETY_FIXTURE";
const value = (env, key) => String(env?.[key] || "").trim();

export function inspectRemoteSafetyEnvironment(env = {}) {
  const required = ["WEDOIT_BACKEND_ENDPOINT", "WEDOIT_BACKEND_PUBLISHABLE_KEY", "WEDOIT_SAFETY_PROBE_ACCESS_TOKEN", "WEDOIT_SAFETY_PROBE_SESSION_ACTOR_ID", "WEDOIT_SAFETY_PROBE_TARGET_ACTOR_ID", "WEDOIT_SAFETY_PROBE_POST_ID", "WEDOIT_SAFETY_PROBE_CIRCLE_ID", "WEDOIT_SAFETY_PROBE_RUN_ID"];
  const missing = required.filter(key => !value(env, key));
  const approved = value(env, "WEDOIT_SAFETY_PROBE_APPROVAL") === APPROVAL;
  let endpointValid = false;
  try { endpointValid = new URL(value(env, "WEDOIT_BACKEND_ENDPOINT")).protocol === "https:"; } catch (_) {}
  const outcome = missing.length === 0 && approved && endpointValid ? "READY" : "BLOCKED";
  return Object.freeze({ version: REMOTE_SAFETY_PROBE_VERSION, outcome, reason: outcome === "READY" ? "dedicated safety fixture ready" : "configuration, HTTPS endpoint, or exact approval missing", missing: Object.freeze(missing), approved, endpointValid, calls: 0, credentialsExposed: false });
}

export async function runRemoteSafetyProbe({ env = {}, fetchImpl = globalThis.fetch } = {}) {
  const inspection = inspectRemoteSafetyEnvironment(env);
  if (inspection.outcome !== "READY") return inspection;
  let calls = 0;
  const countedFetch = async (...args) => { calls += 1; return fetchImpl(...args); };
  const client = createSafetyApiClient({
    config: { endpoint: value(env, "WEDOIT_BACKEND_ENDPOINT"), publishableKey: value(env, "WEDOIT_BACKEND_PUBLISHABLE_KEY") },
    session: { remote: true, actorId: value(env, "WEDOIT_SAFETY_PROBE_SESSION_ACTOR_ID"), accessToken: value(env, "WEDOIT_SAFETY_PROBE_ACCESS_TOKEN") },
    fetchImpl: countedFetch
  });
  const run = value(env, "WEDOIT_SAFETY_PROBE_RUN_ID"), actorId = value(env, "WEDOIT_SAFETY_PROBE_TARGET_ACTOR_ID"), postId = value(env, "WEDOIT_SAFETY_PROBE_POST_ID"), circleId = value(env, "WEDOIT_SAFETY_PROBE_CIRCLE_ID");
  try {
    const results = [];
    results.push(await client.report({ targetKind: "post", targetId: postId, reasonCode: "unsafe", idempotencyKey: `${run}.report` }));
    results.push(await client.setMute({ actorId, enabled: true, idempotencyKey: `${run}.mute.on` }));
    results.push(await client.setMute({ actorId, enabled: false, idempotencyKey: `${run}.mute.off` }));
    results.push(await client.setBlock({ actorId, enabled: true, idempotencyKey: `${run}.block.on` }));
    results.push(await client.setBlock({ actorId, enabled: false, idempotencyKey: `${run}.block.off` }));
    results.push(await client.setRankingConsent({ circleId, optIn: true, idempotencyKey: `${run}.ranking.on` }));
    results.push(await client.setRankingConsent({ circleId, optIn: false, idempotencyKey: `${run}.ranking.off` }));
    return Object.freeze({ version: REMOTE_SAFETY_PROBE_VERSION, outcome: "PASS", reason: "seven safety delivery transitions accepted", calls, statuses: Object.freeze(results.map(item => item.status)), cleanup: Object.freeze({ mute: "disabled", block: "disabled", rankingConsent: "opted-out" }), credentialsExposed: false, boundary: Object.freeze({ actualBackend: true, dedicatedFixtureOnly: true, automaticNetwork: false }) });
  } catch (error) {
    return Object.freeze({ version: REMOTE_SAFETY_PROBE_VERSION, outcome: "FAIL", reason: String(error?.message || "safety probe failed"), calls, credentialsExposed: false, boundary: Object.freeze({ actualBackend: calls > 0, dedicatedFixtureOnly: true, automaticNetwork: false }) });
  }
}
