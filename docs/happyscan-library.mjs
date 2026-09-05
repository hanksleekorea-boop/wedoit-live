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

export function installContentLibrary(){
  const render=()=>{
    const c=CONTENT_COUNTS;
    $('contentCounts').innerHTML=[
      ['행복 영역',c.dimensions],['자체 성찰',c.measurements],['작은 실천',c.actions],['프로그램',c.programs],['도움말',c.help],['연구 접근',c.methodologies]
    ].map(([label,count])=>`<li><b>${count}</b><span>${label}</span></li>`).join('');
    $('contentCompass').innerHTML=DIMENSIONS.map((dimension,index)=>{
      const actions=ACTIONS.filter(action=>action.area===dimension.id).length;
      return `<article class="compass-card" style="--tone:${escape(dimension.color)}"><span class="compass-number">0${index+1}</span><h3>${escape(dimension.name)}</h3><p>${escape(dimension.description||'내 삶의 한 단면을 살펴봐요.')}</p><span class="small">${actions}개 실천 · <a href="#actions">실천 고르기 →</a></span></article>`;
    }).join('');
    $('contentPrograms').innerHTML=[...PROGRAMS,...FOUR_WEEK_PROGRAMS].map(program=>card(program.title,program.description||program.summary||'하루씩 차분하게 이어가는 과정이에요.',program.duration||'프로그램')).join('');
    $('contentHelp').innerHTML=[...HELP,...STAGE2_HELP,...STAGE3_HELP].map(help=>card(help.title,help.description||help.body||'필요할 때 찾아볼 수 있는 안내입니다.','도움말')).join('');
    $('methodAtlas').innerHTML=METHOD_GROUPS.map(group=>`<details class="atlas-group"><summary><span>${escape(group.name)}</span><b>${group.items.length}개 접근</b></summary><p class="small muted">${escape(group.note)}</p><ol>${group.items.map(item=>`<li>${escape(item)}</li>`).join('')}</ol></details>`).join('');
    $('fieldAtlas').innerHTML=FIELD_GROUPS.map(group=>`<details class="atlas-group"><summary><span>${escape(group.name)}</span><b>${group.items.length}개 분야</b></summary><ol>${group.items.map(item=>`<li>${escape(item)}</li>`).join('')}</ol></details>`).join('');
    $('contentBridge').innerHTML=`<article class="bridge-card"><div><p class="eyebrow">CONTINUITY</p><h2>기존의 목표와 기록도 이어갈 수 있어요.</h2><p class="muted">목표·타이머·회고·함께 실천하기는 기존 공간에서 계속 사용할 수 있습니다. 두 서비스의 기록과 점수는 자동으로 합치지 않아요.</p></div><div class="bridge-actions"><a class="btn primary" href="./practice.html?page=goals">기존 목표 이어가기</a><a class="btn" href="./practice.html?page=together">함께 실천하기</a></div></article>`;
    $('homeContentSnapshot').innerHTML=`<strong>한눈에 보기</strong><span>${c.dimensions}개 영역 · ${c.actions}개 실천 · ${c.programs}개 프로그램 · ${c.help}개 도움말</span><a href="#library">전체 콘텐츠 지도 →</a>`;
  };
  return {render};
}
