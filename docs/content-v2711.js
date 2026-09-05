/* HappyScan stage-1 content library: one reviewed source for UI, tests, and offline use. */
export const CONTENT_VERSION = "v27.1.1-stage1";
export const CONTENT_REVIEWED_AT = "2026-09-04";

export const AREAS = Object.freeze([
  { id: "health", name: "건강·운동", nameEn: "Health & movement", icon: "🏃", guide: "몸의 신호를 존중하며 무리 없는 움직임을 쌓아요.", guideEn: "Build gentle movement while respecting your body's signals." },
  { id: "mind", name: "마음·회복", nameEn: "Mind & recovery", icon: "🌿", guide: "감정을 평가하지 않고 쉬고 돌아오는 힘을 키워요.", guideEn: "Notice feelings without judgment and strengthen your return." },
  { id: "growth", name: "학습·성장", nameEn: "Learning & growth", icon: "📚", guide: "짧게 시작하고 기억에 남는 배움을 반복해요.", guideEn: "Start briefly and repeat learning that sticks." },
  { id: "work", name: "일·창작", nameEn: "Work & making", icon: "🛠️", guide: "가장 작은 다음 결과물에 집중해 일을 앞으로 옮겨요.", guideEn: "Move work forward by focusing on the smallest next output." },
  { id: "relationship", name: "관계·가족", nameEn: "Relationships & family", icon: "💛", guide: "부담 없는 관심 표현으로 중요한 관계를 돌봐요.", guideEn: "Care for important relationships with low-pressure attention." },
  { id: "finance", name: "재무·소비", nameEn: "Money & spending", icon: "🪙", guide: "비난 없이 선택을 돌아보고 작은 여유를 만들어요.", guideEn: "Review choices without blame and create a little room." },
  { id: "life", name: "생활·환경", nameEn: "Home & daily life", icon: "🏠", guide: "눈앞의 한 곳부터 정돈해 일상의 마찰을 줄여요.", guideEn: "Reduce daily friction by tending to one visible place." },
  { id: "experience", name: "취미·경험", nameEn: "Joy & experiences", icon: "✨", guide: "호기심을 작은 경험으로 바꾸고 삶의 폭을 넓혀요.", guideEn: "Turn curiosity into small experiences that widen life." }
]);

const t = (id, area, name, nameEn, icon, archetype, metric, target, why, whyEn, tinyStep, tinyStepEn) => Object.freeze({
  id, area, name, nameEn, icon, archetype, metric, target, period: "day", why, whyEn, tinyStep, tinyStepEn, localeCoverage: ["ko", "en"]
});

