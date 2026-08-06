import { BACKEND_CONFIG_VERSION, BACKEND_SCHEMA_VERSION, inspectBackendEnvironment } from "./backend-config-v260a9.mjs";

export const REMOTE_RLS_PROBE_VERSION = "wedoit.remote-rls-probe.v1";
const DENIED = new Set([403, 404]);

const matrix = runtime => [
  { id: "owner-private-read", actor: "owner", goal: runtime.goals.private, expect: "allow" },
  { id: "member-private-denied", actor: "member", goal: runtime.goals.private, expect: "deny" },
  { id: "stranger-private-denied", actor: "stranger", goal: runtime.goals.private, expect: "deny" },
  { id: "owner-circle-read", actor: "owner", goal: runtime.goals.circle, expect: "allow" },
  { id: "member-circle-read", actor: "member", goal: runtime.goals.circle, expect: "allow" },
  { id: "stranger-circle-denied", actor: "stranger", goal: runtime.goals.circle, expect: "deny" },
  { id: "owner-public-read", actor: "owner", goal: runtime.goals.public, expect: "allow" },
  { id: "member-public-read", actor: "member", goal: runtime.goals.public, expect: "allow" },
  { id: "stranger-public-read", actor: "stranger", goal: runtime.goals.public, expect: "allow" }
];

function safeError(error) {
  const message = String(error?.message || error || "request failed");
  return message.replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]").slice(0, 240);
}

export async function runRemoteRlsProbe({ env = {}, fetchImpl = globalThis.fetch } = {}) {
  const config = inspectBackendEnvironment(env);
  if (config.status.outcome !== "READY") {
    return {
      version: REMOTE_RLS_PROBE_VERSION,
      configVersion: BACKEND_CONFIG_VERSION,
      schemaVersion: BACKEND_SCHEMA_VERSION,
      outcome: "BLOCKED",
      passed: 0,
      total: 0,
      reason: "remote backend configuration is incomplete or unsafe",
      config: config.status,
      cases: [],
      boundary: { actualBackend: false, remoteAccount: false, automaticNetwork: false }
    };
  }
  if (typeof fetchImpl !== "function") {
    return {
      version: REMOTE_RLS_PROBE_VERSION,
      configVersion: BACKEND_CONFIG_VERSION,
      schemaVersion: BACKEND_SCHEMA_VERSION,
      outcome: "BLOCKED",
      passed: 0,
      total: 0,
      reason: "fetch unavailable",
      config: config.status,
      cases: [],
      boundary: { actualBackend: false, remoteAccount: false, automaticNetwork: false }
    };
  }

  const cases = [];
  let transportReached = false;
  for (const item of matrix(config.runtime)) {
    let status = 0;
    let error = null;
    try {
      const response = await fetchImpl(`${config.runtime.endpoint}/v1/goals/${encodeURIComponent(item.goal)}`, {
        method: "GET",
        headers: {
          authorization: `Bearer ${config.runtime.tokens[item.actor]}`,
          "x-wedoit-publishable-key": config.runtime.publishableKey,
          accept: "application/json"
        },
        cache: "no-store"
      });
      status = Number(response?.status) || 0;
      transportReached ||= status > 0;
    } catch (caught) {
      error = safeError(caught);
    }
    const pass = item.expect === "allow" ? status === 200 : DENIED.has(status);
    cases.push({ id: item.id, actor: item.actor, expectation: item.expect, status, pass, ...(error ? { error } : {}) });
  }

  const passed = cases.filter(item => item.pass).length;
  const complete = passed === cases.length;
  return {
    version: REMOTE_RLS_PROBE_VERSION,
    configVersion: BACKEND_CONFIG_VERSION,
    schemaVersion: BACKEND_SCHEMA_VERSION,
    outcome: complete ? "PASS" : "FAIL",
    passed,
    total: cases.length,
    config: config.status,
    cases,
    boundary: {
      actualBackend: transportReached,
      remoteAccount: complete,
      automaticNetwork: false
    }
  };
}

