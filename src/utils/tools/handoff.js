/**
 * Open another tool with a shared session payload (in-tab handoff).
 *
 * Payload conventions - set via session before navigate:
 *
 * | type     | fields                                      | typical targets              |
 * |----------|---------------------------------------------|------------------------------|
 * | text     | text                                        | text/*, dev/regex, data/*    |
 * | json     | text (JSON string)                          | data/editor, text/diff       |
 * | colors   | colors: string[] (hex/rgb)                  | color/*, svg/colors          |
 * | image    | dataUrl, fileName?, mime?                   | image/*, svg/image-to-svg    |
 * | svg      | text (SVG markup), fileName?                | svg/*, color/extract         |
 * | file     | text? and/or dataUrl?, fileName?, mime?     | any paste/upload consumer    |
 *
 * Feature agents should call consumeSessionPayload() on mount when they
 * support handoffs. UI "Open in…" menus can land later; this API is stable now.
 */

import { TOOL_CATEGORIES, getToolPath } from "../../pages/tools/catalog";
import { setSessionPayload } from "./session";

/**
 * Resolve a catalog category id ("text") or path ("/tools/text") to categoryPath.
 * @param {string} category
 * @returns {string | null}
 */
export function resolveCategoryPath(category) {
  if (!category) return null;
  if (String(category).startsWith("/")) return category;

  const match = TOOL_CATEGORIES.find(
    (item) => item.id === category || item.path === `/tools/${category}`
  );
  return match?.path || null;
}

/**
 * @param {string} category - category id or path
 * @param {string} toolId
 * @returns {string | null}
 */
export function resolveToolPath(category, toolId) {
  const categoryPath = resolveCategoryPath(category);
  if (!categoryPath || !toolId) return null;
  return getToolPath(categoryPath, toolId);
}

/**
 * Store payload in the shared session and navigate to the target tool.
 *
 * @param {object} options
 * @param {string} options.category - category id (e.g. "color") or path
 * @param {string} options.toolId - catalog tool slug
 * @param {object} options.payload - typed session payload (see conventions above)
 * @param {(path: string) => void} [options.navigate] - react-router navigate; falls back to location.assign
 * @returns {string | null} destination path, or null if unresolved
 */
export function openToolWithPayload({ category, toolId, payload, navigate }) {
  const path = resolveToolPath(category, toolId);
  if (!path) return null;

  if (payload != null) {
    setSessionPayload(payload);
  }

  if (typeof navigate === "function") {
    navigate(path);
  } else if (typeof window !== "undefined") {
    window.location.assign(path);
  }

  return path;
}
