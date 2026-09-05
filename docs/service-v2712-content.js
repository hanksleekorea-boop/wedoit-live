import {
  CONTENT_VERSION,
  ALL_GOAL_TEMPLATES,
  ALL_PROGRAMS,
  ALL_FAQS,
  ALL_INSIGHTS,
  CONTEXT_PACKS,
  PEER_COMPARISON_CARDS,
  SOCIAL_SAFETY_MESSAGES,
  ILLUSTRATIVE_CASES,
  STAGE2_COUNTS
} from "./content-v2712.js";
import { AREAS, PURPOSES, COACH_MESSAGES, STATE_MESSAGES, NOTIFICATION_MESSAGES, STAGE1_COUNTS, localized } from "./content-v2711.js";

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
const lang = () => document.documentElement.lang === "en" ? "en" : "ko";
const text = (ko, en) => lang() === "en" ? en : ko;
const areaName = (id) => localized(AREAS.find((item) => item.id === id) || AREAS[0], "name", lang());
let selectedArea = "all";
let selectedPurpose = "health";
let unsubscribeCoach = null;
let renderedLanguage = null;

function createSection(id, view, title, titleEn, intro, introEn, count) {
  const section = document.createElement("section");
  section.id = id;
  section.className = "section content-hub";
  section.dataset.serviceView = view;
  section.innerHTML = `<div class="content-hub__head"><div><span class="service-section-kicker">${text("콘텐츠 안내", "Content library")}</span><h2>${text(title, titleEn)}</h2><p>${text(intro, introEn)}</p></div><span class="content-hub__count">${escapeHtml(count)}</span></div>`;
  return section;
}

function areaTabs(active = selectedArea) {
  return `<div class="content-area-tabs" role="group" aria-label="${text("생활 영역 필터", "Life area filter")}"><button type="button" data-content-area="all" aria-pressed="${active === "all"}">${text("전체", "All")}</button>${AREAS.map((area) => `<button type="button" data-content-area="${area.id}" aria-pressed="${active === area.id}">${area.icon} ${escapeHtml(localized(area, "name", lang()))}</button>`).join("")}</div>`;
}

function mountPurpose(host, app) {
  const section = createSection("contentPurposeHub", "today goals", "8개 영역에서 바로 시작", "Start in all eight areas", "목적을 하나 고르면 3개의 부담 없는 첫 행동이 열립니다. 모든 행동은 이 기기에 먼저 저장됩니다.", "Choose a purpose to reveal three low-pressure first actions. Every action saves to this device first.", `${STAGE1_COUNTS.areas} × 3`);
  host.querySelector("#serviceP0FlowSection")?.setAttribute("hidden", "");
  const render = () => {
    const purpose = PURPOSES.find((item) => item.id === selectedPurpose) || PURPOSES[0];
    const picks = purpose.starterIds.map((id) => ALL_GOAL_TEMPLATES.find((item) => item.id === id)).filter(Boolean);
    section.innerHTML = `<div class="content-hub__head"><div><span class="service-section-kicker">${text("처음 시작하기", "Getting started")}</span><h2>${text("8개 영역에서 바로 시작", "Start in all eight areas")}</h2><p>${escapeHtml(localized(purpose, "copy", lang()))}</p></div><span class="content-hub__count">8 × 3</span></div>${areaTabs(selectedPurpose)}<div class="content-card-grid">${picks.map((item) => `<article class="content-card"><h3>${item.icon} ${escapeHtml(localized(item, "name", lang()))}</h3><p>${escapeHtml(localized(item, "why", lang()))}</p><div class="content-card__meta"><span>${text("최소 행동", "Tiny step")}</span></div><p>${escapeHtml(localized(item, "tinyStep", lang()))}</p><button type="button" data-content-start="${item.id}">${text("목표만 추가 · 기록은 별도", "Add goal only · log separately")}</button></article>`).join("")}</div><p class="content-status" role="status" aria-live="polite"></p>`;
    section.querySelectorAll("[data-content-area]").forEach((button) => button.addEventListener("click", () => { if (button.dataset.contentArea !== "all") selectedPurpose = button.dataset.contentArea; render(); }));
    section.querySelectorAll("[data-content-start]").forEach((button) => button.addEventListener("click", () => {
      const item = ALL_GOAL_TEMPLATES.find((candidate) => candidate.id === button.dataset.contentStart);
      if (!item) return;
      let goal = app.store.getState().goals.find((candidate) => candidate.status === "active" && candidate.name === item.name);
      if (!goal) goal = app.store.addGoal(item);
      // Choosing a template is not evidence that the user performed the action.
      section.querySelector(".content-status").textContent = text(`${item.name}을 목표에 추가했어요. 행동한 뒤 오늘 탭에서 기록하세요.`, `${item.nameEn} is ready. Log it on Today after doing the action.`);
    }));
  };
  render();
  return section;
}

