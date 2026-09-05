(()=>{
  "use strict";
  const VERSION="v26.4.0-p1-insight-reasons";
  const copy=()=>document.documentElement.lang==="en"?{
    title:"How were these numbers calculated?",lead:"We count the different days with a record in the last 7 days. Several records on one day still count as one recorded day.",days:n=>`${n} recorded days: this is a count of dates with a record, not a score or a promise to record every day.`,area:(name,count,total)=>`${name}: ${count} of ${total} records in the last 7 days were in this area.`,time:(name,count,total)=>`${name}: ${count} of ${total} records were saved at this time of day. This describes timing only; it does not explain why.`,three:"Three recorded days are an early look. The app will describe a full-week flow after 7 recorded days.",seven:"Seven recorded days are the full recent-week view. Days without records are not guessed or judged."
  }:{
    title:"이 숫자는 어떻게 나온 걸까요?",lead:"최근 7일 안에서 기록이 있었던 서로 다른 날을 셌어요. 같은 날에 여러 번 기록해도 ‘기록한 날’은 1일로 계산합니다.",days:n=>`기록한 날 ${n}일: 기록이 있는 날짜 수일 뿐, 점수나 매일 기록해야 한다는 약속은 아니에요.`,area:(name,count,total)=>`${name}: 최근 7일 ${total}번 기록 중 ${count}번이 이 영역에 있었어요.`,time:(name,count,total)=>`${name}: 최근 7일 ${total}번 기록 중 ${count}번이 이 시간대에 남았어요. 시간만 설명하며, 이유를 추측하지 않아요.`,three:"기록한 날 3일은 첫 흐름을 보는 단계예요. 7일이 되면 한 주 흐름을 함께 보여드려요.",seven:"기록한 날 7일은 최근 한 주를 보는 단계예요. 기록이 없는 날은 추측하거나 평가하지 않아요."
  };
  const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  function render(app){
    const section=document.querySelector("#serviceInsightSection"),body=document.querySelector("#serviceInsightBody");if(!section||!body||!window.__WEDOIT_V263__)return;
    const old=document.querySelector("#serviceInsightReasons"),model=window.__WEDOIT_V263__.buildInsights(app.store.getState(),app.store.constants.areas);
    if(model.stage==="building"){old?.remove();return}
    const t=copy(),items=[t.days(model.activeDays),t.area(model.topArea.name,model.topArea.count,model.total),t.time(model.topTime.label,model.topTime.count,model.total),model.stage==="seven"?t.seven:t.three];
    const next=`<details id="serviceInsightReasons" class="service-insight-reasons" data-i18n-skip><summary>${t.title}</summary><p>${t.lead}</p><ul>${items.map(item=>`<li>${escapeHtml(item)}</li>`).join("")}</ul></details>`;
    if(old)old.outerHTML=next;else body.insertAdjacentHTML("afterend",next);
  }
  function mount(app){
    let queued=false;const schedule=()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;render(app)})};
    app.store.subscribe(schedule);window.addEventListener("wedoit:languagechange",schedule);new MutationObserver(schedule).observe(document.querySelector("#serviceInsightBody"),{childList:true,subtree:true});schedule();document.documentElement.dataset.p1InsightReasonsReady="true";
  }
  let tries=0;const timer=setInterval(()=>{tries+=1;const app=window.__WEDOIT__;if(app?.ready&&app.store&&window.__WEDOIT_V263__){clearInterval(timer);mount(app)}else if(tries>250)clearInterval(timer)},40);
  window.__WEDOIT_V264_P1_INSIGHT_REASONS__={version:VERSION};
})();
