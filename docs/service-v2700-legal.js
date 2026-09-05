(() => {
  "use strict";
  const VERSION = "v27.0.0-legal-draft";
  const links = Object.freeze([
    ["terms.html", "이용 조건", "서비스 범위·제한"],
    ["privacy.html", "개인정보", "로컬 저장 사실표"],
    ["delete.html", "삭제", "범위·백업·전체 제거"],
    ["support.html", "도움·문의", "문의 채널 미확정"],
    ["status.html", "후보 상태", "증거·차단 조건"],
    ["changelog.html", "변경 내역", "v27에서 바뀐 점"],
  ]);
  const node = (name, className, text) => {
    const item = document.createElement(name);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = String(text);
    return item;
  };
  function mount() {
    if (document.querySelector("#serviceLegalSection")) return true;
    const host = document.querySelector("main.app");
    const anchor = document.querySelector("#serviceDeleteSection") || document.querySelector("#serviceTrustSection") || host?.lastElementChild;
    if (!host || !anchor) return false;
    const root = node("section", "section v270-legal");
    root.id = "serviceLegalSection";
    root.dataset.serviceView = "me";
    root.dataset.operatorStatus = "pending";
    root.setAttribute("aria-labelledby", "serviceLegalTitle");
    const header = node("header");
    const copy = node("div");
    copy.append(node("span", "service-section-kicker", "운영과 도움"));
    const title = node("h2", "", "저장·삭제·운영 정보");
    title.id = "serviceLegalTitle";
    copy.append(title, node("p", "", "현재 코드의 사실과 아직 결정되지 않은 출시 조건을 구분해 보세요."));
    header.append(copy, node("span", "v270-legal-badge", "검토용 초안"));
    const grid = node("nav", "v270-legal-grid");
    grid.setAttribute("aria-label", "운영·법적·지원 문서");
    links.forEach(([file, label, detail]) => {
      const link = node("a");
      link.href = `./legal/${file}`;
      link.append(node("b", "", label), node("span", "", detail));
      grid.append(link);
    });
    root.append(header, grid, node("p", "v270-legal-pending", "출시 전 필수: 법적 운영자, 실제 문의 채널, 대상 국가, 수익 모델을 운영자가 확정해야 합니다."));
    anchor.insertAdjacentElement("afterend", root);
    document.documentElement.dataset.v270LegalReady = "true";
    return true;
  }
  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (window.__WEDOIT__?.ready && mount() || tries > 250) clearInterval(timer);
  }, 40);
  mount();
  Object.defineProperty(window, "__WEDOIT_V270_LEGAL__", { configurable: false, enumerable: false, writable: false, value: Object.freeze({ version: VERSION, status: "operator-input-required", links }) });
})();
