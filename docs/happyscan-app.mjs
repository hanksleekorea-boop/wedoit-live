import {DIMENSIONS,ACTIONS,METHODS,DISCLAIMER,scoreScan,dayKey,recommend} from './happyscan-data.mjs';
import {openStore,newRecord,backup,parseBackup,MAX_BYTES} from './happyscan-store.mjs';
const $=id=>document.getElementById(id);
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let store,records=[],dailyValue=null,answers={},question=0,toastTimer,pendingInstall,focusReturn,scanStarted=false,consent=false,diaryDraft='',stage1,stage2,stage3,installStage1,installStage2,installStage3,methodsLoaded=false;
const hasDraft=()=>Object.keys(answers).length>0||dailyValue!==null||Boolean($('dailyNote').value.trim())||Boolean(diaryDraft.trim())||Boolean(stage2?.hasDraft())||Boolean(stage3?.hasDraft());
const channel='BroadcastChannel'in window?new BroadcastChannel('happyscan-refresh'):null;
try{consent=sessionStorage.getItem('happyscan-notice-v1')==='accepted';document.documentElement.dataset.large=localStorage.getItem('happyscan-large-text')==='true'?'true':'false';}catch{}
const rows=type=>records.filter(r=>r.type===type);
const date=ts=>new Intl.DateTimeFormat('ko-KR',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(ts));
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,5500);}
function modal(title,body){focusReturn=document.activeElement;$('modalTitle').textContent=title;$('modalBody').innerHTML=body;if(!$('modal').open)$('modal').showModal();}
function close(){ $('modal').close();focusReturn?.focus(); }
$('closeModal').onclick=close;
$('modal').addEventListener('keydown',e=>{
  if(e.key!=='Tab')return;
  const items=[...$('modal').querySelectorAll('button:not([disabled]),a[href],input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')].filter(n=>n.getClientRects().length);
  const first=items[0],last=items.at(-1);if(!first)return;
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
});
function ensureConsent(callback){
  if(consent)return callback();
  modal('시작하기 전에 알아두세요',`<p>${DISCLAIMER}</p><p>응답은 이 브라우저에만 저장됩니다. 외부로 자동 전송하지 않아요. 원하지 않는 질문은 건너뛸 수 있습니다.</p><label class="consent"><input type="checkbox" id="understood">만 18세 이상이며, 자체 성찰 도구와 기기 저장 안내를 이해했습니다.</label><button class="btn primary" id="acceptNotice" disabled>이해했어요, 시작할게요</button><p class="small muted">미성년자 전용 도구와 보호 절차는 아직 제공하지 않습니다.</p>`);
  $('understood').onchange=e=>$('acceptNotice').disabled=!e.target.checked;
  $('acceptNotice').onclick=()=>{consent=true;try{sessionStorage.setItem('happyscan-notice-v1','accepted');}catch{}close();callback();};
}
function ratings(node,selected,onSelect){
  node.innerHTML=Array.from({length:11},(_,n)=>`<button type="button" aria-label="${n}점" aria-pressed="${selected===n}" data-rating="${n}">${n}</button>`).join('');
  node.querySelectorAll('button').forEach(b=>b.onclick=()=>{onSelect(Number(b.dataset.rating));node.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
}
async function route(){
  let page=location.hash.slice(1)||'home';if(!['home','measure','scan','actions','report','me','about','help'].includes(page))page='home';
  if(!stage1&&(!['home','scan'].includes(page)||!navigator.onLine||navigator.serviceWorker?.controller)){({installStage1}=await import('./happyscan-stage1-ui.mjs'));stage1=installStage1({getRecords:()=>records,getStore:()=>store,toast,download,hasDraft});navigator.serviceWorker?.getRegistration?.().then(reg=>reg&&stage1?.connectUpdate(reg));}
  if(!methodsLoaded&&['measure','about'].includes(page)){methods();methodsLoaded=true;}
  if(!stage2&&['actions','me','help'].includes(page)){({installStage2}=await import('./happyscan-stage2-ui.mjs'));stage2=installStage2({getRecords:()=>records,save,ensureConsent,modal,close,toast});stage2.render();}
  if(!stage3&&['measure','actions','report','me','help'].includes(page)){({installStage3}=await import('./happyscan-stage3-ui.mjs'));stage3=installStage3({getRecords:()=>records,save,ensureConsent,modal,close,toast});stage3.render();}
  if(document.documentElement.dataset.happyscanReady==='true'){
    if(page==='actions')renderActions();
    if(page==='report')report();
    else {stage2?.render();stage3?.render();}
  }
  document.querySelectorAll('.view').forEach(v=>v.hidden=v.id!==`view-${page}`);
  document.querySelectorAll('[data-nav]').forEach(n=>{if(n.dataset.nav===(page==='scan'?'measure':page))n.setAttribute('aria-current','page');else n.removeAttribute('aria-current');});
  document.title=`해피스캔 — ${{home:'나의 행복',measure:'행복 측정',scan:'행복 스캔',actions:'작은 실천',report:'변화 리포트',me:'내 공간',about:'측정과 신뢰',help:'도움말과 복원'}[page]}`;
  if(page==='scan'){scanStarted=true;renderQuestion();}
  if(document.documentElement.dataset.happyscanReady==='true'){window.scrollTo({top:0,behavior:'instant'});$('main').focus({preventScroll:true});}
}
window.addEventListener('hashchange',()=>void route());
window.addEventListener('offline',()=>void route());
window.addEventListener('beforeunload',e=>{if(hasDraft()){e.preventDefault();e.returnValue='';}});
function actionCard(a){return `<article class="card"><div class="action-icon" aria-hidden="true">${DIMENSIONS.find(d=>d.id===a.area).short}</div><span class="small muted">${a.time} · ${DIMENSIONS.find(d=>d.id===a.area).name}</span><h3 style="margin-top:8px">${a.title}</h3><p class="small muted">${a.steps}</p><button class="btn" data-action-detail="${a.id}">방법 알아보기 →</button></article>`;}
function overview(){
  const last=rows('scan')[0];
  $('overview').innerHTML=`<div class="row between"><h2>나의 행복 스냅샷</h2><span class="badge neutral">${last?'자체 지수':'첫 스캔을 기다려요'}</span></div><div class="score-top"><div class="score-ring" style="--angle:${last?last.score*3.6:0}deg"><div><div class="metric">${last?last.score:'—'}<small> / 100</small></div><span class="small muted">${last?'HS-8 v1':'아직 측정 전'}</span></div></div><div><h3>${last?'지금의 모습을 이해해요':'나만의 출발점을 찾아요'}</h3><p class="small muted">${last?date(last.createdAt)+' 측정<br>지난 7일에 대한 자기보고':'첫 측정 후 8가지 단면이<br>이곳에 펼쳐집니다.'}</p><a href="${last?'#report':'#measure'}" class="small">${last?'기록 자세히 보기':'측정 방법 알아보기'} →</a></div></div><div class="dimensions">${DIMENSIONS.map(d=>`<div class="dim"><div class="dim-head"><span>${d.name}</span><b>${last?last.answers[d.id]:'—'}</b></div><div class="dim-track"><span style="width:${last?last.answers[d.id]*10:0}%;--tone:${d.color}"></span></div></div>`).join('')}</div>`;
  $('homeActions').innerHTML=recommend(last?.answers).map(actionCard).join('');
}
function methods(){for(const available of [true,false])$(available?'availableMethods':'researchMethods').innerHTML=METHODS.filter(m=>m.available===available).map(m=>`<article class="card method"><span class="badge ${available?'':'neutral'}">${m.tag}</span><h3>${m.name}</h3><p class="small muted">${m.description}</p>${available?`<button class="btn ${m.id==='weekly'?'primary':''}" data-start="${m.id}">시작하기 →</button>`:`<a class="btn" href="${m.source}" target="_blank" rel="noopener noreferrer">원출처 보기 ↗</a>`}</article>`).join('');}
function renderQuestion(){
  const d=DIMENSIONS[question];$('questionProgress').textContent=`${question+1} / 8`;$('questionBar').style.width=`${(question+1)/8*100}%`;$('questionArea').textContent=d.name;$('questionTitle').textContent=d.question;$('questionHint').textContent=`0–10 중 선택 · ${d.hint}`;
  ratings($('scanRating'),answers[d.id],n=>{answers[d.id]=n;$('scanNext').disabled=false;$('draftStatus').textContent=`${Object.keys(answers).length}개 응답 임시 보관 중 · 아직 저장되지 않았어요.`;});
  $('scanBack').disabled=question===0;$('scanNext').textContent=question===7?'결과 확인하고 저장':'다음';$('scanNext').disabled=answers[d.id]===undefined;
}
function start(kind){if(!store)return toast('안전한 저장을 준비하지 못했어요. 저장 안내를 확인해 주세요.');ensureConsent(()=>{
  if(kind==='weekly'){scanStarted=true;location.hash='scan';renderQuestion();}
  else if(kind==='daily'){location.hash='home';setTimeout(()=>$('dailyRating').scrollIntoView({behavior:'smooth',block:'center'}),100);}
  else{modal('하루 돌아보기','<p class="muted">어떤 상황에서 어떤 느낌이 있었나요? 해석하거나 긍정적으로 바꿀 필요는 없어요.</p><div class="field"><label for="diaryText">내 하루의 한 장면</label><textarea id="diaryText" maxlength="2000" rows="6" placeholder="내가 기억하고 싶은 순간을 적어보세요."></textarea></div><p class="small muted">닫아도 이 창에서 다시 열면 임시 글이 남습니다. 새로고침 전에는 저장해 주세요.</p><button class="btn primary" id="saveDiary">회고 저장하기</button><button class="btn" id="discardDiary">임시 글 비우기</button>');$('diaryText').value=diaryDraft;$('diaryText').oninput=e=>diaryDraft=e.target.value;$('discardDiary').onclick=()=>{diaryDraft='';$('diaryText').value='';};$('saveDiary').onclick=async()=>{const note=$('diaryText').value.trim();if(!note)return toast('남기고 싶은 내용을 입력해 주세요.');if(await save('diary',{note},$('saveDiary'))){diaryDraft='';close();}};}
});}
async function refresh(){records=await store.all();overview();const page=location.hash.slice(1)||'home';if(page==='actions')renderActions();if(page==='report')report();else{stage2?.render();stage3?.render();}$('recordCount').textContent=`행복 기록 ${records.length}건 · 기존 활동 기록과 별도 보관`;$('dailySaved').textContent=rows('daily').some(r=>dayKey(r.createdAt)===dayKey(Date.now()))?'오늘의 기분 기록이 저장되어 있어요. 새 기록은 덮어쓰지 않고 추가됩니다.':'';}
async function save(type,data,button){
  if(!store){toast('기록을 저장할 수 없는 상태예요.');return false;}if(button)button.disabled=true;
  try{const saved=await store.add(newRecord(type,data));channel?.postMessage('changed');try{await refresh();toast('이 브라우저에 저장했어요.');}catch{records=[saved,...records.filter(r=>r.id!==saved.id)];toast('기록은 저장됐지만 화면을 갱신하지 못했어요. 다시 열어 확인해 주세요.');}return true;}
  catch(error){toast(error.message);return false;}finally{if(button)button.disabled=false;}
}
function daily(){ratings($('dailyRating'),dailyValue,n=>{dailyValue=n;$('saveDaily').disabled=!store;});$('saveDaily').disabled=dailyValue===null||!store;}
$('saveDaily').onclick=()=>ensureConsent(async()=>{if(dailyValue===null)return;if(await save('daily',{value:dailyValue,note:$('dailyNote').value},$('saveDaily'))){dailyValue=null;$('dailyNote').value='';daily();}});
async function finish(){
  if(!consent)return ensureConsent(finish);
  if(scoreScan(answers)===null){modal('아직 답하지 않은 단면이 있어요',`<p>모든 질문에 답해야 종합 지수를 계산할 수 있습니다. 미응답을 0점으로 처리하지 않아요.</p><p>${DIMENSIONS.filter(d=>answers[d.id]===undefined).map(d=>d.name).join(' · ')}</p><button class="btn primary" id="reviewMissing">미응답 질문으로 돌아가기</button>`);$('reviewMissing').onclick=()=>{question=DIMENSIONS.findIndex(d=>answers[d.id]===undefined);close();renderQuestion();};return;}
  if(await save('scan',{answers:{...answers},instrument:'hs-eight-v1'},$('scanNext'))){scanStarted=false;answers={};question=0;location.hash='report';modal('나만의 출발점을 기록했어요',`<p>이번 결과는 <b>${rows('scan')[0].score}/100</b>입니다. 좋고 나쁨을 판정하는 임상 기준점이 아니에요.</p><p>${DISCLAIMER}</p><p>8개 응답의 단순 평균 × 10입니다. 마음에 걸리는 단면에서 부담 없는 실천 하나를 골라보세요.</p><a href="#actions" class="btn primary" id="resultActions">나에게 맞는 실천 보기</a>`);$('resultActions').onclick=close;}
}
$('scanBack').onclick=()=>{if(question>0)question--;renderQuestion();};
$('scanNext').onclick=()=>{if(question<7){question++;renderQuestion();$('questionTitle').focus();}else finish();};
$('scanSkip').onclick=()=>{delete answers[DIMENSIONS[question].id];if(question<7){question++;renderQuestion();}else finish();};
$('cancelScan').onclick=e=>{if(!Object.keys(answers).length){scanStarted=false;return;}e.preventDefault();modal('측정을 그만둘까요?','<p>완료하지 않은 응답은 아직 저장되지 않았어요. 그만두면 이 임시 응답만 지워집니다.</p><button class="btn danger" id="confirmCancel">임시 응답 지우고 돌아가기</button>');$('confirmCancel').onclick=()=>{answers={};question=0;scanStarted=false;close();location.hash='measure';};};
function latestActions(){const map=new Map();for(const r of rows('action'))if(!map.has(r.actionId))map.set(r.actionId,r);return [...map.values()];}
function renderActions(){
  const filter=$('actionArea').value;$('actionLibrary').innerHTML=ACTIONS.filter(a=>filter==='all'||a.area===filter).map(actionCard).join('');
  const chosen=latestActions().filter(r=>r.status==='planned');
  $('myActions').innerHTML=chosen.length?`<div class="grid-3">${chosen.map(r=>{const a=ACTIONS.find(a=>a.id===r.actionId);return `<article class="card"><span class="badge">내가 선택한 실천</span><h3 style="margin-top:12px">${a.title}</h3><p class="small muted">${a.steps}</p><div class="card-actions"><button class="btn primary" data-action-status="done" data-id="${a.id}">실천했어요</button><button class="btn" data-action-status="skipped" data-id="${a.id}">이번엔 쉬기</button></div></article>`;}).join('')}</div>`:'<div class="empty">아래에서 나에게 맞는 실천 하나를 골라보세요.<br>고르는 것만으로 완료 기록이 생기지는 않아요.</div>';
}
function report(){
  const scans=rows('scan').slice(0,20),last=scans[0],prev=scans[1];
  const change=prev?`이전 기록 대비 ${last.score-prev.score>0?'+':''}${last.score-prev.score}점 · ${date(prev.createdAt)} → ${date(last.createdAt)}`:'같은 도구의 기록이 두 번 쌓이면 차이를 표시해요.';
  $('reportSummary').innerHTML=`<span class="badge">자체 지수 · HS-8 v1</span><h2 style="margin-top:16px">최근 행복 스캔</h2><div class="metric">${last?last.score:'—'}<small> / 100</small></div><p class="small muted" style="margin-top:12px">${change}</p><div class="notice info">${last?'두 점수의 차이만으로 실천의 효과나 통계적으로 의미 있는 개선을 입증할 수 없어요.':'아직 측정 기록이 없어요. 첫 기록부터 시작해 보세요.'}</div><p class="small muted" style="margin-top:14px">실천 완료 ${rows('action').filter(r=>r.status==='done').length}건 · 행복 점수에는 더하지 않아요.</p>`;
  const groups=new Map();for(const r of [...rows('daily')].reverse()){const key=dayKey(r.createdAt);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r.value);}
  const points=[...groups].slice(-7).map(([day,values])=>({day,value:Math.round(values.reduce((a,b)=>a+b,0)/values.length*10)/10}));
  $('moodChart').innerHTML=points.length?`<div class="chart" role="img" aria-label="${points.map(p=>p.day+' '+p.value+'점').join(', ')}">${points.map(p=>`<div class="chart-col"><b>${p.value}</b><div class="chart-bar" style="height:${p.value*10+3}px"></div><span>${p.day.slice(5)}</span></div>`).join('')}</div>`:'<p class="empty">아직 기분 기록이 없어요.</p>';
  $('scanHistory').innerHTML=scans.length?scans.map(r=>`<li><div><b>${date(r.createdAt)}</b><p class="small muted">지난 7일 · HS-8 v1 · 8개 응답</p><details><summary>단면별 응답 보기</summary>${DIMENSIONS.map(d=>d.name+': '+r.answers[d.id]+'/10').join('<br>')}</details></div><strong>${r.score}<small>/100</small></strong></li>`).join(''):'<li class="muted">첫 행복 스캔을 하면 이곳에 기록이 남아요.</li>';
  stage1?.render(records);
  stage2?.render();
  stage3?.render();
}
function download(name,text,type){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
$('exportJson').onclick=async()=>{if(!store)return toast('저장 공간을 읽을 수 없어요.');try{await refresh();download('happyscan-backup-'+dayKey(Date.now())+'.json',backup(records),'application/json');toast('백업 파일에는 개인 응답이 있어요. 안전하게 보관해 주세요.');}catch(e){toast(e.message);}};
$('chooseImport').onclick=()=>$('importFile').click();
$('importFile').onchange=async e=>{
  const file=e.target.files[0];e.target.value='';if(!file)return;
  try{if(file.size>MAX_BYTES)throw Error('5MB 이하의 백업 파일을 선택해 주세요.');const incoming=parseBackup(await file.text());if(!store)throw Error('저장 공간을 사용할 수 없어요.');await refresh();const currentIds=new Set(records.map(r=>r.id));const duplicates=incoming.filter(r=>currentIds.has(r.id)).length;
    modal('백업을 확인해 주세요',`<p>행복 기록 ${incoming.length}건 · 현재 기록과 같은 ID ${duplicates}건</p><p>현재 기록은 유지하고 새 ID만 추가합니다. 같은 ID의 내용이 다르면 전체 가져오기를 취소합니다.</p><button class="btn primary" id="confirmImport">확인 후 합치기</button>`);
    $('confirmImport').onclick=()=>{const b=$('confirmImport');ensureConsent(async()=>{b.disabled=true;modal('백업을 합치고 있어요','<p>기존 기록을 보존하며 파일을 확인하고 있어요. 완료 안내가 나올 때까지 기다려 주세요.</p>');try{const count=await store.merge(incoming);await refresh();channel?.postMessage('changed');if($('modalTitle').textContent==='백업을 합치고 있어요')close();toast(count+'건을 추가했어요. 기존 기록은 보존했어요.');}catch(error){if($('modalTitle').textContent==='백업을 합치고 있어요')close();toast(error.message);}finally{b.disabled=false;}});};
  }catch(error){toast(error.message);}
};
$('deleteAll').onclick=()=>{
  modal('행복 기록 전체 삭제','<p>해피스캔의 행복 응답·기분·회고·실천 기록만 삭제합니다. 이전 활동 기록, 클라우드 자료, 내려받은 파일은 별개입니다. 이 작업은 되돌릴 수 없어요.</p><p>필요하다면 먼저 창을 닫고 백업을 받아 주세요.</p><div class="field"><label for="deleteWord">확인하려면 ‘삭제’를 입력하세요</label><input id="deleteWord" autocomplete="off"></div><button class="btn danger" id="confirmDelete" disabled>이 브라우저의 행복 기록 삭제</button>');
  $('deleteWord').oninput=e=>$('confirmDelete').disabled=e.target.value!=='삭제';
  $('confirmDelete').onclick=async()=>{if(!store)return;const b=$('confirmDelete');b.disabled=true;try{await store.clear();await refresh();channel?.postMessage('changed');close();toast('이 브라우저의 행복 기록을 삭제했어요.');}catch(e){toast(e.message);b.disabled=false;}};
};
$('exportCsv').onclick=()=>{const cell=v=>'"'+String(v).replace(/"/g,'""')+'"';const values=[['일시','측정도구','자체 지수','기분',...DIMENSIONS.map(d=>d.name)],...records.filter(r=>['scan','daily'].includes(r.type)).map(r=>[new Date(r.createdAt).toISOString(),r.instrument,r.score??'',r.value??'',...DIMENSIONS.map(d=>r.answers?.[d.id]??'')])];download('happyscan-measurements-'+dayKey(Date.now())+'.csv','\uFEFF'+values.map(row=>row.map(cell).join(',')).join('\r\n'),'text/csv;charset=utf-8');};
$('printReport').onclick=()=>window.print();$('actionArea').onchange=renderActions;
$('largeText').checked=document.documentElement.dataset.large==='true';
$('largeText').onchange=e=>{document.documentElement.dataset.large=String(e.target.checked);try{localStorage.setItem('happyscan-large-text',String(e.target.checked));}catch{toast('화면 설정은 이번 방문에만 적용했어요.');}};
$('persistStorage').onclick=async()=>{try{toast(await navigator.storage?.persist?.()?'브라우저가 저장 유지 요청을 허용했어요. 별도 백업도 보관해 주세요.':'저장 유지 요청을 허용하지 않았거나 지원하지 않아요. 백업을 내려받아 주세요.');}catch{toast('저장 유지 요청에 실패했어요. 백업을 내려받아 주세요.');}};
document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.start)start(b.dataset.start);
  if(b.dataset.actionDetail){const a=ACTIONS.find(a=>a.id===b.dataset.actionDetail);if(!a)return;const last=rows('scan')[0];
    modal(a.title,`<span class="badge">${a.time} · ${DIMENSIONS.find(d=>d.id===a.area).name}</span><p style="margin-top:16px">${a.steps}</p><div class="notice">${a.caution}</div><h3 style="margin-top:16px">다른 방법도 있어요</h3><p>${a.alternative}</p><p class="small muted">${last?'최근 이 단면의 응답: '+last.answers[a.area]+'/10. 홈 화면은 상대적으로 낮은 3단면의 예시를 보여줍니다. 원하는 실천은 직접 바꿀 수 있어요.':'첫 실천 예시입니다. 개인 결과를 분석한 맞춤 처방이 아니에요.'}</p><p class="small muted">${a.evidence}</p><p class="small muted">${a.reviewedAt} · ${a.reviewer} · 사람 검수 대기</p><a href="${a.source}" target="_blank" rel="noopener noreferrer">관련 일반 근거 보기 ↗</a><div class="card-actions"><button class="btn primary" id="planAction">이 실천 선택하기</button></div>`);
    $('planAction').onclick=()=>ensureConsent(async()=>{if(latestActions().some(r=>r.actionId===a.id&&r.status==='planned')){close();toast('이미 선택한 실천이에요.');return;}if(await save('action',{actionId:a.id,status:'planned'},$('planAction'))){close();location.hash='actions';}});
  }
  if(b.dataset.actionStatus)ensureConsent(async()=>{if(await save('action',{actionId:b.dataset.id,status:b.dataset.actionStatus},b))toast(b.dataset.actionStatus==='done'?'실천을 남겼어요. 기분 변화는 별도로 기록해 보세요.':'쉬기로 한 선택을 기록했어요. 벌점은 없어요.');});
  if(b.dataset.remove){const id=b.dataset.remove;modal('이 기록을 삭제할까요?','<p>선택한 기록 한 건만 삭제합니다. 삭제 후 되돌릴 수 없어요.</p><button class="btn danger" id="confirmRemove">이 기록 삭제</button>');$('confirmRemove').onclick=async()=>{if(!store)return;const b=$('confirmRemove');b.disabled=true;try{await store.remove(id);await refresh();channel?.postMessage('changed');close();toast('선택한 기록을 삭제했어요.');}catch(e){toast(e.message);b.disabled=false;}};}
});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();pendingInstall=e;$('install').textContent='앱 설치';});
$('install').onclick=async()=>{if(pendingInstall){try{await pendingInstall.prompt();await pendingInstall.userChoice;pendingInstall=null;}catch{toast('브라우저 메뉴에서 홈 화면에 추가해 주세요.');}return;}modal('해피스캔을 앱처럼 사용하기','<p>지원하는 브라우저 메뉴에서 ‘앱 설치’ 또는 ‘홈 화면에 추가’를 선택하세요. iPhone에서는 Safari의 공유 메뉴를 이용하세요.</p><p>설치 지원은 브라우저와 HTTPS 환경에 따라 다릅니다. 설치는 기기 간 동기화나 백업을 대신하지 않습니다.</p>');};
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&store)refresh().catch(e=>toast(e.message));});
if(channel)channel.onmessage=()=>store&&refresh().catch(e=>toast(e.message));
$('todayDate').textContent=new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'long'}).format(new Date());
$('actionArea').insertAdjacentHTML('beforeend',DIMENSIONS.map(d=>`<option value="${d.id}">${d.name}</option>`).join(''));
daily();await route();
try{store=await openStore();await refresh();daily();document.documentElement.dataset.happyscanReady='true';}catch(error){store?.close();store=null;overview();renderActions();report();$('saveWarning').textContent=error.message+' 저장되지 않은 내용을 성공으로 표시하지 않습니다. 기존 자료를 삭제하지 말고 도움을 요청해 주세요.';$('saveWarning').hidden=false;}
if('serviceWorker'in navigator&&['https:','http:'].includes(location.protocol))navigator.serviceWorker.register('./sw.js').then(async reg=>{stage1?.connectUpdate(reg);await navigator.serviceWorker.ready;toast('오프라인 화면 준비가 완료됐어요. 기록은 별도로 백업해 주세요.');}).catch(()=>toast('오프라인 준비에 실패했어요. 지금 화면은 계속 사용할 수 있어요.'));
