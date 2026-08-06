(()=>{
  "use strict";
  const VERSION="v26.2.0",DAY=86400000,WINDOW_DAYS=14,MAX_ACTIONS=5,RETURN_DAYS=3;
  const slots=[{id:"morning",label:"아침",hint:"하루를 여는 때"},{id:"now",label:"지금",hint:"바로 하기 좋은 때"},{id:"evening",label:"저녁",hint:"하루를 닫는 때"}];
  const escapeHtml=value=>String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
  const dayKey=value=>{const d=new Date(value);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
  function currentSlot(hour=new Date().getHours()){return hour<11?"morning":hour<18?"now":"evening"}
  function slotForGoal(goal,index=0){
    const text=`${goal?.name||""} ${goal?.archetype||""}`;
    if(/아침|기상|물|스트레칭|출근/.test(text))return"morning";
    if(/저녁|자기 전|잠|회고|정리|소비/.test(text))return"evening";
    return["now","morning","evening"][Math.abs(Number(goal?.priority??index))%3];
  }
  function daysSince(value,now=Date.now()){if(!Number.isFinite(Number(value)))return null;const start=new Date(Number(value));start.setHours(0,0,0,0);const end=new Date(now);end.setHours(0,0,0,0);return Math.max(0,Math.floor((end-start)/DAY))}
  function buildOrbit(state,areas,now=Date.now()){
    const goals=new Map((state?.goals||[]).map(goal=>[goal.id,goal]));
    const cutoff=now-WINDOW_DAYS*DAY;
    const events=(state?.events||[]).filter(event=>event.type!=="rest"&&Number(event.occurredAt)>=cutoff&&Number(event.occurredAt)<=now);
    const counts=Object.fromEntries(areas.map(area=>[area.id,0]));
    for(const event of events){const areaId=goals.get(event.goalId)?.areaId;if(areaId in counts)counts[areaId]+=1}
    const activeDays=new Set(events.map(event=>dayKey(event.occurredAt))).size,total=events.length;
    const reveal=activeDays>=3?8:activeDays>=1?Math.min(5,Math.max(3,Object.values(counts).filter(Boolean).length+2)):3;
    const ranked=areas.map((area,index)=>({...area,count:counts[area.id]||0,index})).sort((a,b)=>b.count-a.count||a.index-b.index);
    const suggestions=["health","mind","relationship","growth","life","experience","work","finance"];
    const visible=[];
    for(const item of ranked.filter(item=>item.count>0))if(visible.length<reveal)visible.push(item);
    for(const id of suggestions){const item=ranked.find(entry=>entry.id===id);if(item&&!visible.some(entry=>entry.id===id)&&visible.length<reveal)visible.push(item)}
    if(activeDays>=3)return{total,activeDays,reveal:8,items:areas.map(area=>({...area,count:counts[area.id]||0,share:total?Math.round((counts[area.id]||0)/total*100):0}))};
    return{total,activeDays,reveal,items:visible.map(item=>({...item,share:total?Math.round(item.count/total*100):0}))};
  }
  function renderRhythm(app,state){
    const board=document.querySelector("#serviceRhythmBoard");if(!board)return;
    const hidden=new Set(state.dashboardPrefs?.hiddenGoalIds||[]);
    const goals=state.goals.filter(goal=>goal.status==="active"&&!hidden.has(goal.id)).sort((a,b)=>a.priority-b.priority).slice(0,MAX_ACTIONS);
    const now=currentSlot(),today=dayKey(Date.now());
    board.innerHTML=slots.map(slot=>{
      const list=goals.map((goal,index)=>({goal,slot:window.__WEDOIT_V263__?.getSlotOverride?.(goal.id)||slotForGoal(goal,index)})).filter(item=>item.slot===slot.id);
      return`<article class="service-rhythm-lane${slot.id===now?" is-now":""}" data-rhythm-slot="${slot.id}"><div class="service-rhythm-label"><b>${slot.label}</b>${slot.id===now?"<em>지금</em>":""}<span>${slot.hint}</span></div><div class="service-rhythm-items">${list.length?list.map(({goal})=>{const progress=app.store.progress(goal.id),done=progress.value>0;return`<div class="service-rhythm-item" data-goal="${escapeHtml(goal.id)}"><div class="service-rhythm-item-copy"><b>${escapeHtml(goal.icon||"🎯")} ${escapeHtml(goal.name)}</b><span>${done?`오늘 ${progress.value}${goal.measurementContract?.unit||"회"} 기록`:`오늘 첫 기록을 기다려요`}</span></div><button class="service-rhythm-record${done?" is-done":""}" type="button" data-rhythm-record="${escapeHtml(goal.id)}" aria-label="${escapeHtml(goal.name)} 기록">${done?"+ 한 번":"기록"}</button></div>`}).join(""):`<p class="service-rhythm-empty">${goals.length?"이 시간대는 비워 두었어요.":"목표를 만들면 여기에 놓아드려요."}</p>`}</div></article>`
    }).join("");
    board.dataset.actionCount=String(goals.length);board.dataset.today=today;
    const count=document.querySelector("#serviceRhythmCount");if(count)count.textContent=goals.length?`${goals.length}/${MAX_ACTIONS}개만 보기`:`최대 ${MAX_ACTIONS}개`;
  }
  function renderOrbit(app,state){
    const grid=document.querySelector("#serviceOrbitGrid"),summary=document.querySelector("#serviceOrbitSummary"),unlock=document.querySelector("#serviceOrbitUnlock");if(!grid)return;
    const model=buildOrbit(state,app.store.constants.areas);
    grid.innerHTML=model.items.map(item=>`<article class="service-orbit-card${item.count?"":" is-quiet"}" role="listitem" style="--share:${item.share}%" data-area="${escapeHtml(item.id)}"><b>${escapeHtml(item.icon)} ${escapeHtml(item.name)}</b><strong>${item.count?`${item.share}%`:"·"}</strong><span>${item.count?`${item.count}번의 관심`:`아직 기록 없음`}</span></article>`).join("");
    if(summary)summary.textContent=model.total?`${model.activeDays}일 동안 ${model.total}번, ${model.items.filter(item=>item.count).length}곳에 관심이 머물렀어요.`:"아직 비어 있어요. 오늘의 작은 행동부터 시작해요.";
    if(unlock)unlock.textContent=model.activeDays===0?"첫 기록 뒤 관심 영역 3곳부터 보여드려요.":model.activeDays<3?`기록한 날이 ${3-model.activeDays}일 더 쌓이면 8개 영역을 모두 펼쳐드려요.`:model.activeDays<7?"8개 영역을 모두 보여드려요. 좋고 나쁨은 매기지 않습니다.":"충분한 흐름이 생겼어요. 많이 돌본 곳과 쉬어 간 곳을 함께 볼 수 있어요.";
    grid.dataset.reveal=String(model.reveal);grid.dataset.activeDays=String(model.activeDays);grid.dataset.total=String(model.total);
  }
  function renderReturn(state){
    const panel=document.querySelector("#serviceReturnPanel");if(!panel)return;
    const actions=state.events.filter(event=>event.type!=="rest");
    const last=actions.length?Math.max(...actions.map(event=>Number(event.occurredAt)||0)):null;
    const away=daysSince(last),show=state.goals.some(goal=>goal.status==="active")&&away!==null&&away>=RETURN_DAYS;
    panel.hidden=!show;panel.dataset.days=show?String(away):"0";
    const title=document.querySelector("#serviceReturnTitle"),copy=document.querySelector("#serviceReturnCopy");
    if(show&&title)title.textContent=`${away}일 만에 다시 오셨네요. 온 것만으로 충분해요.`;
    if(show&&copy)copy.textContent="밀린 기록은 묻지 않을게요. 30초, 작은 목표, 휴식 중 지금 맞는 것을 고르세요.";
  }
  function firstGoal(app){return app.store.getState().goals.filter(goal=>goal.status==="active").sort((a,b)=>a.priority-b.priority)[0]||null}
  function mount(app){
    let scheduled=false;const render=()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;const state=app.store.getState();renderRhythm(app,state);renderOrbit(app,state);renderReturn(state)})};
    document.querySelector("#serviceRhythmBoard")?.addEventListener("click",event=>{const button=event.target.closest("[data-rhythm-record]");if(!button)return;app.store.record(button.dataset.rhythmRecord,1,"rhythm-v2620")});
    document.querySelector("#serviceReturnThirty")?.addEventListener("click",()=>{const goal=firstGoal(app);if(goal){app.store.startTimer(goal.id,"thirty",30);app.store.record(goal.id,1,"return-thirty-v2620")}});
    document.querySelector("#serviceReturnLower")?.addEventListener("click",()=>{const goal=firstGoal(app);if(!goal)return;const contract=goal.measurementContract||{},target=Number(contract.target);app.store.updateGoal(goal.id,{name:goal.name,area:goal.areaId,archetype:goal.archetype,metric:contract.metric,target:Number.isFinite(target)&&target>1?Math.max(1,Math.ceil(target/2)):1,period:contract.period})});
    document.querySelector("#serviceReturnRest")?.addEventListener("click",()=>{const goal=firstGoal(app);if(goal)app.store.setRest(goal.id);document.querySelector("#serviceReturnPanel")?.setAttribute("hidden","")});
    app.store.subscribe(render);window.addEventListener("wedoit:rhythm-preferences",render);render();document.documentElement.dataset.rhythmReady="true";
  }
  let tries=0;const timer=setInterval(()=>{tries+=1;const app=window.__WEDOIT__;if(app?.ready&&app.store){clearInterval(timer);mount(app)}else if(tries>250)clearInterval(timer)},40);
  window.__WEDOIT_V262__={version:VERSION,windowDays:WINDOW_DAYS,maxActions:MAX_ACTIONS,returnDays:RETURN_DAYS,currentSlot,slotForGoal,daysSince,buildOrbit};
})();