function mountLibrary(app) {
  const section = createSection("contentGoalLibrary", "goals", "생활 목표 80개", "80 everyday goal ideas", "8개 영역마다 10개씩, 이유와 30초에 가까운 최소 행동까지 제공합니다.", "Ten ideas in each of eight areas, each with a reason and a tiny first step.", String(STAGE2_COUNTS.goalTemplates));
  let query = "";
  const render = () => {
    const items = ALL_GOAL_TEMPLATES.filter((item) => selectedArea === "all" || item.area === selectedArea).filter((item) => `${item.name} ${item.nameEn} ${item.tinyStep} ${item.tinyStepEn}`.toLowerCase().includes(query.toLowerCase()));
    section.innerHTML = `<div class="content-hub__head"><div><span class="service-section-kicker">${text("목표 찾기", "Find a goal")}</span><h2>${text("생활 목표 80개", "80 everyday goal ideas")}</h2><p>${text("영역마다 10개씩, 이유와 최소 행동을 함께 보여줍니다.", "Ten per area, with a reason and tiny step.")}</p></div><span class="content-hub__count">${items.length} / 80</span></div><div class="content-controls"><input id="contentGoalSearch" type="search" value="${escapeHtml(query)}" placeholder="${text("목표 검색", "Search goals")}" aria-label="${text("목표 검색", "Search goals")}"><select id="contentGoalArea" aria-label="${text("생활 영역", "Life area")}"><option value="all">${text("모든 영역", "All areas")}</option>${AREAS.map((area) => `<option value="${area.id}" ${selectedArea === area.id ? "selected" : ""}>${escapeHtml(localized(area, "name", lang()))}</option>`).join("")}</select></div><div class="content-card-grid">${items.map((item) => `<article class="content-card"><h3>${item.icon} ${escapeHtml(localized(item, "name", lang()))}</h3><p>${escapeHtml(localized(item, "why", lang()))}</p><div class="content-card__meta"><span>${escapeHtml(areaName(item.area))}</span><span>${item.metric === "minutes" ? `${item.target}${text("분", " min")}` : item.target ? `${item.target}${text("회", " times")}` : text("돌아보기", "reflection")}</span></div><p><b>${text("가장 작게:", "Tiny step:")}</b> ${escapeHtml(localized(item, "tinyStep", lang()))}</p><button type="button" data-add-goal="${item.id}">${text("내 목표에 추가", "Add to my goals")}</button></article>`).join("") || `<p class="content-empty">${text("찾는 목표가 없습니다. 검색어를 줄여 보세요.", "No matching goal. Try a shorter query.")}</p>`}</div><p class="content-status" role="status" aria-live="polite"></p>`;
    const search = section.querySelector("#contentGoalSearch");
    search?.addEventListener("input", () => { query = search.value; render(); section.querySelector("#contentGoalSearch")?.focus(); });
    section.querySelector("#contentGoalArea")?.addEventListener("change", (event) => { selectedArea = event.target.value; render(); });
    section.querySelectorAll("[data-add-goal]").forEach((button) => button.addEventListener("click", () => {
      const item = ALL_GOAL_TEMPLATES.find((candidate) => candidate.id === button.dataset.addGoal);
      if (!item) return;
      const exists = app.store.getState().goals.some((goal) => goal.status === "active" && goal.name === item.name);
      if (!exists) app.store.addGoal(item);
      section.querySelector(".content-status").textContent = exists ? text("이미 내 목표에 있어요.", "Already in your goals.") : text(`${item.name}을 내 목표에 추가했어요.`, `${item.nameEn} was added.`);
    }));
  };
  render();
  return section;
}

