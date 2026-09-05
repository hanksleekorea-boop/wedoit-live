import {
  AREAS,
  GOAL_TEMPLATES,
  PROGRAMS,
  INSIGHT_EXPLANATIONS,
  FAQS
} from "./content-v2711.js";

export const CONTENT_VERSION = "v27.1.2-stage2";
export const CONTENT_REVIEWED_AT = "2026-09-04";

const definitions = {
  health: [
    ["health-stairs", "계단 한 층 천천히 오르기", "Climb one flight slowly", "🪜", "repeat", "count", 1, "계단 앞까지 가기", "Walk to the stairs"],
    ["health-balance", "한 발 균형 30초 연습", "Practice balance for 30 seconds", "🦶", "build", "check", 1, "벽 옆에 서기", "Stand beside a wall"],
    ["health-posture", "앉은 자세 한 번 고쳐 보기", "Reset your sitting posture once", "🪑", "maintain", "check", 1, "발을 바닥에 놓기", "Place both feet on the floor"],
    ["health-sun", "낮빛 5분 보기", "Spend 5 minutes in daylight", "☀️", "maintain", "minutes", 5, "창가로 가기", "Move near a window"],
    ["health-meal", "한 끼 천천히 먹기", "Eat one meal slowly", "🥣", "maintain", "check", 1, "첫 입 전에 숨 쉬기", "Breathe before the first bite"]
  ],
  mind: [
    ["mind-unclench", "몸의 힘 한 곳 풀기", "Release tension in one spot", "👐", "recover", "check", 1, "턱이나 어깨 확인", "Check your jaw or shoulders"],
    ["mind-worry", "걱정과 할 일을 나눠 적기", "Separate worries from actions", "🗂️", "recover", "reflection", null, "걱정 하나 적기", "Write one worry"],
    ["mind-sound", "주변 소리 3개 알아차리기", "Notice three nearby sounds", "👂", "recover", "count", 3, "가장 가까운 소리 듣기", "Hear the nearest sound"],
    ["mind-compassion", "실수에서 배운 점 한 줄", "Write one lesson from a mistake", "🌱", "build", "reflection", null, "사실만 한 줄 적기", "Write one factual line"],
    ["mind-boundary", "오늘 하지 않을 일 하나 정하기", "Choose one thing not to do today", "🚪", "reduce", "check", 1, "할 일 목록 하나 지우기", "Remove one item from the list"]
  ],
  growth: [
    ["growth-teach", "배운 것을 1분 설명하기", "Explain what you learned for 1 minute", "🎙️", "build", "minutes", 1, "핵심을 한 문장으로 말하기", "Say the key idea in one sentence"],
    ["growth-card", "복습 카드 3개 만들기", "Make three review cards", "🗃️", "build", "count", 3, "질문 하나 쓰기", "Write one question"],
    ["growth-focus", "알림 끄고 15분 배우기", "Learn for 15 minutes with alerts off", "🔕", "repeat", "minutes", 15, "알림 하나 끄기", "Silence one alert"],
    ["growth-mistake", "틀린 문제 하나 다시 풀기", "Retry one missed problem", "🧠", "recover", "check", 1, "틀린 이유 한 단어", "Name one reason it went wrong"],
    ["growth-plan", "다음 학습 시간 예약하기", "Schedule the next learning block", "📅", "project", "check", 1, "가능한 시간 하나 찾기", "Find one possible time"]
  ],
  work: [
    ["work-break", "집중 뒤 3분 쉬기", "Take a 3-minute break after focus", "☕", "recover", "minutes", 3, "자리에서 일어나기", "Stand up"],
    ["work-block", "방해 요소 하나 치우기", "Remove one distraction", "🧱", "reduce", "check", 1, "불필요한 창 하나 닫기", "Close one unneeded window"],
    ["work-delegate", "도움 요청 하나 보내기", "Send one request for help", "🙋", "build", "check", 1, "막힌 점 한 줄 적기", "Write the blocker in one line"],
    ["work-review", "끝낸 일 세 가지 확인", "Review three completed tasks", "📌", "maintain", "count", 3, "끝낸 일 하나 찾기", "Find one completed task"],
    ["work-idea", "아이디어 초안 10분", "Draft an idea for 10 minutes", "💡", "project", "minutes", 10, "제목만 쓰기", "Write only a title"]
  ],
  relationship: [
    ["relationship-memory", "함께한 좋은 기억 한 번 꺼내기", "Recall one good shared memory", "🖼️", "build", "reflection", null, "장소 하나 떠올리기", "Recall one place"],
    ["relationship-help", "도움 필요한지 한 번 묻기", "Ask once if help is needed", "🫶", "build", "check", 1, "짧은 질문 초안", "Draft a short question"],
    ["relationship-repair", "서운했던 일 차분히 정리", "Calmly organize a hurt feeling", "🧵", "recover", "reflection", null, "사실과 느낌을 나눠 적기", "Separate fact from feeling"],
    ["relationship-celebrate", "누군가의 작은 성취 축하", "Celebrate someone's small win", "🎉", "build", "check", 1, "축하 한 문장 쓰기", "Write one congratulatory sentence"],
    ["relationship-device", "대화 중 화면 10분 내려놓기", "Put screens away for 10 minutes", "📵", "maintain", "minutes", 10, "폰을 뒤집어 놓기", "Turn the phone face down"]
  ],
  finance: [
    ["finance-subscription", "구독 하나 사용 여부 확인", "Review one subscription", "🔁", "reduce", "check", 1, "구독 목록 열기", "Open the subscription list"],
    ["finance-receipt", "영수증 세 장 정리", "Sort three receipts", "🧾", "maintain", "count", 3, "영수증 한 장 모으기", "Gather one receipt"],
    ["finance-goal", "저축 목적 한 문장 쓰기", "Write one saving purpose", "🏁", "build", "reflection", null, "원하는 변화 한 단어", "Name one desired change"],
    ["finance-compare", "구매 전 대안 두 개 비교", "Compare two options before buying", "⚖️", "reduce", "count", 2, "구매 목적 적기", "Write the purchase purpose"],
    ["finance-share", "가계 약속 하나 함께 확인", "Review one household money agreement", "🤝", "maintain", "check", 1, "확인할 항목 하나 고르기", "Choose one item to review"]
  ],
  life: [
    ["life-trash", "쓰레기 한 봉투 비우기", "Empty one bag of trash", "🗑️", "maintain", "check", 1, "가장 가까운 쓰레기 줍기", "Pick up the nearest piece"],
    ["life-digital", "파일 다섯 개 정리", "Organize five files", "🗄️", "maintain", "count", 5, "파일 하나 이름 바꾸기", "Rename one file"],
    ["life-repair", "고장 난 것 하나 상태 확인", "Check one broken item", "🔧", "project", "check", 1, "사진 한 장 남기기", "Take one photo"],
    ["life-menu", "내일 한 끼 미리 정하기", "Plan one meal for tomorrow", "🥗", "build", "check", 1, "있는 재료 하나 확인", "Check one ingredient"],
    ["life-reset", "잠들기 전 5분 제자리", "Do a 5-minute evening reset", "🌙", "maintain", "minutes", 5, "타이머 1분 켜기", "Start a 1-minute timer"]
  ],
  experience: [
    ["experience-write", "짧은 창작 한 줄 남기기", "Create one short line", "✒️", "build", "reflection", null, "단어 세 개 고르기", "Choose three words"],
    ["experience-taste", "새로운 맛 한 가지 경험", "Try one new flavor", "🍊", "explore", "check", 1, "후보 하나 저장", "Save one option"],
    ["experience-nature", "자연의 변화 한 가지 보기", "Notice one change in nature", "🍃", "explore", "check", 1, "하늘을 10초 보기", "Look at the sky for 10 seconds"],
    ["experience-event", "가고 싶은 행사 하나 찾기", "Find one event to attend", "🎟️", "project", "check", 1, "관심 분야 하나 적기", "Write one interest"],
    ["experience-share", "좋았던 경험 하나 추천", "Recommend one good experience", "🌟", "build", "check", 1, "한 줄 추천 이유 쓰기", "Write one-line reason"]
  ]
};

