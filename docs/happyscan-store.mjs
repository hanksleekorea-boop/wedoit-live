import {DIMENSIONS, ACTIONS, scoreScan} from './happyscan-data.mjs';
import {PROGRAMS} from './happyscan-stage2.mjs';
import {FOUR_WEEK_PROGRAMS,CONTEXTS,TIME_CATEGORIES} from './happyscan-stage3.mjs';
export const DB_NAME='happyscan-v1';
export const MAX_BYTES=5*1024*1024;
export const MAX_RECORDS=20000;
const allowedTypes=new Set(['daily','scan','diary','action','program','preferences','lifestyle','experiment','community']);
export function validateRecord(row){
  const clean=validatePayload(row);
  if(row.corrections===undefined)return clean;
  if(!Array.isArray(row.corrections)||row.corrections.length>50)throw Error('정정 이력 형식을 확인해 주세요.');
  let last=0;
  const corrections=row.corrections.map(item=>{
    if(!item||typeof item.reason!=='string'||!item.reason.trim()||item.reason.length>300||!Number.isSafeInteger(item.correctedAt)||item.correctedAt<clean.createdAt||item.correctedAt<last||item.correctedAt>Date.now()+86400000||item.previous?.corrections!==undefined)throw Error('정정 이력 형식을 확인해 주세요.');
    const previous=validatePayload(item.previous);
    if(previous.id!==clean.id||previous.type!==clean.type||previous.createdAt!==clean.createdAt)throw Error('다른 기록의 정정 이력을 합칠 수 없어요.');
    last=item.correctedAt;return {correctedAt:item.correctedAt,reason:item.reason,previous};
  });
  return {...clean,corrections};
}
export function correctedRecord(original,fields,reason,now=Date.now()){
  const current=validateRecord(original);
  if(!['daily','scan','diary','action','lifestyle'].includes(current.type))throw Error('진행 사건은 정정할 수 없어요.');
  if(typeof reason!=='string'||!reason.trim()||reason.trim().length>300)throw Error('정정 이유를 1–300자로 적어 주세요.');
  const allowed=current.type==='scan'?['answers']:current.type==='diary'||current.type==='action'?['note']:current.type==='daily'?['value','note']:current.method==='moment'?['value','note']:current.method==='time'?['minutes','note']:['sleepMinutes','activityMinutes','note'];
  if(Object.keys(fields).some(key=>!allowed.includes(key)))throw Error('기록 종류·날짜·진행 상태는 바꿀 수 없어요.');
  const next=validatePayload({...current,...fields});
  return validateRecord({...next,corrections:[...(current.corrections??[]),{correctedAt:now,reason:reason.trim(),previous:validatePayload(current)}]});
}
function validatePayload(row){
  if(!row||typeof row!=='object'||Array.isArray(row)||!allowedTypes.has(row.type)||typeof row.id!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(row.id)||!Number.isSafeInteger(row.createdAt)||row.createdAt<0||row.createdAt>Date.now()+86400000)throw Error('기록 형식 또는 날짜를 확인해 주세요.');
  const base={id:row.id,type:row.type,createdAt:row.createdAt};
  const text=(v,max)=>{if(typeof v!=='string'||v.length>max)throw Error('기록 내용이 너무 길거나 잘못됐어요.');return v;};
  const rating=v=>{if(!Number.isInteger(v)||v<0||v>10)throw Error('점수는 0–10 사이 정수여야 해요.');return v;};
  if(row.type==='preferences'){
    if(!Array.isArray(row.excluded)||row.excluded.length>ACTIONS.length||row.excluded.some(id=>!ACTIONS.some(a=>a.id===id))||![2,3,5,15].includes(row.maxMinutes)||['noContact','noMovement','reminders'].some(k=>typeof row[k]!=='boolean'))throw Error('실천 설정 형식을 확인해 주세요.');
    return {...base,excluded:[...new Set(row.excluded)].sort(),maxMinutes:row.maxMinutes,noContact:row.noContact,noMovement:row.noMovement,reminders:row.reminders,instrument:'hs-preferences-v1'};
  }
  if(row.type==='program'){
    const definition=[...PROGRAMS,...FOUR_WEEK_PROGRAMS].find(p=>p.id===row.programId);
    if(!definition||typeof row.runId!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(row.runId)||!['started','done','skipped','paused','resumed','finished'].includes(row.event)||!Number.isInteger(row.day)||row.day<0||row.day>definition.days||(['done','skipped'].includes(row.event)&&row.day<1)||typeof row.baselineId!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(row.baselineId))throw Error('프로그램 기록을 확인해 주세요.');
    if(row.endScanId!==undefined&&(row.event!=='finished'||typeof row.endScanId!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(row.endScanId)))throw Error('프로그램 종료 측정을 확인해 주세요.');
    return {...base,programId:row.programId,runId:row.runId,event:row.event,day:row.day,baselineId:row.baselineId,...(row.endScanId!==undefined?{endScanId:row.endScanId}:{}),note:text(row.note??'',2000),instrument:'hs-program-v1'};
  }
  if(row.type==='lifestyle'){
    if(!['moment','time','body'].includes(row.method)||typeof row.estimated!=='boolean')throw Error('생활 기록 형식을 확인해 주세요.');
    if(row.method==='moment'){if(!CONTEXTS.includes(row.context))throw Error('순간 기록 상황을 확인해 주세요.');return {...base,method:'moment',value:rating(row.value),context:row.context,estimated:row.estimated,note:text(row.note??'',500),instrument:'hs-moment-v1'};}
    if(row.method==='time'){if(!TIME_CATEGORIES.includes(row.category)||!Number.isInteger(row.minutes)||row.minutes<1||row.minutes>1440)throw Error('시간 사용 기록을 확인해 주세요.');return {...base,method:'time',category:row.category,minutes:row.minutes,estimated:row.estimated,note:text(row.note??'',500),instrument:'hs-time-v1'};}
    if(!Number.isInteger(row.sleepMinutes)||row.sleepMinutes<0||row.sleepMinutes>1440||!Number.isInteger(row.activityMinutes)||row.activityMinutes<0||row.activityMinutes>1440)throw Error('수면·활동 기록을 확인해 주세요.');
    return {...base,method:'body',sleepMinutes:row.sleepMinutes,activityMinutes:row.activityMinutes,estimated:row.estimated,note:text(row.note??'',500),instrument:'hs-body-self-report-v1'};
  }
  if(row.type==='experiment'){
    if(typeof row.experimentId!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(row.experimentId)||!['started','day','paused','resumed','finished'].includes(row.event)||!ACTIONS.some(a=>a.id===row.actionId)||![7,14,28].includes(row.durationDays)||!Number.isInteger(row.day)||row.day<0||row.day>row.durationDays||typeof row.baselineId!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(row.baselineId)||!['done','skipped','not-recorded'].includes(row.outcome??'not-recorded'))throw Error('개인 실험 기록을 확인해 주세요.');
    const endScanId=row.endScanId??'';if(endScanId&&!/^[a-zA-Z0-9_-]{1,100}$/.test(endScanId))throw Error('종료 측정을 확인해 주세요.');
    return {...base,experimentId:row.experimentId,event:row.event,actionId:row.actionId,durationDays:row.durationDays,day:row.day,baselineId:row.baselineId,endScanId,hypothesis:text(row.hypothesis??'',300),outcome:row.outcome??'not-recorded',note:text(row.note??'',2000),instrument:'hs-personal-experiment-v1'};
  }
  if(row.type==='community'){
    const valid=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(v);
    if(!valid(row.groupId)||!['created','invited','joined','action-shared','cheered','reported','blocked','left','ended'].includes(row.event)||!valid(row.actorId))throw Error('함께방 기록을 확인해 주세요.');
    if(row.actionId&&!ACTIONS.some(a=>a.id===row.actionId))throw Error('공유 실천을 확인해 주세요.');
    return {...base,groupId:row.groupId,event:row.event,actorId:row.actorId,targetId:row.targetId&&valid(row.targetId)?row.targetId:'',actionId:row.actionId??'',referenceId:row.referenceId&&valid(row.referenceId)?row.referenceId:'',note:text(row.note??'',500),visibility:'action-only',instrument:'hs-community-event-v1'};
  }
  if(row.type==='daily')return {...base,value:rating(row.value),note:text(row.note??'',500),instrument:'hs-daily-v1'};
  if(row.type==='diary')return {...base,note:text(row.note,2000),instrument:'hs-diary-v1'};
  if(row.type==='action'){if(!ACTIONS.some(a=>a.id===row.actionId)||!['planned','done','skipped'].includes(row.status))throw Error('알 수 없는 실천 기록이에요.');return {...base,actionId:row.actionId,status:row.status,...(row.note!==undefined?{note:text(row.note,2000)}:{}),instrument:'hs-action-v1'};}
  if(row.instrument!=='hs-eight-v1'||scoreScan(row.answers)===null)throw Error('지원하지 않는 검사 또는 응답이에요.');
  const answers=Object.fromEntries(DIMENSIONS.map(d=>[d.id,rating(row.answers[d.id])]));
  return {...base,answers,instrument:'hs-eight-v1',score:scoreScan(answers),period:'past-7-days'};
}
export function parseBackup(raw){
  if(typeof raw!=='string'||new TextEncoder().encode(raw).length>MAX_BYTES)throw Error('5MB 이하의 해피스캔 백업 파일을 선택해 주세요.');
  const data=JSON.parse(raw);
  if(!data||data.format!=='happyscan-backup'||data.schemaVersion!==1||!Array.isArray(data.records)||data.records.length>20000)throw Error('해피스캔 백업 v1 파일이 아니에요. 이전 활동 백업은 실천 도구에서 복원해 주세요.');
  const rows=data.records.map(validateRecord),ids=new Set();
  for(const r of rows){if(ids.has(r.id))throw Error('파일 안에 중복 ID가 있어요.');ids.add(r.id);}
  return rows;
}
export function openStore(){return new Promise((resolve,reject)=>{
  if(!globalThis.indexedDB)return reject(Error('이 브라우저에서는 안전한 저장을 사용할 수 없어요.'));
  const request=indexedDB.open(DB_NAME,1);
  request.onupgradeneeded=()=>request.result.createObjectStore('records',{keyPath:'id'});
  request.onerror=()=>reject(Error('저장 공간을 열 수 없어요. 브라우저 설정을 확인해 주세요.'));
  request.onblocked=()=>reject(Error('다른 해피스캔 창을 닫고 다시 열어 주세요.'));
  request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>db.close();
    const transaction=(mode,work)=>new Promise((res,rej)=>{let value;const tx=db.transaction('records',mode);tx.oncomplete=()=>res(value);tx.onerror=()=>rej(Error('저장에 실패했어요. 입력 내용은 화면에 남아 있어요.'));tx.onabort=()=>rej(Error('변경하지 않았어요. 저장 공간 또는 충돌을 확인해 주세요.'));try{work(tx.objectStore('records'),v=>value=v,tx);}catch(error){tx.abort();rej(error);}});
    resolve({
      all:()=>transaction('readonly',(s,set,tx)=>{s.getAll().onsuccess=e=>{try{set(e.target.result.map(validateRecord).sort((a,b)=>b.createdAt-a.createdAt||b.id.localeCompare(a.id)));}catch{tx.abort();}};}),
      add:async row=>{const clean=validateRecord(row);await transaction('readwrite',s=>s.add(clean));return clean;},
      correct:(original,fields,reason)=>{
        const expected=validateRecord(original),next=correctedRecord(expected,fields,reason);
        return transaction('readwrite',(s,set,tx)=>{
          s.getAll().onsuccess=e=>{
            try{const rows=e.target.result.map(validateRecord),current=rows.find(r=>r.id===expected.id);
              if(!current||JSON.stringify(current)!==JSON.stringify(expected)||rows.some(r=>r.baselineId===expected.id||r.endScanId===expected.id)){tx.abort();return;}
              s.put(next);set(next);
            }catch{tx.abort();}
          };
        });
      },
      remove:id=>transaction('readwrite',s=>s.delete(id)),
      clear:()=>transaction('readwrite',s=>s.clear()),
      merge:rows=>{
        if(!Array.isArray(rows)||rows.length>MAX_RECORDS)throw Error('한 번에 최대 20,000건을 불러올 수 있어요.');
        const clean=rows.map(validateRecord);
        if(new Set(clean.map(r=>r.id)).size!==clean.length)throw Error('파일 안에 중복 ID가 있어요.');
        return transaction('readwrite',(s,set,tx)=>{
          let added=0;set(0);
          for(const row of clean){
            const req=s.get(row.id);
            req.onsuccess=()=>{
              try{
                if(req.result){if(JSON.stringify(validateRecord(req.result))!==JSON.stringify(row))tx.abort();}
                else{s.add(row);set(++added);}
              }catch{tx.abort();}
            };
          }
        });
      },
      close:()=>db.close()
    });
  };
});}
export function newRecord(type,fields){return validateRecord({id:crypto.randomUUID(),type,createdAt:Date.now(),...fields});}
const envelope=records=>JSON.stringify({format:'happyscan-backup',schemaVersion:1,exportedAt:new Date().toISOString(),records});
export function backup(records){const clean=records.map(validateRecord);const raw=envelope(clean);if(clean.length>MAX_RECORDS||new TextEncoder().encode(raw).length>MAX_BYTES)throw Error('한 파일 한도(5MB·20,000건)를 넘었어요. 나눈 백업 받기를 이용해 주세요.');return raw;}
export function backupParts(records){
  const parts=[],encoder=new TextEncoder();let current=[],bytes=encoder.encode(envelope([])).length;
  for(const value of records){const row=validateRecord(value),size=encoder.encode(JSON.stringify(row)).length+1;
    if(current.length&&(current.length===MAX_RECORDS||bytes+size>MAX_BYTES)){parts.push(backup(current));current=[];bytes=encoder.encode(envelope([])).length;}
    current.push(row);bytes+=size;
  }
  if(current.length||!parts.length)parts.push(backup(current));return parts;
}