function mountPrograms(app) {
  const section = createSection("contentPrograms", "goals", "7·14·30일 프로그램", "7-, 14-, and 30-day programs", "8개 영역별 세 길이로 구성했습니다. 날짜를 놓쳐도 다음 단계부터 계속합니다.", "Three lengths for every area. Missing a date never forces a restart.", `${STAGE2_COUNTS.programs}`);
  let area = "all";
  let days = 7;
  const render = () => {
    const items = ALL_PROGRAMS.filter((item) => (area === "all" || item.area === area) && item.days === days);
    section.innerHTML = `<div class="content-hub__head"><div><span class="service-section-kicker">${text("단계별 안내", "Guided paths")}</span><h2>${text("7·14·30일 프로그램", "7-, 14-, and 30-day programs")}</h2><p>${text("순서대로 읽는 안내입니다. 진행 날짜를 자동 추적하지 않으며, 첫 행동만 내 목표에 추가할 수 있습니다.", "Read this guide in sequence. Dates are not tracked automatically; you can add the first action to your goals.")}</p></div><span class="content-hub__count">24</span></div><div class="content-controls"><select id="programArea" aria-label="${text("생활 영역", "Life area")}"><option value="all">${text("모든 영역", "All areas")}</option>${AREAS.map((item) => `<option value="${item.id}" ${area === item.id ? "selected" : ""}>${escapeHtml(localized(item, "name", lang()))}</option>`).join("")}</select><select id="programDays" aria-label="${text("프로그램 길이", "Program length")}">${[7,14,30].map((value) => `<option value="${value}" ${days === value ? "selected" : ""}>${value}${text("일", " days")}</option>`).join("")}</select></div><div class="program-list">${items.map((program) => `<details class="program-item"><summary><span>${escapeHtml(localized(program, "title", lang()))}</span><small>${program.days}${text("일", " days")}</small></summary><div class="program-body"><p>${escapeHtml(localized(program, "promise", lang()))}</p><div class="program-steps">${program.steps.map((step) => `<div class="program-step"><b>DAY ${step.day}</b>${escapeHtml(localized(step, "title", lang()))}</div>`).join("")}</div><div class="program-actions"><button type="button" data-program-start="${program.id}">${text("첫 단계 목표로 추가", "Add first step as a goal")}</button></div></div></details>`).join("")}</div><p class="content-status" role="status" aria-live="polite"></p>`;
    section.querySelector("#programArea")?.addEventListener("change", (event) => { area = event.target.value; render(); });
    section.querySelector("#programDays")?.addEventListener("change", (event) => { days = Number(event.target.value); render(); });
    section.querySelectorAll("[data-program-start]").forEach((button) => button.addEventListener("click", () => {
      const program = ALL_PROGRAMS.find((item) => item.id === button.dataset.programStart);
      const first = program?.steps[0];
      const template = first && { name: first.title, nameEn: first.titleEn, area: program.area, archetype: "build", metric: "check", target: 1, icon: "🌱", period: "day" };
      if (!template) return;
      if (!app.store.getState().goals.some((goal) => goal.status === "active" && goal.name === template.name)) app.store.addGoal(template);
      section.querySelector(".content-status").textContent = text(`${program.title}의 첫 행동을 목표에 추가했어요.`, `The first action from ${program.titleEn} was added.`);
    }));
  };
  render();
  return section;
}

function mountCoach(app) {
  const section = createSection("contentCoachLab", "today goals", "상황에 맞는 격려", "Context-aware encouragement", "5개 말투 × 8개 상황 × 3개 강도, 모두 압박과 성과 보장을 피합니다.", "Five tones × eight situations × three intensities, all avoiding pressure and promised outcomes.", String(STAGE1_COUNTS.coachMessages));
  let situation = "first";
  const render = () => {
    const policy = app.store.getState().coachPolicy || { mode: "warm", intensity: "balanced" };
    const match = COACH_MESSAGES.find((item) => item.tone === policy.mode && item.intensity === policy.intensity && item.situation === situation) || COACH_MESSAGES[0];
    const situations = [...new Set(COACH_MESSAGES.map((item) => item.situation))];
    section.innerHTML = `<div class="content-hub__head"><div><span class="service-section-kicker">${text("압박 없는 코치", "Pressure-free coach")}</span><h2>${text("상황에 맞는 격려", "Context-aware encouragement")}</h2><p>${text("나 탭에서 고른 말투와 강도를 그대로 존중합니다.", "Uses the tone and intensity you chose under Me.")}</p></div><span class="content-hub__count">120</span></div><div class="content-controls"><select id="coachSituation" aria-label="${text("현재 상황", "Current situation")}">${situations.map((item) => `<option value="${item}" ${situation === item ? "selected" : ""}>${text({first:"첫 시작",steady:"이어가기",return:"공백 뒤",busy:"바쁜 날",stuck:"막힘",done:"완료",rest:"휴식",reflect:"돌아보기"}[item], {first:"First start",steady:"Continue",return:"After a gap",busy:"Busy day",stuck:"Stuck",done:"Done",rest:"Rest",reflect:"Reflect"}[item])}</option>`).join("")}</select><output class="content-hub__count">${policy.mode} · ${policy.intensity}</output></div><p class="coach-sample" role="status">${escapeHtml(localized(match, "text", lang()))}</p>`;
    section.querySelector("#coachSituation")?.addEventListener("change", (event) => { situation = event.target.value; render(); });
  };
  unsubscribeCoach?.();
  unsubscribeCoach = app.store.subscribe(() => queueMicrotask(render));
  render();
  return section;
}