export const GOAL_TEMPLATES = Object.freeze([
  t("health-walk", "health", "10분 가볍게 걷기", "Take a gentle 10-minute walk", "🚶", "repeat", "minutes", 10, "짧은 걷기는 준비 부담이 낮아요.", "A short walk has a low barrier to start.", "신발을 신거나 현관 앞까지 가기", "Put on shoes or walk to the door"),
  t("health-stretch", "health", "3분 천천히 스트레칭", "Stretch slowly for 3 minutes", "🤸", "repeat", "minutes", 3, "짧게 몸을 풀어 긴장을 알아차려요.", "A brief stretch helps you notice tension.", "어깨를 한 번 돌리기", "Roll your shoulders once"),
  t("health-water", "health", "물 한 잔 마시기", "Drink one glass of water", "💧", "maintain", "check", 1, "바로 실행하고 확인하기 쉬워요.", "It is immediate and easy to confirm.", "컵에 물을 반만 따르기", "Pour half a glass of water"),
  t("health-air", "health", "바깥 공기 5분 쐬기", "Get 5 minutes of fresh air", "🌤️", "recover", "minutes", 5, "장소를 잠깐 바꾸면 쉬는 계기가 생겨요.", "A brief change of place can create a pause.", "창문을 열고 바깥 보기", "Open a window and look outside"),
  t("health-bed", "health", "잠들기 전 화면 내려놓기", "Put screens down before sleep", "🌙", "reduce", "check", 1, "잠들기 전 자극을 줄이는 선택을 기록해요.", "Record a choice to reduce stimulation before sleep.", "화면 밝기를 낮추기", "Lower the screen brightness"),

  t("mind-breathe", "mind", "깊은 숨 3번", "Take three deep breaths", "🌬️", "recover", "check", 1, "30초 안에 마음의 속도를 알아차릴 수 있어요.", "Notice your pace in under 30 seconds.", "숨을 한 번 길게 내쉬기", "Take one long exhale"),
  t("mind-gratitude", "mind", "고마웠던 일 한 줄", "Write one grateful line", "✍️", "recover", "reflection", null, "좋았던 순간을 억지 없이 붙잡아 둬요.", "Hold onto a good moment without forcing it.", "한 단어만 적기", "Write just one word"),
  t("mind-checkin", "mind", "지금 기분 한 단어 기록", "Name your mood in one word", "🫧", "maintain", "reflection", null, "감정을 해결하기 전에 먼저 알아차려요.", "Notice a feeling before trying to fix it.", "편함·보통·버거움 중 하나 고르기", "Choose easy, okay, or heavy"),
  t("mind-pause", "mind", "2분 아무것도 하지 않기", "Pause for 2 minutes", "⏸️", "recover", "minutes", 2, "해야 할 일을 잠깐 내려놓는 연습이에요.", "Practice putting tasks down briefly.", "30초 타이머 켜기", "Start a 30-second timer"),
  t("mind-kind", "mind", "나에게 친절한 문장 쓰기", "Write a kind sentence to yourself", "💚", "build", "reflection", null, "실수 뒤의 자기비난을 줄이는 말을 남겨요.", "Leave words that soften self-blame after a setback.", "친구에게 할 말을 나에게 쓰기", "Write what you would tell a friend"),

  t("growth-read", "growth", "책 5쪽 읽기", "Read five pages", "📖", "build", "count", 5, "짧고 선명한 분량은 다시 시작하기 쉬워요.", "A small, clear amount is easy to restart.", "책을 펼쳐 한 문장 읽기", "Open the book and read one sentence"),
  t("growth-review", "growth", "배운 것 3줄 복습", "Review learning in three lines", "📝", "maintain", "count", 3, "기억에서 꺼내 쓰면 이해가 또렷해져요.", "Retrieval makes understanding clearer.", "핵심 단어 하나 적기", "Write one key term"),
  t("growth-language", "growth", "외국어 표현 5개 익히기", "Learn five foreign-language phrases", "🗣️", "build", "count", 5, "작은 묶음은 매일 반복하기 좋아요.", "Small sets are easy to repeat daily.", "표현 하나 소리 내어 읽기", "Read one phrase aloud"),
  t("growth-question", "growth", "궁금한 것 하나 찾아보기", "Explore one question", "🔎", "explore", "check", 1, "호기심을 실제 탐색으로 바꿔요.", "Turn curiosity into a real exploration.", "질문을 한 문장으로 쓰기", "Write the question in one sentence"),
  t("growth-practice", "growth", "배운 기술 10분 연습", "Practice a skill for 10 minutes", "🧩", "repeat", "minutes", 10, "짧은 반복이 지식과 실제 행동을 연결해요.", "A short repetition connects knowledge to action.", "도구나 자료를 꺼내기", "Take out the tool or material"),

  t("work-focus", "work", "집중 작업 25분", "Do 25 minutes of focused work", "🧑‍💻", "project", "minutes", 25, "한 번의 집중 구간으로 진입 장벽을 낮춰요.", "One focus block lowers the barrier to entry.", "필요한 파일 하나 열기", "Open the one file you need"),
  t("work-priority", "work", "오늘 가장 중요한 일 하나 고르기", "Choose today's most important task", "🎯", "project", "check", 1, "선택을 줄이면 시작 지점이 선명해져요.", "Fewer choices make the starting point clearer.", "후보 세 개를 적기", "List three candidates"),
  t("work-output", "work", "작은 결과물 하나 끝내기", "Finish one small output", "✅", "project", "check", 1, "완료 가능한 크기로 일을 쪼개요.", "Break work into a finishable size.", "완료 기준을 한 줄로 쓰기", "Write the done condition in one line"),
  t("work-inbox", "work", "미뤄둔 답장 하나 보내기", "Send one delayed reply", "📨", "maintain", "check", 1, "작은 미결정을 하나 닫아 마음의 짐을 줄여요.", "Close one open loop and reduce mental load.", "답장 첫 문장만 쓰기", "Write only the first sentence"),
  t("work-close", "work", "일 마치기 전 내일 첫 행동 적기", "Write tomorrow's first action before stopping", "🗓️", "maintain", "check", 1, "다음 시작의 마찰을 미리 줄여요.", "Reduce friction for the next start.", "동사로 시작하는 한 줄 쓰기", "Write one line starting with a verb"),

  t("relationship-hello", "relationship", "안부 한 번 전하기", "Send one check-in", "💬", "repeat", "check", 1, "짧은 관심 표현은 관계를 이어 줘요.", "A brief check-in keeps connection alive.", "이름 하나 떠올리기", "Think of one person's name"),
  t("relationship-thanks", "relationship", "고마움 한 번 표현하기", "Express thanks once", "💌", "build", "check", 1, "구체적인 감사는 좋은 순간을 함께 확인하게 해요.", "Specific thanks helps both people notice a good moment.", "고마웠던 행동 하나 적기", "Name one helpful action"),
  t("relationship-listen", "relationship", "5분 동안 끼어들지 않고 듣기", "Listen for 5 minutes without interrupting", "👂", "repeat", "minutes", 5, "조언보다 먼저 상대의 말을 위한 자리를 만들어요.", "Make room for their words before advice.", "질문 하나 준비하기", "Prepare one question"),
  t("relationship-plan", "relationship", "함께할 약속 하나 제안하기", "Suggest one shared plan", "🤝", "project", "check", 1, "막연한 마음을 구체적인 만남으로 옮겨요.", "Turn good intent into a concrete meeting.", "가능한 시간 하나 확인하기", "Check one possible time"),
  t("relationship-boundary", "relationship", "필요한 경계 한 문장 말하기", "State one needed boundary", "🛡️", "maintain", "check", 1, "관계를 지키기 위해 가능한 범위를 분명히 해요.", "Clarify what is possible to protect the relationship.", "나는 문장으로 초안 쓰기", "Draft an I-statement"),

  t("finance-review", "finance", "오늘의 소비 한 건 돌아보기", "Review one purchase today", "🧾", "reduce", "reflection", null, "비난 없이 선택의 이유를 알아봐요.", "Understand the reason behind a choice without blame.", "금액과 목적만 적기", "Write only the amount and purpose"),
  t("finance-no-spend", "finance", "사지 않을 것 하나 정하기", "Choose one thing not to buy", "🚫", "reduce", "check", 1, "금지보다 오늘의 한 선택에 집중해요.", "Focus on one choice today rather than a broad ban.", "구매를 10분 미루기", "Delay the purchase by 10 minutes"),
  t("finance-check", "finance", "잔액과 예정 지출 2분 확인", "Check balance and planned spending for 2 minutes", "🔍", "maintain", "minutes", 2, "모르는 불안을 작은 확인으로 바꿔요.", "Turn vague worry into a small check.", "은행 앱을 열지 않고 예정 지출 하나 적기", "Write one planned expense before opening an app"),
  t("finance-save", "finance", "작은 금액 따로 두기", "Set aside a small amount", "🐷", "build", "check", 1, "금액보다 반복 가능한 행동을 먼저 만들어요.", "Build a repeatable action before focusing on amount.", "가능한 최소 금액 정하기", "Choose the smallest feasible amount"),
  t("finance-plan", "finance", "이번 주 돈 쓸 곳 3개 적기", "List three spending needs this week", "📋", "project", "count", 3, "예상 가능한 지출을 먼저 보이게 해요.", "Make predictable spending visible first.", "필수 지출 하나 적기", "Write one essential expense"),

  t("life-desk", "life", "책상 위 한 곳 정리", "Tidy one spot on your desk", "🧹", "maintain", "check", 1, "범위를 좁히면 정리를 시작하기 쉬워요.", "A narrow scope makes tidying easier to start.", "버릴 것 하나 고르기", "Choose one item to discard"),
  t("life-dish", "life", "그릇 3개 정리", "Put away three dishes", "🍽️", "maintain", "count", 3, "작은 개수로 생활의 막힘을 줄여요.", "A small count reduces household friction.", "그릇 하나 물에 담그기", "Soak one dish"),
  t("life-laundry", "life", "빨래 5개 개기", "Fold five pieces of laundry", "🧺", "maintain", "count", 5, "끝낼 수 있는 묶음만 다뤄요.", "Handle only a batch you can finish.", "한 장만 펼치기", "Lay out one item"),
  t("life-ready", "life", "내일 필요한 것 하나 준비", "Prepare one thing for tomorrow", "🎒", "build", "check", 1, "아침의 작은 결정을 미리 줄여요.", "Remove one small decision from the morning.", "내일 첫 일정 확인하기", "Check tomorrow's first event"),
  t("life-air", "life", "방 한 곳 5분 환기", "Air one room for 5 minutes", "🪟", "maintain", "minutes", 5, "눈에 보이는 환경 변화를 짧게 만들어요.", "Create a brief, visible change in your space.", "창문 하나 열기", "Open one window"),

  t("experience-place", "experience", "새로운 장소 한 곳 가기", "Visit one new place", "🗺️", "explore", "check", 1, "익숙한 하루에 작은 새로움을 더해요.", "Add a little novelty to a familiar day.", "근처 후보 한 곳 저장하기", "Save one nearby option"),
  t("experience-music", "experience", "처음 듣는 음악 한 곡", "Listen to one new song", "🎧", "explore", "check", 1, "짧은 감각 경험으로 호기심을 열어요.", "Open curiosity with a short sensory experience.", "추천 목록 첫 곡 재생", "Play the first recommendation"),
  t("experience-photo", "experience", "오늘의 장면 한 장 남기기", "Capture one scene from today", "📷", "build", "check", 1, "평범한 하루에서 기억할 장면을 찾아요.", "Find a moment worth remembering in an ordinary day.", "눈에 머문 것을 한 번 보기", "Notice what catches your eye"),
  t("experience-hobby", "experience", "취미 10분 맛보기", "Try a hobby for 10 minutes", "🎨", "explore", "minutes", 10, "잘해야 한다는 부담 없이 경험을 시작해요.", "Begin without pressure to be good at it.", "도구 하나 꺼내기", "Take out one tool"),
  t("experience-route", "experience", "익숙한 길을 조금 다르게 걷기", "Take a slightly different route", "🧭", "explore", "check", 1, "큰 계획 없이도 일상에 발견을 만들어요.", "Create discovery without a big plan.", "갈림길 하나에서 다른 쪽 고르기", "Choose a different turn once")
]);

