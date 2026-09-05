import {programRun} from './happyscan-maturity.mjs';
// Stage 3 uses original product copy only. It does not embed licensed scale questions.
export const STAGE3_REVIEW={reviewer:'Codex · AI 내용 점검',reviewedAt:'2026-09-04',humanReviewed:false};
const mental='https://www.who.int/news-room/fact-sheets/detail/mental-health-strengthening-our-response';
const activity='https://www.who.int/news-room/fact-sheets/detail/physical-activity';
export const EXTRA_ACTIONS=[
 ['needs','life','오늘 필요한 것 한 가지 이름 붙이기','2분','오늘의 나에게 가장 필요한 것 하나를 판단 없이 적어요.','필요를 바로 해결해야 하는 숙제로 만들지 않아요.','적기 어렵다면 편안함·도움·시간 중 하나만 골라요.',mental],
 ['snapshot','life','오늘의 삶 한 장면 남기기','3분','오늘을 대표하는 평범한 장면 하나와 그 이유를 적어요.','좋은 장면을 억지로 만들어내지 않아요.','글 대신 색이나 한 단어로 남겨도 좋아요.',mental],
 ['name-feeling','emotion','느낌을 한 단어로 부르기','2분','지금의 느낌을 한 단어로 고르고 몸에서 느껴지는 곳이 있는지 살펴요.','감정을 고치거나 분석할 필요는 없어요.','단어가 어렵다면 편함·불편함·모르겠음 중 하나를 골라요.',mental],
 ['gentle-sense','emotion','안전한 감각 하나 찾기','2분','주변에서 부담 없이 보고 듣거나 만질 수 있는 감각 하나에 잠시 머물러요.','불편하거나 기억을 자극하면 즉시 중단해요.','눈을 감지 않고 익숙한 물건의 모양만 봐도 좋아요.',mental],
 ['future-note','meaning','미래의 나에게 짧은 메모','3분','일주일 뒤의 나에게 기억하고 싶은 가치나 방향을 한 문장으로 남겨요.','낙관적인 답을 강요하지 않아요.','피하고 싶은 부담 한 가지를 적어도 좋아요.',mental],
 ['meaningful-no','meaning','중요하지 않은 일 내려놓기','3분','지금 내 방향과 맞지 않아 줄이거나 미뤄도 되는 일 하나를 살펴요.','안전·생계·돌봄의 필수 책임을 무리하게 버리지 않아요.','줄일 수 없다면 도움을 요청할 부분만 정해요.',mental],
 ['safe-company','connection','편안한 동행 방식 고르기','3분','같이 걷기·메시지·조용히 있기처럼 부담이 덜한 연결 방식을 하나 골라요.','연락하거나 만나는 것은 상대와 내 동의가 있을 때만 해요.','혼자 보내는 안전한 시간을 선택해도 좋아요.',mental],
 ['repair-line','connection','관계를 위한 안전한 한 문장','3분','고마움·요청·경계 중 지금 필요한 한 문장을 부드럽게 준비해요.','위험하거나 통제적인 관계에는 직접 전달보다 안전 확보를 우선해요.','보내지 않고 내 기록에만 남겨도 좋아요.',mental],
 ['micro-rest','recovery','60초 회복 구간 만들기','2분','가능한 때에 화면·소리·자세 중 자극 하나를 60초 줄여요.','통증이나 의료 지침을 거스르지 않아요.','시간을 낼 수 없다면 다음 가능한 시각만 정해요.',mental],
 ['gentle-move','recovery','내 몸에 맞는 가벼운 움직임','3분','현재 능력과 환경에 맞는 편안한 움직임을 짧게 선택해요.','통증·어지럼·호흡 곤란이 있으면 중단하고 전문 지침을 우선해요.','움직이지 않고 자세를 편하게 조정해도 좋아요.',activity],
 ['next-choice','agency','다음 선택지를 두 개로 줄이기','3분','막힌 일의 다음 선택지를 아주 작은 두 가지로 적고 하나를 고르거나 보류해요.','고르지 못한 것을 실패로 기록하지 않아요.','결정에 필요한 정보 한 가지만 적어요.',mental],
 ['ask-learn','agency','배운 점을 질문으로 바꾸기','3분','오늘 잘 모르겠던 일을 다음에 확인할 질문 하나로 바꿔 적어요.','모든 문제를 혼자 해결해야 한다고 여기지 않아요.','질문할 사람이나 공식 자료를 찾는 단계만 남겨요.',mental],
 ['buffer','balance','일정 사이 여유 한 칸 만들기','3분','가능하다면 두 일정 사이에 준비·이동·숨 고르기 시간을 조금 남겨요.','통제할 수 없는 일정은 개인의 실패가 아니에요.','여유를 만들 수 없으면 가장 빠듯한 구간만 표시해요.',mental],
 ['enough-list','balance','오늘 목록의 끝 정하기','3분','오늘 할 일 목록에서 마무리 기준을 하나 정하고 나머지는 다음으로 넘겨요.','필수 안전 업무나 다른 사람의 긴급 필요를 무시하지 않아요.','끝을 정하기 어렵다면 도움 받을 일 하나를 골라요.',mental],
 ['check-basics','security','생활 기본 조건 한 번 확인하기','3분','물·식사·이동·연락 수단 중 오늘 필요한 기본 조건 하나를 확인해요.','강박적인 반복 확인으로 이어지면 중단해요.','직접 해결하기 어렵다면 공식 지원 경로를 적어요.',mental],
 ['plan-support','security','도움 요청의 첫 단계 만들기','5분','필요한 도움, 신뢰할 대상, 연락할 때를 각각 한 줄로 준비해요.','공개 공간에 신원·금융·건강 정보를 올리지 않아요.','바로 연락하지 않고 공식 연락처 확인까지만 해도 좋아요.',mental]
].map(([id,area,title,time,steps,caution,alternative,sourceURL])=>({id,area,title,time,duration:time,steps,caution,alternative,source:sourceURL,sourceURL,evidenceCategory:'general-wellbeing-original-suggestion',evidence:'일반 웰빙 정보를 참고한 자체 실천 제안 · 개인별 효과 미검증',...STAGE3_REVIEW}));

