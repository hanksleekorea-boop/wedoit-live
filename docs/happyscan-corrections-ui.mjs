import {DIMENSIONS} from './happyscan-data.mjs';
import {integerInput} from './happyscan-maturity.mjs';
const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function installCorrections({getRecords,getStore,modal,close,toast,onChanged}){
  let dirty=false;
  document.addEventListener('click',event=>{
    const detail=event.target.closest('[data-record-detail]');
    if(detail){
      const row=getRecords().find(r=>r.id===detail.dataset.recordDetail);if(!row)return;
      const supported=['daily','scan','diary','action','lifestyle'].includes(row.type);
      $('modalBody').querySelector('.small:last-child')?.remove();
      $('modalBody').insertAdjacentHTML('beforeend',`<p class="small">정정은 원래 날짜를 유지하고 이전 값·이유를 JSON 백업에 보존합니다. CSV는 현재 값이며 원자료 복원용이 아닙니다.</p>${(row.corrections??[]).map((c,i)=>`<details><summary>정정 ${i+1} · ${new Date(c.correctedAt).toLocaleString('ko-KR')}</summary><p>${esc(c.reason)}</p><pre class="record-snapshot">${esc(JSON.stringify(c.previous,null,2))}</pre></details>`).join('')}${supported?`<button class="btn" data-correct-record="${esc(row.id)}">이력 남기고 정정</button>`:'<p>프로그램·실험 진행 사건은 직접 수정하지 않습니다.</p>'}`);
    }
    const edit=event.target.closest('[data-correct-record]');if(!edit)return;
    const row=getRecords().find(r=>r.id===edit.dataset.correctRecord);if(!row)return;
    if(getRecords().some(r=>r.baselineId===row.id||r.endScanId===row.id)){toast('진행 중이거나 마친 과정이 참조하는 측정입니다. 비교 근거 보호를 위해 정정하지 않았어요. 새 측정을 남겨 주세요.');return;}
    const numeric=(id,label,value,min=0,max=10)=>`<label for="${id}">${label}</label><input id="${id}" type="number" min="${min}" max="${max}" step="1" required value="${value}">`;
    let body=row.type==='scan'?DIMENSIONS.map(d=>numeric('correct-'+d.id,d.name,row.answers[d.id])).join(''):row.type==='daily'||row.method==='moment'?numeric('correct-value','응답 (0–10)',row.value):row.method==='body'?numeric('correct-sleepMinutes','수면 (분)',row.sleepMinutes,0,1440)+numeric('correct-activityMinutes','움직임 (분)',row.activityMinutes,0,1440):row.method==='time'?numeric('correct-minutes','시간 (분)',row.minutes,1,1440):'';
    if(row.type!=='scan')body+=`<label for="correct-note">메모</label><textarea id="correct-note" maxlength="${['daily','lifestyle'].includes(row.type)?500:2000}">${esc(row.note??'')}</textarea>`;
    modal('원본 이력을 남기고 정정하기',`<form id="correctionForm"><p>잘못 입력한 값을 바로잡는 기능입니다. 결과를 좋게 보이기 위해 바꾸지 마세요. 기록 날짜는 바꾸지 않습니다.</p>${body}<label for="correctionReason">정정 이유 (필수)</label><textarea id="correctionReason" maxlength="300" required></textarea><p id="correctionError" role="alert"></p><button class="btn primary" type="submit">이력과 함께 저장</button></form>`);
    dirty=false;$('correctionForm').oninput=()=>{dirty=true;};
    $('correctionForm').onsubmit=async e=>{e.preventDefault();const form=e.currentTarget;if(!form.reportValidity())return;const button=form.querySelector('button');button.disabled=true;
      try{const value=(key,min=0,max=10)=>integerInput($('correct-'+key).value,{label:key,min,max});let fields={};
        if(row.type==='scan')fields.answers=Object.fromEntries(DIMENSIONS.map(d=>[d.id,value(d.id)]));
        else{fields.note=$('correct-note').value;if(row.type==='daily'||row.method==='moment')fields.value=value('value');if(row.method==='body'){fields.sleepMinutes=value('sleepMinutes',0,1440);fields.activityMinutes=value('activityMinutes',0,1440);}if(row.method==='time')fields.minutes=value('minutes',1,1440);}
        const store=getStore();if(!store)throw Error('저장 공간을 사용할 수 없어요.');await store.correct(row,fields,$('correctionReason').value);dirty=false;await onChanged();close();toast('이전 값과 정정 이유를 보존하고 저장했어요.');
      }catch(error){$('correctionError').textContent=error.message;button.disabled=false;}
    };
  });
  return {hasDraft:()=>dirty&&Boolean($('correctionForm'))};
}
