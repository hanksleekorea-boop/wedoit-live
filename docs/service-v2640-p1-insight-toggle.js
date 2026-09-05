(()=>{
  "use strict";
  const VERSION="v26.4.0-p1-insight-toggle",KEY="wedoit.v264.insight-sentences";
  const read=()=>{try{const value=JSON.parse(localStorage.getItem(KEY)||"{}");return{showSentences:value?.showSentences!==false}}catch(_){return{showSentences:true}}};
  const write=value=>{try{localStorage.setItem(KEY,JSON.stringify({showSentences:!!value.showSentences}));return true}catch(_){return false}};
  const copy=()=>document.documentElement.lang==="en"?{shown:"The explanation sentences are shown.",hidden:"Only the recent-record numbers are shown. No records were changed.",show:"Show sentences",hide:"Hide sentences",failed:"This device could not save the display choice."}:{shown:"통찰 설명 문장을 보여주고 있습니다.",hidden:"최근 기록 숫자만 보입니다. 기록은 바뀌지 않았습니다.",show:"문장 표시",hide:"문장 숨기기",failed:"이 기기에 표시 선택을 저장하지 못했습니다."};
  function mount(app){
    const section=document.querySelector("#serviceInsightSection"),body=document.querySelector("#serviceInsightBody"),head=section?.querySelector(".section-head");if(!section||!body||!head)return false;
    let prefs=read(),queued=false;
    const apply=()=>{const reasons=document.querySelector("#serviceInsightReasons"),visible=prefs.showSentences;body.hidden=!visible;if(reasons)reasons.hidden=!visible;section.dataset.insightSentences=visible?"shown":"hidden";document.documentElement.dataset.p1InsightToggleReady="true"};
    const render=()=>{const t=copy();let root=document.querySelector("#serviceInsightToggle");if(!root){root=document.createElement("div");root.id="serviceInsightToggle";root.className="service-insight-toggle";root.setAttribute("role","status");root.setAttribute("aria-live","polite");head.insertAdjacentElement("afterend",root)}const visible=prefs.showSentences;root.innerHTML=`<p>${visible?t.shown:t.hidden}</p><button id="serviceInsightToggleButton" type="button" aria-pressed="${visible}">${visible?t.hide:t.show}</button>`;root.querySelector("button").addEventListener("click",()=>{prefs.showSentences=!prefs.showSentences;const saved=write(prefs);apply();render();if(!saved)root.querySelector("p").textContent=t.failed;window.dispatchEvent(new CustomEvent("wedoit:insight-sentences",{detail:{showSentences:prefs.showSentences}}))});apply()};
    window.addEventListener("wedoit:languagechange",render);app.store.subscribe(()=>queueMicrotask(apply));new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;apply()})}).observe(section,{childList:true,subtree:true});render();return true;
  }
  let tries=0;const timer=setInterval(()=>{tries+=1;const app=window.__WEDOIT__;if(app?.ready&&app.store&&mount(app))clearInterval(timer);else if(tries>250)clearInterval(timer)},40);window.__WEDOIT_V264_P1_INSIGHT_TOGGLE__={version:VERSION,prefKey:KEY,read};
})();
