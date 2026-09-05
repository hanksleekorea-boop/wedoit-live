import {dayPlan} from './happyscan-maturity.mjs';
import {DIMENSIONS,ACTIONS,METHODS} from './happyscan-data.mjs';
import {HELP} from './happyscan-stage1.mjs';
import {PROGRAMS,EXTRA_HELP as STAGE2_HELP} from './happyscan-stage2.mjs';
import {FOUR_WEEK_PROGRAMS,EXTRA_HELP as STAGE3_HELP,LIFESTYLE_METHODS} from './happyscan-stage3.mjs';

const $=id=>document.getElementById(id);
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

const METHOD_GROUPS=[
  {name:'생활의 기반',note:'몸·생활 조건을 살피는 출발점',items:['규칙적인 신체 활동','수면의 질과 규칙성','사회적 지지','균형 잡힌 식사','금연','위험한 음주 줄이기','주거 안정','소득 안정','좋은 일과 일·생활 균형','의료 접근성','일상 안전','건강한 스트레스 관리','우선순위와 경계 세우기','정신건강 전문가 지원','가족·친구와의 질 좋은 시간','지역사회 참여','자원봉사','배움과 성장','자율성','자연과의 접촉']},
  {name:'마음의 기술',note:'주의·생각·감정을 다루는 대표 접근',items:['마음챙김','호흡·근육 이완','요가·태극권','감사 표현','자기연민','도움되지 않는 생각 돌아보기','감정 이름 붙이기','수용과 유연한 대처','가치와 의미','현실적인 목표','실행 의도와 습관 환경','화면·알림 경계','햇빛과 일주기','취미와 놀이','음악·예술']},
  {name:'관계와 사회',note:'함께 살아가는 조건과 연결의 방법',items:['함께하는 식사','친절과 나눔','경청과 관계 회복','갈등 다루기와 도움 요청','신앙·영성·문화 의례','기록과 성찰','재정 점검과 지원','조기 채무 상담','만성질환·장애 자기관리','앉아 있는 시간 줄이기','디지털 문해력과 보안','시민 참여','차별·고립을 줄이는 포용적 지원','일상의 안전 습관']},
  {name:'위기 시 연결',note:'일반 정보보다 즉각적인 안전이 우선인 때',items:['위기 시 긴급·전문 도움 요청']}
];

const FIELD_GROUPS=[
  {name:'전반적 삶',items:['전반적 삶의 만족','행복감','긍정·부정 정서','정신적 웰빙','심리적 기능','의미','번영감','영역별 만족']},
  {name:'관계와 소속',items:['욕구 충족','몰입','사회적 웰빙','사회적 지지','외로움','관계 만족','조화','영성']},
  {name:'내적 자원',items:['자존감','자기효능감','낙관성','회복탄력성','감사','자기연민','마음챙김','스트레스','정서 조절']},
  {name:'생활 조건',items:['수면','신체활동·좌식 시간','재정적 웰빙','직무 만족','주거','건강·기능·삶의 질','교육','환경','일·생활·시간','시민성·신뢰','안전']},
  {name:'생애와 변화',items:['일상 행복의 변화','청소년 삶의 질','노년기 삶의 질']}
];

const card=(title,body,meta='')=>`<article class="guide-card"><p class="eyebrow">${escape(meta)}</p><h3>${escape(title)}</h3><p class="small muted">${escape(body)}</p></article>`;

export const CONTENT_COUNTS=Object.freeze({dimensions:DIMENSIONS.length,measurements:METHODS.filter(method=>method.available).length,researchTools:METHODS.filter(method=>!method.available).length,actions:ACTIONS.length,programs:PROGRAMS.length+FOUR_WEEK_PROGRAMS.length,help:HELP.length+STAGE2_HELP.length+STAGE3_HELP.length,methodologies:METHOD_GROUPS.reduce((sum,group)=>sum+group.items.length,0),fields:FIELD_GROUPS.reduce((sum,group)=>sum+group.items.length,0)});

