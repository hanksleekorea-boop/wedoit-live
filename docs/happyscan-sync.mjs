import {validateRecord} from './happyscan-store.mjs';
// Transport and persistence are injected. No upload, auth session, or external
// request occurs on import. Actual provider rollout is a separate release gate.
export function createSync({actorId,epoch,repository,remote,sessionActor}){
 if(!actorId||!epoch||!repository||!remote)throw Error('계정·서버 판·저장소가 필요합니다.');let busy=false,consented=false;
 const key=`${actorId}:${epoch}`;
 async function actor(){if(await sessionActor()!==actorId)throw Error('계정이 바뀌었어요. 전송하지 않았습니다.');}
 return {
  consent(value){consented=value===true;},
  async enqueue(record,{revision=0,deleted=false}={}){await actor();if(!consented)throw Error('행복 자료 전송 동의가 필요합니다.');if(!Number.isSafeInteger(revision)||revision<0)throw Error('서버 판 오류');const clean=validateRecord(record);return repository.put(key,{operationId:crypto.randomUUID(),recordId:clean.id,payload:deleted?null:clean,deleted,revision,epoch,actorId});},
  async flush(){if(busy)return {status:'busy'};if(!consented)return {status:'consent-required'};busy=true;let applied=0;try{await actor();const items=await repository.list(key);for(const item of items){if(!consented)return {status:'consent-revoked',applied};await actor();if(item.actorId!==actorId||item.epoch!==epoch)throw Error('계정이 다른 전송 대기 자료');const result=await remote.apply(item);await actor();if(!result||result.status!=='applied'||result.recordId!==item.recordId||result.epoch!==epoch||!Number.isSafeInteger(result.revision)||result.revision<1){return {status:'conflict',applied,recordId:item.recordId};}await repository.acknowledge(key,item.operationId,result);applied++;}return {status:'synced',applied,lastSuccessAt:Date.now()};}catch{return {status:'retry-needed',applied};}finally{busy=false;}}
 };
}
export function createSupabaseHappinessTransport(sdk){const rpc=async(name,args={})=>{const {data,error}=await sdk.rpc(name,args);if(error)throw Error('행복 서버 요청 실패');return data;};return {
 async bootstrap(){return rpc('happyscan_bootstrap');},
 async apply(item){return rpc('happyscan_apply',{p_epoch:item.epoch,p_id:item.recordId,p_revision:item.revision,p_payload:item.payload,p_deleted:item.deleted,p_operation:item.operationId});},
 async pull({afterRevision=0,limit=500}={}){if(!Number.isSafeInteger(afterRevision)||afterRevision<0||!Number.isInteger(limit)||limit<1||limit>1000)throw Error('동기화 범위를 확인해 주세요.');return rpc('happyscan_pull',{p_after_revision:afterRevision,p_limit:limit});},
 async exportData(){return rpc('happyscan_export');},
 async eraseData(){return rpc('happyscan_erase_data');}
};}
export function createGoogleSession(sdk,redirectTo){const u=new URL(redirectTo);if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash)throw Error('검증한 HTTPS 복귀 주소가 필요합니다.');return {
 async login(){const {error}=await sdk.auth.signInWithOAuth({provider:'google',options:{redirectTo:u.href,scopes:'openid email profile'}});if(error)throw Error('Google 로그인 연결 실패');},
 async actor(){const {data,error}=await sdk.auth.getUser();if(error||!data?.user)return null;return data.user.id;},
 async logout(){const {error}=await sdk.auth.signOut();if(error)throw Error('로그아웃 실패');}
};}
export function createAccountLifecycle({session,remote}){
 if(!session||!remote)throw Error('계정과 서버 연결이 필요합니다.');let actorId=null;
 const actor=async()=>{const current=await session.actor();if(!current)throw Error('로그인이 필요합니다.');if(actorId&&current!==actorId)throw Error('계정이 바뀌었어요. 작업하지 않았습니다.');actorId=current;return current;};
 return {
  async bootstrap(){await actor();const result=await remote.bootstrap();await actor();if(!result?.epoch)throw Error('서버 계정 준비를 확인하지 못했습니다.');return {status:'ready',actorId,epoch:result.epoch};},
  async pull(options){await actor();const result=await remote.pull(options);await actor();if(!result||!Array.isArray(result.records))throw Error('서버 기록을 확인하지 못했습니다.');for(const row of result.records)if(row.payload&&!row.deleted)validateRecord(row.payload);return result;},
  async exportData(){await actor();const result=await remote.exportData();await actor();if(!result||result.format!=='happyscan-server-export'||!Array.isArray(result.records))throw Error('서버 내보내기를 확인하지 못했습니다.');result.records.forEach(validateRecord);return result;},
  async eraseData(confirmation){if(confirmation!=='서버 자료 삭제')throw Error('서버 자료 삭제 확인 문구가 필요합니다.');await actor();const result=await remote.eraseData();await actor();if(!result||result.status!=='erased'||!result.newEpoch)throw Error('서버 자료 삭제를 확인하지 못했습니다.');return result;},
  async logout(){await session.logout();actorId=null;return {status:'signed-out',localDataDeleted:false,serverDataDeleted:false};}
 };
}
export function openOutbox(){return new Promise((resolve,reject)=>{const r=indexedDB.open('happyscan-outbox-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('operations',{keyPath:'operationId'});r.onerror=()=>reject(Error('전송 대기 저장소 오류'));r.onblocked=()=>reject(Error('다른 앱 창을 닫아주세요.'));r.onsuccess=()=>{const db=r.result;db.onversionchange=()=>db.close();const tx=(mode,fn)=>new Promise((yes,no)=>{const t=db.transaction('operations',mode);let value;t.oncomplete=()=>yes(value);t.onabort=t.onerror=()=>no(Error('대기 기록 변경 실패'));try{fn(t.objectStore('operations'),v=>value=v);}catch(e){t.abort();no(e);}});resolve({put:(key,item)=>tx('readwrite',s=>s.add({...item,key})),list:key=>tx('readonly',(s,set)=>{s.getAll().onsuccess=e=>set(e.target.result.filter(x=>x.key===key));}),acknowledge:(key,id)=>tx('readwrite',s=>{s.get(id).onsuccess=e=>{if(e.target.result?.key===key)s.delete(id);};}),close:()=>db.close()});};});}