export const ADVANCED_GOAL_TEMPLATES = Object.freeze(AREAS.flatMap((area) => definitions[area.id].map((row) => Object.freeze({
  id: row[0], area: area.id, name: row[1], nameEn: row[2], icon: row[3], archetype: row[4], metric: row[5], target: row[6], period: "day",
  why: `${area.name}에서 선택 폭을 넓히되 오늘 끝낼 수 있는 크기로 설계했어요.`,
  whyEn: `This widens choice in ${area.nameEn} while staying finishable today.`, tinyStep: row[7], tinyStepEn: row[8], localeCoverage: ["ko", "en"]
}))));

export const ALL_GOAL_TEMPLATES = Object.freeze([...GOAL_TEMPLATES, ...ADVANCED_GOAL_TEMPLATES]);

const phaseKo = ["환경을 준비해요", "가장 작은 행동을 반복해요", "내 생활에 맞는 시간을 찾아요", "쉬거나 놓친 뒤 돌아오는 법을 연습해요", "도움이 된 조건을 확인해요"];
const phaseEn = ["Prepare the environment", "Repeat the smallest action", "Find a time that fits", "Practice returning after a break", "Review what helped"];
function extendedProgram(area, days) {
  const templates = ALL_GOAL_TEMPLATES.filter((item) => item.area === area.id);
  const steps = Array.from({ length: days }, (_, index) => {
    const template = templates[index % templates.length];
    const phase = Math.min(4, Math.floor(index / Math.max(1, Math.ceil(days / 5))));
    return Object.freeze({ day: index + 1, title: `${phaseKo[phase]}: ${template.tinyStep}`, titleEn: `${phaseEn[phase]}: ${template.tinyStepEn}`, templateId: template.id });
  });
  return Object.freeze({ id: `program-${area.id}-${days}`, area: area.id, days, title: `${area.name} ${days}일 생활 맞춤`, titleEn: `${area.nameEn}: ${days}-day fit`, promise: "완벽한 연속보다 쉬고 돌아오는 방법과 내 생활에 맞는 최소 행동을 찾습니다.", promiseEn: "Find a sustainable minimum and a way to return, rather than chasing a perfect streak.", steps });
}
export const ADVANCED_PROGRAMS = Object.freeze(AREAS.flatMap((area) => [extendedProgram(area, 14), extendedProgram(area, 30)]));
export const ALL_PROGRAMS = Object.freeze([...PROGRAMS, ...ADVANCED_PROGRAMS]);