export const FOUR_WEEK_PROGRAMS=[
 ['life','내 삶을 관찰하는 4주',['notice','enough','needs','snapshot']],
 ['emotion','감정과 안전하게 머무는 4주',['enjoy','playlist','name-feeling','gentle-sense']],
 ['meaning','내 방향을 다듬는 4주',['values','why','future-note','meaningful-no']],
 ['connection','안전한 연결을 연습하는 4주',['hello','listen','safe-company','repair-line']],
 ['recovery','회복의 조건을 찾는 4주',['rest','comfort','micro-rest','gentle-move']],
 ['agency','작은 선택을 실험하는 4주',['learn','experiment','next-choice','ask-learn']],
 ['balance','생활의 여백을 만드는 4주',['space','transition','buffer','enough-list']],
 ['security','생활의 기반을 돌보는 4주',['support','resources','check-basics','plan-support']]
].map(([area,title,actions])=>({id:'four-'+area,version:1,area,title,actions,days:28,weeks:4,baseline:'hs-eight-v1',endMeasure:'hs-eight-v1',weeklyFocus:['관찰','작게 시험','조정','돌아보기'],...STAGE3_REVIEW}));

export const EXTRA_HELP=[
 ['lifestyle','생활 기록 세 가지는 무엇인가요?','순간 기록, 시간 사용 기록, 수면·활동 자기보고를 따로 저장합니다. 기억에 의한 대략값은 추정으로 표시하며 행복 점수에 더하지 않습니다.'],
 ['experiment','개인 실험은 효과를 증명하나요?','아니요. 시작·실천·종료 측정과 회고를 한 흐름으로 보존하지만 한 사람의 전후 차이만으로 원인이나 일반적 효과를 입증하지 않습니다.'],
 ['month','4주 프로그램은 어떻게 끝내나요?','최근 HS-8을 출발점으로 남기고 28일 동안 실천 또는 쉬기를 선택해 기록합니다. 빠진 날은 미기록으로 남으며, 28일 이후 같은 도구 재측정과 회고로 참여한 범위만큼 마칠 수 있습니다.'],
 ['group-privacy','함께방에서 무엇이 보이나요?','기본은 비공개입니다. 내가 명시적으로 공유한 실천 이름과 완료 시각만 방에 보이며 행복 응답·점수·기분·회고·생활 기록은 공유하지 않습니다.'],
 ['group-score','함께방에는 행복 순위가 있나요?','없습니다. 선택한 사람끼리 공유한 실천 완료 수만 볼 수 있고, 행복 점수·기분·연속 기록을 경쟁 점수로 만들지 않습니다.'],
 ['group-safety','불편한 사람이나 내용을 만나면?','차단하면 그 사람의 공유를 내 화면에서 숨깁니다. 신고는 사실 확인을 위한 별도 기록이며 자동 제재 완료로 표시하지 않습니다. 언제든 방을 나갈 수 있습니다.'],
 ['long-report','28일 리포트는 어떻게 읽나요?','같은 HS-8 시작·종료 기록, 실제 기록한 날 수, 실천·쉬기·미기록을 함께 보여줍니다. 미기록은 0으로 바꾸지 않고 변화의 원인을 단정하지 않습니다.'],
 ['stage3-limits','현재 3단계에서 아직 실제 확인이 필요한 것은?','실제 Google 동기화 서버, 여러 사람의 원격 함께방, 표준 척도 사용권, 운영자 문의, 성인 20명·3개 방·28일 관찰, 실제 Android 접근성은 별도 검증이 필요합니다.']
].map(([id,title,text])=>({id,title,steps:[text],...STAGE3_REVIEW}));

