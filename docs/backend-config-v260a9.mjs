export const BACKEND_CONFIG_VERSION = "wedoit.backend-config.v1";
export const BACKEND_SCHEMA_VERSION = 6;

export const BACKEND_ENV = Object.freeze({
  endpoint: "WEDOIT_BACKEND_ENDPOINT",
  publishableKey: "WEDOIT_BACKEND_PUBLISHABLE_KEY",
  ownerToken: "WEDOIT_REMOTE_OWNER_TOKEN",
  memberToken: "WEDOIT_REMOTE_MEMBER_TOKEN",
  strangerToken: "WEDOIT_REMOTE_STRANGER_TOKEN",
  privateGoalId: "WEDOIT_REMOTE_PRIVATE_GOAL_ID",
  circleGoalId: "WEDOIT_REMOTE_CIRCLE_GOAL_ID",
  publicGoalId: "WEDOIT_REMOTE_PUBLIC_GOAL_ID"
});

const SECRET_NAME = /(?:SERVICE[_-]?ROLE|SECRET|ADMIN[_-]?KEY|PRIVATE[_-]?KEY)/i;
const REQUIRED = Object.values(BACKEND_ENV);
const value = (env, name) => String(env?.[name] || "").trim();

function normalizeEndpoint(raw) {
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:") return null;
    parsed.hash = "";
    parsed.search = "";
    return parsed.href.replace(/\/$/, "");
  } catch (_) {
    return null;
  }
}

export function inspectBackendEnvironment(env = {}) {
  const forbidden = Object.keys(env)
    .filter(name => name.startsWith("WEDOIT_") && SECRET_NAME.test(name) && value(env, name))
    .sort();
  const missing = REQUIRED.filter(name => !value(env, name));
  const endpoint = normalizeEndpoint(value(env, BACKEND_ENV.endpoint));
  const invalid = [];
  if (value(env, BACKEND_ENV.endpoint) && !endpoint) invalid.push(BACKEND_ENV.endpoint);
  if (forbidden.length) invalid.push("FORBIDDEN_SERVER_SECRET");

  const ready = missing.length === 0 && invalid.length === 0;
  const status = Object.freeze({
    version: BACKEND_CONFIG_VERSION,
    schemaVersion: BACKEND_SCHEMA_VERSION,
    outcome: ready ? "READY" : "BLOCKED",
    configured: Boolean(endpoint && value(env, BACKEND_ENV.publishableKey)),
    remoteProbeReady: ready,
    missing: Object.freeze([...missing]),
    invalid: Object.freeze([...new Set(invalid)]),
    forbiddenNames: Object.freeze(forbidden),
    endpoint: endpoint || null,
    credentialPresence: Object.freeze({
      owner: Boolean(value(env, BACKEND_ENV.ownerToken)),
      member: Boolean(value(env, BACKEND_ENV.memberToken)),
      stranger: Boolean(value(env, BACKEND_ENV.strangerToken))
    }),
    boundary: Object.freeze({ actualBackend: false, remoteAccount: false, automaticNetwork: false })
  });

  const result = { status };
  Object.defineProperty(result, "runtime", {
    enumerable: false,
    value: ready ? Object.freeze({
      endpoint,
      publishableKey: value(env, BACKEND_ENV.publishableKey),
      tokens: Object.freeze({
        owner: value(env, BACKEND_ENV.ownerToken),
        member: value(env, BACKEND_ENV.memberToken),
        stranger: value(env, BACKEND_ENV.strangerToken)
      }),
      goals: Object.freeze({
        private: value(env, BACKEND_ENV.privateGoalId),
        circle: value(env, BACKEND_ENV.circleGoalId),
        public: value(env, BACKEND_ENV.publicGoalId)
      })
    }) : null
  });
  return Object.freeze(result);
}

export function backendEnvironmentTemplate() {
  return Object.freeze(Object.fromEntries(REQUIRED.map(name => [name, ""])));
}