export const PURPOSES = Object.freeze(AREAS.map((area) => Object.freeze({
  id: area.id,
  label: area.name,
  labelEn: area.nameEn,
  copy: area.guide,
  copyEn: area.guideEn,
  starterIds: GOAL_TEMPLATES.filter((item) => item.area === area.id).slice(0, 3).map((item) => item.id)
})));

const programThemes = Object.freeze({
  health: ["신발 꺼내기", "3분 걷기", "물 한 잔 더하기", "5분 걷기", "몸 상태 한 줄", "10분 걷기", "다음 주 최소 행동 고르기"],
  mind: ["긴 숨 한 번", "기분 한 단어", "2분 멈춤", "고마움 한 줄", "친절한 문장", "쉬는 선택 기록", "돌아올 문장 정하기"],
  growth: ["자료 펼치기", "5분 읽기", "핵심 단어 하나", "질문 하나", "10분 연습", "세 줄 복습", "다음 배움 고르기"],
  work: ["파일 하나 열기", "완료 기준 한 줄", "10분 집중", "답장 하나", "25분 집중", "작은 결과물 마침", "다음 첫 행동 적기"],
  relationship: ["한 사람 떠올리기", "안부 보내기", "고마움 말하기", "질문 하나", "5분 듣기", "약속 제안", "다음 관심 행동 고르기"],
  finance: ["지출 하나 적기", "구매 10분 미루기", "잔액 2분 확인", "필수 지출 하나", "작은 금액 따로 두기", "주간 지출 3개", "다음 주 한 선택 고르기"],
  life: ["물건 하나 제자리", "그릇 하나", "책상 한 구역", "빨래 세 장", "5분 환기", "내일 물건 준비", "다음 정돈 구역 고르기"],
  experience: ["호기심 하나 적기", "새 음악 한 곡", "장면 한 장", "다른 길 한 번", "취미 5분", "새 장소 한 곳", "다음 경험 예약하기"]
});
const programThemesEn = Object.freeze({
  health: ["Set out shoes", "Walk 3 minutes", "Add one glass of water", "Walk 5 minutes", "Note how your body feels", "Walk 10 minutes", "Choose next week's minimum"],
  mind: ["Take one long breath", "Name one feeling", "Pause 2 minutes", "Write one grateful line", "Write a kind sentence", "Record a rest choice", "Choose a return phrase"],
  growth: ["Open your material", "Read 5 minutes", "Write one key term", "Ask one question", "Practice 10 minutes", "Review in three lines", "Choose the next lesson"],
  work: ["Open one file", "Write one done condition", "Focus 10 minutes", "Send one reply", "Focus 25 minutes", "Finish a small output", "Write the next first action"],
  relationship: ["Think of one person", "Send a check-in", "Express thanks", "Ask one question", "Listen 5 minutes", "Suggest a plan", "Choose the next caring action"],
  finance: ["Write one expense", "Delay a purchase 10 minutes", "Check balance 2 minutes", "Name one essential cost", "Set aside a small amount", "List three weekly costs", "Choose one next-week decision"],
  life: ["Put one item away", "Handle one dish", "Tidy one desk area", "Fold three items", "Air a room 5 minutes", "Prepare one item for tomorrow", "Choose the next tidy area"],
  experience: ["Write one curiosity", "Play one new song", "Capture one scene", "Take one different turn", "Try a hobby 5 minutes", "Visit one new place", "Schedule the next experience"]
});

