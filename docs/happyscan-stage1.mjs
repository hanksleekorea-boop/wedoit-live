// Original educational copy, not a licensed or validated clinical instrument.
export const CONTENT_REVIEW={reviewer:'Codex · AI 내용 점검',reviewedAt:'2026-09-04',humanReviewed:false,version:'hs-personal-content-v1'};
export const INTERPRETATIONS={
 life:'지난 7일의 삶 전체를 내가 어떻게 바라보는지에 대한 응답입니다. 소득이나 성취를 객관적으로 평가하지 않습니다. 만족에 영향을 준 상황 하나를 돌아보세요.',
 emotion:'편안하거나 즐거웠던 순간이 나에게 충분했는지 살펴봅니다. 힘든 감정이 없었다는 뜻은 아닙니다. 좋고 힘든 느낌이 함께 있을 수 있습니다.',
 meaning:'내가 중요하게 여기는 방향과 일상이 얼마나 연결되어 있다고 느꼈는지 살펴봅니다. 거창한 목적이 없어도 괜찮으며 종교나 특정 가치관을 요구하지 않습니다.',
 connection:'관계의 수가 아니라 내가 편하게 연결되었다고 느낀 정도입니다. 혼자 있는 것을 선호할 수 있고 위험하거나 불편한 관계를 유지할 필요는 없습니다.',
 recovery:'나에게 필요한 쉼을 충분히 누렸다고 느꼈는지 살펴봅니다. 수면 시간이나 건강 상태를 검사하지 않습니다. 돌봄이나 생계 때문에 쉴 수 없는 상황도 함께 고려하세요.',
 agency:'내 선택으로 배우거나 시도할 여지가 있었는지 살펴봅니다. 생산성이나 능력 점수가 아닙니다. 외부 제약 때문에 선택이 어려웠다면 그것도 중요한 맥락입니다.',
 balance:'해야 할 일과 나를 위한 시간 배분에 대한 만족입니다. 모든 활동에 같은 시간을 써야 한다는 뜻이 아닙니다. 내 생활 조건에 맞는 균형이 기준입니다.',
 security:'일상을 이어갈 여건이 얼마나 안정적이라고 느꼈는지 살펴봅니다. 자산·주거·안전을 실제 확인하는 검사가 아닙니다. 구조적 어려움을 개인의 의지 탓으로 돌리지 않습니다.'
};
export const ALTERNATIVES={
 notice:'좋았던 일이 생각나지 않으면 오늘 실제로 있었던 일 하나만 중립적으로 적어요.',
 enjoy:'5분이 부담되면 익숙하고 편한 것을 30초 바라보거나 오늘은 쉬어요.',
 values:'단어가 떠오르지 않으면 오늘 줄이고 싶은 부담 하나를 적어요.',
 hello:'연락이 부담되거나 안전한 사람이 없다면 보내지 않을 안부를 나에게 적어요.',
 rest:'쉴 공간이 없으면 지금 할 수 있는 가장 편한 자세를 잠깐 찾아요.',
 learn:'검색할 여유가 없다면 나중에 알아볼 질문만 적어 두어요.',
 space:'일정을 바꿀 수 없다면 가장 부담되는 부분을 적고 도움을 요청할 여지를 살펴요.',
 support:'문의할 곳을 모르겠다면 필요한 도움의 종류만 먼저 적어요. 개인정보를 공개 게시하지 않아요.',
 move:'움직임이 제한되거나 불편하다면 움직이지 않고 편하게 쉬는 선택을 해요.',
 thanks:'고마운 일이 떠오르지 않으면 오늘 필요한 도움 하나를 적어요.',
 sleep:'교대근무 등으로 정해진 저녁이 없다면 다음 휴식 전 준비할 것 하나를 골라요.',
 kind:'위로 문장이 어색하면 지금 상황을 판단 없이 한 줄로 적어요.',
 savor:'감각 관찰이 불편하면 주의를 밖으로 돌리고 익숙하고 안전한 활동을 해요.',
 small:'실행이 어렵다면 시작에 필요한 준비물 하나를 적거나 쉬기로 선택해요.',
 tidy:'내 공간을 바꿀 수 없다면 자주 쓰는 물건의 위치만 확인해요.',
 pause:'당장 멈출 수 없다면 다음에 잠깐 쉴 수 있는 때를 정해 두어요.'
};
export const HELP=[
 {id:'scope',title:'누가, 무엇을 위해 쓰나요?',steps:['만 18세 이상 성인의 한국어 자기 성찰 도구입니다. 행복 측정에서 지금의 기분, 8가지 단면, 하루 돌아보기 중 선택하세요.','가입 없이 기록→결과 이해→작은 실천→재측정까지 이용합니다. 진단·치료·위기 감시는 제공하지 않습니다.'],href:'#measure',label:'행복 측정 열기'},
 {id:'score',title:'자체 지수는 어떻게 읽나요?',steps:['HS-8은 지난 7일의 8개 응답(각 0–10)의 평균에 10을 곱해 반올림합니다. 합격선·정상 범위·타인 순위는 없습니다.','변화 리포트에서 원응답과 단면 설명을 함께 읽으세요. 검증된 임상 척도나 WHO·OECD 인증 점수가 아닙니다.'],href:'#report',label:'결과와 원응답 보기'},
 {id:'answers',title:'답하거나 건너뛰고, 취소하려면?',steps:['지난 7일을 떠올려 각 질문의 양 끝 설명을 읽고 0–10 정수 하나를 고릅니다. 0도 유효한 응답입니다.','이전 버튼으로 바꿀 수 있습니다. 건너뛴 문항이 있으면 종합 지수를 저장하지 않고 미응답으로 돌아갑니다.','측정 그만두기에서 임시 응답 삭제를 확인해야 초안이 사라집니다. 입력 중 창을 닫으면 저장되지 않은 내용을 잃을 수 있습니다.'],href:'#measure',label:'측정 선택'},
 {id:'periods',title:'기분과 주간 성찰은 무엇이 다른가요?',steps:['기분은 응답하는 지금, HS-8은 지난 7일을 묻습니다. 서로 다른 기간이라 합산하지 않습니다.','하루에 여러 기분을 남기면 그날 평균을 표시합니다. 기록 없는 날은 0점이 아닙니다. 회고 글은 점수로 변환하지 않습니다.'],href:'#home',label:'지금의 기분 남기기'},
 {id:'actions',title:'나에게 맞는 실천을 고르려면?',steps:['첫 기록 전에는 일반 예시, 주간 기록 후에는 상대적으로 낮게 답한 3단면의 예시를 보여줍니다. 의료 처방은 아닙니다.','작은 실천에서 영역을 골라 방법·주의·대안을 읽고 선택하세요. 다른 실천을 함께 고르거나 기존 선택을 쉬기로 바꿀 수 있습니다.','실제로 한 뒤에만 실천했어요를 누릅니다. 선택·쉬기는 완료가 아니고 어느 선택도 행복 지수에 가산·감점하지 않습니다.'],href:'#actions',label:'실천 살펴보기'},
 {id:'remeasure',title:'언제 다시 측정하나요?',steps:['HS-8은 지난 7일을 돌아보므로 최근 기록의 현지 날짜에서 7일 후를 다음 권장일로 안내합니다. 앱을 열었을 때만 안내하며 외부 알림은 보내지 않습니다.','원하면 더 일찍 측정해도 됩니다. 7일보다 가까운 기록은 회상 기간이 겹칠 수 있습니다. 날짜·원응답·그때의 상황을 함께 비교하세요.','실천 뒤 점수가 변해도 그 실천이 변화를 일으켰다고 단정할 수 없습니다.'],href:'#report',label:'재측정 안내 보기'},
 {id:'storage',title:'기록은 어디에 저장되나요?',steps:['새 행복 기록은 이 주소를 연 이 브라우저의 기기 저장 공간(IndexedDB)에만 있습니다. 기기·브라우저·사이트 주소가 다르면 자동으로 이어지지 않습니다.','다른 곳으로 옮기기 전 내 공간에서 백업을 내려받으세요. 시크릿 모드 종료·브라우저 자료 삭제·기기 분실로 사라질 수 있습니다.','저장 실패 때 입력을 지우지 말고 파일로 별도 복사하거나 공간/설정을 확인한 후 다시 저장하세요. 저장소 손상 시 자동 초기화하지 않습니다.'],href:'#me',label:'자료 보관 열기'},
 {id:'backup',title:'백업은 어떻게 보관하나요?',steps:['내 공간→행복 기록 백업 받기를 누르고 다운로드 완료와 파일 이름을 확인하세요. 기록 수와 날짜도 확인합니다.','백업 한 파일은 최대 5MB·20,000건입니다. 전체가 한도를 넘으면 나눈 백업을 받아 모든 조각을 보관하세요. 원본은 지우지 않습니다.','응답과 메모가 포함된 평문 파일입니다. 타인과 공유하지 말고 개인적으로 보호되는 별도 위치에 보관하세요. 앱이 다운로드 후 파일 보관을 보증하지 않습니다.'],href:'#me',label:'백업 받기'},
 {id:'restore',title:'복원과 기기 이동은 어떻게 하나요?',steps:['새 브라우저에서 같은 해피스캔 주소→내 공간→백업 불러오기→파일 선택→건수 확인→동의 후 합치기를 진행하세요.','같은 ID·같은 내용은 추가하지 않습니다. 같은 ID·다른 내용은 전체 취소합니다. 충돌 시 원본들을 유지하고 다른 파일인지 확인하세요.','나눈 백업은 모든 조각을 하나씩 불러옵니다. 마지막에 전체 건수와 최근·오래된 원응답을 확인하세요. 기존 활동 백업은 기존 활동 도구에서 복원합니다.'],href:'#me',label:'백업 불러오기'},
 {id:'delete',title:'내 자료를 삭제하거나 내보내려면?',steps:['한 건은 변화 리포트→기록 목록에서 삭제를 확인합니다. 전체는 내 공간→삭제 범위 확인→삭제 입력→최종 확인합니다.','행복 자료만 지우며 기존 활동·다른 브라우저·다운로드 파일은 별도입니다. 먼저 필요한 백업을 보관하세요.','CSV에는 모든 측정의 시각·도구·원응답만 담고 메모는 제외합니다. 인쇄/PDF는 현재 표시된 목록 범위의 요약입니다. 전체 자료는 JSON으로 보관하세요.'],href:'#report',label:'기록 관리 열기'},
 {id:'offline',title:'설치·오프라인·새 버전은 어떻게 쓰나요?',steps:['온라인에서 이 앱을 한 번 열고 오프라인 준비 완료 안내를 확인한 뒤 브라우저 메뉴의 앱 설치/홈 화면 추가를 이용하세요. 지원 여부는 브라우저에 따라 다릅니다.','오프라인에서는 준비된 화면과 기기 기록을 이용할 수 있지만 처음 방문한 외부 링크는 열리지 않습니다. 첫 설치에 실패하면 온라인 연결 후 앱을 다시 여세요.','새 버전 안내가 나오면 모든 창의 입력을 저장하고 다른 해피스캔 창을 닫은 뒤 적용하세요. 입력 중에는 새로고침하지 않습니다. 설치는 백업이나 동기화가 아닙니다.'],href:'#me',label:'설치·저장 안내'},
 {id:'contact',title:'문제 신고와 안전 도움은 어디서 받나요?',steps:['현재 후보판의 실제 운영자와 비공개 문의 채널은 아직 확정되지 않았습니다. 공개 상용 서비스 준비 완료가 아니며 접수되었다고 표시하지 않습니다.','문제가 생기면 발생 화면·시간·재현 순서만 개인적으로 정리하세요. 문의 채널 확정 전 민감한 원응답·회고·백업을 공개 게시하지 마세요.','즉각적인 위험에는 현지 응급기관이나 가까운 신뢰할 수 있는 사람에게 도움을 요청하세요. 이 앱은 기록을 상시 확인하거나 위기를 감지하지 않습니다.'],href:'./legal/status.html',label:'현재 운영 상태 보기'}
];
export function nextScanDate(timestamp){const d=new Date(timestamp);d.setHours(0,0,0,0);d.setDate(d.getDate()+7);return d;}
export function calendarDays(a,b){const day=t=>{const d=new Date(t);return Date.UTC(d.getFullYear(),d.getMonth(),d.getDate());};return Math.round((day(b)-day(a))/86400000);}
export function pageOf(records,page=0,size=20){const total=records.length,pages=Math.max(1,Math.ceil(total/size)),current=Math.max(0,Math.min(Number.isInteger(page)?page:0,pages-1));return {rows:records.slice(current*size,(current+1)*size),page:current,pages,total,from:total?current*size+1:0,to:Math.min(total,(current+1)*size)};}
export function recordMetadata(row){const instruments={daily:['hs-daily','v1','now'],scan:['hs-eight','v1','past-7-days'],diary:['hs-diary','v1','free-reflection'],action:['hs-action','v1','event'],program:['hs-program','v1','event'],preferences:['hs-preferences','v1','settings'],lifestyle:['hs-lifestyle','v1','self-report'],experiment:['hs-personal-experiment','v1','event'],community:['hs-community-event','v1','event']};const [instrumentId,instrumentVersion,recallPeriod]=instruments[row.type]??['hs-unknown','v1','unknown'];return {instrumentId,instrumentVersion,language:'ko',recallPeriod,measuredAt:row.createdAt,completionStatus:'complete'};}
