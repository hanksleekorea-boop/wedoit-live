import path from "node:path";

export const SCHEMA6_DEPLOYMENT_VERSION = "wedoit.schema6-deployment.v1";
export const SCHEMA6_EXPECTED = Object.freeze({ tables: 7, policies: 23, functions: 3 });

const ENV = Object.freeze({
  service: "PGSERVICE",
  changeId: "WEDOIT_SCHEMA6_CHANGE_ID",
  backupDir: "WEDOIT_SCHEMA6_BACKUP_DIR",
  approval: "WEDOIT_SCHEMA6_APPROVAL",
  rollbackApproval: "WEDOIT_SCHEMA6_ROLLBACK_APPROVAL"
});
const FORBIDDEN_NAME = /(?:PASSWORD|SECRET|SERVICE[_-]?ROLE|ADMIN[_-]?KEY|PRIVATE[_-]?KEY)/i;
const get = (env, name) => String(env?.[name] || "").trim();
const absolutePath = value => /^(?:[A-Za-z]:[\\/]|\/)/.test(value);

export function inspectSchema6Environment({ env = {}, tools = {} } = {}) {
  const missing = [];
  if (!get(env, ENV.service)) missing.push(ENV.service);
  if (!get(env, ENV.changeId)) missing.push(ENV.changeId);
  if (!get(env, ENV.backupDir)) missing.push(ENV.backupDir);
  const invalid = [];
  if (get(env, ENV.changeId) && !/^[A-Za-z0-9._-]{3,64}$/.test(get(env, ENV.changeId))) invalid.push(ENV.changeId);
  if (get(env, ENV.backupDir) && !absolutePath(get(env, ENV.backupDir))) invalid.push(ENV.backupDir);
  const forbiddenNames = Object.keys(env)
    .filter(name => name.startsWith("WEDOIT_") && FORBIDDEN_NAME.test(name) && get(env, name))
    .sort();
  if (forbiddenNames.length) invalid.push("FORBIDDEN_INLINE_SECRET");
  const missingTools = ["psql", "pgDump", "pgRestore"].filter(name => !tools[name]);
  const ready = missing.length === 0 && invalid.length === 0 && missingTools.length === 0;
  const status = Object.freeze({
    version: SCHEMA6_DEPLOYMENT_VERSION,
    schemaVersion: 6,
    outcome: ready ? "READY" : "BLOCKED",
    missing: Object.freeze(missing),
    invalid: Object.freeze([...new Set(invalid)]),
    forbiddenNames: Object.freeze(forbiddenNames),
    missingTools: Object.freeze(missingTools),
    connectionPresence: Object.freeze({ pgService: Boolean(get(env, ENV.service)), pgPassword: Boolean(get(env, "PGPASSWORD")) }),
    approvals: Object.freeze({
      apply: Boolean(get(env, ENV.changeId)) && get(env, ENV.approval) === get(env, ENV.changeId),
      rollback: Boolean(get(env, ENV.changeId)) && get(env, ENV.rollbackApproval) === `${get(env, ENV.changeId)}:ROLLBACK`
    }),
    boundary: Object.freeze({ actualDatabase: false, actualBackend: false, remoteAccount: false, automaticRollback: false })
  });
  const result = { status };
  Object.defineProperty(result, "runtime", {
    enumerable: false,
    value: ready ? Object.freeze({
      service: get(env, ENV.service),
      changeId: get(env, ENV.changeId),
      backupDir: path.resolve(get(env, ENV.backupDir)),
      tools: Object.freeze({ psql: String(tools.psql), pgDump: String(tools.pgDump), pgRestore: String(tools.pgRestore) })
    }) : null
  });
  return Object.freeze(result);
}

export function buildSchema6DeploymentPlan({ env = {}, tools = {}, root = process.cwd(), now = () => new Date("2026-08-03T00:00:00Z") } = {}) {
  const inspected = inspectSchema6Environment({ env, tools });
  if (inspected.status.outcome !== "READY") return { outcome: "BLOCKED", status: inspected.status, stages: [], rollback: null };
  const runtime = inspected.runtime;
  const stamp = now().toISOString().replace(/[:.]/g, "-");
  const backupFile = path.join(runtime.backupDir, `wedoit-schema6-${runtime.changeId}-${stamp}.dump`);
  const schemaFile = path.resolve(root, "20_SRC", "v26.0-alpha.8_source", "backend-schema-v260a4.sql");
  const readbackFile = path.resolve(root, "20_SRC", "v26.0-alpha.10_source", "schema6-readback-v260a10.sql");
  const database = `service=${runtime.service}`;
  const stages = [
    { id: "backup", command: runtime.tools.pgDump, args: ["--format=custom", `--file=${backupFile}`, "--no-owner", "--no-privileges", "--schema=public", `--dbname=${database}`] },
    { id: "apply", command: runtime.tools.psql, args: [`--dbname=${database}`, "--set=ON_ERROR_STOP=on", `--file=${schemaFile}`] },
    { id: "readback", command: runtime.tools.psql, args: [`--dbname=${database}`, "--set=ON_ERROR_STOP=on", "--tuples-only", `--file=${readbackFile}`] }
  ];
  const rollback = {
    automatic: false,
    approvalRequired: `${runtime.changeId}:ROLLBACK`,
    command: runtime.tools.pgRestore,
    args: ["--clean", "--if-exists", "--no-owner", "--no-privileges", `--dbname=${database}`, backupFile]
  };
  return { outcome: "READY", status: inspected.status, changeId: runtime.changeId, backupFile, stages, rollback };
}

export async function executeSchema6Deployment({ env = {}, tools = {}, root = process.cwd(), now, run = async () => ({ status: 127 }) } = {}) {
  const plan = buildSchema6DeploymentPlan({ env, tools, root, now });
  if (plan.outcome !== "READY") return { ...plan, executed: false, results: [], boundary: plan.status.boundary };
  if (!plan.status.approvals.apply) {
    return { ...plan, outcome: "BLOCKED", reason: "explicit apply approval missing", executed: false, results: [], boundary: plan.status.boundary };
  }
  const results = [];
  for (const stage of plan.stages) {
    const response = await run({ command: stage.command, args: [...stage.args], env });
    const status = Number(response?.status);
    results.push({ id: stage.id, status: Number.isFinite(status) ? status : 1 });
    if (status !== 0) {
      return { ...plan, outcome: "FAIL", failedStage: stage.id, executed: true, results, boundary: { ...plan.status.boundary, actualDatabase: stage.id !== "backup" } };
    }
  }
  return {
    ...plan,
    outcome: "PASS",
    executed: true,
    results,
    boundary: { actualDatabase: true, actualBackend: false, remoteAccount: false, automaticRollback: false }
  };
}

export const schema6EnvironmentNames = ENV;