export const PROGRAMS = Object.freeze(AREAS.map((area) => Object.freeze({
  id: `program-${area.id}-7`, area: area.id, days: 7,
  title: `${area.name} 7일 가벼운 시작`, titleEn: `${area.nameEn}: a gentle 7-day start`,
  promise: "하루를 놓쳐도 처음부터 다시 할 필요 없이 다음 가능한 행동으로 이어갑니다.",
  promiseEn: "If you miss a day, continue with the next possible action instead of restarting.",
  steps: programThemes[area.id].map((title, index) => Object.freeze({ day: index + 1, title, titleEn: programThemesEn[area.id][index] }))
})));

const insightKinds = [
  { id: "attention", ko: "최근 14일 동안 {area} 기록이 가장 자주 나타났어요. 기록 횟수만 본 결과이며 삶의 가치나 성과를 평가하지 않아요.", en: "{area} appeared most often in the last 14 days. This uses log counts only and does not judge value or success." },
  { id: "return", ko: "공백 뒤 {area} 행동으로 다시 돌아온 기록이 있어요. 돌아온 날짜와 행동을 함께 확인할 수 있어요.", en: "There is a return to {area} after a gap. You can review the return date and action together." },
  { id: "unknown", ko: "{area}의 흐름을 말하기에는 아직 기록이 부족해요. 결론을 만들지 않고 다음 작은 기록을 기다립니다.", en: "There is not enough data to describe your {area} pattern. We wait for another small log instead of inventing a conclusion." }
];
export const INSIGHT_EXPLANATIONS = Object.freeze(AREAS.flatMap((area) => insightKinds.map((kind) => Object.freeze({
  id: `${area.id}-${kind.id}`, area: area.id, kind: kind.id,
  text: kind.ko.replace("{area}", area.name), textEn: kind.en.replace("{area}", area.nameEn),
  evidence: kind.id === "unknown" ? "기록 3일 미만" : "기기 안 날짜·행동 횟수", evidenceEn: kind.id === "unknown" ? "Fewer than 3 recorded days" : "On-device dates and action counts"
}))));