const contextKinds = [
  ["busy", "바쁜 날", "원래 목표의 준비 행동 하나만 해도 충분해요.", "Busy day", "One setup action from the original goal is enough."],
  ["low-energy", "기운 없는 날", "시간과 횟수를 절반 이하로 낮추고 몸의 신호를 우선해요.", "Low-energy day", "Cut time or count by at least half and prioritize your signals."],
  ["travel", "이동하는 날", "장소와 도구가 없어도 가능한 대체 행동을 골라요.", "Travel day", "Choose an alternative that needs no usual place or tools."],
  ["recovery", "회복 중인 날", "성과를 늘리지 않고 쉬기·알아차리기·도움 요청 중 하나를 골라요.", "Recovery day", "Choose rest, noticing, or asking for help without increasing output."],
  ["restart", "오랜 공백 뒤", "예전 수치를 따라잡지 말고 오늘의 30초 행동부터 새로 연결해요.", "After a long gap", "Do not catch up; reconnect with a 30-second action today."],
  ["no-data", "기록이 적을 때", "평균이나 추세를 만들지 않고 다음 기록 한 건을 위한 질문만 보여줘요.", "With little data", "Do not invent averages or trends; show only a question for the next log."]
];
export const CONTEXT_PACKS = Object.freeze(AREAS.flatMap((area) => contextKinds.map((kind) => Object.freeze({
  id: `${area.id}-${kind[0]}`, area: area.id, context: kind[0], title: `${area.name} · ${kind[1]}`, titleEn: `${area.nameEn} · ${kind[3]}`,
  guidance: `${kind[2]} ${area.guide}`, guidanceEn: `${kind[4]} ${area.guideEn}`
}))));

