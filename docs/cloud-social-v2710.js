const CONFIG_URL = "./runtime-config.json";
const OUTBOX_KEY = "wedoit.cloud-outbox.v1";
const BACKUP_ENABLED_KEY = "wedoit.cloud-backup.enabled.v1";
const DEVICE_KEY = "wedoit.cloud-device.v1";
const ACCOUNT_PREFERENCES_KEY = "wedoit.v271.account-preferences";
const DAILY_MINUTES = Object.freeze([5, 10, 15, 20, 30]);
const SUPABASE_SDK_URL = "./supabase-v2.112.4.umd.js";
const SECRET_NAME = /(?:service[_-]?role|secret|admin[_-]?key|private[_-]?key)/i;
const enc = new TextEncoder();
const clone = value => JSON.parse(JSON.stringify(value));
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
const randomId = prefix => `${prefix}_${globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`}`;

export async function ensureOfficialSupabaseSdk(documentLike = globalThis.document) {
  if (typeof globalThis.supabase?.createClient === "function") return true;
  if (!documentLike?.head) return false;
  const existing = documentLike.querySelector(`script[src="${SUPABASE_SDK_URL}"]`);
  if (existing) return new Promise(resolve => {
    existing.addEventListener("load", () => resolve(typeof globalThis.supabase?.createClient === "function"), { once: true });
    existing.addEventListener("error", () => resolve(false), { once: true });
  });
  return new Promise(resolve => {
    const script = documentLike.createElement("script");
    script.src = SUPABASE_SDK_URL;
    script.defer = true;
    script.dataset.supabaseSdk = "2.112.4";
    script.addEventListener("load", () => resolve(typeof globalThis.supabase?.createClient === "function"), { once: true });
    script.addEventListener("error", () => resolve(false), { once: true });
    documentLike.head.append(script);
  });
}

export function readAccountPreferences(storage = globalThis.localStorage) {
  try {
    const value = JSON.parse(storage?.getItem(ACCOUNT_PREFERENCES_KEY) || "null");
    const dailyMinutes = Number(value?.dailyMinutes);
    return { schemaVersion: 1, dailyMinutes: DAILY_MINUTES.includes(dailyMinutes) ? dailyMinutes : 10 };
  } catch (_) { return { schemaVersion: 1, dailyMinutes: 10 }; }
}

export function writeAccountPreferences(value, storage = globalThis.localStorage) {
  const dailyMinutes = Number(value?.dailyMinutes);
  if (!DAILY_MINUTES.includes(dailyMinutes)) throw new Error("invalid-daily-minutes");
  storage?.setItem(ACCOUNT_PREFERENCES_KEY, JSON.stringify({ schemaVersion: 1, dailyMinutes }));
  return readAccountPreferences(storage);
}

export function validateCloudConfig(input = {}) {
  const forbidden = Object.keys(input).filter(key => SECRET_NAME.test(key) && String(input[key] || "").trim());
  if (forbidden.length) return { configured: false, valid: false, reason: "server-secret-forbidden", forbidden };
  if (input.provider !== "supabase") return { configured: false, valid: false, reason: "provider-not-supported", forbidden: [] };
  let endpoint;
  try {
    const parsed = new URL(String(input.endpoint || ""));
    if (parsed.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(parsed.hostname)) throw new Error("https-required");
    endpoint = parsed.href.replace(/\/$/, "");
  } catch (_) {
    return { configured: false, valid: false, reason: "valid-endpoint-required", forbidden: [] };
  }
  const publishableKey = String(input.publishableKey || "").trim();
  if (!publishableKey) return { configured: false, valid: false, reason: "publishable-key-required", forbidden: [] };
  return { configured: true, valid: true, endpoint, publishableKey, googleLoginEnabled: input.googleLoginEnabled === true, appleLoginEnabled: input.appleLoginEnabled === true, forbidden: [] };
}

export function safeRedirectUrl(locationLike = globalThis.location) {
  const url = new URL(locationLike.href);
  url.hash = "";
  ["code", "error", "error_code", "error_description", "sb_flow_id"].forEach(key => url.searchParams.delete(key));
  return url.href;
}

export function buildOAuthLoginUrl(config, provider, redirectTo) {
  const checked = validateCloudConfig(config);
  const supported = provider === "google" || provider === "apple";
  if (!supported || !checked.configured || checked[provider + "LoginEnabled"] !== true) throw new Error(provider + "-login-not-configured");
  const url = new URL(`${checked.endpoint}/auth/v1/authorize`);
  url.searchParams.set("provider", provider);
  url.searchParams.set("redirect_to", redirectTo);
  url.searchParams.set("scopes", provider === "google" ? "openid email profile" : "name email");
  return url.href;
}

export const buildGoogleLoginUrl = (config, redirectTo) => buildOAuthLoginUrl(config, "google", redirectTo);
export const buildAppleLoginUrl = (config, redirectTo) => buildOAuthLoginUrl(config, "apple", redirectTo);

async function sha256(text) {
  const bytes = await crypto.subtle.digest("SHA-256", enc.encode(String(text)));
  return [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function createInviteToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const token = [...bytes].map(byte => byte.toString(16).padStart(2, "0")).join("");
  return { token, tokenHash: await sha256(token) };
}

export async function createSnapshotEnvelope(exportedState, { deviceId, createdAt = new Date().toISOString() } = {}) {
  const parsed = typeof exportedState === "string" ? JSON.parse(exportedState) : clone(exportedState);
  if (parsed?.schemaVersion !== 6 || !Array.isArray(parsed.goals) || !Array.isArray(parsed.events)) throw new Error("invalid-app-state");
  const payload = JSON.stringify(parsed);
  return Object.freeze({
    schema: "wedoit.cloud-snapshot.v1",
    deviceId: String(deviceId || "").slice(0, 80),
    clientRevision: Number(parsed.revision) || 0,
    contentHash: await sha256(payload),
    payload: parsed,
    createdAt,
  });
}

export function createDurableOutbox({ storage = globalThis.localStorage, key = OUTBOX_KEY } = {}) {
  const read = () => {
    try {
      const value = JSON.parse(storage?.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (_) { return []; }
  };
  let queue = read();
  const persist = () => { try { storage?.setItem(key, JSON.stringify(queue)); return true; } catch (_) { return false; } };
  return {
    list: () => clone(queue),
    enqueue(item) {
      const id = item.id || item.contentHash || randomId("cloud");
      if (!queue.some(row => row.id === id)) queue.push({ ...clone(item), id, queuedAt: item.queuedAt || Date.now(), attempts: Number(item.attempts) || 0 });
      persist();
      return id;
    },
    fail(id, reason) {
      const item = queue.find(row => row.id === id);
      if (item) { item.attempts += 1; item.lastError = String(reason || "upload-failed").slice(0, 200); persist(); }
    },
    acknowledge(id) { queue = queue.filter(row => row.id !== id); persist(); },
    clear() { queue = []; persist(); },
  };
}

export function createSupabaseCloudClient({ config, fetchImpl = globalThis.fetch, storage = globalThis.localStorage, supabaseFactory = globalThis.supabase?.createClient } = {}) {
  const checked = validateCloudConfig(config);
  const sdk = checked.configured && typeof supabaseFactory === "function" ? supabaseFactory(checked.endpoint, checked.publishableKey, {
    auth: { storage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" },
    global: { fetch: fetchImpl },
  }) : null;
  const auth = () => {
    if (!checked.configured) throw new Error(checked.reason);
    if (!sdk?.auth) throw new Error("supabase-sdk-unavailable");
    return sdk.auth;
  };
  const getSession = async () => {
    const { data, error } = await auth().getSession();
    if (error) throw error;
    return data?.session || null;
  };
  const request = async (path, { method = "GET", body, headers = {}, auth = true } = {}) => {
    if (!checked.configured) throw new Error(checked.reason);
    const session = auth ? await getSession() : null;
    const response = await fetchImpl(`${checked.endpoint}${path}`, {
      method,
      headers: {
        apikey: checked.publishableKey,
        ...(auth && session?.access_token ? { authorization: `Bearer ${session.access_token}` } : {}),
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
        ...headers,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) {
      let detail = "";
      try { detail = String((await response.json())?.message || ""); } catch (_) {}
      throw Object.assign(new Error(`cloud-${response.status}${detail ? `:${detail}` : ""}`), { status: response.status });
    }
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  };
  return {
    configured: checked.configured,
    configStatus: checked,
    officialSdk: Boolean(sdk),
    getSession,
    async setSession(value) {
      const { data, error } = await auth().setSession(value);
      if (error) throw error;
      return data?.session || null;
    },
    async clearSession() {
      const { error } = await auth().signOut({ scope: "local" });
      if (error) throw error;
    },
    consumeOAuthCallback: getSession,
    async beginOAuthLogin(provider, redirectTo = safeRedirectUrl()) {
      const scopes = provider === "google" ? "openid email profile" : "name email";
      const { data, error } = await auth().signInWithOAuth({ provider, options: { redirectTo, scopes } });
      if (error) throw error;
      return data;
    },
    beginGoogleLogin(redirectTo = safeRedirectUrl()) { return this.beginOAuthLogin("google", redirectTo); },
    beginAppleLogin(redirectTo = safeRedirectUrl()) { return this.beginOAuthLogin("apple", redirectTo); },
    async getUser() {
      const { data, error } = await auth().getUser();
      if (error) throw error;
      return data?.user || null;
    },
    async signOut() {
      const { error } = await auth().signOut({ scope: "local" });
      if (error) throw error;
    },
    onAuthStateChange(listener) {
      const { data } = auth().onAuthStateChange((event, session) => listener(event, session));
      return () => data?.subscription?.unsubscribe?.();
    },
    upsertProfile(user, displayName) {
      return request("/rest/v1/profiles?on_conflict=actor_id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=representation" }, body: { actor_id: user.id, display_name: String(displayName || "나").slice(0, 40), updated_at: new Date().toISOString() } });
    },
    uploadSnapshot(userId, snapshot) {
      return request("/rest/v1/cloud_snapshots?on_conflict=owner_id,content_hash", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: { owner_id: userId, device_id: snapshot.deviceId, client_revision: snapshot.clientRevision, content_hash: snapshot.contentHash, payload: snapshot.payload, created_at: snapshot.createdAt } });
    },
    listSnapshots() { return request("/rest/v1/cloud_snapshots?select=id,device_id,client_revision,content_hash,payload,created_at&order=created_at.desc&limit=20"); },
    deleteOwnSnapshots(userId) { return request("/rest/v1/cloud_snapshots?owner_id=eq." + encodeURIComponent(userId), { method: "DELETE", headers: { Prefer: "return=minimal" } }); },
    listCircles() { return request("/rest/v1/circles?select=id,owner_id,name,created_at&order=created_at.desc"); },
    createCircle(userId, name) {
      return request("/rest/v1/circles", { method: "POST", headers: { Prefer: "return=representation" }, body: { owner_id: userId, name: String(name || "").trim().slice(0, 60) } });
    },
    addOwnerMembership(circleId, userId) {
      return request("/rest/v1/circle_memberships?on_conflict=circle_id,actor_id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: { circle_id: circleId, actor_id: userId, role: "owner", status: "active", ranking_opt_in: false } });
    },
    createInvitation(circleId, userId, tokenHash, expiresAt) {
      return request("/rest/v1/circle_invitations", { method: "POST", headers: { Prefer: "return=minimal" }, body: { circle_id: circleId, created_by: userId, token_hash: tokenHash, expires_at: expiresAt, max_uses: 20 } });
    },
    redeemInvitation(tokenHash) { return request("/rest/v1/rpc/redeem_circle_invite", { method: "POST", body: { p_token_hash: tokenHash } }); },
    listMemberships(circleId) { return request(`/rest/v1/circle_memberships?circle_id=eq.${encodeURIComponent(circleId)}&select=actor_id,role,status,ranking_opt_in,joined_at`); },
    listProfiles(actorIds) {
      if (!actorIds.length) return Promise.resolve([]);
      return request(`/rest/v1/profiles?actor_id=in.(${actorIds.map(encodeURIComponent).join(",")})&select=actor_id,display_name`);
    },
    listPosts(circleId) { return request(`/rest/v1/posts?circle_id=eq.${encodeURIComponent(circleId)}&select=id,author_id,kind,body,created_at&order=created_at.desc&limit=50`); },
    listReactions(postIds) {
      if (!postIds.length) return Promise.resolve([]);
      return request(`/rest/v1/reactions?post_id=in.(${postIds.map(encodeURIComponent).join(",")})&select=post_id,actor_id,kind`);
    },
    listCheckins(circleId, fromDate) { return request(`/rest/v1/circle_checkins?circle_id=eq.${encodeURIComponent(circleId)}&occurred_on=gte.${fromDate}&select=actor_id,value,occurred_on`); },
    post(circleId, userId, body) { return request("/rest/v1/posts", { method: "POST", headers: { Prefer: "return=representation" }, body: { circle_id: circleId, author_id: userId, kind: "checkin", body: String(body || "").trim().slice(0, 500) } }); },
    cheer(postId, userId) { return request("/rest/v1/reactions?on_conflict=post_id,actor_id,kind", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: { post_id: postId, actor_id: userId, kind: "cheer" } }); },
    shareCheckin(circleId, userId, eventId, occurredAt) { return request("/rest/v1/circle_checkins?on_conflict=actor_id,idempotency_key", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: { circle_id: circleId, actor_id: userId, idempotency_key: String(eventId).slice(0, 120), occurred_on: new Date(occurredAt).toISOString().slice(0, 10), value: 1 } }); },
    setRankingOptIn(circleId, userId, enabled) { return request(`/rest/v1/circle_memberships?circle_id=eq.${encodeURIComponent(circleId)}&actor_id=eq.${encodeURIComponent(userId)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: { ranking_opt_in: Boolean(enabled) } }); },
    blockActor(userId, actorId) { return request("/rest/v1/blocks?on_conflict=blocker_id,blocked_id", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: { blocker_id: userId, blocked_id: actorId } }); },
    reportPost(userId, postId, reason = "safety-review") { return request("/rest/v1/content_reports", { method: "POST", headers: { Prefer: "return=minimal" }, body: { reporter_id: userId, post_id: postId, reason } }); },
  };
}