function mountInsights() {
  const section = createSection("contentInsightLibrary", "insights", "근거를 밝히는 통찰 40개", "40 evidence-aware insights", "기록이 적으면 모른다고 말하고, 함께 나타난 일을 원인이라고 단정하지 않습니다.", "Say when data is insufficient and never turn correlation into causation.", String(STAGE2_COUNTS.insightExplanations));
  let area = "all";
  const render = () => {
    const items = ALL_INSIGHTS.filter((item) => area === "all" || item.area === area);
    section.innerHTML = `<div class="content-hub__head"><div><span class="service-section-kicker">${text("설명 가능한 통찰", "Explainable insights")}</span><h2>${text("근거를 밝히는 통찰 40개", "40 evidence-aware insights")}</h2><p>${text("설명 문구 예시이며 내 기록의 분석 결과가 아닙니다. 각 예시에 필요한 자료 조건을 표시합니다.", "These are example explanations, not an analysis of your records. Each example lists its data requirements.")}</p></div><span class="content-hub__count">${items.length} / 40</span></div>${areaTabs(area)}<div class="content-card-grid">${items.map((item) => `<article class="content-card"><h3>${escapeHtml(areaName(item.area))}</h3><p>${escapeHtml(localized(item, "text", lang()))}</p><div class="content-card__meta"><span>${escapeHtml(localized(item, "evidence", lang()))}</span></div></article>`).join("")}</div>`;
    section.querySelectorAll("[data-content-area]").forEach((button) => button.addEventListener("click", () => { area = button.dataset.contentArea; render(); }));
  };
  render();
  return section;
}

function mountPeer() {
  const section = createSection("contentPeerCompare", "insights", "나와 비슷한 사람 비교", "Compare with similar people", "실제 통계는 동의한 30명 이상·30일 이내 자료일 때만 표시합니다. 지금은 비교 방법만 공개합니다.", "Real figures require 30+ opted-in people and data reviewed within 30 days. Until then, only the comparison method is shown.", String(STAGE2_COUNTS.peerComparisonCards));
  let area = "health";
  const render = () => {
    const cards = PEER_COMPARISON_CARDS.filter((item) => item.area === area);
    section.innerHTML = `<div class="content-hub__head"><div><span class="service-section-kicker">${text("사생활 보호 비교", "Privacy-safe comparison")}</span><h2>${text("나와 비슷한 사람 비교", "Compare with similar people")}</h2><p>${text("민감정보를 추정하지 않고 사용자가 고른 영역만 비교합니다.", "Compare only user-selected areas without inferring sensitive traits.")}</p></div><span class="content-hub__count">24</span></div>${areaTabs(area)}<div class="content-safety"><b>${text("현재 상태: 실제 평균 미표시", "Current state: no real average shown")}</b><br>${text("동의한 실제 표본과 확인일이 없으므로 가짜 숫자를 만들지 않았습니다.", "No fake figure is created without a real opted-in sample and review date.")}</div><div class="peer-list">${cards.map((item) => `<details class="peer-item"><summary>${escapeHtml(localized(item, "title", lang()))}</summary><div class="peer-body"><p>${escapeHtml(localized(item, "description", lang()))}</p><p><b>${text("표시 조건", "Display rule")}:</b> n ≥ ${item.minimumSample} · ${item.freshnessDays}${text("일 이내", " days or newer")} · ${text("별도 동의", "separate consent")}</p><p>${escapeHtml(localized(item, "unavailable", lang()))}</p></div></details>`).join("")}</div>`;
    section.querySelectorAll("[data-content-area]").forEach((button) => button.addEventListener("click", () => { if (button.dataset.contentArea !== "all") area = button.dataset.contentArea; render(); }));
  };
  render();
  return section;
}

