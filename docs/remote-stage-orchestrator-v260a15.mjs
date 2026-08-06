import { inspectBackendEnvironment } from "../v26.0-alpha.9_source/backend-config-v260a9.mjs";
import { inspectSchema6Environment } from "../v26.0-alpha.10_source/schema6-deployment-v260a10.mjs";
import { inspectRemoteNetworkEnvironment } from "../v26.0-alpha.12_source/remote-network-scenarios-v260a12.mjs";

export const REMOTE_STAGE_ORCHESTRATOR_VERSION = "wedoit.remote-stage-orchestrator.v1";
export const REMOTE_STAGES = Object.freeze([
  Object.freeze({ id: "rls-read", mutates: false, approval: null, prerequisite: "three short-lived test accounts and three fixtures" }),
  Object.freeze({ id: "schema6-apply", mutates: true, approval: "WEDOIT_SCHEMA6_APPROVAL=<change-id>", prerequisite: "backup directory and PostgreSQL tools" }),
  Object.freeze({ id: "safety-delivery", mutates: true, approval: "WEDOIT_SAFETY_PROBE_APPROVAL=RUN_DEDICATED_SAFETY_FIXTURE", prerequisite: "dedicated report/mute/block fixture endpoint" }),
  Object.freeze({ id: "network-recovery", mutates: true, approval: "WEDOIT_NETWORK_PROBE_APPROVAL=RUN_DEDICATED_TEST_FIXTURE", prerequisite: "dedicated network probe goal" })
]);
const text = value => String(value || "").trim();

export function buildRemoteStagePlan({ env = {}, tools = {}, selectedStage = null } = {}) {
  const backend = inspectBackendEnvironment(env).status;
  const schema = inspectSchema6Environment({ env, tools }).status;
  const network = inspectRemoteNetworkEnvironment(env).status;
  const safetyApproved = text(env.WEDOIT_SAFETY_PROBE_APPROVAL) === "RUN_DEDICATED_SAFETY_FIXTURE";
  const statuses = {
    "rls-read": backend.outcome === "READY" ? "READY" : "BLOCKED",
    "schema6-apply": schema.outcome === "READY" && schema.approvals.apply ? "READY" : "BLOCKED",
    "safety-delivery": backend.outcome === "READY" && safetyApproved ? "READY" : "BLOCKED",
    "network-recovery": network.outcome === "READY" ? "READY" : "BLOCKED"
  };
  const stages = REMOTE_STAGES.map(stage => Object.freeze({ ...stage, status: statuses[stage.id], selected: stage.id === selectedStage }));
  if (selectedStage !== null && !REMOTE_STAGES.some(stage => stage.id === selectedStage)) return Object.freeze({ version: REMOTE_STAGE_ORCHESTRATOR_VERSION, outcome: "BLOCKED", reason: "unknown stage", selectedStage, stages: Object.freeze(stages), calls: 0, automaticChain: false });
  const selected = selectedStage ? stages.find(stage => stage.id === selectedStage) : null;
  return Object.freeze({ version: REMOTE_STAGE_ORCHESTRATOR_VERSION, outcome: !selected ? "PLAN_ONLY" : selected.status, reason: !selected ? "select exactly one stage" : selected.status === "READY" ? "single stage ready" : "selected stage prerequisites or approval missing", selectedStage, stages: Object.freeze(stages), calls: 0, automaticChain: false, rollbackApprovalSeparate: true, boundary: Object.freeze({ actualBackend: false, actualDatabase: false, remoteAccount: false, automaticNetwork: false }) });
}

export async function executeRemoteStage({ env = {}, tools = {}, selectedStage, adapters = {} } = {}) {
  const plan = buildRemoteStagePlan({ env, tools, selectedStage });
  if (plan.outcome !== "READY") return plan;
  const adapter = adapters[selectedStage];
  if (typeof adapter !== "function") return Object.freeze({ ...plan, outcome: "BLOCKED", reason: "stage adapter unavailable", calls: 0 });
  const result = await adapter();
  const outcome = result?.outcome === "PASS" ? "PASS" : result?.outcome === "BLOCKED" ? "BLOCKED" : "FAIL";
  return Object.freeze({ ...plan, outcome, calls: 1, stageResult: result, automaticChain: false });
}

export async function runRemoteStageReadback() {
  const cases=[],check=(id,value,detail)=>cases.push({id,pass:Boolean(value),detail:String(detail)});
  const empty=buildRemoteStagePlan({});
  check("empty-plan-only",empty.outcome==="PLAN_ONLY"&&empty.calls===0,empty.outcome);
  check("four-stages",empty.stages.length===4,empty.stages.length);
  check("mutations-need-approval",empty.stages.filter(stage=>stage.mutates).every(stage=>stage.approval),"3/3");
  check("no-automatic-chain",empty.automaticChain===false,"false");
  const unknown=buildRemoteStagePlan({selectedStage:"all"});check("unknown-stage-blocked",unknown.outcome==="BLOCKED",unknown.reason);
  const missing=await executeRemoteStage({selectedStage:"rls-read",adapters:{"rls-read":async()=>({outcome:"PASS"})}});check("missing-config-zero-calls",missing.outcome==="BLOCKED"&&missing.calls===0,missing.calls);
  const env={WEDOIT_BACKEND_ENDPOINT:"https://api.example.test",WEDOIT_BACKEND_PUBLISHABLE_KEY:"pk",WEDOIT_REMOTE_OWNER_TOKEN:"o",WEDOIT_REMOTE_MEMBER_TOKEN:"m",WEDOIT_REMOTE_STRANGER_TOKEN:"s",WEDOIT_REMOTE_PRIVATE_GOAL_ID:"p",WEDOIT_REMOTE_CIRCLE_GOAL_ID:"c",WEDOIT_REMOTE_PUBLIC_GOAL_ID:"u"};
  let calls=0;const rls=await executeRemoteStage({env,selectedStage:"rls-read",adapters:{"rls-read":async()=>{calls++;return{outcome:"PASS"}}}});check("one-stage-one-call",rls.outcome==="PASS"&&calls===1&&rls.calls===1,calls);
  check("other-stages-not-selected",rls.stages.filter(stage=>stage.selected).length===1&&rls.stages.find(stage=>stage.selected).id==="rls-read","one");
  const safety=buildRemoteStagePlan({env,selectedStage:"safety-delivery"});check("safety-separate-approval",safety.outcome==="BLOCKED",safety.outcome);
  const safetyReady=buildRemoteStagePlan({env:{...env,WEDOIT_SAFETY_PROBE_APPROVAL:"RUN_DEDICATED_SAFETY_FIXTURE"},selectedStage:"safety-delivery"});check("safety-ready-only-with-token",safetyReady.outcome==="READY",safetyReady.outcome);
  check("rollback-approval-separate",safetyReady.rollbackApprovalSeparate===true,"true");
  check("boundary-not-promoted",Object.values(safetyReady.boundary).every(value=>value===false),JSON.stringify(safetyReady.boundary));
  return {version:REMOTE_STAGE_ORCHESTRATOR_VERSION,passed:cases.filter(item=>item.pass).length,total:cases.length,cases,boundary:{actualBackend:false,actualDatabase:false,remoteAccount:false,automaticChain:false}};
}
