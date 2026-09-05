// Device-local temporary work, deliberately separate from completed measurements/backups.
export const DRAFT_DB='happyscan-drafts-v1';
export function validateDraft(key,data){
  if(!/^(weekly|daily|diary|action:[a-z0-9-]{1,80}|lifestyle:(moment|time|body))$/.test(key))throw Error('지원하지 않는 초안 종류예요.');
  if(!data||typeof data!=='object'||Array.isArray(data)||JSON.stringify(data).length>12000)throw Error('초안 내용을 확인해 주세요.');
  const keys=key==='weekly'?['answers','question']:key==='daily'?['value','note']:key==='diary'?['note']:key.startsWith('action:')?['note','minutes','fit']:['lifeNote','momentValue','momentContext','timeCategory','timeMinutes','sleepMinutes','activityMinutes','estimated'];
  if(Object.keys(data).some(k=>!keys.includes(k)))throw Error('알 수 없는 초안 항목이에요.');
  if(key==='weekly'){
    if(!data.answers||typeof data.answers!=='object'||Array.isArray(data.answers)||!Number.isInteger(data.question)||data.question<0||data.question>7)throw Error('초안 질문 위치를 확인해 주세요.');
    for(const [k,v] of Object.entries(data.answers))if(!['life','emotion','meaning','connection','recovery','agency','balance','security'].includes(k)||!Number.isInteger(v)||v<0||v>10)throw Error('초안 응답을 확인해 주세요.');
  }else for(const [k,v] of Object.entries(data)){if(k==='value'){if(v!==null&&(!Number.isInteger(v)||v<0||v>10))throw Error('초안 점수를 확인해 주세요.');}else if(k==='estimated'){if(typeof v!=='boolean')throw Error('대략값 표시를 확인해 주세요.');}else if(typeof v!=='string'||v.length>(k==='note'?2000:500))throw Error('초안 글자 수를 확인해 주세요.');}
  return structuredClone(data);
}
export function openDraftStore(){return new Promise((resolve,reject)=>{
  if(!globalThis.indexedDB)return reject(Error('이 기기에 초안을 보관할 수 없어요.'));
  const request=indexedDB.open(DRAFT_DB,1);request.onupgradeneeded=()=>{request.result.createObjectStore('drafts',{keyPath:'key'});request.result.createObjectStore('meta');};request.onerror=()=>reject(Error('초안 보관함을 열 수 없어요.'));request.onblocked=()=>reject(Error('다른 창을 닫고 초안을 다시 확인해 주세요.'));
  request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>db.close();let epoch;const initial=db.transaction('meta').objectStore('meta').get('epoch');initial.onerror=()=>reject(Error('초안 보호 상태를 확인하지 못했어요.'));initial.onsuccess=()=>{epoch=initial.result??0;
    const mutate=(key,expected,data,remove=false)=>new Promise((ok,no)=>{const clean=remove?null:validateDraft(key,data),revision=crypto.randomUUID();let error;const tx=db.transaction(['drafts','meta'],'readwrite'),s=tx.objectStore('drafts'),generation=tx.objectStore('meta').get('epoch');generation.onsuccess=()=>{if((generation.result??0)!==epoch){error=Error('다른 창에서 자료를 지웠어요. 이 창을 새로 열기 전에는 초안을 다시 보관하지 않습니다.');tx.abort();return;}const get=s.get(key);get.onsuccess=()=>{if((get.result?.revision??null)!==expected){error=Error('다른 창에서 초안이 바뀌었어요. 보관한 초안을 다시 열어 비교해 주세요.');tx.abort();return;}if(remove)s.delete(key);else s.put({key,data:clean,revision,updatedAt:Date.now()});};};tx.oncomplete=()=>ok(revision);tx.onabort=tx.onerror=()=>no(error||Error('초안을 보관하지 못했어요. 입력은 이 창에 남겨 두었습니다.'));});
    resolve({all:()=>new Promise((ok,no)=>{const r=db.transaction('drafts').objectStore('drafts').getAll();r.onsuccess=()=>{try{ok(r.result.map(x=>({...x,data:validateDraft(x.key,x.data)})));}catch(e){no(e);}};r.onerror=()=>no(Error('초안을 읽지 못했어요.'));}),put:mutate,remove:(key,expected)=>mutate(key,expected,null,true),clear:()=>new Promise((ok,no)=>{const tx=db.transaction(['drafts','meta'],'readwrite'),meta=tx.objectStore('meta'),get=meta.get('epoch');let next;get.onsuccess=()=>{next=(get.result??0)+1;meta.put(next,'epoch');tx.objectStore('drafts').clear();};tx.oncomplete=()=>{epoch=next;ok();};tx.onabort=tx.onerror=()=>no(Error('초안을 모두 지우지 못했어요. 다시 시도해 주세요.'));}),close:()=>db.close()});};
  };
});}
