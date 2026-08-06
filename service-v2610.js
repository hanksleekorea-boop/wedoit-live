(()=>{
  "use strict";
  const VERSION="v26.1.0";
  const pages=new Set(["today","goals","together","insights","me"]);
  const root=document.documentElement;
  const all=(selector)=>[...document.querySelectorAll(selector)];
  const navIcons={
    today:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.5 12 5l8 6.5v7a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z"/><path d="M9.5 20v-5.5h5V20"/></svg>',
    goals:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><path d="m15.5 8.5 4-4M16.5 4.5h3v3"/></svg>',
    together:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3.5 19c.4-4 2.2-6 5.5-6s5.1 2 5.5 6M14 14c3.6-.8 5.8.8 6.5 4"/></svg>',
    insights:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V9M10 19V5M16 19v-7M22 19V3"/><path d="M2 19.5h21"/></svg>',
    me:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4.5 20c.7-4.3 3.2-6.5 7.5-6.5s6.8 2.2 7.5 6.5"/></svg>'
  };
  const areaIcons=[
    '<svg viewBox="0 0 24 24"><path d="M4 13h3l2-5 3.2 10 2.4-6H20"/><path d="M5.5 5.5A4.4 4.4 0 0 1 12 6a4.4 4.4 0 0 1 6.5-.5c2.2 2.2 1.8 5.4-.2 7.7L12 20l-6.3-6.8c-2-2.3-2.4-5.5-.2-7.7Z"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M5 19c6.5 0 12-4.8 14-14-8.2 1.2-13 5.8-14 14Z"/><path d="M5 19c3-3.8 6-6.3 10.5-9"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M4 5.5c3.3-.7 5.9 0 8 2v12c-2.1-2-4.7-2.7-8-2zM20 5.5c-3.3-.7-5.9 0-8 2v12c2.1-2 4.7-2.7 8-2z"/></svg>',
    '<svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="12" rx="2"/><path d="M8 7V5h8v2M3 12h18M10 12v2h4v-2"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M12 20 5.7 13.2c-2-2.3-2.4-5.5-.2-7.7A4.4 4.4 0 0 1 12 6a4.4 4.4 0 0 1 6.5-.5c2.2 2.2 1.8 5.4-.2 7.7Z"/></svg>',
    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v10M9 9.2c.8-.8 1.8-1.2 3-1.2 1.7 0 3 1 3 2.3 0 1.4-1.2 2-3 2.4s-3 1-3 2.4c0 1.3 1.3 2.3 3 2.3 1.2 0 2.3-.4 3-1.2"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="m3.5 11 8.5-7 8.5 7v8.5h-17z"/><path d="M9 19.5v-6h6v6"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="m12 3 1.3 4.4L17 9l-3.7 1.6L12 15l-1.3-4.4L7 9l3.7-1.6ZM18.5 14l.8 2.7L22 18l-2.7 1.3-.8 2.7-.8-2.7L15 18l2.7-1.3Z"/></svg>'
  ];
  function installNavIcons(){
    all('.service-rail-nav [data-service-nav],.nav [data-service-nav]').forEach(button=>{
      const slot=button.querySelector('span'),icon=navIcons[button.dataset.serviceNav];
      if(slot&&icon)slot.innerHTML=icon;
    });
  }
  function upgradeAreaIcons(){
    all('#areaGrid .area-icon').forEach((slot,index)=>{if(!slot.dataset.serviceIcon&&areaIcons[index]){slot.dataset.serviceIcon='true';slot.innerHTML=areaIcons[index]}});
    all('#pcPortfolio>div').forEach((card,index)=>{const label=card.querySelector('b');if(!label||label.dataset.serviceIcon||!areaIcons[index])return;const count=(label.textContent.match(/\d+/)||['0'])[0];label.dataset.serviceIcon='true';label.innerHTML=`${areaIcons[index]}<em>${count}</em>`});
  }
  const starterSpecs={
    water:{name:"물 한 잔",area:"health",archetype:"repeat",metric:"check",target:1,period:"day",icon:"💧",message:"물 한 잔을 오늘의 첫 걸음으로 기록했어요."},
    breathe:{name:"깊은 숨 3번",area:"mind",archetype:"recover",metric:"check",target:1,period:"day",icon:"🌿",message:"깊은 숨 3번을 오늘의 첫 걸음으로 기록했어요."},
    hello:{name:"안부 한 번",area:"relationship",archetype:"repeat",metric:"check",target:1,period:"day",icon:"💛",message:"안부 한 번을 오늘의 첫 걸음으로 기록했어요."}
  };
  let current="today",mounted=false;
  function setPage(page,{focus=true}={}){
    current=pages.has(page)?page:"today";
    root.dataset.servicePage=current;
    all("[data-service-nav]").forEach(button=>{
      const active=button.dataset.serviceNav===current;
      button.classList.toggle("on",active);
      active?button.setAttribute("aria-current","page"):button.removeAttribute("aria-current");
    });
    const labels={today:"오늘",goals:"목표",together:"함께",insights:"통찰",me:"나"};
    document.title=`위두잇 — ${labels[current]}`;
    if(focus){window.scrollTo({top:0,behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});document.querySelector("main")?.focus?.({preventScroll:true})}
    window.dispatchEvent(new CustomEvent("wedoit:service-page",{detail:{page:current}}));
  }
  function todayKey(value){const d=new Date(value);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
  function refineCopy(){
    const replacements=[
      [/\brepeat\b/g,"반복"],[/\bbuild\b/g,"쌓기"],[/\breduce\b/g,"줄이기"],[/\bmaintain\b/g,"유지"],[/\brecover\b/g,"회복"],[/\bexplore\b/g,"탐색"],[/\bcheck\b/g,"완료"],[/\bcount\b/g,"횟수"],[/\bminutes\b/g,"시간"],[/\breflection\b/g,"짧은 기록"],[/ · 계약 v\d+/g,""],
      [/기기 안에서 함께방을 만들어 볼 수 있어요/g,"작은 모임을 만들어 함께 걸어갈 수 있어요"],[/실제 사람이나 서버와 연결되지 않습니다\. 이름·공개범위·안전 흐름을 먼저 시험합니다\./g,"지금은 이 기기에서 모임 모습을 먼저 만들며, 밖으로 전송하지 않습니다."],[/로컬 함께방 만들기/g,"작은 모임 만들기"],[/이 화면의 사람·글·순위는 모두 이 기기의 시험 데이터입니다\. 실제 초대·신고 전송·서버 랭킹이 아닙니다\./g,"현재 모임 정보는 이 기기에만 저장됩니다. 실제 초대와 공유는 연결 후 사용할 수 있어요."],[/이 글 신고 시험/g,"이 글 신고 준비"],[/로컬 프로필 계약 저장/g,"이 기기에 이름 저장"],[/삭제 요청 계약 확인/g,"삭제 요청 준비 확인"]
    ];
    const targets=[document.querySelector("#goalCards"),document.querySelector("#circleLabCard"),document.querySelector("#identityCard")].filter(Boolean);
    for(const target of targets){const walker=document.createTreeWalker(target,NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode()){let next=node.nodeValue;for(const[pair,value]of replacements)next=next.replace(pair,value);if(next!==node.nodeValue)node.nodeValue=next}}
  }
  function render(){
    const app=window.__WEDOIT__,state=app?.store?.getState?.();
    if(!state)return;
    const active=state.goals.filter(goal=>goal.status==="active");
    const today=todayKey(Date.now());
    const actions=state.events.filter(event=>todayKey(event.occurredAt)===today&&event.type!=="rest");
    const progressed=new Set(active.filter(goal=>app.store.progress(goal.id).value>0).map(goal=>goal.areaId));
    const hour=new Date().getHours(),greeting=hour<12?"좋은 아침이에요.":hour<18?"오늘도 반가워요.":"오늘 하루도 수고했어요.";
    const hero=document.querySelector("#pcHero"),title=document.querySelector("#todayTitle"),summary=document.querySelector("#todaySummary");
    hero?.classList.toggle("has-goals",active.length>0);
    if(title)title.innerHTML=active.length?`${greeting}<br>기록은 한 번에.`:"오늘의 첫 루틴을<br>가볍게 골라보세요.";
    if(summary)summary.textContent=active.length?`목표 ${active.length}개를 한곳에서 보고 오늘 ${actions.length}번 기록했어요. 지금 가능한 하나만 이어가세요.`:"30초면 충분해요. 추천 행동을 누르면 목표 생성과 오늘 기록이 한 번에 끝납니다.";
    const start=document.querySelector("#startAction"),open=document.querySelector("#openGoal");
    if(start){start.hidden=!active.length;start.textContent=active.length?"선택 목표 기록하기":"내 목표 둘러보기"}
    if(open)open.textContent=active.length?"새 목표 추가":"새 목표 직접 만들기";
    const orbit=document.querySelector("#serviceOrbitValue");
    if(orbit)orbit.innerHTML=actions.length?`오늘<br>${actions.length}회`:"첫<br>한 걸음";
    all(".service-orbit-ring [data-area]").forEach(dot=>dot.classList.toggle("active",progressed.has(dot.dataset.area)));
    const date=new Intl.DateTimeFormat("ko-KR",{month:"long",day:"numeric",weekday:"long"}).format(new Date());
    const topDate=document.querySelector("#serviceTopDate");if(topDate)topDate.textContent=date;
    refineCopy();upgradeAreaIcons();
  }
  function recordStarter(key,button){
    const app=window.__WEDOIT__,spec=starterSpecs[key];
    if(!app?.ready||!app.store||!spec){button.disabled=false;return}
    const state=app.store.getState();
    let goal=state.goals.find(item=>item.status==="active"&&item.name===spec.name);
    if(!goal)goal=app.store.addGoal(spec);
    app.store.record(goal.id,1,"service-quick-start");
    const celebration=document.querySelector("#serviceCelebration");
    if(celebration){celebration.textContent=`✓ ${spec.message}`;celebration.hidden=false}
    button.textContent="오늘 1회 기록됨";button.disabled=true;button.dataset.done="true";
    render();
  }
  installNavIcons();
  all("[data-service-nav]").forEach(button=>button.addEventListener("click",()=>setPage(button.dataset.serviceNav)));
  all("[data-service-starter]").forEach(button=>button.addEventListener("click",()=>{button.disabled=true;const key=button.dataset.serviceStarter;if(window.__WEDOIT__?.ready)recordStarter(key,button);else{let tries=0;const timer=setInterval(()=>{tries+=1;if(window.__WEDOIT__?.ready||tries>100){clearInterval(timer);recordStarter(key,button)}},40)}}));
  setPage("today",{focus:false});
  const timer=setInterval(()=>{
    const app=window.__WEDOIT__;
    if(mounted||!app?.ready||!app.store)return;
    mounted=true;clearInterval(timer);app.store.subscribe(()=>queueMicrotask(render));render();
    const observer=new MutationObserver(()=>queueMicrotask(refineCopy));
    ["#goalCards","#circleLabCard","#identityCard"].map(selector=>document.querySelector(selector)).filter(Boolean).forEach(target=>observer.observe(target,{childList:true,subtree:true}));
    const iconObserver=new MutationObserver(()=>queueMicrotask(upgradeAreaIcons));
    ["#areaGrid","#pcPortfolio"].map(selector=>document.querySelector(selector)).filter(Boolean).forEach(target=>iconObserver.observe(target,{childList:true,subtree:true}));
    upgradeAreaIcons();
    root.dataset.serviceReady="true";
  },40);
  window.__WEDOIT_SERVICE__={version:VERSION,setPage,get page(){return current},starterSpecs:Object.keys(starterSpecs)};
})();