const advancedInsightKinds = [
  ["timing", "{area} 행동이 나타난 시간대를 비교할 수 있어요. 3일 이상 같은 시간대가 있을 때만 ‘자주’라고 표현합니다.", "Compare when {area} actions appear. We say 'often' only after the same time band appears on at least 3 days."],
  ["condition", "{area} 기록이 있던 날의 메모에서 사용자가 직접 고른 조건만 묶어 보여줘요. 원인이라고 단정하지 않습니다.", "Group only user-selected conditions from days with {area} logs. Do not claim they caused the action."]
];
export const ADVANCED_INSIGHTS = Object.freeze(AREAS.flatMap((area) => advancedInsightKinds.map((kind) => Object.freeze({
  id: `${area.id}-${kind[0]}`, area: area.id, kind: kind[0], text: kind[1].replace("{area}", area.name), textEn: kind[2].replace("{area}", area.nameEn), evidence: "기기 안 3일 이상 기록과 사용자 선택 조건", evidenceEn: "At least 3 on-device days and user-selected conditions"
}))));
export const ALL_INSIGHTS = Object.freeze([...INSIGHT_EXPLANATIONS, ...ADVANCED_INSIGHTS]);

const peerKinds = [
  ["attention", "관심 분포", "내 8개 영역 기록 비율과 동의한 집단의 기록 비율을 나란히 봅니다.", "Attention mix", "Compare your eight-area log mix with an opted-in group's log mix."],
  ["return", "공백 뒤 복귀", "7일 이상 공백 뒤 다시 기록한 비율을 비교합니다. 높고 낮음을 성실성으로 해석하지 않습니다.", "Return after a gap", "Compare return rates after a gap of 7+ days without treating high or low as virtue."],
  ["action-size", "작은 행동 크기", "사용자가 고른 30초·2분·10분 행동 비율을 비교합니다. 건강 상태나 능력을 추정하지 않습니다.", "Small-action size", "Compare selected 30-second, 2-minute, and 10-minute actions without inferring health or ability."]
];
export const PEER_COMPARISON_CARDS = Object.freeze(AREAS.flatMap((area) => peerKinds.map((kind) => Object.freeze({
  id: `${area.id}-${kind[0]}`, area: area.id, metric: kind[0], title: `${area.name} · ${kind[1]}`, titleEn: `${area.nameEn} · ${kind[3]}`, description: kind[2], descriptionEn: kind[4], minimumSample: 30, consentRequired: true, sensitiveSegmentation: false, freshnessDays: 30,
  unavailable: "동의한 실제 표본 30명 이상이 모이기 전에는 수치 대신 비교 방법만 보여줍니다.", unavailableEn: "Until 30+ real opted-in participants exist, show the method without a number."
}))));

