(()=>{
  "use strict";
  const VERSION="v27.0.0-pc";
  const WIDTH_KEY="wedoit.v270.pc-panel-width";
  const HIDDEN_KEY="wedoit.v270.pc-hidden-records";
  const NOTES_KEY="wedoit.v264.record-notes";
  const MAX_RENDERED=200;
  const SEARCH_DELAY=100;
  const mq=matchMedia("(min-width:1024px)");
  const escape=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const readJson=(key,fallback)=>{try{const value=JSON.parse(localStorage.getItem(key)||"null");return value??fallback}catch(_){return fallback}};
  const writeJson=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch(_){return false}};
  const dayKey=value=>{const date=new Date(value);return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`};
  const normalize=value=>String(value||"").normalize("NFKC").toLocaleLowerCase().trim();
  const formatDate=value=>new Intl.DateTimeFormat(document.documentElement.lang==="en"?"en-US":"ko-KR",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date(value));
  const startOfWeek=value=>{const date=new Date(value);date.setHours(0,0,0,0);date.setDate(date.getDate()-((date.getDay()+6)%7));return date.getTime()};
  const readNotes=()=>{const value=readJson(NOTES_KEY,{});return value&&typeof value==="object"&&!Array.isArray(value)?value:{}};
  const toRecords=(state,notes=readNotes())=>{
    const goals=new Map((state?.goals||[]).map(goal=>[goal.id,goal]));
    return (state?.events||[]).filter(event=>event.type!=="rest").map(event=>{
      const goal=goals.get(event.goalId),note=String(notes[event.id]?.note||"").slice(0,140),date=dayKey(event.occurredAt);
      return Object.freeze({id:String(event.id),goalId:String(event.goalId||""),title:String(goal?.name||event.type||"기록"),note,date,occurredAt:Number(event.occurredAt)||0,value:Number(event.value)||0,source:String(event.source||"")});
    }).sort((a,b)=>b.occurredAt-a.occurredAt);
  };
  const filterRecords=(records,query,hiddenIds=new Set(),includeHidden=false)=>{
    const needle=normalize(query);
    return records.filter(record=>(includeHidden||!hiddenIds.has(record.id))&&(!needle||normalize(`${record.title} ${record.note} ${record.date}`).includes(needle)));
  };
  const exportSelection=(records,selectedIds,now=()=>new Date())=>{
    const picked=records.filter(record=>selectedIds.has(record.id)).map(record=>({id:record.id,goalId:record.goalId,title:record.title,note:record.note,date:record.date,occurredAt:record.occurredAt,value:record.value,source:record.source}));
    return Object.freeze({format:"wedoit.pc-record-selection",formatVersion:1,generatedAt:now().toISOString(),count:picked.length,records:picked});
  };
  const copy=()=>document.documentElement.lang==="en"?{
    kicker:"Desktop workspace",title:"Review and organize records",intro:"Search, select, export, or hide records without changing the original history.",today:"Today",week:"This week",records:"records",active:"active goals",panel:"Records panel width",narrow:"Narrow",wide:"Wide",search:"Search title, note, or date",placeholder:"Try a goal, note, or 2026-08-25",selectAll:"Select all results",found:n=>`${n} results`,selected:n=>`${n} selected`,limited:n=>`Showing the newest ${n}. Search and select-all still cover every matching record.`,empty:"No matching visible records.",export:"Export selected",hide:"Hide selected here",show:"Show hidden",deletePreview:"Open deletion preview",help:"Keyboard help",exported:n=>`Prepared ${n} selected records as JSON. Originals were not changed.`,hidden:n=>`Hid ${n} records only in this desktop list. Originals remain.`,restored:"All hidden records are visible again.",failed:"This browser could not save the desktop preference.",none:"Select at least one record first."
  }:{
    kicker:"PC 정리 작업",title:"기록을 빠르게 찾고 정리하기",intro:"제목·메모·날짜로 찾고, 원본을 바꾸지 않은 채 선택 내보내기나 이 화면에서 숨기기를 할 수 있어요.",today:"오늘",week:"이번 주",records:"기록",active:"진행 목표",panel:"기록 패널 너비",narrow:"좁게",wide:"넓게",search:"제목·메모·날짜 검색",placeholder:"목표, 메모 또는 2026-08-25",selectAll:"검색 결과 모두 선택",found:n=>`결과 ${n}개`,selected:n=>`선택 ${n}개`,limited:n=>`최신 ${n}개만 화면에 표시합니다. 검색과 전체 선택은 일치한 모든 기록에 적용됩니다.`,empty:"조건에 맞는 보이는 기록이 없습니다.",export:"선택 JSON 내보내기",hide:"이 화면에서 선택 숨기기",show:"숨긴 기록 다시 보기",deletePreview:"삭제 범위 미리보기 열기",help:"단축키 도움말",exported:n=>`선택 기록 ${n}개를 JSON으로 준비했어요. 원본은 바뀌지 않았습니다.`,hidden:n=>`${n}개를 PC 목록에서만 숨겼어요. 원본 기록은 남아 있습니다.`,restored:"숨긴 기록을 모두 다시 표시했어요.",failed:"이 브라우저에 PC 설정을 저장하지 못했습니다.",none:"먼저 기록을 하나 이상 선택해 주세요."
  };
  function mount(app){
    if(!mq.matches||document.querySelector("#v270PcWorkspace"))return false;
    const host=document.querySelector("main.app"),anchor=document.querySelector("#pcDeskHome")||document.querySelector("#pcHero");
    if(!host||!anchor)return false;
    const root=document.createElement("section");root.id="v270PcWorkspace";root.className="v270-pc-workspace";root.dataset.serviceView="today goals me";root.setAttribute("aria-labelledby","v270PcTitle");
    root.innerHTML=`<div class="v270-pc-summary"><header><span class="service-section-kicker" id="v270PcKicker"></span><h2 id="v270PcTitle"></h2><p id="v270PcIntro"></p></header><div class="v270-pc-summary-grid"><article class="v270-pc-metric"><span id="v270PcTodayLabel"></span><strong id="v270PcTodayCount">0</strong><span id="v270PcTodayMeta"></span></article><article class="v270-pc-metric"><span id="v270PcWeekLabel"></span><strong id="v270PcWeekCount">0</strong><span id="v270PcWeekMeta"></span></article></div><label class="v270-pc-resize" for="v270PcWidth"><span id="v270PcNarrow"></span><input id="v270PcWidth" type="range" min="360" max="640" step="20"><span id="v270PcWide"></span></label></div><div class="v270-pc-records"><div class="v270-pc-toolbar"><label class="v270-pc-search" for="v270PcSearch"><span id="v270PcSearchLabel"></span><input id="v270PcSearch" type="search" autocomplete="off"></label><label class="v270-pc-select-all"><input id="v270PcSelectAll" type="checkbox"><span id="v270PcSelectAllLabel"></span></label></div><div class="v270-pc-result-head"><p id="v270PcResultCount" aria-live="polite"></p><p id="v270PcSelectedCount"></p></div><div id="v270PcList" class="v270-pc-list"></div><p id="v270PcLimit" class="v270-pc-muted"></p><div class="v270-pc-actions"><button id="v270PcExport" class="v270-pc-primary" type="button"></button><button id="v270PcHide" type="button"></button><button id="v270PcShowHidden" type="button"></button><button id="v270PcDeletePreview" type="button"></button><button id="v270PcHelp" type="button"></button></div><p id="v270PcStatus" class="v270-pc-status" role="status" aria-live="polite"></p></div>`;
    anchor.insertAdjacentElement("afterend",root);
    let query="",selected=new Set(),status="",timer=null,lastFilterMs=0,lastResultCount=0;
    const hidden=()=>new Set(readJson(HIDDEN_KEY,[]).map(String));
    const setWidth=value=>{const width=Math.max(360,Math.min(640,Number(value)||420));root.style.setProperty("--v270-pc-side",`${width}px`);root.querySelector("#v270PcWidth").value=String(width);return width};
    setWidth(readJson(WIDTH_KEY,420));
    const render=()=>{
      const t=copy(),state=app.store.getState(),records=toRecords(state),hiddenIds=hidden(),started=performance.now(),matches=filterRecords(records,query,hiddenIds),elapsed=performance.now()-started,visible=matches.slice(0,MAX_RENDERED),today=dayKey(Date.now()),week=startOfWeek(Date.now());
      lastFilterMs=elapsed;lastResultCount=matches.length;selected=new Set([...selected].filter(id=>matches.some(record=>record.id===id)));
      root.querySelector("#v270PcKicker").textContent=t.kicker;root.querySelector("#v270PcTitle").textContent=t.title;root.querySelector("#v270PcIntro").textContent=t.intro;
      root.querySelector("#v270PcTodayLabel").textContent=t.today;root.querySelector("#v270PcTodayCount").textContent=String(records.filter(record=>record.date===today).length);root.querySelector("#v270PcTodayMeta").textContent=`${state.goals.filter(goal=>goal.status==="active").length} ${t.active}`;
      root.querySelector("#v270PcWeekLabel").textContent=t.week;root.querySelector("#v270PcWeekCount").textContent=String(records.filter(record=>record.occurredAt>=week).length);root.querySelector("#v270PcWeekMeta").textContent=`${records.length} ${t.records}`;
      root.querySelector("#v270PcNarrow").textContent=t.narrow;root.querySelector("#v270PcWide").textContent=t.wide;root.querySelector("#v270PcWidth").setAttribute("aria-label",t.panel);
      root.querySelector("#v270PcSearchLabel").textContent=t.search;root.querySelector("#v270PcSearch").placeholder=t.placeholder;root.querySelector("#v270PcSelectAllLabel").textContent=t.selectAll;
      root.querySelector("#v270PcResultCount").textContent=t.found(matches.length);root.querySelector("#v270PcSelectedCount").textContent=t.selected(selected.size);root.querySelector("#v270PcLimit").textContent=matches.length>MAX_RENDERED?t.limited(MAX_RENDERED):"";
      root.querySelector("#v270PcList").innerHTML=visible.length?visible.map(record=>`<label class="v270-pc-row"><input type="checkbox" data-record-id="${escape(record.id)}" ${selected.has(record.id)?"checked":""}><span class="v270-pc-row-copy"><b>${escape(record.title)}</b><span>${escape(record.note||record.source||t.records)}</span></span><time datetime="${escape(record.date)}">${escape(formatDate(record.occurredAt))}</time></label>`).join(""):`<p class="v270-pc-empty">${escape(t.empty)}</p>`;
      const all=matches.length>0&&matches.every(record=>selected.has(record.id)),some=matches.some(record=>selected.has(record.id));const selectAll=root.querySelector("#v270PcSelectAll");selectAll.checked=all;selectAll.indeterminate=!all&&some;
      root.querySelector("#v270PcExport").textContent=t.export;root.querySelector("#v270PcHide").textContent=t.hide;root.querySelector("#v270PcShowHidden").textContent=`${t.show}${hiddenIds.size?` (${hiddenIds.size})`:""}`;root.querySelector("#v270PcDeletePreview").textContent=t.deletePreview;root.querySelector("#v270PcHelp").textContent=t.help;
      root.querySelector("#v270PcExport").disabled=!selected.size;root.querySelector("#v270PcHide").disabled=!selected.size;root.querySelector("#v270PcShowHidden").disabled=!hiddenIds.size;root.querySelector("#v270PcStatus").textContent=status;
      root.dataset.resultCount=String(matches.length);root.dataset.selectedCount=String(selected.size);root.dataset.filterMs=elapsed.toFixed(3);
    };
    const schedule=()=>{clearTimeout(timer);timer=setTimeout(render,SEARCH_DELAY)};
    root.querySelector("#v270PcSearch").addEventListener("input",event=>{query=event.target.value;schedule()});
    root.querySelector("#v270PcList").addEventListener("change",event=>{const input=event.target.closest("[data-record-id]");if(!input)return;input.checked?selected.add(input.dataset.recordId):selected.delete(input.dataset.recordId);render()});
    root.querySelector("#v270PcSelectAll").addEventListener("change",event=>{const matches=filterRecords(toRecords(app.store.getState()),query,hidden());if(event.target.checked)matches.forEach(record=>selected.add(record.id));else matches.forEach(record=>selected.delete(record.id));render()});
    root.querySelector("#v270PcWidth").addEventListener("input",event=>{const width=setWidth(event.target.value);if(!writeJson(WIDTH_KEY,width))status=copy().failed;render()});
    root.querySelector("#v270PcExport").addEventListener("click",()=>{const t=copy();if(!selected.size){status=t.none;return render()}const payload=exportSelection(toRecords(app.store.getState()),selected),text=JSON.stringify(payload,null,2),blob=new Blob([text],{type:"application/json"}),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=`wedoit-selected-records-${new Date().toISOString().slice(0,10)}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status=t.exported(payload.count);render()});
    root.querySelector("#v270PcHide").addEventListener("click",()=>{const t=copy();if(!selected.size){status=t.none;return render()}const next=new Set([...hidden(),...selected]),count=selected.size;selected.clear();status=writeJson(HIDDEN_KEY,[...next])?t.hidden(count):t.failed;render()});
    root.querySelector("#v270PcShowHidden").addEventListener("click",()=>{status=writeJson(HIDDEN_KEY,[])?copy().restored:copy().failed;render()});
    root.querySelector("#v270PcDeletePreview").addEventListener("click",()=>{document.querySelector('[data-service-nav="me"]')?.click();let tries=0;const wait=setInterval(()=>{tries+=1;const section=document.querySelector("#serviceDeleteSection");if(section){clearInterval(wait);section.scrollIntoView({block:"center"});section.querySelector("#serviceDeletePreview")?.focus()}else if(tries>100)clearInterval(wait)},50)});
    root.querySelector("#v270PcHelp").addEventListener("click",()=>document.querySelector("#pcShortcutHelp")?.click());
    document.addEventListener("keydown",event=>{if(!mq.matches||event.altKey||event.ctrlKey||event.metaKey||event.target.closest("input,textarea,select,[contenteditable=true]"))return;if(event.key==="/"){event.preventDefault();root.querySelector("#v270PcSearch").focus()}});
    app.store.subscribe(()=>queueMicrotask(render));window.addEventListener("wedoit:languagechange",render);render();
    Object.defineProperties(window.__WEDOIT_V270_PC__,{lastFilterMs:{get:()=>lastFilterMs},lastResultCount:{get:()=>lastResultCount}});
    document.documentElement.dataset.v270PcReady="true";return true;
  }
  const api={version:VERSION,widthKey:WIDTH_KEY,hiddenKey:HIDDEN_KEY,maxRendered:MAX_RENDERED,searchDelay:SEARCH_DELAY,toRecords,filterRecords,exportSelection};
  Object.defineProperty(window,"__WEDOIT_V270_PC__",{configurable:false,enumerable:false,writable:false,value:api});
  let tries=0;const boot=setInterval(()=>{tries+=1;const app=window.__WEDOIT__;if(app?.ready&&app.store&&mq.matches&&mount(app)||tries>250)clearInterval(boot)},40);
  mq.addEventListener?.("change",()=>{if(mq.matches)mount(window.__WEDOIT__)});
})();
