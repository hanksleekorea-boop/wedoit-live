// A synchronous, durable per-edit journal plus a browser-native exclusive flush.
// Never use a read/set localStorage flag as a cross-process mutex.
const PREFIX = 'wedoit.pending-op.v1.';
const LOCK = 'wedoit.store.v6';
const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const keyed = value => Array.isArray(value) && value.every(item => object(item) && typeof item.id === 'string');
const hidden = new Set(['lastWriterId', '_appliedOps', 'revision']);
export function publicState(state) {
  const result = clone(state);
  delete result.lastWriterId;
  delete result._appliedOps;
  return result;
}
export function changes(before, after, path = [], result = []) {
  if (equal(before, after)) return result;
  if (keyed(before) && keyed(after)) {
    const oldItems = new Map(before.map(item => [item.id, item]));
    const newItems = new Map(after.map(item => [item.id, item]));
    for (const id of new Set([...oldItems.keys(), ...newItems.keys()])) {
      changes(oldItems.get(id), newItems.get(id), [...path, { id }], result);
    }
  } else if (object(before) && object(after)) {
    for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
      if ((!path.length && hidden.has(key)) || ['__proto__', 'constructor', 'prototype'].includes(key)) continue;
      changes(before[key], after[key], [...path, key], result);
    }
  } else {
    result.push(after === undefined ? { path, remove: true } : { path, value: clone(after) });
  }
  return result;
}
export function applyChanges(state, edits) {
  for (const edit of edits) {
    if (!Array.isArray(edit.path) || !edit.path.length) continue;
    let parent = state;
    for (const segment of edit.path.slice(0, -1)) {
      if (typeof segment === 'string' && !['__proto__', 'constructor', 'prototype'].includes(segment)) parent = parent?.[segment];
      else if (object(segment) && typeof segment.id === 'string' && Array.isArray(parent)) parent = parent.find(item => item.id === segment.id);
      else { parent = null; break; }
      if (!parent) break; // Do not resurrect an item deleted by another tab.
    }
    if (!parent) continue;
    const last = edit.path.at(-1);
    if (object(last) && typeof last.id === 'string' && Array.isArray(parent)) {
      const index = parent.findIndex(item => item.id === last.id);
      if (edit.remove) { if (index >= 0) parent.splice(index, 1); }
      else if (index >= 0) parent[index] = clone(edit.value);
      else parent.push(clone(edit.value));
    } else if (typeof last === 'string' && !['__proto__', 'constructor', 'prototype'].includes(last)) {
      if (edit.remove) delete parent[last];
      else parent[last] = clone(edit.value);
    }
  }
  return state;
}
export function createIndexedTransaction(key) {
  let opening = null;
  const open = () => {
    if (opening) return opening;
    opening = new Promise((resolve, reject) => {
      const request = indexedDB.open('wedoit.core.v27', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('current');
      request.onerror = () => { opening = null; reject(request.error); };
      request.onblocked = () => { opening = null; reject(new Error('database-open-blocked')); };
      request.onsuccess = () => {
        const database = request.result;
        database.onversionchange = () => { database.close(); opening = null; };
        resolve(database);
      };
    });
    return opening;
  };
  return async transform => {
    const database = await open();
    return new Promise((resolve, reject) => {
      let tx;
      try { tx = database.transaction('current', 'readwrite', {durability:'strict'}); }
      catch (_) { tx = database.transaction('current', 'readwrite'); }
      const store = tx.objectStore('current'), request = store.get(key);
      let result, failure, settled = false;
      const finish = callback => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        callback();
      };
      const timeout = setTimeout(() => {
        failure = new Error('database-transaction-timeout');
        try { tx.abort(); }
        catch (_) { finish(() => reject(failure)); }
      }, 15000);
      request.onsuccess = () => {
        try {
          result = transform(request.result ? clone(request.result) : null);
          store.put(clone(result), key);
        } catch (error) { failure = error; tx.abort(); }
      };
      tx.oncomplete = () => finish(() => resolve(clone(result)));
      tx.onabort = () => finish(() => reject(failure || tx.error || new Error('database-transaction-aborted')));
      tx.onerror = () => { /* onabort is the authoritative failure event. */ };
    });
  };
}
export function createJournalCoordinator({ key, storage, getState, setState, notify, normalizeState = state => state, transaction }) {
  const writer = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let sequence = 0, baseline = clone(getState()), committed = clone(getState()), queued = null, needsFlush = false, databaseFailed = false;
  const atomic = transaction || (globalThis.indexedDB ? createIndexedTransaction(key) : null);
  const valid = value => value?.schemaVersion === 6 && Array.isArray(value.goals) && Array.isArray(value.events);
  const mirror = () => {
    try { const value = JSON.parse(storage.readRaw(key)); if (valid(value)) return normalizeState(value); } catch (_) {}
    return null;
  };
  const entries = () => {
    const found = new Map();
    try {
      for (let index = 0; index < localStorage.length; index++) {
        const name = localStorage.key(index);
        if (!name?.startsWith(PREFIX)) continue;
        try {
          const entry = JSON.parse(localStorage.getItem(name));
          if (entry?.id === name && Array.isArray(entry.edits)) found.set(name, entry);
        } catch (_) { /* Preserve damaged entries; never execute them. */ }
      }
    } catch (_) {}
    return [...found.values()].sort((a,b)=>a.at-b.at || a.id.localeCompare(b.id));
  };
  const fold = (state, pending) => {
    const applied = new Set(state._appliedOps || []);
    for (const entry of pending) if (!applied.has(entry.id)) {
      applyChanges(state, entry.edits);
      applied.add(entry.id);
      state.revision = (Number(state.revision)||0)+1;
    }
    state.events = state.events.filter(event=>state.goals.some(goal=>goal.id===event.goalId));
    // Renderer-local storage snapshots may still expose a recently removed
    // journal. Keep non-personal operation IDs so an old entry cannot replay.
    state._appliedOps = [...applied];
    return state;
  };
  const accept = state => {
    const changed = !equal(publicState(getState()),publicState(state));
    setState(state); baseline = clone(state);
    if (changed) notify();
  };
  const refresh = () => {
    if (storage.mode !== 'persistent') return;
    const hint = mirror();
    if (hint && Number(hint.revision||0)>Number(committed.revision||0)) committed = hint;
    accept(fold(normalizeState(clone(committed)),entries()));
  };
  const flush = async () => {
    if (storage.mode !== 'persistent' || !atomic) return;
    let pending = [];
    // The canonical read/modify/write is one IndexedDB transaction. A Web Lock
    // alone does not make renderer-local localStorage snapshots transactional.
    const state = await atomic(databaseState => {
      const base = valid(databaseState) ? normalizeState(databaseState) : (mirror() || normalizeState(clone(committed)));
      pending = entries();
      return fold(base,pending);
    });
    databaseFailed = false;
    committed = state;
    const raw = JSON.stringify(state);
    if (storage.readRaw(key)!==raw && !storage.writeRaw(key,raw)) {
      accept(fold(clone(committed),entries()));
      return; // Keep durable edits if the compatibility mirror could not be written.
    }
    for (const entry of pending) {
      try { localStorage.removeItem(entry.id); } catch (_) { /* Applied IDs prevent replay. */ }
    }
    // New edits may arrive while the IDB transaction is in flight.
    accept(fold(clone(committed),entries()));
  };
  const schedule = () => {
    if (storage.mode !== 'persistent') return Promise.resolve();
    if (queued) { needsFlush = true; return queued; }
    if (!globalThis.navigator?.locks?.request || !atomic) {
      storage.report('warn','이 브라우저는 안전한 저장 정리를 지원하지 않습니다. 입력은 기기에 임시 기록되며 최신 브라우저에서 다시 열면 복구를 시도합니다.');
      return Promise.resolve();
    }
    queued = navigator.locks.request(LOCK,flush).catch(() => {
      databaseFailed = true;
      storage.report('warn','기기 저장 정리를 완료하지 못했습니다. 입력 기록은 보존했습니다. 내보내기 후 다시 열어 주세요.');
    }).finally(() => {
      queued = null;
      if (needsFlush) { needsFlush = false; schedule(); }
    });
    return queued;
  };
  const commit = () => {
    const edits = changes(baseline,getState());
    baseline = clone(getState());
    if (!edits.length) return;
    if (storage.mode !== 'persistent') { storage.writeRaw(key,JSON.stringify(getState())); notify(); return; }
    const entry = {id:`${PREFIX}${writer}.${++sequence}`,at:Date.now(),edits};
    if (!storage.writeRaw(entry.id,JSON.stringify(entry))) {
      storage.writeRaw(key,JSON.stringify(getState())); notify(); return;
    }
    refresh(); schedule();
  };
  const whenSaved = async () => {
    const wait = promise => Promise.race([
      promise,
      new Promise((_,reject)=>setTimeout(()=>reject(new Error('storage-flush-timeout')),20000))
    ]);
    try {
      if (entries().length || queued) await wait(schedule());
      if (entries().length && atomic && globalThis.navigator?.locks?.request) await wait(schedule());
    } catch (_) {
      databaseFailed = true;
      storage.report('warn','기기 저장 정리가 지연되고 있습니다. 입력 기록은 보존했으며 다음 실행에서 다시 복구를 시도합니다.');
      return false;
    }
    return storage.mode==='persistent' && !databaseFailed && entries().length===0;
  };
  const exclusive = async action => {
    if (!globalThis.navigator?.locks?.request || !atomic || storage.mode!=='persistent') throw new Error('exclusive-storage-unavailable');
    return navigator.locks.request(LOCK,async () => {
      await flush();
      if (storage.mode!=='persistent') throw new Error('persistent-storage-unavailable');
      const snapshots = new Map();
      const remember = name => { if (!snapshots.has(name)) snapshots.set(name,localStorage.getItem(name)); };
      const trackedStorage = {
        getItem:name=>localStorage.getItem(name),
        setItem:(name,value)=>{remember(name);localStorage.setItem(name,value);},
        removeItem:name=>{remember(name);localStorage.removeItem(name);}
      };
      try {
        const result = action(publicState(committed),trackedStorage);
        if (result && typeof result.then==='function') throw new Error('exclusive-action-must-be-synchronous');
        const next = mirror() || clone(committed);
        next.revision = (Number(committed.revision)||0)+1;
        next._appliedOps = committed._appliedOps || [];
        trackedStorage.setItem(key,JSON.stringify(next));
        committed = await atomic(()=>next);
        databaseFailed = false;
        refresh();
        return result;
      } catch (error) {
        let rollbackFailed = false;
        for (const [name,value] of snapshots) {
          try { value===null ? localStorage.removeItem(name) : localStorage.setItem(name,value); }
          catch (_) { rollbackFailed = true; }
        }
        refresh();
        if (rollbackFailed) throw new Error('exclusive-rollback-failed');
        throw error;
      }
    });
  };
  if (typeof window!=='undefined') window.addEventListener('storage',event=>{
    if (event.key!==key && !event.key?.startsWith(PREFIX)) return;
    if (event.key===key && event.newValue) {
      try {
        const value=JSON.parse(event.newValue);
        if(valid(value) && Number(value.revision||0)>=Number(committed.revision||0)) committed=normalizeState(value);
      } catch (_) {}
    }
    refresh();
    // A failed exclusive operation may restore an older mirror revision.
    // Re-read the transactional authority instead of retaining that transient hint.
    if(event.key===key || (event.key?.startsWith(PREFIX) && event.newValue)) schedule();
  });
  refresh(); schedule();
  return {commit,whenSaved,exclusive};
}