const socialKinds = [
  ["invite", "초대", "초대받은 사람만 들어올 수 있어요.", "Invite", "Only invited people can join."],
  ["share", "공유", "목표 원문·메모·기분은 빼고 고른 행동만 공유해요.", "Share", "Share only a chosen action, never goal text, notes, or mood."],
  ["cheer", "응원", "비교나 압박 없이 구체적인 행동을 응원해요.", "Encourage", "Encourage a specific action without comparison or pressure."],
  ["ranking", "순위", "별도 동의한 사람만 7일 행동 횟수에 참여해요.", "Ranking", "Only separately opted-in people join the 7-day action-count ranking."],
  ["leave", "나가기", "이유를 쓰지 않고 언제든 모임에서 나갈 수 있어요.", "Leave", "Leave anytime without giving a reason."],
  ["report", "신고", "정해진 이유로 신고하고 차단 여부를 따로 고를 수 있어요.", "Report", "Report with a defined reason and choose blocking separately."]
];
const socialTones = ["안내", "확인", "완료", "실패", "회복"];
const socialTonesEn = ["Guide", "Confirm", "Complete", "Failed", "Recover"];
const socialStateGuides = [
  ["실행 전에 공개 범위와 취소 방법을 확인하세요.", "Before acting, check visibility and how to cancel."],
  ["대상과 선택한 내용을 다시 확인한 뒤 직접 실행하세요. 취소해도 전송하지 않습니다.", "Review the recipient and selection, then act explicitly. Cancel sends nothing."],
  ["서버가 완료를 확인한 경우에만 완료로 표시합니다. 목록에서 결과를 다시 확인하세요.", "Show completion only after server confirmation; check the result in the list."],
  ["실패하거나 응답을 못 받았다면 성공으로 간주하지 마세요. 재시도 전에 기존 결과를 확인하세요.", "A failure or missing response is not success. Check existing results before retrying."],
  ["연결이 돌아오면 결과를 먼저 확인하세요. 자동으로 다시 전송하지 말고 필요한 경우에만 재시도하세요.", "After reconnecting, check results first. Do not resend automatically; retry only if needed."]
];
export const SOCIAL_SAFETY_MESSAGES = Object.freeze(socialKinds.flatMap((kind) => socialTones.map((tone, index) => Object.freeze({
  id: `${kind[0]}-${index + 1}`, action: kind[0], state: ["guide", "confirm", "complete", "failed", "recover"][index], title: `${kind[1]} · ${tone}`, titleEn: `${kind[3]} · ${socialTonesEn[index]}`, text: `${kind[2]} ${socialStateGuides[index][0]}`, textEn: `${kind[4]} ${socialStateGuides[index][1]}`
}))));

export const ILLUSTRATIVE_CASES = Object.freeze(AREAS.flatMap((area, areaIndex) => [0, 1].map((variant) => Object.freeze({
  id: `${area.id}-case-${variant + 1}`, area: area.id, illustrative: true,
  title: variant === 0 ? `${area.name}: 바쁜 주의 작은 복귀` : `${area.name}: 목표를 낮춘 뒤의 지속`,
  titleEn: variant === 0 ? `${area.nameEn}: a small return in a busy week` : `${area.nameEn}: continuing after resizing`,
  story: variant === 0
    ? `가상 사례 ${areaIndex + 1}A는 이틀을 쉰 뒤 준비 행동 하나만 기록했습니다. 앱은 놓친 양을 채우라고 하지 않고 다음 가능한 행동을 제안했습니다.`
    : `가상 사례 ${areaIndex + 1}B는 목표를 절반으로 낮추고 일주일 동안 가능한 날만 기록했습니다. 결과는 성과 보장이 아니라 기능 사용 예시입니다.`,
  storyEn: variant === 0
    ? `Illustrative case ${areaIndex + 1}A rested for two days, then logged one setup action. The app suggested the next possible action instead of catch-up.`
    : `Illustrative case ${areaIndex + 1}B halved the goal and logged only on possible days for a week. This demonstrates use, not a promised outcome.`
}))));