const situations = [
  { id: "first", ko: "첫 행동을 30초 크기로 줄여 보세요.", en: "Shrink the first action to 30 seconds." },
  { id: "steady", ko: "지금의 작은 흐름을 그대로 한 번 더 이어 보세요.", en: "Repeat the small rhythm you already have." },
  { id: "return", ko: "쉰 날은 실패가 아니에요. 오늘 가능한 크기로 돌아오세요.", en: "A rest day is not failure. Return at today's possible size." },
  { id: "busy", ko: "바쁜 날에는 준비 행동 하나만 해도 기록할 가치가 있어요.", en: "On a busy day, even one setup action is worth recording." },
  { id: "stuck", ko: "막혔다면 목표를 절반으로 낮추거나 다른 시간으로 옮겨 보세요.", en: "If stuck, halve the goal or move it to another time." },
  { id: "done", ko: "오늘 한 일을 확인하고 더 하지 않아도 괜찮아요.", en: "Notice what you did today; you do not have to add more." },
  { id: "rest", ko: "쉬기로 한 선택도 내 상태를 돌보는 기록입니다.", en: "Choosing rest is also a record of caring for your state." },
  { id: "reflect", ko: "잘잘못 대신 도움이 된 조건 하나를 찾아보세요.", en: "Instead of judging, find one condition that helped." }
];
const tones = [
  { id: "warm", ko: "괜찮아요.", en: "It is okay." },
  { id: "structured", ko: "다음 한 단계만 정리할게요.", en: "Let's organize just the next step." },
  { id: "analytical", ko: "최근 기록만 기준으로 보면,", en: "Based only on recent logs," },
  { id: "challenge", ko: "작게라도 지금 움직여 봅시다.", en: "Let's move now, even in a small way." },
  { id: "together", ko: "혼자 하지 않아도 돼요.", en: "You do not have to do this alone." }
];
const intensities = [
  { id: "gentle", ko: "원할 때 선택하세요.", en: "Choose it when you want." },
  { id: "balanced", ko: "지금 가능한지 한 번 확인해 보세요.", en: "Check whether it feels possible now." },
  { id: "active", ko: "가능하면 지금 바로 한 번 눌러 기록하세요.", en: "If possible, log one action now." }
];
export const COACH_MESSAGES = Object.freeze(tones.flatMap((tone) => situations.flatMap((situation) => intensities.map((intensity) => Object.freeze({
  id: `${tone.id}-${situation.id}-${intensity.id}`, tone: tone.id, situation: situation.id, intensity: intensity.id,
  text: `${tone.ko} ${situation.ko} ${intensity.ko}`, textEn: `${tone.en} ${situation.en} ${intensity.en}`
})))));

