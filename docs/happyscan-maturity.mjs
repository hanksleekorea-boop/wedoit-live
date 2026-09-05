// Pure rules shared by screens and regression tests. No storage or network effects.
export function integerInput(raw,{label='값',min=0,max=1440}={}) {
  if(typeof raw!=='string'||!raw.trim())throw Error(`${label}을 입력해 주세요. 입력하지 않은 값은 0으로 저장하지 않아요.`);
  const value=Number(raw);
  if(!Number.isSafeInteger(value)||value<min||value>max)throw Error(`${label}은 ${min}–${max} 사이 정수로 입력해 주세요.`);
  return value;
}
export function calendarDistance(a,b) {
  const day=t=>{const d=new Date(t);return Date.UTC(d.getFullYear(),d.getMonth(),d.getDate());};
  return Math.floor((day(b)-day(a))/86400000);
}
export function programRun(records,runId,definitions,now=Date.now()) {
  const events=records.filter(r=>r.type==='program'&&r.runId===runId&&r.createdAt<=now).sort((a,b)=>a.createdAt-b.createdAt||a.id.localeCompare(b.id));
  const start=events.find(r=>r.event==='started'&&definitions.some(p=>p.id===r.programId));
  if(!start)return null;
  const definition=definitions.find(p=>p.id===start.programId),duration=definition.days;
  const baseline=records.find(r=>r.type==='scan'&&r.id===start.baselineId&&r.createdAt<=start.createdAt);
  const state={runId,programId:start.programId,baselineId:start.baselineId,startedAt:start.createdAt,status:'active',days:{},lateDays:[],elapsed:calendarDistance(start.createdAt,now),duration};
  const endAt=(at,id)=>baseline&&records.filter(r=>r.type==='scan'&&(!id||r.id===id)&&r.instrument===baseline.instrument&&r.createdAt<=at&&calendarDistance(start.createdAt,r.createdAt)>=duration).sort((a,b)=>a.createdAt-b.createdAt||a.id.localeCompare(b.id))[0];
  for(const e of events) {
    if(e.createdAt<start.createdAt||e.programId!==start.programId||e.baselineId!==start.baselineId||state.status==='finished')continue;
    const elapsed=calendarDistance(start.createdAt,e.createdAt);
    if(['done','skipped'].includes(e.event)&&state.status==='active'&&e.day>=1&&e.day<=duration&&elapsed>=e.day&&!state.days[e.day]) {
      state.days[e.day]=e.event;if(elapsed>e.day)state.lateDays.push(e.day);
    } else if(e.event==='paused')state.status='paused';
    else if(e.event==='resumed')state.status='active';
    else if(e.event==='finished'&&elapsed>=duration&&e.note?.trim()&&endAt(e.createdAt,e.endScanId)){state.status='finished';state.note=e.note;state.endScanId=endAt(e.createdAt,e.endScanId).id;}
  }
  state.recordedDays=Object.keys(state.days).length;
  state.missingDays=Array.from({length:duration},(_,i)=>i+1).filter(day=>!state.days[day]);
  state.canFinish=state.elapsed>=duration&&Boolean(endAt(now));
  state.endCandidateId=endAt(now)?.id??'';
  state.participation=state.recordedDays===duration?'complete':'partial';
  return state;
}
export function comparisonPair(records,minDays=28) {
  const scans=records.filter(r=>r.type==='scan').sort((a,b)=>b.createdAt-a.createdAt||b.id.localeCompare(a.id));
  for(const end of scans){const baseline=scans.find(r=>r.id!==end.id&&r.instrument===end.instrument&&calendarDistance(r.createdAt,end.createdAt)>=minDays);if(baseline)return {baseline,end};}
  return null;
}
export function dayPlan(program,day,actions) {
  if(!Number.isInteger(day)||day<1||day>program.days)throw Error('프로그램 날짜 범위를 확인해 주세요.');
  const week=Math.floor((day-1)/7),phase=(day-1)%7;
  const focus=['부담 없이 시작','내 조건 확인','다른 방법 시도','편한 방법 반복','조금 조정','쉬거나 이어가기','한 주 돌아보기'][phase];
  const action=actions.find(a=>a.id===program.actions[(phase+week)%program.actions.length]);
  if(!action)throw Error('연결된 실천을 찾을 수 없어요.');
  const prompt=PROGRAM_REFLECTIONS[program.area]?.[phase]??'지금의 조건과 나에게 맞았던 점을 적어보세요.';
  return {day,week:week+1,focus,action,reflectionTemplateId:program.area+':'+phase,reflection:`${prompt} 오늘의 ‘${action.title}’을 떠올려 보세요. ${WEEK_INTENT[week]??WEEK_INTENT[0]} 변화가 없어도 괜찮아요.`};
}
export function csvText(records,{includeNotes=false}={}) {
  const cell=value=>{let s=String(value??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
  const fields=['id','type','createdAt','instrument','value','score','sleepMinutes','activityMinutes','minutes','context','category','estimated','actionId','status','execution','programId','runId','baselineId','endScanId','event','day','experimentId','durationDays','outcome','groupId','visibility','maxMinutes','noContact','noMovement','reminders','excluded','answers','correctionCount',...(includeNotes?['note','hypothesis','correctionReasons']:[])];
  const lines=[fields,...records.map(r=>fields.map(k=>k==='createdAt'?new Date(r.createdAt).toISOString():k==='correctionCount'?(r.corrections?.length??0):k==='correctionReasons'?(r.corrections??[]).map(c=>c.reason).join(' / '):typeof r[k]==='object'&&r[k]!==null?JSON.stringify(r[k]):r[k]??''))];
  return '\uFEFF'+lines.map(row=>row.map(cell).join(',')).join('\r\n');
}
import {PROGRAM_REFLECTIONS,WEEK_INTENT} from './happyscan-program-reflections.mjs';