const advancedFaqSeeds = [
  ["insight-1", "통찰", "통찰은 원인을 알려주나요?", "아니요. 함께 나타난 기록을 설명할 뿐 원인이나 효과로 단정하지 않습니다.", "Do insights identify causes?", "No. They describe co-occurring logs without claiming cause or effect."],
  ["insight-2", "통찰", "비슷한 사람은 어떻게 정하나요?", "현재는 비교 방법 안내만 제공하며 실제 비슷한 사용자 집단을 계산하지 않습니다. 향후에도 민감정보를 추정하거나 건강·재무 상태로 집단을 나누지 않는 것이 공개 조건입니다.", "How are similar people defined?", "Currently only comparison methods are explained; no real similar-user cohort is computed. Publication must not infer sensitive traits or segment by health or financial status."],
  ["insight-3", "통찰", "평균 데이터는 실제 사람의 것인가요?", "현재 실제 평균은 표시하지 않습니다. 향후 동의·표본 수·신선도·철회 반영 검증이 모두 충족돼야 하며 가상 사례를 실제 평균의 근거로 사용하지 않습니다.", "Is average data from real people?", "No real average is currently displayed. Future publication requires verified consent, sample size, freshness and withdrawal handling. Illustrative cases cannot substantiate a real average."],
  ["insight-4", "통찰", "표본이 적으면 왜 숫자를 숨기나요?", "개인을 짐작할 위험과 흔들리는 결론을 줄이기 위해 30명 미만 구간은 공개하지 않습니다.", "Why hide small samples?", "Segments under 30 are suppressed to reduce re-identification risk and unstable conclusions."],
  ["insight-5", "통찰", "내 기록과 평균이 다르면 나쁜가요?", "아니요. 비교는 관심의 차이를 살피는 참고이며 점수나 정상 범위를 뜻하지 않습니다.", "Is it bad to differ from average?", "No. Comparison is context, not a score or normal range."],
  ["program-1", "프로그램", "14일과 30일 프로그램의 차이는 무엇인가요?", "14일은 생활 시간 찾기, 30일은 공백 뒤 복귀와 유지 조건 확인까지 다룹니다.", "How do 14- and 30-day programs differ?", "Fourteen days focuses on fit; thirty adds returning after gaps and reviewing maintenance conditions."],
  ["program-2", "프로그램", "프로그램 도중 목표를 바꿔도 되나요?", "네. 기록 이력을 보존하면서 행동 크기·시간·종류를 바꿀 수 있어요.", "Can I change a goal during a program?", "Yes. Resize, reschedule, or replace the action while preserving history."],
  ["program-3", "프로그램", "아픈 날도 프로그램을 계속해야 하나요?", "아니요. 쉬기를 선택하고 필요하면 의료 전문가의 안내를 우선하세요.", "Should I continue when ill?", "No. Choose rest and prioritize guidance from a qualified health professional when needed."],
  ["program-4", "프로그램", "완료율을 친구와 비교하나요?", "현재 안내 프로그램은 완료율을 추적하거나 친구에게 전송하지 않습니다. 첫 단계를 목표로 추가한 뒤의 개별 행동 기록과 프로그램 전체 완료는 서로 다릅니다.", "Is program completion compared with friends?", "Current program guides neither track completion percentages nor send them to friends. Logging an individual goal added from the first step is not completion of the whole program."],
  ["program-5", "프로그램", "중간에 멈춘 프로그램을 삭제해야 하나요?", "안내 목록은 읽기용이므로 삭제할 진행 상태가 없습니다. 원하는 단계부터 다시 읽을 수 있지만 앱이 중단 위치를 자동 기억하지는 않습니다.", "Must I delete a paused program?", "The readable guides have no stored progress state to delete. You can revisit any step, but the app does not automatically remember a paused position."],
  ["context-1", "상황", "바쁜 날 추천은 어떻게 달라지나요?", "상황 안내 목록에서 준비 행동이나 작은 대안의 설명을 읽을 수 있습니다. 현재 이 목록이 내 일정을 분석하거나 목표를 자동 변경하지는 않습니다.", "How do busy-day suggestions change?", "The context library explains setup actions and smaller alternatives. It does not currently analyze your schedule or automatically change your goals."],
  ["context-2", "상황", "여행 중에도 기록할 수 있나요?", "네. 장소와 도구가 필요 없는 대체 행동을 고를 수 있어요.", "Can I log while traveling?", "Yes. Choose an alternative that needs no usual place or tools."],
  ["context-3", "상황", "기운이 없다고 적으면 건강을 진단하나요?", "아니요. 행동 크기를 낮추는 선택만 돕고 건강 상태를 추정하거나 진단하지 않습니다.", "Does low energy trigger a diagnosis?", "No. It only helps resize actions and never infers or diagnoses health."],
  ["context-4", "상황", "오래 쉰 뒤 과거 목표를 따라잡아야 하나요?", "아니요. 밀린 양은 만들지 않으며 오늘 가능한 최소 행동부터 연결합니다.", "Must I catch up after a long gap?", "No. There is no backlog; reconnect with today's minimum."],
  ["context-5", "상황", "추천이 맞지 않으면 어떻게 하나요?", "숨기기, 목표 낮추기, 다른 시간, 쉬기 중 하나를 고르거나 직접 목표를 만들 수 있어요.", "What if a suggestion does not fit?", "Hide, resize, reschedule, rest, or create your own goal."],
  ["safety-1", "안전", "해피스캔은 의료 조언을 하나요?", "아니요. 생활 행동 기록 도구이며 증상·치료·약물 결정은 의료 전문가와 상의해야 합니다.", "Does HappyScan give medical advice?", "No. It is not medical advice; consult qualified professionals for symptoms, treatment, or medication decisions."],
  ["safety-2", "안전", "재무 목표가 투자 조언인가요?", "아니요. 소비와 저축 행동을 돌아보는 기능이며 투자·세금·대출 조언을 제공하지 않습니다.", "Are money goals investment advice?", "No. They support spending reflection and do not provide investment, tax, or lending advice."],
  ["safety-3", "안전", "긴급한 위험 상황에는 어떻게 하나요?", "앱 기록보다 현지 긴급 서비스와 신뢰할 수 있는 사람의 즉각적인 도움을 우선하세요.", "What about an urgent danger?", "Prioritize local emergency services and immediate help from a trusted person over app logging."],
  ["safety-4", "안전", "다른 사람의 기록을 볼 수 있나요?", "기본 로컬 모드는 다른 사람의 실제 기록을 불러오지 않습니다. 운영판 공유는 명시적으로 선택한 항목에만 한정돼야 하며 개인 메모와 기분의 비공개성은 별도 접근권한 시험이 필요합니다.", "Can I see another person's records?", "Default local mode does not load other people's real records. Production sharing must be limited to explicit choices; privacy of notes and mood requires separate access-control tests."],
  ["safety-5", "안전", "차단하면 상대에게 알림이 가나요?", "차단을 상대에게 직접 알리지 않는 것이 설계 원칙입니다. 현재 로컬 화면의 차단 상태만으로 원격 알림·접근 제한까지 검증됐다고 볼 수는 없습니다.", "Does blocking notify the other person?", "The design is not to announce blocking directly. A local blocked state alone does not verify remote notification behavior or access restrictions."],
  ["quality-1", "품질", "콘텐츠는 얼마나 자주 점검하나요?", "계획상 안전·운영 문구는 90일, 일반 도움말은 180일 안에 다시 확인합니다. 현재 확인일은 2026-09-04이며 운영 검토 일정은 아직 개통되지 않았습니다.", "How often is content reviewed?", "The plan calls for safety and operations review within 90 days and general help within 180. This content is dated 2026-09-04; the ongoing operational review schedule is not active yet."],
  ["quality-2", "품질", "번역이 이상하면 어떻게 하나요?", "지원 경로로 화면·문구·언어를 알려 주세요. 의미가 다른 번역은 높은 우선순위로 고칩니다.", "What if a translation is wrong?", "Report the screen, text, and language through support. Meaning-changing errors receive high priority."],
  ["quality-3", "품질", "가상 사례는 실제 후기인가요?", "아니요. 기능 사용법을 설명하기 위한 예시이며 실제 사용자 성과로 표시하지 않습니다.", "Are illustrative cases testimonials?", "No. They demonstrate product use and are never presented as real outcomes."],
  ["quality-4", "품질", "추천 문구가 부담스러우면 바꿀 수 있나요?", "네. 부드러운·구조적인·분석적인·도전적인·함께하는 말투와 강도를 고를 수 있어요.", "Can I change pressuring coach copy?", "Yes. Choose among five tones and three intensity levels."],
  ["quality-5", "품질", "틀린 콘텐츠를 신고할 수 있나요?", "나 탭의 지원 정보를 확인하세요. 공개 지원 채널이 개통되지 않았다면 이 앱에서 신고 접수나 답변을 보장하지 않습니다. 문구 위치와 설명만 준비하고 개인 기록 원문은 보내지 마세요.", "Can I report incorrect content?", "Check support information under Me. Until a public support channel is active, the app cannot guarantee report delivery or a reply. Prepare the location and description, not private journal text."],
  ["export-1", "이동", "다른 기기로 기록을 옮길 수 있나요?", "JSON을 내보낸 뒤 다른 기기에서 가져오기 비교 화면으로 확인하세요. 클라우드 경로는 실제 운영 연결·로그인·보호본 생성 성공이 확인된 경우에만 사용하세요.", "Can I move records to another device?", "Export JSON, then review it in the import comparison on the other device. Use the cloud route only after a working production connection, sign-in, and successful copy creation have been confirmed."],
  ["export-2", "이동", "가져오기 충돌은 어떻게 처리하나요?", "같은 항목의 현재 값과 파일 값을 나란히 보여 주고 기본값은 현재 기록 보존입니다.", "How are import conflicts handled?", "Current and imported values are shown side by side, with keeping current data as the default."],
  ["export-3", "이동", "CSV는 무엇을 담나요?", "선택한 기간의 날짜·목표·행동 수처럼 표로 보기 좋은 항목을 담고 비공개 메모 포함 여부를 따로 묻습니다.", "What is included in CSV?", "It contains tabular fields such as date, goal, and action count; private notes require a separate choice."],
  ["export-4", "이동", "내보낸 파일도 보호해야 하나요?", "네. 파일은 앱 밖에 있으므로 공유 저장소나 공용 기기에 둘 때 사용자가 직접 보호해야 합니다.", "Should exported files be protected?", "Yes. Outside the app, you must protect them on shared storage or devices."],
  ["export-5", "이동", "오래된 백업인지 알 수 있나요?", "파일의 만든 날짜와 앱 판, 목표·기록 수를 가져오기 전에 보여 줍니다.", "Can I tell whether a backup is old?", "Its creation date, app version, and goal/log counts appear before import."]
];
export const ADVANCED_FAQS = Object.freeze(advancedFaqSeeds.map((row) => Object.freeze({ id: row[0], category: row[1], q: row[2], a: row[3], qEn: row[4], aEn: row[5] })));
export const ALL_FAQS = Object.freeze([...FAQS, ...ADVANCED_FAQS]);

export const STAGE2_COUNTS = Object.freeze({
  goalTemplates: ALL_GOAL_TEMPLATES.length,
  programs: ALL_PROGRAMS.length,
  programSteps: ALL_PROGRAMS.reduce((sum, item) => sum + item.steps.length, 0),
  contextPacks: CONTEXT_PACKS.length,
  insightExplanations: ALL_INSIGHTS.length,
  peerComparisonCards: PEER_COMPARISON_CARDS.length,
  socialSafetyMessages: SOCIAL_SAFETY_MESSAGES.length,
  illustrativeCases: ILLUSTRATIVE_CASES.length,
  faqs: ALL_FAQS.length
});
