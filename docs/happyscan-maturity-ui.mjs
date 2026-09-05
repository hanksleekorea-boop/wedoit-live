import {ACTIONS,DIMENSIONS} from './happyscan-data.mjs';
import {PROGRAMS} from './happyscan-stage2.mjs';
import {FOUR_WEEK_PROGRAMS} from './happyscan-stage3.mjs';
import {csvText,calendarDistance} from './happyscan-maturity.mjs';
const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function recordDescription(r) {
  const action=ACTIONS.find(a=>a.id===r.actionId),program=[...PROGRAMS,...FOUR_WEEK_PROGRAMS].find(p=>p.id===r.programId);
  if(r.type==='lifestyle')return r.method==='moment'?`순간의 느낌 ${r.value}/10`:r.method==='time'?`시간 사용 ${r.minutes}분`:`수면 ${r.sleepMinutes}분 · 움직임 ${r.activityMinutes}분`;
  if(r.type==='program')return `${program?.title??'프로그램'} · ${r.day}일차`;
  if(r.type==='action')return `${action?.title??'실천'} · ${{planned:'선택',done:'완료',skipped:'쉬기'}[r.status]}`;
  if(r.type==='daily')return `현재 기분 ${r.value}/10`;
  if(r.type==='scan')return `행복의 8가지 단면 ${r.score}/100`;
  if(r.type==='diary')return '하루 돌아보기';
  if(r.type==='preferences')return '내 실천 조건';
  if(r.type==='experiment')return `${action?.title??'개인 실험'} · ${r.durationDays}일 관찰`;
  return '이 브라우저 안의 함께 기능 연습';
}
export function installMaturityUI({getRecords,modal,close,download,toast,renderActions}) {
  // The first action is present in HTML so loading the app cannot push the page down.
  $('actionArea').parentElement.insertAdjacentHTML('afterend','<div class="library-tools"><label for="actionSearch">실천 검색</label><input type="search" id="actionSearch" placeholder="실천 이름이나 방법"><span id="actionSearchStatus" role="status"></span></div>');
  $('actionSearch').oninput=renderActions;
  $('view-report').querySelector('.intro').insertAdjacentHTML('afterend','<article class="card compare-controls"><h2>비교할 측정 고르기</h2><p>같은 HS-8 기록의 시작과 끝을 직접 선택하세요.</p><label for="compareStart">시작 기록</label><select class="btn" id="compareStart"></select><label for="compareEnd">종료 기록</label><select class="btn" id="compareEnd"></select><p id="compareResult" role="status"></p></article>');
  $('compareStart').onchange=$('compareEnd').onchange=compare;
  let previousScans='';
  function compare(){const records=getRecords(),start=records.find(r=>r.id===$('compareStart').value),end=records.find(r=>r.id===$('compareEnd').value);$('compareResult').textContent=!start||!end?'같은 도구의 기록 두 건이 쌓이면 비교할 수 있어요.':start.id===end.id?'서로 다른 두 기록을 선택해 주세요.':start.instrument!==end.instrument?'같은 도구의 기록을 선택해 주세요.':start.createdAt>end.createdAt?'시작이 종료보다 앞선 기록이어야 해요.':`${calendarDistance(start.createdAt,end.createdAt)}일 구간 · ${start.score} → ${end.score} · 차이 ${end.score-start.score>0?'+':''}${end.score-start.score}점. 기록 사이의 빈 날은 0점이 아니며, 이 차이가 실천의 효과를 증명하지는 않습니다.`;}
  $('exportCsv').textContent='기록 CSV 받기';
  $('exportCsv').onclick=()=>{modal('내보낼 기록 선택','<p>JSON 백업은 전체 자료 복원용이며, CSV는 표로 읽는 용도입니다.</p><label for="csvType">포함할 종류</label><select class="btn" id="csvType"><option value="all">모든 기록</option><option value="measurement">기분·행복 스캔·생활 기록</option><option value="action">실천 기록</option></select><p><label><input type="checkbox" id="csvNotes"> 개인 메모 포함하기 (선택)</label></p><p id="csvCount" role="status"></p><button class="btn primary" id="confirmCsv">CSV 내려받기</button>');const selected=()=>getRecords().filter(r=>$('csvType').value==='all'||($('csvType').value==='measurement'?['daily','scan','lifestyle'].includes(r.type):r.type==='action'));const count=()=>$('csvCount').textContent=`${selected().length}건 · 날짜·단위·측정도구 포함`;$('csvType').onchange=count;count();$('confirmCsv').onclick=()=>{download('happyscan-records.csv',csvText(selected(),{includeNotes:$('csvNotes').checked}),'text/csv;charset=utf-8');close();toast('선택한 범위의 CSV를 받았어요. 원본 복원에는 JSON 백업을 이용하세요.');};};
  document.addEventListener('click',e=>{const button=e.target.closest('[data-record-detail]');if(!button)return;const r=getRecords().find(x=>x.id===button.dataset.recordDetail);if(!r)return;const labels={context:'기록 상황',category:'시간 사용 종류',sleepMinutes:'수면 (분)',activityMinutes:'움직임 (분)',minutes:'시간 (분)',value:'응답 (0–10)',score:'자체 지수 (0–100)',note:'메모',hypothesis:'살펴볼 기대',durationDays:'관찰 기간 (일)',day:'프로그램 날짜',event:'진행 기록',instrument:'측정 도구 판'};const words={home:'집',work:'일',study:'배움',social:'사람과 함께',commute:'이동',rest:'휴식',other:'기타',care:'돌봄',household:'집안일',leisure:'여가',travel:'이동',started:'시작',done:'실천',skipped:'쉬기',paused:'중단',resumed:'재개',finished:'회고 제출',day:'하루 기록'};modal(recordDescription(r),`<p>${new Date(r.createdAt).toLocaleString('ko-KR')}</p>${r.type==='lifestyle'?`<p>${r.estimated?'기억에 따른 대략값':'직접 입력한 자기보고'} · 센서 측정이 아닙니다.</p>`:''}<dl>${Object.entries(labels).filter(([key])=>r[key]!==undefined&&r[key]!=='').map(([key,label])=>`<dt>${label}</dt><dd>${esc(words[r[key]]??r[key])}</dd>`).join('')}${r.answers?DIMENSIONS.map(d=>`<dt>${esc(d.name)}</dt><dd>${r.answers[d.id]}/10</dd>`).join(''):''}</dl><p class="small">현재 원자료를 표시합니다. 정정 이력을 보존하는 수정 기능은 아직 제공하지 않아요. 원본을 백업한 뒤 삭제 범위를 확인해 주세요.</p>`);});
  function render(){const records=getRecords(),scans=records.filter(r=>r.type==='scan'),key=scans.map(r=>r.id).join('|');if(key!==previousScans){const selectedStart=$('compareStart').value,selectedEnd=$('compareEnd').value;const options=scans.map(r=>`<option value="${esc(r.id)}">${new Date(r.createdAt).toLocaleString('ko-KR')} · ${r.score}/100</option>`).join('');$('compareStart').innerHTML=$('compareEnd').innerHTML=options;$('compareStart').value=scans.some(r=>r.id===selectedStart)?selectedStart:(scans.at(-1)?.id??'');$('compareEnd').value=scans.some(r=>r.id===selectedEnd)?selectedEnd:(scans[0]?.id??'');previousScans=key;}compare();
    const today=new Date().toLocaleDateString(),done=records.some(r=>r.type==='action'&&r.status==='done'&&new Date(r.createdAt).toLocaleDateString()===today),planned=records.some(r=>r.type==='action'&&r.status==='planned');
    $('todayNextCopy').textContent=done?'오늘 남긴 실천을 돌아보거나 편히 쉬어도 좋아요.':planned?'선택한 실천에서 이어 해보세요.':scans.length?'기록한 내 모습에서 작은 실천 하나를 골라보세요.':'약 3분 동안 지난 7일을 살펴보거나, 오늘의 기분만 남겨도 좋아요.';
    $('todayNextAction').textContent=done?'오늘 기록 보기':scans.length||planned?'작은 실천 이어가기':'측정 시작하기';$('todayNextAction').href=done?'#report':scans.length||planned?'#actions':'#measure';
  }
  return {render};
}
