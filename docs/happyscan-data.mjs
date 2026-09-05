import {ALTERNATIVES,CONTENT_REVIEW,INTERPRETATIONS} from './happyscan-stage1.mjs';
import {EXTRA_ACTIONS} from './happyscan-stage2.mjs';
import {EXTRA_ACTIONS as STAGE3_ACTIONS} from './happyscan-stage3.mjs';
export const VERSION = '29.1.0';
export const DIMENSIONS = [
  {id:'life',name:'삶의 만족',short:'만족',question:'지난 7일의 내 삶을 돌아볼 때, 전반적으로 얼마나 만족하나요?',hint:'전혀 만족하지 않음 → 매우 만족함',color:'#365ce6'},
  {id:'emotion',name:'긍정적인 순간',short:'감정',question:'지난 7일, 편안하거나 즐거운 순간을 얼마나 충분히 경험했나요?',hint:'거의 없었음 → 충분했음',color:'#bc6b20'},
  {id:'meaning',name:'의미와 방향',short:'의미',question:'지난 7일, 내가 중요하게 여기는 방향으로 살아간다고 얼마나 느꼈나요?',hint:'거의 느끼지 못함 → 충분히 느낌',color:'#8462bc'},
  {id:'connection',name:'관계와 연결',short:'관계',question:'지난 7일, 편하게 연결되어 있다고 느끼는 관계가 얼마나 충분했나요?',hint:'거의 없었음 → 충분했음',color:'#bc506c'},
  {id:'recovery',name:'쉼과 회복',short:'회복',question:'지난 7일, 내게 필요한 쉼과 회복을 얼마나 누렸나요?',hint:'거의 누리지 못함 → 충분히 누림',color:'#227c85'},
  {id:'agency',name:'선택과 성장',short:'성장',question:'지난 7일, 내 속도와 선택으로 배우거나 시도할 여지가 얼마나 있었나요?',hint:'거의 없었음 → 충분했음',color:'#487646'},
  {id:'balance',name:'생활의 균형',short:'균형',question:'지난 7일, 해야 하는 일과 나를 위한 시간의 균형에 얼마나 만족했나요?',hint:'전혀 만족하지 않음 → 매우 만족함',color:'#887230'},
  {id:'security',name:'생활의 안정',short:'안정',question:'지난 7일, 일상을 이어갈 생활 여건이 얼마나 안정적이라고 느꼈나요?',hint:'매우 불안정함 → 매우 안정적임',color:'#547089'}
];
for(const d of DIMENSIONS)Object.assign(d,{interpretation:INTERPRETATIONS[d.id],recallPeriod:'past-7-days',...CONTENT_REVIEW});
export const DISCLAIMER = '해피스캔 자체 성찰 도구입니다. 임상적으로 검증된 검사나 의료 진단이 아니며, 점수는 나의 가치나 행복의 정답을 뜻하지 않습니다.';
const mental='https://www.who.int/news-room/fact-sheets/detail/mental-health-strengthening-our-response';
const physical='https://www.who.int/news-room/fact-sheets/detail/physical-activity';
export const ACTIONS = [
  ['notice','life','괜찮았던 순간 하나 찾기','2분','오늘 조금이라도 괜찮았던 순간을 한 줄로 적어요. 떠오르지 않으면 무리해서 찾지 않아도 괜찮아요.','전후로 무엇이 달랐는지 관찰해요. 변화가 없어도 기록은 유효해요.',mental],
  ['enjoy','emotion','좋아하는 것에 5분 쓰기','5분','음악 한 곡, 창밖 보기, 차 한 잔 중 지금 부담 없는 것을 골라요.','즐거움을 느껴야 한다는 목표보다 경험 자체에 주의를 둬요.',mental],
  ['values','meaning','내게 중요한 것 하나 고르기','3분','오늘 지키고 싶은 가치를 한 단어로 적고, 그 가치에 맞는 작은 선택을 정해요.','거창한 목표나 생산성이 아니어도 좋아요.',mental],
  ['hello','connection','편안한 사람에게 안부 건네기','3분','연락해도 안전하고 편안한 사람에게 짧은 안부를 보내거나, 다음에 연락할 시간을 정해요.','불편하거나 위험한 관계에 연락할 필요는 없어요.',mental],
  ['rest','recovery','자극에서 잠시 벗어나기','3분','가능하다면 화면을 내려놓고 편한 자세로 쉬어요. 눈을 뜨고 있어도 괜찮아요.','불편해지면 바로 중단하고 편한 활동으로 바꿔요.',mental],
  ['learn','agency','궁금했던 것 하나 알아보기','5분','내가 고른 질문 하나를 찾아보고 새로 알게 된 것을 한 줄로 남겨요.','성과보다 스스로 고른 시도를 기록해요.',mental],
  ['space','balance','나를 위한 시간 한 칸 남기기','3분','오늘 일정에서 줄이거나 미룰 수 있는 작은 일 하나를 골라요.','돌봄·생계 등 바꾸기 어려운 제약은 나의 실패가 아니에요.',mental],
  ['support','security','필요한 도움 한 가지 적기','3분','주거·돈·일상에서 필요한 도움과 문의할 수 있는 기관 또는 사람을 한 곳 적어요.','투자·부채·법률 판단은 자격 있는 전문가나 공공기관에 확인해요.',mental],
  ['move','recovery','내 몸에 맞게 조금 움직이기','5분','가능한 범위에서 걷기, 휠체어 이동, 가벼운 자세 바꾸기 중 하나를 골라요.','통증·어지럼이 있으면 중단해요. 의료진의 제한을 우선해요.',physical],
  ['thanks','connection','고마웠던 도움 기록하기','2분','작은 도움 한 가지와 그때의 느낌을 적어요. 누군가에게 보낼 필요는 없어요.','감사를 느끼지 못해도 괜찮아요. 억지로 긍정하지 않아요.',mental],
  ['sleep','recovery','쉬기 좋은 저녁 준비하기','5분','내일 할 일을 한 줄로 남기고 오늘 마무리할 시간을 골라요.','수면 문제가 지속되거나 일상을 어렵게 하면 전문적인 도움을 고려해요.',mental],
  ['kind','agency','친구에게 하듯 나에게 말하기','2분','지금의 어려움을 한 문장으로 인정하고, 나에게 가능한 도움을 하나 적어요.','힘든 감정을 없애려 하지 않아도 돼요.',mental],
  ['savor','emotion','주변 감각 하나 알아차리기','2분','편하게 느껴지는 소리·빛·촉감 하나를 잠시 관찰해요.','감각에 집중하는 것이 불편하면 익숙한 활동으로 바꿔요.',mental],
  ['small','meaning','중요한 일의 첫 조각 하기','5분','내게 중요한 일 중 5분 안에 할 수 있는 첫 조각만 골라 시도해요.','끝내지 못해도 시도한 사실만 기록해요.',mental],
  ['tidy','security','자주 쓰는 자리 한 곳 정리하기','5분','손이 닿는 작은 공간에서 거슬리는 물건 하나만 정리해요.','거주 조건 전체를 개인의 노력으로 해결해야 한다는 뜻은 아니에요.',mental],
  ['pause','balance','지금은 쉬기로 선택하기','2분','할 수 있는 일이 많아도 오늘은 쉬기로 선택할 수 있어요. 잠깐 멈출 시간을 정해요.','휴식도 하나의 선택이에요. 연속 기록을 지킬 필요가 없어요.',mental]
].map(([id,area,title,time,steps,caution,source])=>({id,area,title,time,duration:time,steps,caution,source,sourceURL:source,alternative:ALTERNATIVES[id],evidenceCategory:'general-wellbeing-original-suggestion',...CONTENT_REVIEW,evidence:'일반 웰빙 근거를 참고한 자체 실천 제안 · 개별 효과 미검증'}));
ACTIONS.push(...EXTRA_ACTIONS);
ACTIONS.push(...STAGE3_ACTIONS);
export const METHODS = [
  {id:'daily',name:'지금의 기분 체크',tag:'자체 기록 · 30초',description:'현재 기분을 0–10으로 남기고 변화를 살펴봐요.',available:true},
  {id:'weekly',name:'행복의 8가지 단면',tag:'자체 성찰 · 약 3분',description:'지난 7일의 만족·감정·의미·관계·회복·성장·균형·안정을 살펴봐요.',available:true},
  {id:'diary',name:'하루 돌아보기',tag:'자체 회고 · 2분',description:'어떤 상황에서 어떤 느낌이 있었는지 내 말로 남겨요.',available:true},
  {id:'swls',name:'SWLS · 삶의 만족도',tag:'연구 도구 · 도입 검토',description:'인지적 삶 만족을 측정하는 5문항 도구. 한국어판과 상업적 사용권 확인 후 제공해요.',source:'https://eddiener.com/satisfaction-with-life-scale-swls/',available:false},
  {id:'who5',name:'WHO-5 · 정신적 웰빙',tag:'연구 도구 · 도입 검토',description:'최근 2주의 정신적 웰빙을 살피는 5문항 도구. 제공 조건과 번역판 확인이 필요해요.',source:'https://www.who.int/publications/m/item/WHO-UCN-MSD-MHE-2024.01',available:false},
  {id:'perma',name:'PERMA · 다영역 웰빙',tag:'연구 도구 · 도입 검토',description:'긍정 정서·몰입·관계·의미·성취를 다루는 도구. 현재 자체 질문의 검증 근거가 아니에요.',source:'https://internationaljournalofwellbeing.org/index.php/ijow/article/view/526',available:false},
  {id:'spane',name:'SPANE · 정서 경험',tag:'연구 도구 · 도입 검토',description:'긍정·부정 경험을 따로 측정해요. 도구의 질문과 채점은 사용 조건 확인 후 적용해요.',source:'https://eddiener.com/scale-of-positive-and-negative-experience-spane/',available:false},
  {id:'ryff',name:'Ryff · 심리적 웰빙',tag:'연구 도구 · 도입 검토',description:'자기수용·성장·목적 등 여섯 가지 심리적 기능을 다뤄요. 원척도와 자체 도구는 별개예요.',source:'https://pubmed.ncbi.nlm.nih.gov/7473027/',available:false}
];
export function scoreScan(answers){
  const values=DIMENSIONS.map(d=>answers?.[d.id]);
  if(values.some(v=>!Number.isInteger(v)||v<0||v>10))return null;
  return Math.round(values.reduce((s,v)=>s+v,0)/values.length*10);
}
export function dayKey(timestamp){const d=new Date(timestamp);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function recommend(answers,pool=ACTIONS){const areas=DIMENSIONS.filter(d=>typeof answers?.[d.id]==='number').sort((a,b)=>answers[a.id]-answers[b.id]).slice(0,3).map(d=>d.id);return (areas.length?areas.map(area=>pool.find(a=>a.area===area)):['life','recovery','connection'].map(area=>pool.find(a=>a.area===area))).filter(Boolean);}

// Action requirements describe the default instructions; users may choose the written alternative.
for(const a of ACTIONS){a.requiresMovement=['move','gentle-move'].includes(a.id);a.requiresContact=['hello','listen','request','safe-company'].includes(a.id);a.minutes=parseInt(a.time,10);}
