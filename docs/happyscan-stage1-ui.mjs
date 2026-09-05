import {HELP,CONTENT_REVIEW,nextScanDate,calendarDays,pageOf,recordMetadata} from './happyscan-stage1.mjs';
import {DIMENSIONS,ACTIONS} from './happyscan-data.mjs';
import {backupParts} from './happyscan-store.mjs';
const $=id=>document.getElementById(id);
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const when=ts=>new Date(ts).toLocaleString('ko-KR');
export function installStage1({getRecords,getStore,toast,download,hasDraft}){
  let allPage=0,scanPage=0,lastRecords=[];
  const help=document.createElement('section');help.className='view';help.id='view-help';help.hidden=true;help.setAttribute('aria-labelledby','helpTitle');
  help.innerHTML=`<div class="intro"><p class="eyebrow">HELP &amp; RECOVERY</p><h1 id="helpTitle">막히는 순간에도, 내 기록은 내 손에.</h1><p>기록부터 복원까지 필요한 순서대로 안내합니다.</p></div><article class="card">${HELP.map(h=>`<details id="help-${h.id}"><summary>${esc(h.title)}</summary><ol>${h.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol><a class="btn" href="${h.href}">${h.label}</a></details>`).join('')}<p class="small muted">${CONTENT_REVIEW.reviewedAt} · AI 문안 점검. 실제 운영자·전문가·사용자 검수는 별도이며 아직 완료되지 않았습니다.</p></article>`;
  $('main').append(help);
  document.querySelector('.app-footer .row').insertAdjacentHTML('afterbegin','<a href="#help">도움말·복원 절차</a>');
  $('view-me').querySelector('.intro').insertAdjacentHTML('beforeend','<a class="btn" href="#help">도움말·문의 안내</a>');
  const research=$('researchMethods'),researchHeading=research.previousElementSibling;
  researchHeading.querySelector('span').textContent='현재 제공하는 검사가 아닙니다';
  $('view-about').append(researchHeading,research);
  $('view-measure').querySelector('.notice').textContent='만 18세 이상을 위한 자체 성찰 기록 3가지입니다. 의료 진단이나 검증된 임상 검사가 아닙니다. 가입 없이 이 브라우저에 저장합니다.';
  $('reportSummary').parentElement.insertAdjacentHTML('beforebegin','<article id="remeasureNotice" class="card" style="margin-bottom:20px" aria-live="polite"></article>');
  $('scanHistory').insertAdjacentHTML('afterend','<div class="row between"><button class="btn" id="scansPrev">이전 20건</button><span class="small" id="scansRange" role="status"></span><button class="btn" id="scansNext">다음 20건</button></div>');
  $('allHistory').insertAdjacentHTML('beforebegin','<div class="row"><label for="historyType">기록 종류</label><select class="btn" id="historyType"><option value="all">모든 기록</option><option value="scan">행복 스캔</option><option value="daily">기분</option><option value="diary">회고</option><option value="action">실천</option></select></div>');
  $('allHistory').insertAdjacentHTML('afterend','<div class="row between"><button class="btn" id="historyPrev">이전 20건</button><span class="small" id="historyRange" role="status"></span><button class="btn" id="historyNext">다음 20건</button></div>');
  $('printReport').insertAdjacentHTML('afterend','<span class="small muted">인쇄/PDF: 현재 표시한 목록 범위. 전체 원자료는 JSON 백업에 담깁니다.</span>');
  $('exportJson').insertAdjacentHTML('afterend','<button class="btn" id="splitBackup">나눈 백업 받기</button>');
  $('recordCount').insertAdjacentHTML('afterend','<p class="small muted">백업 한 파일당 최대 5MB·20,000건. 전체가 넘으면 나눈 백업의 모든 조각을 저장하세요.</p><div id="backupParts" class="row" aria-live="polite"></div>');
  $('main').insertAdjacentHTML('afterbegin','<div id="networkStatus" class="notice info" role="status" hidden></div>');
  $('view-me').querySelector('.intro').insertAdjacentHTML('afterend','<div id="updateNotice" class="notice info" hidden><span>새 버전이 준비됐어요. 입력을 저장하고 다른 해피스캔 창을 닫은 뒤 적용하세요.</span> <button id="applyUpdate" class="btn">안전하게 새 버전 적용</button><span id="updateStatus" role="status"></span></div>');
  function network(){const offline=!navigator.onLine;$('networkStatus').hidden=!offline;$('networkStatus').textContent='오프라인입니다. 준비된 화면과 기기 저장을 이용할 수 있어요. 외부 링크는 연결 후 열어 주세요.';}
  window.addEventListener('online',network);window.addEventListener('offline',network);network();
  $('splitBackup').onclick=async()=>{try{const store=getStore();if(!store)throw Error('저장 공간을 읽을 수 없어요.');const parts=backupParts(await store.all());$('backupParts').innerHTML=`<p>${parts.length}개 조각을 모두 내려받으세요. 각 버튼을 눌러 저장한 뒤 파일을 직접 확인하세요.</p>`;parts.forEach((raw,i)=>{const b=document.createElement('button');b.className='btn';b.textContent=`백업 ${i+1}/${parts.length} 받기`;b.onclick=()=>{download(`happyscan-backup-part-${i+1}-of-${parts.length}.json`,raw,'application/json');b.textContent=`${i+1}/${parts.length} 다운로드 요청됨 · 다시 받기`;};$('backupParts').append(b);});}catch(e){toast(e.message);}};
  function render(records=getRecords()){
    $('backupParts').replaceChildren();
    lastRecords=records;const scans=records.filter(r=>r.type==='scan'),last=scans[0],due=last&&nextScanDate(last.createdAt);
    $('remeasureNotice').innerHTML=`<h2>${last?'다음 주간 성찰':'나만의 출발점을 남겨요'}</h2><p>${last?`다음 권장일: ${due.toLocaleDateString('ko-KR')} · ${Date.now()>=due.getTime()?'다시 돌아볼 때가 되었어요.':'최근 기록의 현지 날짜에서 7일 후입니다.'}`:'첫 측정 이후 7일 뒤 다시 돌아보도록 안내합니다.'}</p><p class="small muted">지난 7일을 묻는 같은 도구끼리 비교해요. 앱을 열었을 때만 안내하며 외부 알림은 보내지 않습니다.${scans[1]&&calendarDays(scans[1].createdAt,last.createdAt)<7?' 최근 두 기록은 7일보다 가까워 회상 기간이 겹칠 수 있어요.':''}</p><button class="btn primary" data-start="weekly">${last?'같은 도구로 다시 측정':'첫 행복 스캔 시작'}</button>`;
    const sp=pageOf(scans,scanPage);scanPage=sp.page;
    $('scanHistory').innerHTML=sp.rows.length?sp.rows.map(r=>`<li><div><b>${when(r.createdAt)}</b><p class="small muted">지난 7일 · HS-8 v1 · 8개 응답</p><details><summary>단면별 응답과 설명 보기</summary>${DIMENSIONS.map(d=>`<p><b>${d.name}: ${r.answers[d.id]}/10</b><br>${d.interpretation}</p>`).join('')}<p class="small muted">자체 성찰 도구 · 좋고 나쁨을 나누는 기준점 없음 · ${CONTENT_REVIEW.reviewedAt} AI 문안 점검, 사람 검수 대기</p><p class="small muted">${Object.values(recordMetadata(r)).map(esc).join(' · ')}</p></details></div><strong>${r.score}<small>/100</small></strong></li>`).join(''):'<li class="muted">첫 행복 스캔을 하면 이곳에 기록이 남아요.</li>';
    const type=$('historyType').value,ap=pageOf(records.filter(r=>type==='all'||r.type===type),allPage);allPage=ap.page;
    const labels={daily:'기분',scan:'행복 스캔',diary:'회고',action:'실천',program:'프로그램',preferences:'실천 설정',lifestyle:'생활 기록',experiment:'개인 실험',community:'함께방'};
    const describe=r=>r.type==='program'?esc(r.programId)+' · '+({started:'시작',done:'실천',skipped:'쉬기',paused:'중단',resumed:'재개',finished:'회고 제출'}[r.event])+' · '+esc(r.note):r.type==='preferences'?'실천 시간·제외 조건·앱 안 일정 설정':r.type==='daily'?r.value+'/10'+(r.note?' · '+esc(r.note):''):r.type==='scan'?r.score+'/100 · 자체 지수':r.type==='diary'?esc(r.note):r.type==='action'?esc(ACTIONS.find(a=>a.id===r.actionId)?.title??r.actionId)+' · '+{planned:'선택함',done:'실천함',skipped:'쉬기로 함'}[r.status]:r.type==='lifestyle'?({moment:'순간',time:'시간 사용',body:'수면·활동'}[r.method])+' · '+(r.estimated?'대략값':'직접값'):r.type==='experiment'?esc(ACTIONS.find(a=>a.id===r.actionId)?.title??r.actionId)+' · '+({started:'시작',day:'하루 기록',paused:'중단',resumed:'재개',finished:'회고 제출'}[r.event]):'함께방 · '+({created:'연습방 생성','action-shared':'실천 공유 연습',joined:'참여',cheered:'격려',reported:'신고',blocked:'차단',left:'나가기',ended:'종료',invited:'초대'}[r.event]??esc(r.event));
    $('allHistory').innerHTML=ap.rows.length?ap.rows.map(r=>`<li><div><span class="small muted">${when(r.createdAt)} · ${labels[r.type]??'기록'}</span><p>${describe(r)}</p></div><button class="btn" data-remove="${r.id}" aria-label="${when(r.createdAt)} 기록 삭제">삭제</button></li>`).join(''):'<li class="muted">이 종류의 기록이 없어요. 다른 종류를 선택하거나 새 기록을 남겨보세요.</li>';
    for(const [prefix,p] of [['scans',sp],['history',ap]]){$(prefix+'Range').textContent=`${p.from}–${p.to} / 전체 ${p.total}건` ;$(prefix+'Prev').disabled=p.page===0;$(prefix+'Next').disabled=p.page===p.pages-1;}
  }
  $('historyType').onchange=()=>{allPage=0;render(lastRecords);};
  for(const [id,change] of [['scansPrev',()=>scanPage--],['scansNext',()=>scanPage++],['historyPrev',()=>allPage--],['historyNext',()=>allPage++]])$(id).onclick=()=>{change();render(lastRecords);};
  async function connectUpdate(reg){
    if(!reg)return;
    const ready=()=>{if(reg.waiting)$('updateNotice').hidden=false;};ready();reg.addEventListener('updatefound',()=>{reg.installing?.addEventListener('statechange',ready);});
    $('applyUpdate').onclick=async()=>{
      if(hasDraft()){$('updateStatus').textContent='저장하지 않은 입력이 있어 적용하지 않았어요. 먼저 저장하거나 측정을 취소하세요.';return;}
      if(!reg.waiting)return;
      $('applyUpdate').disabled=true;$('updateStatus').textContent='다른 창을 확인하고 있어요.';
      const port=new MessageChannel();let settled=false;
      const timeout=setTimeout(()=>{if(!settled){port.port1.close();$('applyUpdate').disabled=false;$('updateStatus').textContent='창 확인에 실패했어요. 모든 창을 닫고 다시 열어 주세요.';}},4000);
      port.port1.onmessage=e=>{settled=true;clearTimeout(timeout);port.port1.close();if(e.data?.otherClients!==0||hasDraft()){$('applyUpdate').disabled=false;$('updateStatus').textContent='다른 앱 창이 있거나 입력이 남아 있어요. 모두 저장하고 다른 창을 닫아 주세요.';return;}navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!hasDraft())location.reload();else{$('updateStatus').textContent='새 버전 준비 완료. 현재 입력을 저장한 뒤 직접 다시 여세요.';}},{once:true});reg.waiting?.postMessage({type:'ACTIVATE_UPDATE'});};
      reg.waiting.postMessage({type:'CHECK_UPDATE_CLIENTS'},[port.port2]);
    };
  }
  return {render,connectUpdate};
}