export const LIFESTYLE_METHODS={
 moment:{id:'moment',name:'순간 기록',description:'지금의 느낌과 상황을 0–10으로 짧게 남겨요.'},
 time:{id:'time',name:'시간 사용 기록',description:'활동 종류와 대략의 시간을 직접 남겨요.'},
 body:{id:'body',name:'수면·활동 자기보고',description:'기억하는 범위의 수면과 움직임을 대략 남겨요.'}
};
export const CONTEXTS=['home','work','study','social','commute','rest','other'];
export const TIME_CATEGORIES=['work','study','care','household','social','leisure','rest','travel','other'];
export function lifestyleSummary(records){
 const rows=records.filter(r=>r.type==='lifestyle'),moments=rows.filter(r=>r.method==='moment'),times=rows.filter(r=>r.method==='time'),bodies=rows.filter(r=>r.method==='body');
 const mean=(list,key)=>list.length?Math.round(list.reduce((sum,row)=>sum+row[key],0)/list.length*10)/10:null;
 return {records:rows.length,momentMean:mean(moments,'value'),timeMinutes:times.reduce((sum,row)=>sum+row.minutes,0),sleepMean:mean(bodies,'sleepMinutes'),activityMean:mean(bodies,'activityMinutes'),estimated:rows.filter(r=>r.estimated).length};
}

export function experimentState(records,experimentId,now=Date.now()){
 const events=records.filter(r=>r.type==='experiment'&&r.experimentId===experimentId&&r.createdAt<=now).sort((a,b)=>a.createdAt-b.createdAt||a.id.localeCompare(b.id));
 const start=events.find(r=>r.event==='started');if(!start)return null;
 const state={experimentId,actionId:start.actionId,hypothesis:start.hypothesis,durationDays:start.durationDays,baselineId:start.baselineId,startedAt:start.createdAt,status:'active',days:{},elapsed:calendarDistance(start.createdAt,now)};
 let finish;
 for(const event of events){
  if(event.createdAt<start.createdAt||event.baselineId!==start.baselineId||event.actionId!==start.actionId||event.durationDays!==start.durationDays||finish)continue;
  if(event.event==='day'&&state.status==='active'&&event.day>=1&&event.day<=start.durationDays&&calendarDistance(start.createdAt,event.createdAt)>=event.day&&!state.days[event.day]&&['done','skipped'].includes(event.outcome))state.days[event.day]=event.outcome;
  else if(event.event==='paused')state.status='paused';else if(event.event==='resumed')state.status='active';else if(event.event==='finished')finish=event;
 }
 const baseline=records.find(r=>r.type==='scan'&&r.id===start.baselineId&&r.createdAt<=start.createdAt);
 state.canFinish=state.elapsed>=start.durationDays&&Boolean(baseline)&&Boolean(finish?.endScanId)&&Boolean(finish?.note?.trim())&&records.some(r=>r.type==='scan'&&r.id===finish?.endScanId&&r.instrument===baseline.instrument&&r.createdAt<=finish.createdAt&&calendarDistance(start.createdAt,r.createdAt)>=start.durationDays);
 if(state.canFinish){state.status='finished';state.endScanId=finish.endScanId;state.note=finish.note;}
 return state;
}

export function fourWeekState(records,runId,now=Date.now()){return programRun(records,runId,FOUR_WEEK_PROGRAMS,now);}

