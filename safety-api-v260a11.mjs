export const SAFETY_API_VERSION = "wedoit.safety-api.v1";
export const REPORT_REASONS = Object.freeze(["spam", "harassment", "unsafe", "privacy", "impersonation"]);
export const AUDIT_ACTIONS = Object.freeze(["report.create", "mute.enable", "mute.disable", "block.enable", "block.disable", "ranking.opt-in", "ranking.opt-out"]);

const idPattern = /^[A-Za-z0-9._:-]{1,128}$/;
const forbiddenConfig = config => Boolean(config?.serviceRoleKey || config?.adminKey || config?.secretKey || config?.privateKey);
const cleanId = (value, label) => {
  const normalized = String(value || "").trim();
  if (!idPattern.test(normalized)) throw new Error(`invalid ${label}`);
  return normalized;
};

function validateConnection({ config = {}, session = {}, fetchImpl } = {}) {
  if (forbiddenConfig(config)) throw new Error("server secret must not be placed in the client");
  let endpoint;
  try {
    const parsed = new URL(config.endpoint);
    if (parsed.protocol !== "https:") throw new Error("https required");
    endpoint = parsed.href.replace(/\/$/, "");
  } catch (_) { throw new Error("valid HTTPS backend endpoint required"); }
  if (!String(config.publishableKey || "").trim()) throw new Error("publishable key required");
  if (!session.remote || !String(session.actorId || "").trim() || !String(session.accessToken || "").trim()) throw new Error("authenticated remote session required");
  if (typeof fetchImpl !== "function") throw new Error("fetch unavailable");
  return { endpoint, publishableKey: String(config.publishableKey), actorId: String(session.actorId), accessToken: String(session.accessToken) };
}

function strictKeys(input, allowed) {
  const extra = Object.keys(input || {}).filter(key => !allowed.includes(key));
  if (extra.length) throw new Error(`unsupported fields: ${extra.join(",")}`);
}

export function normalizeReport(input = {}) {
  strictKeys(input, ["targetKind", "targetId", "reasonCode", "idempotencyKey"]);
  const targetKind = ["profile", "post", "circle"].includes(input.targetKind) ? input.targetKind : null;
  if (!targetKind) throw new Error("invalid report target kind");
  if (!REPORT_REASONS.includes(input.reasonCode)) throw new Error("invalid report reason code");
  return Object.freeze({
    targetKind,
    targetId: cleanId(input.targetId, "report target id"),
    reasonCode: input.reasonCode,
    idempotencyKey: cleanId(input.idempotencyKey, "idempotency key")
  });
}

export function minimizeAuditEvent(input = {}) {
  const action = AUDIT_ACTIONS.includes(input.action) ? input.action : null;
  if (!action) throw new Error("invalid audit action");
  return Object.freeze({
    action,
    actorId: cleanId(input.actorId, "audit actor id"),
    targetKind: ["profile", "post", "circle"].includes(input.targetKind) ? input.targetKind : "profile",
    targetIdHash: cleanId(input.targetIdHash, "audit target hash"),
    requestId: cleanId(input.requestId, "audit request id"),
    createdAt: Number(input.createdAt)
  });
}

export function createSafetyApiClient({ config, session, fetchImpl = globalThis.fetch } = {}) {
  const connection = validateConnection({ config, session, fetchImpl });
  const request = async ({ method, route, idempotencyKey, body, expected }) => {
    const response = await fetchImpl(`${connection.endpoint}${route}`, {
      method,
      headers: {
        authorization: `Bearer ${connection.accessToken}`,
        "x-wedoit-publishable-key": connection.publishableKey,
        "idempotency-key": cleanId(idempotencyKey, "idempotency key"),
        "content-type": "application/json",
        accept: "application/json"
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    if (!expected.includes(Number(response?.status))) throw new Error(`safety backend ${Number(response?.status) || "failed"}`);
    if (Number(response.status) === 204) return { ok: true, status: 204 };
    const payload = await response.json();
    return { ok: true, status: Number(response.status), requestId: payload?.requestId || null, consent: payload?.consent || null };
  };
  return Object.freeze({
    id: SAFETY_API_VERSION,
    boundary: Object.freeze({ actualBackend: false, remoteAccount: true, automaticNetwork: false }),
    report(input) {
      const report = normalizeReport(input);
      return request({ method: "POST", route: "/v1/reports", idempotencyKey: report.idempotencyKey, body: { targetKind: report.targetKind, targetId: report.targetId, reasonCode: report.reasonCode }, expected: [202] });
    },
    setMute({ actorId, enabled, idempotencyKey } = {}) {
      if (typeof enabled !== "boolean") throw new Error("mute enabled boolean required");
      return request({ method: enabled ? "PUT" : "DELETE", route: `/v1/mutes/${encodeURIComponent(cleanId(actorId, "mute actor id"))}`, idempotencyKey, expected: [204] });
    },
    setBlock({ actorId, enabled, idempotencyKey } = {}) {
      if (typeof enabled !== "boolean") throw new Error("block enabled boolean required");
      return request({ method: enabled ? "PUT" : "DELETE", route: `/v1/blocks/${encodeURIComponent(cleanId(actorId, "block actor id"))}`, idempotencyKey, expected: [204] });
    },
    setRankingConsent({ circleId, optIn, idempotencyKey } = {}) {
      if (typeof optIn !== "boolean") throw new Error("ranking optIn boolean required");
      return request({ method: "PUT", route: `/v1/ranking-consents/${encodeURIComponent(cleanId(circleId, "ranking circle id"))}`, idempotencyKey, body: { optIn }, expected: [200] });
    }
  });
}

