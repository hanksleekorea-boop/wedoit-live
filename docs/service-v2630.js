(()=>{
  "use strict";
  const VERSION="v26.3.0",PREF_KEY="wedoit.v263.rhythm",DAY=86400000;
  const safeParse=value=>{try{return JSON.parse(value)}catch(_){return null}};
  function readPrefs(){try{const data=safeParse(localStorage.getItem(PREF_KEY));return data&&typeof data==="object"?{slots:{...data.slots}}:{slots:{}}}catch(_){return{slots:{}}}}
  function writePrefs(prefs){try{localStorage.setItem(PREF_KEY,JSON.stringify(prefs));return true}catch(_){return false}}
  function getSlotOverride(goalId){const value=readPrefs().slots[goalId];return["morning","now","evening"].includes(value)?value:null}
  function setSlotOverride(goalId,slot){const prefs=readPrefs();if(["morning","now","evening"].includes(slot))prefs.slots[goalId]=slot;else delete prefs.slots[goalId];writePrefs(prefs);window.dispatchEvent(new CustomEvent("wedoit:rhythm-preferences",{detail:{goalId,slot}}))}
  const dayKey=value=>{const d=new Date(value);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
  const timeBucket=value=>{const hour=new Date(value).getHours();return hour<11?"morning":hour<18?"now":"evening"};
  function buildInsights(state,areas,now=Date.now()){
    const cutoff=now-7*DAY,goals=new Map((state?.goals||[]).map(goal=>[goal.id,goal])),events=(state?.events||[]).filter(event=>event.type!=="rest"&&Number(event.occurredAt)>=cutoff&&Number(event.occurredAt)<=now),activeDays=new Set(events.map(event=>dayKey(event.occurredAt))).size;
    const areaCounts=Object.fromEntries(areas.map(area=>[area.id,0])),timeCounts={morning:0,now:0,evening:0};
    for(const event of events){const areaId=goals.get(event.goalId)?.areaId;if(areaId in areaCounts)areaCounts[areaId]+=1;timeCounts[timeBucket(event.occurredAt)]+=1}
    const topArea=areas.map(area=>({...area,count:areaCounts[area.id]||0})).sort((a,b)=>b.count-a.count)[0],timeLabels={morning:"아침",now:"낮과 오후",evening:"저녁"},topTime=Object.entries(timeCounts).sort((a,b)=>b[1]-a[1])[0];
    return{stage:activeDays>=7?"seven":activeDays>=3?"three":"building",activeDays,total:events.length,needed:Math.max(0,3-activeDays),topArea,topTime:{id:topTime[0],label:timeLabels[topTime[0]],count:topTime[1]},areaCounts,timeCounts};
  }
  function enhanceRhythm(app){
    document.querySelectorAll("#serviceRhythmBoard .service-rhythm-item").forEach(item=>{if(item.querySelector(".service-rhythm-edit"))return;const goalId=item.dataset.goal,lane=item.closest("[data-rhythm-slot]")?.dataset.rhythmSlot||"now",edit=document.createElement("div");edit.className="service-rhythm-edit";edit.innerHTML=`<select aria-label="행동 시간대 바꾸기"><option value="morning">아침에 하기</option><option value="now">낮·오후에 하기</option><option value="evening">저녁에 하기</option></select><button type="button">오늘 숨기기</button>`;const select=edit.querySelector("select");select.value=getSlotOverride(goalId)||lane;select.addEventListener("change",()=>setSlotOverride(goalId,select.value));edit.querySelector("button").addEventListener("click",()=>app.store.hideGoalToday(goalId));item.append(edit)});
  }
  function renderInsights(app){
    const body=document.querySelector("#serviceInsightBody"),evidence=document.querySelector("#serviceInsightEvidence");if(!body)return;const state=app.store.getState(),model=buildInsights(state,app.store.constants.areas);if(evidence)evidence.textContent=model.total?`최근 7일 · ${model.activeDays}일 · ${model.total}번`:"최근 7일 기록 없음";
    if(model.stage==="building"){body.innerHTML=`<div class="service-insight-wait"><div class="service-insight-days">${model.activeDays}<small>/ 3일</small></div><p><b>${model.activeDays?`${model.needed}일만 더 쌓이면 첫 흐름을 알려드려요.`:"첫 기록부터 천천히 시작해요."}</b>${model.total?`지금은 ${model.total}번의 기록을 보관하고 있지만, 성급한 결론은 내리지 않을게요.`:"기록이 없는 날을 나쁨으로 판단하지 않습니다."}</p></div>`;return}
    const cards=[{kicker:"자주 돌본 곳",title:`${model.topArea.icon} ${model.topArea.name}`,copy:`최근 7일 기록 중 ${model.topArea.count}번이 이 영역에 머물렀어요.`},{kicker:"잘 이어진 시간",title:model.topTime.label,copy:`이 시간대에 ${model.topTime.count}번 기록했어요. 다른 시간보다 잘 맞았던 흐름입니다.`}];
    if(model.stage==="seven")cards.push({kicker:"기록한 날",title:`최근 7일 중 ${model.activeDays}일`,copy:"매일 해야 한다는 뜻은 아니에요. 실제로 기록이 있었던 날만 보여드립니다."});
    else cards.push({kicker:"다음 확인",title:"7일이 되면 더 선명해져요",copy:`기록한 날이 ${7-model.activeDays}일 더 쌓이면 한 주 흐름을 함께 보여드려요.`});
    body.innerHTML=`<div class="service-insight-grid">${cards.map(card=>`<article class="service-insight-card"><span>${card.kicker}</span><b>${card.title}</b><small>${card.copy}</small></article>`).join("")}</div><button id="serviceInsightFocus" class="service-insight-focus" type="button" data-area="${model.topArea.id}">이 흐름으로 오늘 시작</button><p class="service-insight-note">최근 7일의 내 기기 기록만 사용했으며, 기록이 없는 날을 추측하지 않습니다.</p>`;
    body.querySelector("#serviceInsightFocus")?.addEventListener("click",()=>{const goal=state.goals.find(item=>item.status==="active"&&item.areaId===model.topArea.id)||state.goals.find(item=>item.status==="active");document.querySelector("#serviceRhythmSection")?.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"center"});if(goal)setTimeout(()=>document.querySelector(`[data-rhythm-record="${CSS.escape(goal.id)}"]`)?.focus(),250)});
  }
  const api={version:VERSION,prefKey:PREF_KEY,getSlotOverride,setSlotOverride,buildInsights};window.__WEDOIT_V263__=api;
  let tries=0;const timer=setInterval(()=>{tries+=1;const app=window.__WEDOIT__;if(!(app?.ready&&app.store)){if(tries>250)clearInterval(timer);return}clearInterval(timer);let queued=false;const render=()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;renderInsights(app);enhanceRhythm(app)})};app.store.subscribe(render);window.addEventListener("wedoit:rhythm-preferences",render);new MutationObserver(()=>queueMicrotask(()=>enhanceRhythm(app))).observe(document.querySelector("#serviceRhythmBoard"),{childList:true,subtree:true});render();document.documentElement.dataset.insightReady="true"},40);
})();