function mountCases() {
  const section = createSection("contentCases", "insights", "사용 예시 16개", "16 use examples", "실제 후기와 혼동하지 않도록 모든 예시에 ‘가상 사례’를 표시합니다.", "Every example is labeled illustrative so it cannot be mistaken for a testimonial.", String(STAGE2_COUNTS.illustrativeCases));
  section.innerHTML += `<div class="case-list">${ILLUSTRATIVE_CASES.map((item) => `<details class="case-item"><summary>${escapeHtml(localized(item, "title", lang()))}<small>${text("가상 사례", "Illustrative")}</small></summary><div class="case-body"><p><b>${text("가상 사례 · 실제 사용자 후기가 아님", "Illustrative · not a user testimonial")}</b></p><p>${escapeHtml(localized(item, "story", lang()))}</p></div></details>`).join("")}</div>`;
  return section;
}

function mountHelp() {
  const section = createSection("contentHelpCenter", "me", "도움말 60개", "60 help answers", "시작·기록·데이터·개인정보·알림·함께·접근성·비교·안전까지 검색할 수 있습니다.", "Search getting started, records, data, privacy, alerts, social, accessibility, comparison, and safety.", String(STAGE2_COUNTS.faqs));
  let query = "";
  const render = () => {
    const items = ALL_FAQS.filter((item) => `${item.category} ${item.q} ${item.a} ${item.qEn} ${item.aEn}`.toLowerCase().includes(query.toLowerCase()));
    section.innerHTML = `<div class="content-hub__head"><div><span class="service-section-kicker">${text("검색 가능한 도움말", "Searchable help")}</span><h2>${text("도움말 60개", "60 help answers")}</h2><p>${text("답을 찾지 못하면 기록을 먼저 내보낸 뒤 지원 경로를 이용하세요.", "If you cannot find an answer, export records first and use the support route.")}</p></div><span class="content-hub__count">${items.length} / 60</span></div><div class="content-controls"><input id="helpSearch" type="search" value="${escapeHtml(query)}" placeholder="${text("도움말 검색", "Search help")}" aria-label="${text("도움말 검색", "Search help")}"><output>${text("검색 결과", "Results")}: ${items.length}</output></div><div class="help-list">${items.map((item) => `<details class="help-item"><summary><span>${escapeHtml(localized(item, "q", lang()))}</span><small>${escapeHtml(item.category)}</small></summary><div class="help-answer">${escapeHtml(localized(item, "a", lang()))}</div></details>`).join("") || `<p class="content-empty">${text("찾는 답이 없습니다. 다른 단어로 검색해 보세요.", "No answer found. Try another term.")}</p>`}</div>`;
    const input = section.querySelector("#helpSearch");
    input?.addEventListener("input", () => { query = input.value; render(); section.querySelector("#helpSearch")?.focus(); });
  };
  render();
  return section;
}

function mountContextAndSafety() {
  const section = createSection("contentContextSafety", "me", "상황별 안내와 함께 안전", "Context and social safety", "48개 상황별 안내와 30개 함께 기능 안전 문구를 제품 기준으로 제공합니다.", "Provides 48 context guides and 30 social-safety messages as product rules.", `${STAGE2_COUNTS.contextPacks} + ${STAGE2_COUNTS.socialSafetyMessages}`);
  let area = "all", category = "context";
  const render = () => {
    const collections = { context: CONTEXT_PACKS, social: SOCIAL_SAFETY_MESSAGES, state: STATE_MESSAGES, notification: NOTIFICATION_MESSAGES };
    const items = collections[category].filter(item => !item.area || area === "all" || item.area === area);
    section.innerHTML = `<div class="content-hub__head"><h2>${text("상황·안전 안내 모음", "Context and safety library")}</h2><span class="content-hub__count">${items.length}</span></div><p class="content-safety">${text("안내 문구의 예시입니다. 저장·전송·알림 성공을 나타내는 실제 상태가 아닙니다. 건강·재무·법률 판단을 대신하지 않습니다.", "These are reference messages, not evidence of a save, delivery, or notification. They do not replace medical, financial, or legal judgment.")}</p><div class="content-controls"><select id="contentGuideCategory" aria-label="${text("안내 종류", "Guide category")}">${[["context","상황 안내","Context guides"],["social","함께 안전","Social safety"],["state","상태·복구","Status and recovery"],["notification","알림 문구","Notification copy"]].map(([id,ko,en])=>`<option value="${id}" ${category===id?"selected":""}>${text(ko,en)}</option>`).join("")}</select><select id="contentGuideArea" aria-label="${text("생활 영역", "Life area")}"><option value="all">${text("모든 영역", "All areas")}</option>${AREAS.map(item=>`<option value="${item.id}" ${area===item.id?"selected":""}>${escapeHtml(localized(item,"name",lang()))}</option>`).join("")}</select></div><div class="content-card-grid">${items.map(item=>`<article class="content-card"><h3>${escapeHtml(item.title?localized(item,"title",lang()):areaName(item.area))}</h3><p>${escapeHtml(localized(item,item.guidance?"guidance":item.body?"body":"text",lang()))}</p><p>${escapeHtml(item.id)}</p></article>`).join("")}</div>`;
    section.querySelector("#contentGuideCategory").addEventListener("change",event=>{category=event.target.value;render();});
    section.querySelector("#contentGuideArea").addEventListener("change",event=>{area=event.target.value;render();});
  };
  render();
  return section;
}