export function aggregateLeaderboard({ memberships = [], profiles = [], checkins = [] } = {}) {
  const names = new Map(profiles.map(row => [row.actor_id, row.display_name]));
  const counts = new Map;
  checkins.forEach(row => counts.set(row.actor_id, (counts.get(row.actor_id) || 0) + Math.max(0, Number(row.value) || 0)));
  return memberships.filter(row => row.status === "active" && row.ranking_opt_in === true).map(row => ({ actorId: row.actor_id, name: names.get(row.actor_id) || "친구", actions: counts.get(row.actor_id) || 0 })).sort((a, b) => b.actions - a.actions || a.name.localeCompare(b.name, "ko"));
}

async function loadConfig(fetchImpl = globalThis.fetch) {
  try { return await (await fetchImpl(CONFIG_URL, { cache: "no-store" })).json(); }
  catch (_) { return { schemaVersion: 1, provider: "supabase", endpoint: "", publishableKey: "", googleLoginEnabled: false, appleLoginEnabled: false }; }
}

function downloadJson(name, value) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function mountCloudSocial({ app = globalThis.__WEDOIT__, fetchImpl = globalThis.fetch, storage = globalThis.localStorage } = {}) {
  const accountRoot = document.querySelector("#cloudAccountCard");
  const friendsRoot = document.querySelector("#friendsNetworkCard");
  if (!app?.store || !accountRoot || !friendsRoot) return false;
  accountRoot.dataset.state = "checking";
  accountRoot.innerHTML = '<b>계정 상태를 확인하고 있습니다</b><p role="status">로그인·무료 가입 또는 내 계정 화면을 준비합니다.</p>';
  const rawConfig = await loadConfig(fetchImpl);
  if (validateCloudConfig(rawConfig).configured) await ensureOfficialSupabaseSdk();
  const client = createSupabaseCloudClient({ config: rawConfig, fetchImpl, storage });
  const outbox = createDurableOutbox({ storage });
  let user = null, snapshots = [], circles = [], selectedCircle = null, bundle = null, busy = false, notice = "";
  let authState = client.configured && rawConfig.googleLoginEnabled === true ? "checking" : "configurationError";
  let accountPreferences = readAccountPreferences(storage);
  const authListeners = new Set;
  const setAuthState = next => {
    authState = next;
    authListeners.forEach(listener => { try { listener(next); } catch (_) {} });
  };
  const deviceId = (() => { try { let value = storage?.getItem(DEVICE_KEY); if (!value) { value = randomId("device"); storage?.setItem(DEVICE_KEY, value); } return value; } catch (_) { return randomId("device"); } })();
  const backupEnabled = () => { try { return storage?.getItem(BACKUP_ENABLED_KEY) === "true"; } catch (_) { return false; } };
  const setBackupEnabled = enabled => { try { storage?.setItem(BACKUP_ENABLED_KEY, String(Boolean(enabled))); } catch (_) { throw new Error("cloud-preference-storage-unavailable"); } };
  const say = message => { notice = message; render(); };
  const flushOutbox = async () => {
    if (!user || !navigator.onLine) return;
    for (const item of outbox.list()) {
      try { await client.uploadSnapshot(user.id, item.snapshot); outbox.acknowledge(item.id); }
      catch (error) { outbox.fail(item.id, error.message); break; }
    }
  };
  const backupNow = async () => {
    if (!user || !backupEnabled()) return;
    if (app.store.whenSaved && !(await app.store.whenSaved())) throw new Error("local-save-incomplete");
    const snapshot = await createSnapshotEnvelope(app.store.exportJson(), { deviceId });
    outbox.enqueue({ id: snapshot.contentHash, snapshot });
    await flushOutbox();
    snapshots = await client.listSnapshots();
  };
  const refreshCircles = async () => {
    circles = user ? await client.listCircles() : [];
    selectedCircle = circles.find(row => row.id === selectedCircle?.id) || circles[0] || null;
    if (!selectedCircle) { bundle = null; return; }
    const memberships = await client.listMemberships(selectedCircle.id);
    const profiles = await client.listProfiles(memberships.map(row => row.actor_id));
    const posts = await client.listPosts(selectedCircle.id);
    const reactions = await client.listReactions(posts.map(row => row.id));
    const from = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
    const checkins = await client.listCheckins(selectedCircle.id, from);
    bundle = { memberships, profiles, posts, reactions, checkins, leaderboard: aggregateLeaderboard({ memberships, profiles, checkins }) };
  };
  let displayName = "";
  const profileName = () => String(displayName || user?.user_metadata?.full_name || user?.user_metadata?.name || "나").slice(0, 40);
  const copy = () => document.documentElement.lang === "en" ? {
    checking: "Checking your account status",
    checkingDetail: "Preparing sign in or My account without changing on-device records.",
    configTitle: "Google sign-in needs an operator setting",
    configDetail: "The app is ready, but the existing Supabase project still needs its public configuration and Google provider enabled.",
    configMeta: "Administrator secrets and OAuth secrets never belong in this browser or repository.",
    signInTitle: "Continue safely with Google",
    signInDetail: "Every local feature works without signing in. Cloud data is sent only after a separate choice.",
    signIn: "Sign in or join free with Google",
    signingIn: "Opening Google sign-in",
    signingInDetail: "Complete Google sign-in in the provider screen. Do not share your password or verification code with this app.",
    retryTitle: "We could not confirm the account state",
    retryDetail: "Your on-device records are unchanged. Check the connection and try again.",
    retry: "Try account check again",
    account: "My account",
    connected: name => `${name} is connected through Google. The imported name is not saved to the app automatically.`,
    displayName: "App display name",
    saveName: "Save name",
    nameMeta: "The name is sent only after Save name. Email is not displayed or copied to the app profile.",
    language: "App language",
    daily: "Daily target",
    minutes: value => `${value} minutes`,
    localMeta: "Language and daily target stay on this device and are not merged into another account.",
    localBackup: "Open local backup",
    privacy: "Privacy",
    support: "Help and account support",
    googleAccount: "Manage Google password and 2-step verification",
    cloudStatus: (enabled, count, queued) => `Manual cloud protection ${enabled ? "enabled" : "off"} · ${count} copies · ${queued} waiting`,
    cloudMeta: "Enabling protection does not upload anything. Use Create copy now for each upload. No automatic upload, restore, merge, or delete runs.",
    enableCloud: "Enable manual cloud protection",
    disableCloud: "Disable manual cloud protection",
    backupNow: "Create copy now",
    download: "Download latest copy",
    deleteBackups: "Delete all cloud copies",
    signOut: "Sign out",
  } : {
    checking: "계정 상태를 확인하고 있습니다",
    checkingDetail: "기기 기록을 바꾸지 않고 로그인·무료 가입 또는 내 계정 화면을 준비합니다.",
    configTitle: "Google 로그인 운영 설정이 필요합니다",
    configDetail: "앱은 준비됐지만 기존 Supabase 프로젝트의 공개 설정과 Google 제공자 연결이 아직 필요합니다.",
    configMeta: "관리자 비밀값과 OAuth 비밀값은 브라우저나 코드 보관소에 넣지 않습니다.",
    signInTitle: "Google 계정으로 안전하게 이어쓰기",
    signInDetail: "로그인하지 않아도 모든 로컬 기능을 사용할 수 있습니다. 클라우드 전송은 별도 선택 뒤에만 시작합니다.",
    signIn: "Google로 로그인·무료 가입",
    signingIn: "Google 로그인 화면을 여는 중입니다",
    signingInDetail: "제공자 화면에서 직접 로그인하세요. 비밀번호와 인증코드를 이 앱에 알려주지 마세요.",
    retryTitle: "계정 상태를 확인하지 못했습니다",
    retryDetail: "기기 기록은 그대로입니다. 연결을 확인하고 다시 시도하세요.",
    retry: "계정 상태 다시 확인",
    account: "내 계정",
    connected: name => `${name}님이 Google로 연결됐습니다. 가져온 이름은 앱 프로필에 자동 저장하지 않습니다.`,
    displayName: "앱 표시 이름",
    saveName: "이름 저장",
    nameMeta: "이름 저장을 누를 때만 이름을 전송합니다. 이메일은 표시하거나 앱 프로필에 복사하지 않습니다.",
    language: "앱 표시 언어",
    daily: "하루 목표",
    minutes: value => `${value}분`,
    localMeta: "언어와 하루 목표는 이 기기에만 남고 다른 계정에 자동 합치지 않습니다.",
    localBackup: "기기 백업 화면 열기",
    privacy: "개인정보 처리방침",
    support: "도움말·계정 문의",
    googleAccount: "Google 비밀번호·2단계 인증 관리",
    cloudStatus: (enabled, count, queued) => `수동 클라우드 보호 ${enabled ? "사용" : "꺼짐"} · 보호본 ${count}개 · 전송 대기 ${queued}건`,
    cloudMeta: "보호 사용을 켜도 자동 전송하지 않습니다. 매번 지금 보호본 만들기를 눌러야 하며 자동 업로드·복원·병합·삭제는 실행하지 않습니다.",
    enableCloud: "수동 클라우드 보호 켜기",
    disableCloud: "수동 클라우드 보호 끄기",
    backupNow: "지금 보호본 만들기",
    download: "최신 보호본 내려받기",
    deleteBackups: "클라우드 보호본 모두 삭제",
    signOut: "로그아웃",
  };
  const renderAccount = () => {
    const t = copy();
    const enabled = backupEnabled();
    const language = document.documentElement.lang === "en" ? "en" : "ko";
    const dailyOptions = DAILY_MINUTES.map(value => `<option value="${value}" ${accountPreferences.dailyMinutes === value ? "selected" : ""}>${t.minutes(value)}</option>`).join("");
    accountRoot.dataset.state = authState;
    if (authState === "checking") accountRoot.innerHTML = `<b>${t.checking}</b><p role="status">${t.checkingDetail}</p>`;
    else if (authState === "configurationError") accountRoot.innerHTML = `<b>${t.configTitle}</b><p>${t.configDetail}</p><p class="meta">${t.configMeta}</p>`;
    else if (authState === "signingIn") accountRoot.innerHTML = `<b>${t.signingIn}</b><p role="status">${t.signingInDetail}</p><button class="primary" type="button" disabled aria-busy="true">${t.signIn}</button>`;
    else if (authState === "recoverableError") accountRoot.innerHTML = `<b>${t.retryTitle}</b><p role="alert">${t.retryDetail}</p><button id="cloudAuthRetry" class="secondary" type="button">${t.retry}</button>${notice ? `<p class="cloud-notice" role="status">${escapeHtml(notice)}</p>` : ""}`;
    else if (authState === "signedOut") accountRoot.innerHTML = `<b>${t.signInTitle}</b><p>${t.signInDetail}</p><button id="cloudGoogleLogin" class="primary" type="button">${t.signIn}</button>`;
    else accountRoot.innerHTML = `<b>${t.account}</b><p>${escapeHtml(t.connected(profileName()))}</p><div class="cloud-account-grid"><label>${t.displayName}<input id="cloudDisplayName" maxlength="40" autocomplete="nickname" value="${escapeHtml(profileName())}"></label><button id="cloudDisplayNameSave" class="secondary" type="button">${t.saveName}</button><label>${t.language}<select id="cloudAccountLanguage"><option value="ko" ${language === "ko" ? "selected" : ""}>한국어</option><option value="en" ${language === "en" ? "selected" : ""}>English</option></select></label><label>${t.daily}<select id="cloudDailyMinutes">${dailyOptions}</select></label></div><p class="meta">${t.nameMeta} ${t.localMeta}</p><div class="goal-actions"><button id="openLocalBackup" class="ghost" type="button">${t.localBackup}</button><a class="ghost button-link" href="./legal/privacy.html">${t.privacy}</a><a class="ghost button-link" href="./legal/support.html">${t.support}</a><a class="ghost button-link" href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer">${t.googleAccount}</a></div><p>${t.cloudStatus(enabled, snapshots.length, outbox.list().length)}</p><p class="meta">${t.cloudMeta}</p><div class="goal-actions"><button id="toggleCloudBackup" class="${enabled ? "secondary" : "primary"}" type="button">${enabled ? t.disableCloud : t.enableCloud}</button><button id="cloudBackupNow" class="ghost" type="button" ${enabled ? "" : "disabled"}>${t.backupNow}</button><button id="downloadCloudBackup" class="ghost" type="button" ${snapshots.length ? "" : "disabled"}>${t.download}</button><button id="deleteCloudBackups" class="ghost" type="button" ${snapshots.length ? "" : "disabled"}>${t.deleteBackups}</button><button id="cloudSignOut" class="ghost" type="button">${t.signOut}</button></div>${notice ? `<p class="cloud-notice" role="status">${escapeHtml(notice)}</p>` : ""}`;
  };
  const renderFriends = () => {
    const configured = client.configured && (rawConfig.googleLoginEnabled === true || rawConfig.appleLoginEnabled === true);
    if (!configured || !user) {
      friendsRoot.innerHTML = `<b>친구 연결은 Google 로그인 후 사용할 수 있습니다</b><p>초대 링크로 작은 비공개 모임을 만들고, 목표 이름이나 메모가 아닌 선택한 응원 글과 행동 횟수만 공유합니다.</p><p class="meta">경쟁 순위는 기본 비공개이며 각 구성원이 직접 동의해야 표시됩니다.</p>`;
      return;
    }
    const names = new Map((bundle?.profiles || []).map(row => [row.actor_id, row.display_name]));
    const membership = bundle?.memberships?.find(row => row.actor_id === user.id);
    const leaderboard = bundle?.leaderboard || [];
    const posts = bundle?.posts || [];
    friendsRoot.innerHTML = `<div class="friends-toolbar"><label>내 모임<select id="friendCircleSelect"><option value="">새 모임</option>${circles.map(row => `<option value="${escapeHtml(row.id)}" ${row.id === selectedCircle?.id ? "selected" : ""}>${escapeHtml(row.name)}</option>`).join("")}</select></label><div class="friend-create"><input id="friendCircleName" maxlength="60" placeholder="예: 저녁 걷기"><button id="createFriendCircle" class="secondary" type="button">모임 만들기</button></div></div>${selectedCircle ? `<section class="friend-panel"><h3>${escapeHtml(selectedCircle.name)}</h3><p class="meta">활동 회원 ${bundle?.memberships?.filter(row => row.status === "active").length || 0}명 · 7일 행동 경쟁은 동의한 사람만 표시</p><div class="goal-actions"><button id="createFriendInvite" class="ghost" type="button">초대 링크 만들기</button><button id="shareLatestCheckin" class="ghost" type="button">최근 행동 1회 공유</button><button id="toggleRemoteRanking" class="ghost" type="button">${membership?.ranking_opt_in ? "순위 참여 취소" : "7일 순위 참여"}</button></div><div class="friend-compose"><input id="friendPostBody" maxlength="500" placeholder="친구에게 짧은 응원을 남겨보세요"><button id="postFriendMessage" class="primary" type="button">응원 보내기</button></div><div class="friend-leaderboard" aria-label="최근 7일 순위"><h4>최근 7일 행동 순위</h4>${leaderboard.length ? `<ol>${leaderboard.map(row => `<li><span>${escapeHtml(row.name)}</span><b>${row.actions}회</b></li>`).join("")}</ol>` : `<p class="meta">순위 참여에 동의한 사람이 없습니다.</p>`}</div><div class="friend-posts"><h4>서로 격려하기</h4>${posts.length ? posts.map(row => { const cheers = (bundle.reactions || []).filter(item => item.post_id === row.id).length; const own = row.author_id === user.id; return `<article data-post-id="${escapeHtml(row.id)}" data-author-id="${escapeHtml(row.author_id)}"><b>${escapeHtml(names.get(row.author_id) || "친구")}</b><p>${escapeHtml(row.body)}</p><div class="goal-actions"><button data-friend-action="cheer" class="ghost" type="button">응원 ${cheers}</button>${own ? "" : `<button data-friend-action="block" class="ghost" type="button">차단</button><button data-friend-action="report" class="ghost" type="button">신고</button>`}</div></article>`; }).join("") : `<p class="meta">아직 공유된 응원이 없습니다.</p>`}</div></section>` : `<p class="meta">모임을 만들거나 받은 초대 링크를 열어 시작하세요.</p>`}${notice ? `<p class="cloud-notice" role="status">${escapeHtml(notice)}</p>` : ""}`;
  };
  const render = () => { renderAccount(); renderFriends(); };
  const initializeAuthState = async () => {
    if (!client.configured || rawConfig.googleLoginEnabled !== true) { setAuthState("configurationError"); render(); return; }
    setAuthState("checking"); render();
    try {
      await client.consumeOAuthCallback();
      if (!await client.getSession()) { user = null; setAuthState("signedOut"); render(); return; }
      user = await client.getUser();
      snapshots = await client.listSnapshots();
      const invite = new URL(location.href).searchParams.get("invite");
      if (invite) { await client.redeemInvitation(await sha256(invite)); const clean = new URL(location.href); clean.searchParams.delete("invite"); history.replaceState({}, "", clean); notice = "친구 모임에 연결했습니다."; }
      await refreshCircles();
      setAuthState("signedIn"); render();
    } catch (_) { setAuthState("recoverableError"); notice = "계정 상태를 확인하지 못했습니다. 로컬 기록은 그대로 사용할 수 있습니다."; render(); }
  };
  const refreshAuthState = async () => {
    if (!client.configured || rawConfig.googleLoginEnabled !== true) { setAuthState("configurationError"); render(); return; }
    if (!await client.getSession()) { user = null; setAuthState("signedOut"); render(); return; }
    setAuthState("checking"); render();
    try { user = await client.getUser(); setAuthState("signedIn"); }
    catch (_) { setAuthState("recoverableError"); notice = "연결을 확인한 뒤 계정 상태를 다시 시도해 주세요."; }
    render();
  };
  const authAdapter = Object.freeze({
    initializeAuthState,
    signInWithGoogle() { setAuthState("signingIn"); render(); return client.beginGoogleLogin(safeRedirectUrl()); },
    subscribeAuthState(listener) { authListeners.add(listener); return () => authListeners.delete(listener); },
    refreshAuthState,
    updateDisplayName(nextName) { return client.upsertProfile(user, nextName); },
    async signOut() { await client.signOut(); user = null; snapshots = []; circles = []; bundle = null; setAuthState("signedOut"); },
  });
  const act = async task => {
    if (busy) return;
    busy = true;
    try { await task(); }
    catch (error) { notice = error.message === "cloud-sign-in-required" ? "로그인이 만료됐습니다. 다시 로그인해 주세요." : "요청을 완료하지 못했습니다. 기기 기록은 바뀌지 않았습니다."; }
    finally { busy = false; render(); }
  };
  accountRoot.addEventListener("click", event => act(async () => {
    if (event.target.closest("#cloudGoogleLogin")) return authAdapter.signInWithGoogle();
    if (event.target.closest("#cloudAuthRetry")) return authAdapter.refreshAuthState();
    if (event.target.closest("#cloudDisplayNameSave")) {
      const nextName = accountRoot.querySelector("#cloudDisplayName")?.value.trim();
      if (!nextName) throw new Error("display-name-required");
      await authAdapter.updateDisplayName(nextName);
      displayName = nextName.slice(0, 40);
      notice = "앱 표시 이름을 저장했습니다.";
    }
    if (event.target.closest("#toggleCloudBackup")) {
      const enabled = !backupEnabled(); setBackupEnabled(enabled);
      notice = enabled ? "수동 클라우드 보호를 켰습니다. 아직 전송하지 않았습니다." : "수동 클라우드 보호를 껐습니다. 기존 보호본은 자동 삭제하지 않습니다.";
    } else if (event.target.closest("#cloudBackupNow")) { await backupNow(); notice = "새 보호본을 만들었습니다."; }
    else if (event.target.closest("#openLocalBackup")) {
      const target = document.querySelector("#serviceBackupSection");
      if (target) { target.scrollIntoView({ block: "start", behavior: "smooth" }); target.querySelector("button")?.focus(); }
      else notice = "기기 백업 화면을 준비하고 있습니다. 잠시 후 다시 눌러 주세요.";
    }
    else if (event.target.closest("#downloadCloudBackup") && snapshots[0]) downloadJson(`wedoit-cloud-backup-${new Date().toISOString().slice(0, 10)}.json`, { schema: "wedoit.local-backup", version: 1, exportedAt: new Date().toISOString(), state: snapshots[0].payload, preferences: {} });
    else if (event.target.closest("#deleteCloudBackups") && snapshots.length) {
      if (!globalThis.confirm?.("클라우드 보호본을 모두 삭제할까요? 이 기기의 기록은 삭제되지 않습니다.")) return;
      setBackupEnabled(false); outbox.clear(); await client.deleteOwnSnapshots(user.id); snapshots = []; notice = "클라우드 보호본을 모두 삭제했습니다. 기기 기록은 그대로입니다.";
    }
    else if (event.target.closest("#cloudSignOut")) { await authAdapter.signOut(); notice = "로그아웃했습니다. 기기 기록은 그대로입니다."; }
  }));
  accountRoot.addEventListener("change", event => {
    if (event.target.matches("#cloudDailyMinutes")) {
      try { accountPreferences = writeAccountPreferences({ dailyMinutes: event.target.value }, storage); notice = "하루 목표를 이 기기에 저장했습니다."; }
      catch (_) { notice = "하루 목표를 이 기기에 저장하지 못했습니다."; }
      render();
    }
    if (event.target.matches("#cloudAccountLanguage")) {
      const trustLanguage = document.querySelector("#serviceTrustLanguage");
      if (trustLanguage) { trustLanguage.value = event.target.value; trustLanguage.dispatchEvent(new Event("change", { bubbles: true })); }
    }
  });
  friendsRoot.addEventListener("change", event => act(async () => {
    if (event.target.matches("#friendCircleSelect")) { selectedCircle = circles.find(row => row.id === event.target.value) || null; await refreshCircles(); }
  }));
  friendsRoot.addEventListener("click", event => act(async () => {
    if (event.target.closest("#createFriendCircle")) {
      const name = friendsRoot.querySelector("#friendCircleName")?.value.trim(); if (!name) throw new Error("circle-name-required");
      const created = await client.createCircle(user.id, name); const circle = Array.isArray(created) ? created[0] : created; await client.addOwnerMembership(circle.id, user.id); selectedCircle = circle; await refreshCircles(); notice = "비공개 모임을 만들었습니다.";
    } else if (event.target.closest("#createFriendInvite") && selectedCircle) {
      const { token, tokenHash } = await createInviteToken(); await client.createInvitation(selectedCircle.id, user.id, tokenHash, new Date(Date.now() + 7 * 86400000).toISOString());
      const url = new URL(safeRedirectUrl()); url.searchParams.set("invite", token);
      if (navigator.share) await navigator.share({ title: `${selectedCircle.name} 초대`, url: url.href }); else await navigator.clipboard.writeText(url.href);
      notice = "7일 동안 사용할 수 있는 초대 링크를 만들었습니다.";
    } else if (event.target.closest("#shareLatestCheckin") && selectedCircle) {
      const latest = [...app.store.getState().events].filter(row => row.type !== "rest").sort((a, b) => b.occurredAt - a.occurredAt)[0];
      if (!latest) throw new Error("no-local-checkin"); await client.shareCheckin(selectedCircle.id, user.id, latest.id, latest.occurredAt); await refreshCircles(); notice = "목표 내용 없이 행동 1회만 공유했습니다.";
    } else if (event.target.closest("#toggleRemoteRanking") && selectedCircle) {
      const mine = bundle?.memberships?.find(row => row.actor_id === user.id); await client.setRankingOptIn(selectedCircle.id, user.id, !mine?.ranking_opt_in); await refreshCircles(); notice = mine?.ranking_opt_in ? "순위 참여를 취소했습니다." : "최근 7일 행동 순위 참여에 동의했습니다.";
    } else if (event.target.closest("#postFriendMessage") && selectedCircle) {
      const body = friendsRoot.querySelector("#friendPostBody")?.value.trim(); if (!body) throw new Error("message-required"); await client.post(selectedCircle.id, user.id, body); await refreshCircles(); notice = "응원을 보냈습니다.";
    } else {
      const button = event.target.closest("[data-friend-action]"); const post = button?.closest("[data-post-id]"); if (!button || !post) return;
      if (button.dataset.friendAction === "cheer") await client.cheer(post.dataset.postId, user.id);
      if (button.dataset.friendAction === "block") await client.blockActor(user.id, post.dataset.authorId);
      if (button.dataset.friendAction === "report") await client.reportPost(user.id, post.dataset.postId);
      await refreshCircles(); notice = button.dataset.friendAction === "cheer" ? "응원을 보냈습니다." : button.dataset.friendAction === "block" ? "이 사용자를 차단했습니다." : "신고를 접수했습니다.";
    }
  }));
  await authAdapter.initializeAuthState();
  window.addEventListener("focus", () => { if (authState === "signedIn") authAdapter.refreshAuthState(); });
  document.addEventListener("visibilitychange", () => { if (!document.hidden && authState === "signedIn") authAdapter.refreshAuthState(); });
  window.addEventListener("wedoit:languagechange", render);
  document.documentElement.dataset.cloudSocialReady = "true";
  globalThis.__WEDOIT_CLOUD_SOCIAL__ = Object.freeze({ version: "v27.1.1", client, authAdapter, backupNow, refreshCircles, getState: () => clone({ configured: client.configured, authState, signedIn: Boolean(user), snapshots: snapshots.length, circles: circles.length, outbox: outbox.list().length, accountPreferences }) });
  return true;
}

if (typeof document !== "undefined") {
  const start = () => {
    if (globalThis.__WEDOIT__?.ready) mountCloudSocial().catch(() => {});
    else setTimeout(start, 50);
  };
  start();
}
