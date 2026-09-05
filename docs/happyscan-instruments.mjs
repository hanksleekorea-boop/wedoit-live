// Metadata only: copyrighted questions remain absent until product rights and
// the exact Korean instrument version have been reviewed and recorded.
export const INSTRUMENT_CANDIDATES=[
 {id:'swls',name:'삶의 만족도 SWLS',purpose:'life-evaluation',count:5,source:'https://eddiener.com/satisfaction-with-life-scale-swls/',checkedOn:'2026-09-04',rights:'Official site permits non-commercial use only; product permission unresolved.'},
 {id:'who5',name:'정신적 웰빙 WHO-5',purpose:'wellbeing',count:5,source:'https://www.who.int/publications/m/item/WHO-UCN-MSD-MHE-2024.01',checkedOn:'2026-09-04',rights:'WHO commercial-context permission and exact Korean edition unresolved.'},
 {id:'spane',name:'정서 경험 SPANE',purpose:'affect',count:12,source:'https://eddiener.com/scale-of-positive-and-negative-experience-spane/',checkedOn:'2026-09-04',rights:'Commercial product and Korean version review unresolved.'}
].map(c=>({...c,licensedForProduct:false,translationApproved:false,scoringVerified:false,contentReviewed:false,questions:[],enabled:false}));
export function verifyInstrument(d){
 const required=['id','version','language','recallPeriod','source','rightsEvidence','translationEvidence','reviewEvidence'];
 if(!d||required.some(k=>typeof d[k]!=='string'||!d[k].trim())||!['licensedForProduct','translationApproved','scoringVerified','contentReviewed'].every(k=>d[k]===true))throw Error('도구 사용권·판본·한국어·채점·검수 근거가 필요합니다.');
 if(!Array.isArray(d.questions)||!d.questions.length||d.questions.length>100||new Set(d.questions.map(q=>q.id)).size!==d.questions.length||d.questions.some(q=>typeof q.id!=='string'||typeof q.text!=='string'||!q.text.trim()||!Array.isArray(q.options)||q.options.length<2||q.options.some(o=>!Number.isFinite(o.value)||typeof o.label!=='string')||new Set(q.options.map(o=>o.value)).size!==q.options.length))throw Error('도구 문항·응답 계약 오류');
 if(!['sum','mean'].includes(d.aggregation)||!Number.isFinite(d.multiplier)||d.multiplier<=0||d.missingRule!=='reject')throw Error('지원하지 않는 산식 또는 결측 규칙');return d;
}
export function scoreInstrument(definition,answers){const d=verifyInstrument(definition);const raw=d.questions.map(q=>{const v=answers?.[q.id];if(!q.options.some(o=>o.value===v))throw Error('모든 질문에 허용된 응답이 필요합니다.');return q.reverse?Math.min(...q.options.map(o=>o.value))+Math.max(...q.options.map(o=>o.value))-v:v;});const sum=raw.reduce((s,v)=>s+v,0);return {instrumentId:d.id,instrumentVersion:d.version,language:d.language,recallPeriod:d.recallPeriod,raw:sum,result:(d.aggregation==='mean'?sum/raw.length:sum)*d.multiplier,answers:Object.fromEntries(d.questions.map(q=>[q.id,answers[q.id]]))};}
