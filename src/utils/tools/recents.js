/**
 * localStorage recents + favorites for the tools hub.
 *
 * Entry shape:
 *   { path, label, category, timestamp }
 */

const RECENTS_KEY = "tools.recents";
const FAVORITES_KEY = "tools.favorites";
const MAX_RECENTS = 20;

/** @type {Set<() => void>} */
const listeners = new Set();

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

/** Cached snapshot for useSyncExternalStore (stable until notify). */
let snapshotCache = null;

function refreshSnapshot() {
  snapshotCache = {
    recents: getRecents(),
    favorites: getFavorites(),
  };
  return snapshotCache;
}

function notify() {
  refreshSnapshot();
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Ignore subscriber errors
    }
  });
}

function readList(key) {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeList(key, list) {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // Quota / private mode
  }
}

function normalizeEntry(entry) {
  if (!entry || typeof entry !== "object" || !entry.path) return null;
  return {
    path: String(entry.path),
    label: String(entry.label || entry.path),
    category: String(entry.category || ""),
    timestamp: Number(entry.timestamp) || Date.now(),
  };
}

export function getRecents() {
  return readList(RECENTS_KEY)
    .map(normalizeEntry)
    .filter(Boolean)
    .slice(0, MAX_RECENTS);
}

export function getFavorites() {
  return readList(FAVORITES_KEY).map(normalizeEntry).filter(Boolean);
}

/**
 * Record a tool visit. Dedupes by path (moves to front). Caps at MAX_RECENTS.
 * @param {{ path: string, label?: string, category?: string }} entry
 */
export function recordRecent(entry) {
  const normalized = normalizeEntry({
    ...entry,
    timestamp: Date.now(),
  });
  if (!normalized) return;

  const next = [
    normalized,
    ...getRecents().filter((item) => item.path !== normalized.path),
  ].slice(0, MAX_RECENTS);

  writeList(RECENTS_KEY, next);
  notify();
}

export function clearRecents() {
  writeList(RECENTS_KEY, []);
  notify();
}

export function isFavorite(path) {
  if (!path) return false;
  return getFavorites().some((item) => item.path === path);
}

/**
 * Toggle favorite for a tool path. Pass full entry when adding.
 * @param {{ path: string, label?: string, category?: string } | string} entryOrPath
 * @returns {boolean} true if now favorited
 */
export function toggleFavorite(entryOrPath) {
  const path =
    typeof entryOrPath === "string" ? entryOrPath : entryOrPath?.path;
  if (!path) return false;

  const current = getFavorites();
  const existing = current.find((item) => item.path === path);

  if (existing) {
    writeList(
      FAVORITES_KEY,
      current.filter((item) => item.path !== path)
    );
    notify();
    return false;
  }

  const normalized = normalizeEntry(
    typeof entryOrPath === "string"
      ? { path, label: path, category: "", timestamp: Date.now() }
      : { ...entryOrPath, timestamp: Date.now() }
  );
  if (!normalized) return false;

  writeList(FAVORITES_KEY, [normalized, ...current]);
  notify();
  return true;
}

/**
 * @param {() => void} listener
 * @returns {() => void}
 */
export function subscribeRecents(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getRecentsSnapshot() {
  if (!snapshotCache) refreshSnapshot();
  return snapshotCache;
}
