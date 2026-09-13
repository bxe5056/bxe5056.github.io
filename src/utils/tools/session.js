/**
 * In-tab shared session for tools handoffs and paste/upload payloads.
 * Persists to sessionStorage so values survive soft navigations within the tab.
 *
 * Payload shape:
 *   { type: string, text?, fileName?, mime?, dataUrl?, colors?, ... }
 *
 * Common `type` values (see handoff.js for conventions):
 *   text | json | colors | image | svg | file
 */

const STORAGE_KEY = "tools.session.payload";

/** @type {Set<() => void>} */
const listeners = new Set();

function canUseStorage() {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

function notify() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Ignore subscriber errors
    }
  });
}

function readRaw() {
  if (!canUseStorage()) return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeRaw(payload) {
  if (!canUseStorage()) return;
  try {
    if (payload == null) {
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }
  } catch {
    // Quota / private mode - still notify in-memory subscribers via getSessionPayload cache
  }
}

/** @type {object | null} */
let memoryPayload = null;
let memoryHydrated = false;

function hydrate() {
  if (memoryHydrated) return;
  memoryHydrated = true;
  memoryPayload = readRaw();
}

/**
 * @returns {object | null}
 */
export function getSessionPayload() {
  hydrate();
  return memoryPayload;
}

/**
 * @param {object | null} payload
 */
export function setSessionPayload(payload) {
  hydrate();
  if (payload == null) {
    memoryPayload = null;
    writeRaw(null);
  } else if (typeof payload === "object") {
    memoryPayload = { ...payload };
    writeRaw(memoryPayload);
  } else {
    memoryPayload = { type: "text", text: String(payload) };
    writeRaw(memoryPayload);
  }
  notify();
}

export function clearSessionPayload() {
  setSessionPayload(null);
}

/**
 * Read payload and optionally clear (default: clear after read).
 * @param {{ clear?: boolean }} [options]
 * @returns {object | null}
 */
export function consumeSessionPayload(options = {}) {
  const { clear = true } = options;
  const payload = getSessionPayload();
  if (clear && payload) clearSessionPayload();
  return payload;
}

export function hasSessionPayload() {
  return getSessionPayload() != null;
}

/**
 * Subscribe to payload changes (hooks-friendly with useSyncExternalStore).
 * @param {() => void} listener
 * @returns {() => void} unsubscribe
 */
export function subscribeSession(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Snapshot for useSyncExternalStore.getSnapshot */
export function getSessionSnapshot() {
  return getSessionPayload();
}
