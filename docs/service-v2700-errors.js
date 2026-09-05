(()=>{
  "use strict";
  const VERSION="v27.0.0-errors",MAX_REPORTS=10;
  const reports=[];let host=null;
  const copy=()=>document.documentElement.lang==="en"?{title:"This view needs attention",safe:"Your existing on-device records are still available.",unknown:"Record safety could not be confirmed. Export a backup before closing this page.",next:"Reload this view",generic:"Try the action again. If it repeats, create a backup from Me.",dismiss:"Dismiss"}:{title:"이 화면을 다시 확인해 주세요",safe:"기존 기록은 이 기기에 그대로 있습니다.",unknown:"기록 안전을 확인하지 못했어요. 화면을 닫기 전에 ‘나’에서 백업 파일을 만들어 주세요.",next:"화면 다시 열기",generic:"한 번 더 시도해 주세요. 반복되면 ‘나’에서 백업 파일을 만들어 주세요.",dismiss:"닫기"};
  const ensureHost=()=>{
    if(host?.isConnected)return host;
    const mount=()=>{if(host?.isConnected)return host;const anchor=document.querySelector("#storageStatus")||document.querySelector("main.app");if(!anchor)return null;host=document.createElement("section");host.id="v270ErrorBoundary";host.className="v270-error-boundary";host.hidden=true;host.setAttribute("role","status");host.setAttribute("aria-live","polite");host.innerHTML='<div><b id="v270ErrorTitle"></b><p id="v270ErrorMessage"></p></div><button id="v270ErrorAction" type="button"></button>';anchor.insertAdjacentElement(anchor.id==="storageStatus"?"afterend":"afterbegin",host);host.querySelector("#v270ErrorAction").addEventListener("click",()=>{host.hidden=true;window.dispatchEvent(new CustomEvent("wedoit:v270-retry-view",{detail:{scope:host.dataset.scope||"unknown"}}))});return host};
    if(document.body)return mount();document.addEventListener("DOMContentLoaded",mount,{once:true});return null;
  };
  const scopeLabel=scope=>String(scope||"unknown").replace(/[^a-z0-9._-]/gi,"-").slice(0,40)||"unknown";
  const report=(scope,_error,{recordsSafe=false,nextAction=""}={})=>{
    const item=Object.freeze({code:`WDI-${scopeLabel(scope).toUpperCase()}-${String(reports.length+1).padStart(2,"0")}`,scope:scopeLabel(scope),recordsSafe:Boolean(recordsSafe),at:Date.now()});
    reports.push(item);if(reports.length>MAX_REPORTS)reports.shift();
    const node=ensureHost(),t=copy();if(node){node.dataset.scope=item.scope;node.dataset.recordsSafe=String(item.recordsSafe);node.querySelector("#v270ErrorTitle").textContent=t.title;node.querySelector("#v270ErrorMessage").textContent=`${item.recordsSafe?t.safe:t.unknown} ${String(nextAction||t.generic).slice(0,180)}`;node.querySelector("#v270ErrorAction").textContent=t.next;node.hidden=false}
    window.dispatchEvent(new CustomEvent("wedoit:v270-error-reported",{detail:{code:item.code,scope:item.scope,recordsSafe:item.recordsSafe}}));return item;
  };
  const guard=async(scope,task,options={})=>{try{return await (typeof task==="function"?task():task)}catch(error){report(scope,error,options);return undefined}};
  addEventListener("error",event=>{if(event.target&&event.target!==window){report("asset-load",null,{recordsSafe:true,nextAction:copy().generic});return}report("view-runtime",event.error,{recordsSafe:true,nextAction:copy().generic})},true);
  addEventListener("unhandledrejection",event=>report("view-promise",event.reason,{recordsSafe:true,nextAction:copy().generic}));
  addEventListener("wedoit:languagechange",()=>{if(!host?.hidden&&reports.length){const last=reports.at(-1),t=copy();host.querySelector("#v270ErrorTitle").textContent=t.title;host.querySelector("#v270ErrorMessage").textContent=`${last.recordsSafe?t.safe:t.unknown} ${t.generic}`;host.querySelector("#v270ErrorAction").textContent=t.next}});
  ensureHost();
  Object.defineProperty(window,"__WEDOIT_V270_ERRORS__",{configurable:false,enumerable:false,writable:false,value:Object.freeze({version:VERSION,maximumReports:MAX_REPORTS,remoteReporting:false,storesErrorMessages:false,report,guard,reports:()=>reports.slice()})});
})();