const stateKinds = [
  { id: "empty", ko: "아직 {area} 기록이 없어요. 가장 작은 행동 하나를 골라 시작할 수 있어요.", en: "No {area} logs yet. Start by choosing the smallest action." },
  { id: "loading", ko: "{area} 기록을 이 기기에서 불러오고 있어요.", en: "Loading {area} records from this device." },
  { id: "error", ko: "{area} 기록을 읽지 못했어요. 원본을 바꾸지 않았고 다시 시도할 수 있어요.", en: "We could not read {area} records. The original was not changed, and you can retry." },
  { id: "offline", ko: "오프라인입니다. {area} 기록은 이 기기에 먼저 저장되고 연결 뒤에도 그대로 남아요.", en: "You are offline. {area} logs save on this device first and remain after reconnection." },
  { id: "complete", ko: "오늘의 {area} 행동을 기록했어요. 더 하지 않고 쉬어도 괜찮아요.", en: "Today's {area} action is logged. It is okay to stop and rest." }
];
export const STATE_MESSAGES = Object.freeze(AREAS.flatMap((area) => stateKinds.map((kind) => Object.freeze({
  id: `${area.id}-${kind.id}`, area: area.id, state: kind.id,
  text: kind.ko.replace("{area}", area.name), textEn: kind.en.replace("{area}", area.nameEn)
}))));

const notificationPresets = ["gentle", "focus", "together", "deadline", "quiet"];
const notificationStyle = {
  gentle: ["부담되면 이번에는 쉬어도 괜찮아요.", "It is okay to skip this time if it feels too much."],
  focus: ["지금 가능한 행동 하나만 선택하세요.", "Choose just one action that fits right now."],
  together: ["함께할지는 직접 고르며 기록은 자동 공유하지 않아요.", "You choose whether to join others; logs are not shared automatically."],
  deadline: ["날짜보다 내 상황을 우선하고 필요하면 일정을 바꾸세요.", "Prioritize your circumstances and adjust the date if needed."],
  quiet: ["조용한 방식은 앱 안에서 확인하며 추가 소리를 요구하지 않아요.", "The quiet option can be checked in the app without requesting extra sound."]
};
const notificationEvents = [
  { id: "next-action", ko: "오늘 가능한 한 걸음을 골라 두었어요.", en: "Your next possible step is ready." },
  { id: "return", ko: "공백은 괜찮아요. 30초 행동부터 다시 시작할 수 있어요.", en: "A gap is okay. You can return with a 30-second action." },
  { id: "weekly", ko: "이번 주 기록을 판단 없이 돌아볼 시간이에요.", en: "It is time to review this week's logs without judgment." },
  { id: "social", ko: "친구가 보낸 새 응원이 있어요. 원할 때 확인하세요.", en: "A friend sent encouragement. Check it when you want." },
  { id: "deadline", ko: "정해 둔 날짜가 가까워요. 목표 크기를 조정해도 괜찮아요.", en: "Your chosen date is near. It is okay to resize the goal." }
];
export const NOTIFICATION_MESSAGES = Object.freeze(notificationPresets.flatMap((preset) => notificationEvents.map((event) => Object.freeze({
  id: `${preset}-${event.id}`, preset, event: event.id, title: "해피스캔", titleEn: "HappyScan", body: `${event.ko} ${notificationStyle[preset][0]}`, bodyEn: `${event.en} ${notificationStyle[preset][1]}`
}))));