export function buildLongReport(records,{baselineId,endScanId,startedAt,endedAt=Date.now()}={}){
 const baseline=records.find(r=>r.type==='scan'&&r.id===baselineId),end=records.find(r=>r.type==='scan'&&r.id===endScanId);
 if(!baseline||!end||baseline.instrument!==end.instrument||end.createdAt<baseline.createdAt)throw Error('같은 도구의 시작·종료 측정이 필요합니다.');
 const inside=records.filter(r=>r.createdAt>=startedAt&&r.createdAt<=endedAt),days=new Set(inside.filter(r=>r.type==='lifestyle'||r.type==='action'&&['done','skipped'].includes(r.status)||r.type==='program'&&['done','skipped'].includes(r.event)||r.type==='experiment'&&r.event==='day'&&['done','skipped'].includes(r.outcome)).map(r=>localDay(r.createdAt)));
 return {instrument:baseline.instrument,baselineId,endScanId,baselineScore:baseline.score,endScore:end.score,change:end.score-baseline.score,recordedDays:days.size,actionsDone:inside.filter(r=>r.type==='action'&&r.status==='done').length,daysSkipped:inside.filter(r=>r.type==='program'&&r.event==='skipped').length,missingIsZero:false,causalConclusion:false};
}

export const MAX_GROUP_MEMBERS=10;
export function createGroup({id,name,ownerId,now=Date.now()}){if(!validId(id)||!validId(ownerId)||typeof name!=='string'||!name.trim()||name.trim().length>60)throw Error('함께방 정보를 확인해 주세요.');return {id,name:name.trim(),ownerId,status:'active',createdAt:now,members:[{id:ownerId,role:'owner',joinedAt:now}],blocks:[],reports:[],shares:[],cheers:[]};}
export function applyGroupEvent(group,event){
 const next=structuredClone(group);if(next.status!=='active'&&event.type!=='deleted')throw Error('종료된 함께방입니다.');
 const member=id=>next.members.some(m=>m.id===id),blocked=(a,b)=>next.blocks.some(x=>(x.actorId===a&&x.targetId===b)||(x.actorId===b&&x.targetId===a));
 if(event.type==='joined'){if(member(event.memberId))return next;if(next.members.length>=MAX_GROUP_MEMBERS)throw Error('함께방은 최대 10명입니다.');next.members.push({id:event.memberId,role:'member',joinedAt:event.createdAt});}
 else if(event.type==='action-shared'){if(!member(event.actorId)||!validId(event.actionId))throw Error('공유 권한이나 실천을 확인해 주세요.');next.shares.push({id:event.id,actorId:event.actorId,actionId:event.actionId,createdAt:event.createdAt,visibility:'action-only'});}
 else if(event.type==='cheered'){const share=next.shares.find(s=>s.id===event.shareId);if(!member(event.actorId)||!share||blocked(event.actorId,share.actorId))throw Error('격려 대상을 확인해 주세요.');next.cheers.push({id:event.id,actorId:event.actorId,shareId:event.shareId,createdAt:event.createdAt});}
 else if(event.type==='blocked'){if(!member(event.actorId)||!member(event.targetId)||event.actorId===event.targetId)throw Error('차단 대상을 확인해 주세요.');if(!blocked(event.actorId,event.targetId))next.blocks.push({actorId:event.actorId,targetId:event.targetId,createdAt:event.createdAt});}
 else if(event.type==='reported'){if(!member(event.actorId)||!event.targetId||typeof event.reason!=='string'||!event.reason.trim())throw Error('신고 내용을 확인해 주세요.');next.reports.push({id:event.id,actorId:event.actorId,targetId:event.targetId,reason:event.reason.trim().slice(0,500),createdAt:event.createdAt,status:'received-not-reviewed'});}
 else if(event.type==='left'){if(!member(event.actorId))return next;next.members=next.members.filter(m=>m.id!==event.actorId);if(event.actorId===next.ownerId){const successor=next.members[0];if(successor){successor.role='owner';next.ownerId=successor.id;}else next.status='ended';}}
 else if(event.type==='ended'){if(event.actorId!==next.ownerId)throw Error('방장만 함께방을 종료할 수 있습니다.');next.status='ended';}
 else throw Error('알 수 없는 함께방 작업입니다.');return next;
}
export function actionLeaderboard(group,optedInIds=[]){const allowed=new Set(optedInIds.filter(id=>group.members.some(m=>m.id===id)));return [...allowed].map(id=>({memberId:id,count:group.shares.filter(s=>s.actorId===id).length})).sort((a,b)=>b.count-a.count||a.memberId.localeCompare(b.memberId));}
export function visibleShares(group,viewerId){return group.shares.filter(share=>!group.blocks.some(b=>(b.actorId===viewerId&&b.targetId===share.actorId)||(b.targetId===viewerId&&b.actorId===share.actorId)));}
function validId(value){return typeof value==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(value);}
function localDay(timestamp){const d=new Date(timestamp);return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;}
function calendarDistance(a,b){const day=t=>{const d=new Date(t);return Date.UTC(d.getFullYear(),d.getMonth(),d.getDate());};return Math.floor((day(b)-day(a))/86400000);}