function mount(app) {
  if (document.querySelector("#contentGoalLibrary")) return;
  const main = document.querySelector("main.app");
  if (!main) return;
  for (const [view, ko, en] of [["goals","내 목표","My goals"],["insights","내 기록 돌아보기","Reflect on my records"],["me","내 설정과 도움말","My settings and help"],["together","함께하기","Together"]]) {
    const heading = document.createElement("h1");
    heading.className = "content-page-title";
    heading.dataset.serviceView = view;
    heading.textContent = text(ko, en);
    main.querySelector(".top")?.insertAdjacentElement("afterend", heading);
  }
  const purpose = mountPurpose(main, app);
  const goalAnchor = document.querySelector("#pcGoalsSection");
  goalAnchor?.insertAdjacentElement("beforebegin", purpose);
  goalAnchor?.insertAdjacentElement("afterend", mountLibrary(app));
  document.querySelector("#contentGoalLibrary")?.insertAdjacentElement("afterend", mountPrograms(app));
  document.querySelector("#pcCoachSection")?.insertAdjacentElement("afterend", mountCoach(app));
  document.querySelector("#pcLargeStats")?.insertAdjacentElement("afterend", mountInsights());
  document.querySelector("#contentInsightLibrary")?.insertAdjacentElement("afterend", mountPeer());
  document.querySelector("#contentPeerCompare")?.insertAdjacentElement("afterend", mountCases());
  document.querySelector("#pcNotificationSection")?.insertAdjacentElement("afterend", mountHelp());
  document.querySelector("#contentHelpCenter")?.insertAdjacentElement("afterend", mountContextAndSafety());
  window.__WEDOIT_SERVICE__?.setPage?.(document.documentElement.dataset.servicePage || "today");
  document.documentElement.dataset.contentStage2Ready = "true";
  renderedLanguage = lang();
}

let tries = 0;
const timer = setInterval(() => {
  tries += 1;
  if (window.__WEDOIT__?.ready && window.__WEDOIT__.store) {
    clearInterval(timer);
    mount(window.__WEDOIT__);
  } else if (tries > 250) clearInterval(timer);
}, 40);

window.addEventListener("wedoit:languagechange", () => {
  if (renderedLanguage === null || renderedLanguage === lang()) return;
  unsubscribeCoach?.();
  document.querySelectorAll(".content-hub,.content-page-title").forEach(section => section.remove());
  mount(window.__WEDOIT__);
});

const enhanceProgress = () => document.querySelectorAll('.progress[aria-label]:not([role])').forEach(node => {
  node.setAttribute("role", "progressbar");
  node.setAttribute("aria-valuemin", "0");
  node.setAttribute("aria-valuemax", "100");
  node.setAttribute("aria-valuenow", String(Math.max(0, Math.min(100, Number(node.getAttribute("aria-label")?.match(/([\d.]+)%/)?.[1]) || 0))));
});
const contentSemanticsObserver = new MutationObserver(enhanceProgress);
contentSemanticsObserver.observe(document.querySelector("main.app") || document.body, { childList: true, subtree: true });
enhanceProgress();

export const CONTENT_UI_CONTRACT = Object.freeze({
  version: CONTENT_VERSION,
  sections: ["contentPurposeHub", "contentGoalLibrary", "contentPrograms", "contentCoachLab", "contentInsightLibrary", "contentPeerCompare", "contentCases", "contentHelpCenter", "contentContextSafety"],
  stage1: STAGE1_COUNTS,
  stage2: STAGE2_COUNTS
});