export function installContentLibrary({modal,close}={}){
  let installed=false;
  const filter=()=>{const query=$('librarySearch').value.trim().toLocaleLowerCase(),kind=$('libraryKind').value;let count=0;for(const id of ['contentCompass','contentActions','contentPrograms','contentHelp']){const section=$(id).closest('section');section.hidden=kind!=='all'&&kind!==id;for(const card of $(id).children){card.hidden=Boolean(query)&&!card.textContent.toLocaleLowerCase().includes(query);if(!section.hidden&&!card.hidden)count++;}}$('libraryActionList').open=Boolean(query)||kind==='contentActions';$('libraryResults').textContent=count?`${count}개 항목을 찾았어요. 실천 목록은 펼쳐서 볼 수 있어요.`:'검색 결과가 없어요. 다른 말로 찾거나 조건을 지워주세요.';};
  const render=()=>{
    const c=CONTENT_COUNTS;
    if(installed){filter();return;}installed=true;
    $('view-library').querySelector('.intro').insertAdjacentHTML('afterend','<div class="library-tools"><label for="librarySearch">내용 검색</label><input id="librarySearch" type="search" placeholder="수면, 백업, 관계…"><label for="libraryKind">종류</label><select id="libraryKind" class="btn"><option value="all">전체</option><option value="contentCompass">행복 영역</option><option value="contentPrograms">프로그램</option><option value="contentHelp">도움말</option></select><button class="btn" id="clearLibrary">조건 지우기</button><p id="libraryResults" role="status"></p></div>');
    $('libraryKind').insertAdjacentHTML('beforeend','<option value="contentActions">실천</option>');
    $('contentPrograms').closest('section').insertAdjacentHTML('beforebegin','<section class="library-section"><details id="libraryActionList"><summary>작은 실천 48개에서 찾기</summary><div class="guide-grid" id="contentActions"></div></details></section>');
    $('contentActions').innerHTML=ACTIONS.map(a=>`<article class="guide-card"><h3>${escape(a.title)}</h3><p>${escape(a.time)} · ${escape(a.steps)}</p><button class="btn" data-action-detail="${a.id}">방법과 주의사항 보기</button></article>`).join('');
    $('librarySearch').oninput=filter;$('libraryKind').onchange=filter;$('clearLibrary').onclick=()=>{$('librarySearch').value='';$('libraryKind').value='all';filter();};
    $('contentCounts').innerHTML=[
      ['행복 영역',c.dimensions],['자체 성찰',c.measurements],['작은 실천',c.actions],['프로그램',c.programs],['도움말',c.help],['연구 접근',c.methodologies]
    ].map(([label,count])=>`<li><b>${count}</b><span>${label}</span></li>`).join('');
    $('contentCompass').innerHTML=DIMENSIONS.map((dimension,index)=>{
      const actions=ACTIONS.filter(action=>action.area===dimension.id).length;
      return `<article class="compass-card" style="--tone:${escape(dimension.color)}"><span class="compass-number">0${index+1}</span><h3>${escape(dimension.name)}</h3><p>${escape(dimension.interpretation||dimension.question)}</p><span class="small">${actions}개 실천 · <a href="#actions?area=${escape(dimension.id)}">실천 고르기 →</a></span></article>`;
    }).join('');
    $('contentPrograms').innerHTML=[...PROGRAMS,...FOUR_WEEK_PROGRAMS].map(program=>`<article class="guide-card"><span class="badge">${program.days}일 · 하루 ${Math.max(...program.actions.map(id=>parseInt(ACTIONS.find(a=>a.id===id).time)))}분 안팎</span><h3>${escape(program.title)}</h3><p>${escape(DIMENSIONS.find(d=>d.id===program.area).name)}을 작은 실천과 회고로 살펴봅니다. 쉬거나 빠진 날이 있어도 참여한 범위대로 마칠 수 있어요.</p><button class="btn" data-program-preview="${program.id}">내용과 일정 보기</button></article>`).join('');
    $('contentHelp').innerHTML=[...HELP,...STAGE2_HELP,...STAGE3_HELP].map(help=>`<details class="guide-card"><summary>${escape(help.title)}</summary><ol>${help.steps.map(step=>`<li>${escape(step)}</li>`).join('')}</ol><a class="btn" href="${escape(help.href||'#help')}">${escape(help.label||'관련 도움 더 보기')}</a></details>`).join('');
    $('methodAtlas').innerHTML=METHOD_GROUPS.map(group=>`<details class="atlas-group"><summary><span>${escape(group.name)}</span><b>${group.items.length}개 접근</b></summary><p class="small muted">${escape(group.note)}</p><ol>${group.items.map(item=>`<li>${escape(item)}</li>`).join('')}</ol></details>`).join('');
    $('fieldAtlas').innerHTML=FIELD_GROUPS.map(group=>`<details class="atlas-group"><summary><span>${escape(group.name)}</span><b>${group.items.length}개 분야</b></summary><ol>${group.items.map(item=>`<li>${escape(item)}</li>`).join('')}</ol></details>`).join('');
    $('contentBridge').innerHTML=`<article class="bridge-card"><div><p class="eyebrow">CONTINUITY</p><h2>기존의 목표와 기록도 이어갈 수 있어요.</h2><p class="muted">목표·타이머·회고·함께 실천하기는 기존 공간에서 계속 사용할 수 있습니다. 두 서비스의 기록과 점수는 자동으로 합치지 않아요.</p></div><div class="bridge-actions"><a class="btn primary" href="./practice.html?page=goals">기존 목표 이어가기</a><a class="btn" href="./practice.html?page=together">함께 실천하기</a></div></article>`;
    $('homeContentSnapshot').innerHTML=`<strong>한눈에 보기</strong><span>${c.dimensions}개 영역 · ${c.actions}개 실천 · ${c.programs}개 프로그램 · ${c.help}개 도움말</span><a href="#library">전체 콘텐츠 지도 →</a>`;
  };
  $('view-library').addEventListener('click',e=>{const button=e.target.closest('[data-program-preview]');if(!button||!modal)return;const program=[...PROGRAMS,...FOUR_WEEK_PROGRAMS].find(p=>p.id===button.dataset.programPreview);if(!program)return;modal(program.title,`<p>${program.days}일 · 기준 측정 후 다음 날부터 실천합니다. 빠진 날은 미기록으로 남고, 재측정과 회고로 마칠 수 있어요.</p><details><summary>전체 일정 ${program.days}일 보기</summary><ol>${Array.from({length:program.days},(_,i)=>dayPlan(program,i+1,ACTIONS)).map(p=>`<li><b>${p.day}일차 · ${escape(p.focus)}</b><p>${escape(p.action.title)} · ${escape(p.action.time)}</p><p>${escape(p.action.steps)}</p><p class="small">${escape(p.action.alternative)}</p><p class="small">${escape(p.reflection)}</p></li>`).join('')}</ol></details><a class="btn primary" id="openProgram" href="#actions?program=${program.id}">이 프로그램 시작·이어 하기</a>`);$('openProgram').onclick=close;});
  return {render};
}