const faq = (id, category, q, a, qEn, aEn) => Object.freeze({ id, category, q, a, qEn, aEn });
export const FAQS = Object.freeze([
  faq("start-1", "시작", "무엇부터 해야 하나요?", "오늘 탭에서 30초 행동을 고르거나 목표 탭의 8개 영역 예시 중 하나를 누르세요.", "Where should I begin?", "Choose a 30-second action on Today, or pick an example from one of eight areas under Goals."),
  faq("start-2", "시작", "숫자 목표가 없어도 되나요?", "네. 확인 한 번이나 짧은 돌아보기처럼 숫자가 필요 없는 목표도 만들 수 있어요.", "Do I need a numeric target?", "No. You can use a simple check or reflection without a number."),
  faq("start-3", "시작", "하루를 놓치면 다시 시작해야 하나요?", "아니요. 연속 기록을 강요하지 않으며 다음 가능한 날에 작은 행동부터 이어가면 됩니다.", "Must I restart after missing a day?", "No. Streaks are not required; continue with a small action on the next possible day."),
  faq("start-4", "시작", "목표는 몇 개가 적당한가요?", "오늘 화면에는 우선 세 개까지 두고 나머지는 목표 화면에서 관리하는 방법을 권해요.", "How many goals should I use?", "Keep up to three priorities on Today and manage the rest under Goals."),
  faq("start-5", "시작", "7일 프로그램은 꼭 매일 해야 하나요?", "아니요. 현재 프로그램은 읽는 안내이며 진행 위치를 자동 저장하지 않습니다. 원하는 순서로 읽고 첫 행동을 목표에 추가한 뒤 실행했을 때 별도로 기록하세요.", "Must I do a 7-day program daily?", "No. Programs are readable guides and do not automatically save a progress position. Read at your pace, add the first action as a goal, and log it separately after doing it."),
  faq("record-1", "기록", "잘못 누른 기록을 되돌릴 수 있나요?", "네. 방금 기록 되돌리기를 사용하면 가장 최근 행동 한 건을 취소할 수 있어요.", "Can I undo an accidental log?", "Yes. Undo last log removes the most recent action."),
  faq("record-2", "기록", "기분과 메모는 공개되나요?", "기본값은 이 기기에만 저장되는 비공개 기록이며 자동으로 친구에게 공유되지 않아요.", "Are moods and notes public?", "They are private, on-device records by default and are never shared with friends automatically."),
  faq("record-3", "기록", "휴식도 기록할 수 있나요?", "네. 휴식은 실패가 아니라 사용자가 선택한 별도 기록으로 저장됩니다.", "Can I log rest?", "Yes. Rest is stored as a separate user choice, not as failure."),
  faq("record-4", "기록", "목표 수치를 바꾸면 과거 기록은 어떻게 되나요?", "기존 측정 기준을 이력으로 보존하고 새 기준은 바꾼 시점부터 적용합니다.", "What happens if I change a target?", "The prior measurement rule stays in history, and the new rule applies from the change."),
  faq("record-5", "기록", "기록이 적어도 통찰을 보여주나요?", "근거가 부족하면 결론 대신 ‘아직 모름’과 필요한 기록 조건을 보여줍니다.", "Will I see insights with little data?", "When evidence is thin, we show 'not enough data' and the needed condition instead of a conclusion."),
  faq("data-1", "데이터", "인터넷이 없어도 쓸 수 있나요?", "설치에 필요한 파일을 한 번 받은 뒤에는 핵심 기록을 오프라인에서도 사용할 수 있어요.", "Can I use it without internet?", "After core files are loaded once, key logging works offline."),
  faq("data-2", "데이터", "내 기록은 어디에 저장되나요?", "기본 정본은 현재 기기의 브라우저 저장소입니다. 클라우드는 운영 연결과 로그인이 확인된 뒤에도 ‘지금 보호본 만들기’를 직접 누른 경우만 전송하며 자동 백업이 아닙니다.", "Where is my data stored?", "The primary copy is in this browser on this device. Even after a working cloud connection and sign-in, transfer requires pressing Create protection copy now. This is not automatic backup."),
  faq("data-3", "데이터", "브라우저를 지우면 기록도 사라지나요?", "네. 먼저 JSON을 내보내 안전한 곳에 보관하고 가져오기 미리보기로 내용을 확인하세요. 클라우드가 연결되지 않았거나 보호본 성공을 확인하지 않았다면 원격 사본이 있다고 가정하지 마세요.", "Can clearing the browser erase my logs?", "Yes. Export JSON to a safe location first and check it with the import preview. Never assume a remote copy exists without a working cloud connection and a confirmed successful copy."),
  faq("data-4", "데이터", "백업 파일을 가져오면 바로 덮어쓰나요?", "아니요. 먼저 추가·변경·충돌을 비교하고 사용자가 확인한 뒤에만 적용합니다.", "Does importing overwrite immediately?", "No. Additions, changes, and conflicts are reviewed before you approve applying them."),
  faq("data-5", "데이터", "내 데이터를 모두 삭제할 수 있나요?", "나 탭의 삭제 기능에서 범위와 건수를 확인하고 로컬 자료를 삭제할 수 있습니다. 클라우드 보호본은 별도로 삭제합니다.", "Can I delete all my data?", "Use deletion under Me to review scope and counts. Cloud copies are deleted separately."),
  faq("privacy-1", "개인정보", "계정 없이 사용할 수 있나요?", "네. 로그인 없이도 목표와 기록의 핵심 기능을 사용할 수 있어요.", "Can I use it without an account?", "Yes. Core goals and logs work without signing in."),
  faq("privacy-2", "개인정보", "Google 로그인 뒤 이메일을 앱에 저장하나요?", "앱 프로필에는 이메일을 별도 저장하지 않고 표시 이름은 저장을 눌러야 보관합니다. 인증 제공자의 계정 처리는 별개입니다. Google 실제 로그인은 운영 연결 확인이 필요합니다.", "Is my email stored after Google sign-in?", "The app profile does not separately store email; saving a display name requires your action. Authentication-provider account processing is separate. Real Google sign-in requires a verified production connection."),
  faq("privacy-3", "개인정보", "친구에게 목표 내용이 자동으로 보이나요?", "아니요. 선택한 행동 횟수나 응원 글만 명시적으로 공유할 수 있어요.", "Do friends automatically see my goals?", "No. Only action counts or encouragement posts you explicitly choose can be shared."),
  faq("privacy-4", "개인정보", "순위 참여는 필수인가요?", "아니요. 7일 순위는 별도 동의가 있어야 하며 언제든 참여를 취소할 수 있어요.", "Is leaderboard participation required?", "No. It needs separate consent and can be turned off anytime."),
  faq("privacy-5", "개인정보", "신고하면 바로 운영자에게 전송되나요?", "서버 연결이 켜진 운영판에서만 전송됩니다. 로컬 시험판은 기기 안에만 남는다고 표시합니다.", "Are reports always sent to an operator?", "Only a connected production service sends them. Local test mode clearly says they stay on device."),
  faq("notice-1", "알림", "반복 알림이 자동으로 오나요?", "아니요. 현재 웹판의 일정은 기기에 계획만 저장하며 시험 알림은 버튼을 누를 때 한 번만 보냅니다.", "Are repeating notifications automatic?", "No. The web version stores a plan only; a test notification is sent once when you press its button."),
  faq("notice-2", "알림", "방해 금지 시간은 시스템 설정을 바꾸나요?", "아니요. 앱 안의 알림 계획에만 적용되고 기기 시스템 설정은 바꾸지 않습니다.", "Do quiet hours change system settings?", "No. They apply only to the in-app plan and do not change device settings."),
  faq("notice-3", "알림", "알림 권한을 거절해도 앱을 쓸 수 있나요?", "네. 알림은 선택 기능이며 기록과 분석에는 영향을 주지 않아요.", "Can I use the app after denying notifications?", "Yes. Notifications are optional and do not affect logging or insights."),
  faq("social-1", "함께", "친구는 어떻게 초대하나요?", "운영 서버와 계정 연결이 확인된 경우 초대 링크로 비공개 모임에 참여하는 구조입니다. 로컬 시험 모드의 초대·예시는 다른 사람의 계정으로 전달된 실제 초대가 아닙니다.", "How do I invite a friend?", "Private-circle invitation links require a verified server and account connection. Invitations or examples in local test mode are not real deliveries to another person's account."),
  faq("social-2", "함께", "원하지 않는 사람을 막을 수 있나요?", "모임 나가기·차단·신고 화면이 있어도 로컬 시험 결과는 서버 처리 증거가 아닙니다. 원격 차단과 운영자 신고 접수는 연결된 운영판에서 확인해야 합니다.", "Can I block someone?", "Leave, block, and report controls in local test mode do not prove server enforcement. Remote blocking and operator receipt must be verified in a connected production service."),
  faq("social-3", "함께", "경쟁 때문에 부담이 생기면 어떻게 하나요?", "순위 참여를 끄고 응원만 주고받거나 함께 기능을 사용하지 않아도 됩니다.", "What if competition feels stressful?", "Turn off ranking, use encouragement only, or stop using Together."),
  faq("access-1", "접근성", "글자를 크게 볼 수 있나요?", "화면 스타일에서 큰 글씨를 선택하고 브라우저 확대도 함께 사용할 수 있어요.", "Can I make text larger?", "Choose the large-text theme and use browser zoom as well."),
  faq("access-2", "접근성", "키보드만으로 PC에서 쓸 수 있나요?", "주요 이동과 기록 버튼에 키보드 초점을 제공하며 단축키 도움말도 볼 수 있어요.", "Can I use the desktop version by keyboard?", "Primary navigation and logging are keyboard focusable, with shortcut help available."),
  faq("access-3", "접근성", "색만으로 상태를 구분하나요?", "아니요. 상태는 글자, 아이콘, 모양을 함께 사용해 전달합니다.", "Is status shown by color alone?", "No. Status uses text, icons, and shape along with color."),
  faq("support-1", "지원", "문제가 생기면 무엇을 먼저 확인하나요?", "나 탭의 저장 상태와 고급 진단을 확인하고, 내보내기로 기록을 먼저 보존하세요.", "What should I check first when something goes wrong?", "Check storage status and advanced diagnostics under Me, then preserve records with Export." )
]);

export const STAGE1_COUNTS = Object.freeze({
  areas: AREAS.length,
  goalTemplates: GOAL_TEMPLATES.length,
  onboardingStarters: PURPOSES.reduce((sum, item) => sum + item.starterIds.length, 0),
  programs: PROGRAMS.length,
  coachMessages: COACH_MESSAGES.length,
  insightExplanations: INSIGHT_EXPLANATIONS.length,
  stateMessages: STATE_MESSAGES.length,
  notificationMessages: NOTIFICATION_MESSAGES.length,
  faqs: FAQS.length
});

export function localized(item, field, language = document.documentElement.lang || "ko") {
  return language === "en" && item[`${field}En`] ? item[`${field}En`] : item[field];
}

export function findCoachMessage({ tone = "warm", situation = "first", intensity = "balanced" } = {}) {
  return COACH_MESSAGES.find((item) => item.tone === tone && item.situation === situation && item.intensity === intensity) || COACH_MESSAGES[0];
}
