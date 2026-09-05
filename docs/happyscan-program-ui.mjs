import {dayPlan} from './happyscan-maturity.mjs';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function runCard(run,program,actions,{prefix='program',allowed=new Set(actions.map(a=>a.id))}={}) {
  const day=Math.min(program.days,Math.max(1,run.elapsed)),plan=dayPlan(program,day,actions);
  const choices=program.actions.filter(id=>allowed.has(id));
  const active=run.status==='active',disabled=!active||run.elapsed<1||Boolean(run.days[day]);
  const event=(name,label,off=false)=>`<button class="btn" data-${prefix}-event="${name}" data-run="${run.runId}" ${off?'disabled':''}>${label}</button>`;
  const date=new Date(run.startedAt);date.setDate(date.getDate()+1);
  return `<article class="card program-run" data-program-run="${esc(run.runId)}"><h3>${esc(program.title)}</h3><p>${new Date(run.startedAt).toLocaleDateString('ko-KR')} 시작 · ${run.status==='finished'?'회고까지 마침':active?'진행 중':'잠시 중단'} · ${Math.max(0,run.elapsed)}일 경과 · 직접 기록 ${run.recordedDays}/${program.days}일</p>
    ${run.status==='finished'?`<p>${run.participation==='partial'?'일부 날짜에 참여한 과정':'모든 날짜를 기록한 과정'} · 미기록 ${run.missingDays.length}일</p><p>${esc(run.note)}</p>`:`
    ${run.elapsed<1?`<p class="notice info">오늘은 준비하는 날이에요. 첫 실천은 ${date.toLocaleDateString('ko-KR')}에 열립니다. 아래 방법을 먼저 읽어도 좋아요.</p>`:''}
    <h4>${day}일차 · ${esc(plan.focus)}</h4>${allowed.has(plan.action.id)?`<p>${esc(plan.action.title)} · ${esc(plan.action.time)}</p><p>${esc(plan.action.steps)}</p><p class="small">${esc(plan.action.caution)}</p>`:'<p>오늘 기본 제안은 현재 제외 조건에 해당하여 표시하지 않아요. 아래의 다른 방법을 선택하거나 쉬어도 좋아요.</p>'}
    <div class="row">${choices.map(id=>`<button class="btn" data-action-detail="${esc(id)}">${esc(actions.find(a=>a.id===id).title)}</button>`).join('')||'<p>현재 조건에 맞는 실천이 없어요. 쉬거나 내 공간에서 조건을 바꿔주세요.</p>'}</div>
    <p class="small">${esc(plan.reflection)}</p><div class="row">${event('done','오늘 실천',disabled||!choices.length)}${event('skipped','오늘 쉬기',disabled)}${event(active?'paused':'resumed',active?'잠시 중단':'이어 하기')}${event('finished','재측정 후 종료 회고',!run.canFinish)}<a class="btn" href="#scan">행복 스캔 다시 하기</a></div>
    ${active&&run.elapsed>1&&run.missingDays.some(d=>d<run.elapsed)?`<details><summary>빠진 날짜를 기억해 기록하기</summary><label for="late-${run.runId}">기억나는 날짜</label><select class="btn" id="late-${run.runId}">${run.missingDays.filter(d=>d<=run.elapsed).map(d=>`<option value="${d}">${d}일차</option>`).join('')}</select>${event('late-done','늦게 실천 기록')}${event('late-skipped','늦게 쉬기 기록')}<p class="small">늦게 적은 기록으로 표시합니다. 기억나지 않으면 비워두세요.</p></details>`:''}
    <p class="small">일정은 시작한 현지 날짜 기준으로 진행하며 중단 중에도 달력 날짜는 흐릅니다. 빠진 날은 미기록으로 남아요. ${program.days}일 이후 같은 도구로 재측정하고 회고하면 참여한 범위대로 마칠 수 있어요.</p>`}
    <details><summary>날짜별 기록 ${run.recordedDays}/${program.days}</summary><ol>${Array.from({length:program.days},(_,i)=>`<li>${i+1}일차: ${{done:'실천',skipped:'쉬기'}[run.days[i+1]]??'미기록'}${run.lateDays.includes(i+1)?' · 늦게 기록':''}</li>`).join('')}</ol></details></article>`;
}
