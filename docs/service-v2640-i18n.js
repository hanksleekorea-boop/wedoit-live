(()=>{
  "use strict";
  const VERSION="v26.4.0-i18n";
  const text={
    "위두잇":"WeDoIt","오늘":"Today","목표":"Goals","함께":"Together","통찰":"Insights","나":"Me",
    "안전한 기기 저장":"Safe device storage","가입 없이 바로 시작하고":"Start without an account;","내 기록은 내가 관리해요.":"you control your records.","모바일에서 계속":"Continue on mobile","휴대폰으로 오늘을 이어보세요.":"Continue today on your phone.",
    "오늘을 가볍게":"A lighter today","나만 보는 기록":"Private records","기본":"Default","삶의 궤도":"Life orbit","데이터 보기":"Data view","따뜻한 화면":"Warm view","큰 글씨":"Large text","앱으로 설치":"Install app",
    "오늘의 추천":"Today’s suggestion","오늘의 첫 루틴을 가볍게 골라보세요.":"Choose a light first routine for today.","30초면 충분해요. 추천 행동을 누르면 목표 생성과 오늘 기록이 한 번에 끝납니다.":"Thirty seconds is enough. Choosing a suggestion creates a goal and logs today’s action together.","물 한 잔":"A glass of water","깊은 숨 3번":"Three deep breaths","안부 한 번":"One check-in","선택 목표 기록하기":"Log selected goal","새 목표 직접 만들기":"Create a goal",
    "빠른 기록":"Quick log","키보드로 바로 완료":"Finish with your keyboard","선택 목표 +1":"Selected goal +1","단축키 보기":"Keyboard shortcuts","바로 고르기":"Choose now","오늘 목표":"Today’s goals","오늘만 보기":"Today only","오늘의 흐름":"Today’s rhythm","삶 전체 보기":"Whole-life view","이 기기의 기록":"Records on this device","최근 7일 흐름":"Last 7 days",
    "30초로 다시 시작":"Restart in 30 seconds","오늘 목표 낮추기":"Lower today’s goal","오늘은 쉬기":"Rest today","최근 14일":"Last 14 days","나의 관심이 머문 곳":"Where your attention went","점수 없이 보기":"No scores","작은 기록이 쌓이면 관심의 흐름을 보여드려요.":"Small logs reveal the flow of your attention.","첫 기록 뒤부터 천천히 열립니다.":"It opens gradually after your first log.","내 기록이 말해주는 것":"What your records say","충분히 쌓인 뒤에만 알려드려요":"Shown only after enough records","기록을 기다리는 중":"Waiting for records",
    "오늘 우선 목표":"Today’s priority goals","최대 3개":"Up to 3","오늘 숨긴 목표 다시 보기":"Show goals hidden today","나를 돕는 제안":"A suggestion for you","압박 없이":"No pressure","나의 7일 요약":"My 7-day summary","나와 공개범위":"Me and visibility","나만 보기 기본":"Private by default",
    "처음 시작하기":"Getting started","무엇을 위해 시작할까요?":"What would you like to start for?","목적 하나를 고르면 오늘 바로 해볼 작은 행동을 보여드려요.":"Choose one purpose and we’ll show a small action to try today.","시작 목적":"Starting purpose","방금 기록 되돌리기":"Undo last log","오늘 목표 숨기기":"Hide today’s goal","내 기록 JSON으로 받기":"Download my records as JSON","가져오기 전 내용 확인":"Review before import","목적을 골라 첫 행동을 시작해 보세요.":"Choose a purpose to start your first action.","취소하고 돌아가기":"Cancel and return",
    "몸과 건강":"Body & health","작은 움직임부터":"Start with small movement","배움":"Learning","짧게 읽고 익히기":"Read and learn briefly","소비":"Spending","오늘의 선택 돌아보기":"Review today’s choices","이 행동으로 오늘 1회 시작":"Start this action once today",
    "새 목표 만들기":"Create a goal","숫자를 정하지 않아도 시작할 수 있어요.":"You can start without setting a number.","목표 이름":"Goal name","목표 유형":"Goal type","반복하기":"Repeat","쌓기":"Build","줄이기":"Reduce","유지하기":"Maintain","프로젝트":"Project","회복하기":"Recover","탐색하기":"Explore","목표값(선택)":"Goal value (optional)","정하지 않아도 됩니다":"No number is required","취소":"Cancel","목표 저장":"Save goal",
    "PC 단축키":"PC keyboard shortcuts","선택 목표에 +1 기록":"Log +1 for selected goal","목표 사이 이동":"Move between goals","이 도움말 열기":"Open this help","도움말 닫기":"Close this help","확인":"OK","공개 앱 열기":"Open public app","같은 오늘 화면을 휴대폰에서 엽니다.":"Open the same Today view on your phone.",
    "기록할 목표가 없습니다. 먼저 목표를 추가해 주세요.":"There is no goal to log. Add a goal first.","기록할 목표가 없습니다.":"There is no goal to log.","목표를 불러오는 중입니다.":"Loading goals…","목표를 추가하면 이곳에서 바로 고를 수 있습니다.":"Add a goal to choose it here.",
    "기록 JSON 파일을 브라우저의 다운로드 목록에 준비했어요.":"Your records JSON file is ready in the browser downloads.","2MB보다 작은 JSON 파일만 먼저 확인할 수 있어요.":"Only JSON files smaller than 2MB can be reviewed first.","이 단계는 내용 확인과 취소만 제공합니다. 현재 기록과 실제로 합치지 않았습니다.":"This step only lets you review or cancel. Your current records have not been merged.","이 파일은 위두잇 기록 JSON 형식으로 읽을 수 없어요. 현재 기록은 바뀌지 않았습니다.":"This file is not a readable WeDoIt records JSON file. Your current records were not changed.","방금 기록을 되돌렸어요.":"The last log was undone.","되돌릴 기록이 없어요.":"There is no log to undo."
  };
  const attrs={"위두잇 오늘 화면":"WeDoIt Today view","화면 이동":"Navigate views","화면 스타일":"Display style","바로 시작할 작은 행동":"Small actions to start now","이전 목표":"Previous goal","다음 목표":"Next goal","폰으로 이어서 보기 QR":"QR code to continue on phone","오늘 한눈에 보기":"Today at a glance","최근 7일 행동 막대 차트":"Last 7 days action bar chart","주요 메뉴":"Main menu","예: 저녁에 10분 걷기":"Example: walk for 10 minutes after dinner","예: 저녁에는 너무 지쳐서 시작하기 어려웠어요":"Example: I was too tired in the evening to start","예: 점심 뒤 2분 걷기부터 시작하기":"Example: start with a 2-minute walk after lunch"};
  const originalText=new WeakMap(),originalAttrs=new WeakMap();
  const compact=value=>String(value||"").replace(/\s+/g," ").trim();
  function english(value){
    const key=compact(value); if(text[key]) return text[key];
    let match=key.match(/^(.+)을 오늘 1회 기록했어요\. 필요하면 바로 되돌릴 수 있어요\.$/); if(match)return `${match[1]} was logged once today. You can undo it now.`;
    match=key.match(/^(.+)을 위한 예시를 골랐어요\.$/); if(match)return `Examples for ${match[1]} are ready.`;
    match=key.match(/^(.+)을 오늘 화면에서 숨겼어요\. 목표 목록에서 다시 볼 수 있어요\.$/); if(match)return `${match[1]} is hidden for today. You can show it again in Goals.`;
    match=key.match(/^목표 (\d+)개와 기록 (\d+)개를 읽었어요\.$/); if(match)return `Read ${match[1]} goals and ${match[2]} records.`;
    match=key.match(/^선택: (.+?)( · 이번 PC 세션 \+\d+)?$/); if(match)return `Selected: ${match[1]}${match[2]||""}`;
    return null;
  }
  function textNodes(root=document.body){
    if(!root)return[]; const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){const parent=node.parentElement;if(!parent||parent.closest("script,style,template,[data-i18n-skip]"))return NodeFilter.FILTER_REJECT;return compact(node.nodeValue)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT}});const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);return nodes;
  }
  function apply(){
    const isEnglish=document.documentElement.lang==="en";
    textNodes().forEach(node=>{if(!originalText.has(node))originalText.set(node,node.nodeValue);const source=originalText.get(node),translated=english(source);const next=isEnglish?(translated||source):source;if(node.nodeValue!==next)node.nodeValue=next});
    document.querySelectorAll("[aria-label],[alt],[placeholder],[title]").forEach(element=>{let saved=originalAttrs.get(element);if(!saved){saved={};["aria-label","alt","placeholder","title"].forEach(name=>{if(element.hasAttribute(name))saved[name]=element.getAttribute(name)});originalAttrs.set(element,saved)}Object.entries(saved).forEach(([name,source])=>{const next=isEnglish?(attrs[source]||source):source;if(element.getAttribute(name)!==next)element.setAttribute(name,next)})});
    document.documentElement.dataset.i18nReady="true";
  }
  let queued=false;const schedule=()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;apply()})};
  window.addEventListener("wedoit:languagechange",schedule);new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:["aria-label","alt","placeholder","title"]});
  apply();window.__WEDOIT_V264_I18N__={version:VERSION,apply,language:()=>document.documentElement.lang};
})();
