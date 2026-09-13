/**
 * SVG color extract / replace engine.
 * Walks paint attributes, inline style, and <style> blocks.
 * Solid colors are grouped via normalizeSvgColor; none / currentColor / url()
 * are left alone unless the caller opts in.
 */

import {
  normalizeSvgColor,
  isPaintServerOrSpecial,
} from "../../../utils/tools/svgColorNormalize";

/** @type {readonly string[]} */
export const PAINT_ATTRIBUTES = Object.freeze([
  "fill",
  "stroke",
  "stop-color",
  "flood-color",
  "lighting-color",
]);

/** CSS property names that carry SVG paints (same set as attributes). */
const PAINT_STYLE_PROPS = new Set(PAINT_ATTRIBUTES);

/**
 * @param {string} token
 * @returns {'solid' | 'special' | 'other'}
 */
function classifyToken(token) {
  const t = String(token ?? "").trim();
  if (!t) return "other";
  if (isPaintServerOrSpecial(t)) return "special";
  if (normalizeSvgColor(t)) return "solid";
  return "other";
}

/**
 * @param {Map<string, { canonical: string, samples: Map<string, number>, count: number }>} groups
 * @param {string} raw
 */
function addSolidSample(groups, raw) {
  const token = String(raw).trim();
  const canonical = normalizeSvgColor(token);
  if (!canonical) return;

  let group = groups.get(canonical);
  if (!group) {
    group = { canonical, samples: new Map(), count: 0 };
    groups.set(canonical, group);
  }
  group.count += 1;
  group.samples.set(token, (group.samples.get(token) || 0) + 1);
}

/**
 * @param {Map<string, { token: string, count: number }>} specials
 * @param {string} raw
 */
function addSpecialSample(specials, raw) {
  const token = String(raw).trim();
  if (!token) return;
  const key = token.toLowerCase();
  let entry = specials.get(key);
  if (!entry) {
    entry = { token, count: 0 };
    specials.set(key, entry);
  }
  entry.count += 1;
}

/**
 * Record a paint token into solid groups or specials.
 * @param {string} raw
 * @param {Map} groups
 * @param {Map} specials
 * @param {{ includeSpecial?: boolean }} [opts]
 */
function recordPaintToken(raw, groups, specials, opts = {}) {
  const kind = classifyToken(raw);
  if (kind === "solid") {
    addSolidSample(groups, raw);
  } else if (kind === "special" && opts.includeSpecial !== false) {
    addSpecialSample(specials, raw);
  }
}

/**
 * Parse an inline style attribute into declaration objects.
 * @param {string} styleText
 * @returns {{ prop: string, value: string, raw: string }[]}
 */
export function parseStyleDeclarations(styleText) {
  const text = String(styleText ?? "");
  if (!text.trim()) return [];

  const decls = [];
  // Split on `;` but keep values intact (no nested parens issues for typical paint values)
  for (const part of text.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const colon = trimmed.indexOf(":");
    if (colon === -1) continue;
    const prop = trimmed.slice(0, colon).trim().toLowerCase();
    const value = trimmed.slice(colon + 1).trim();
    decls.push({ prop, value, raw: trimmed });
  }
  return decls;
}

/**
 * @param {{ prop: string, value: string }[]} decls
 * @returns {string}
 */
function serializeStyleDeclarations(decls) {
  return decls.map((d) => `${d.prop}: ${d.value}`).join("; ");
}

/**
 * Walk color tokens inside a CSS <style> block text.
 * Replaces only paint property values when a replacer returns a string.
 *
 * @param {string} cssText
 * @param {(value: string, prop: string) => string | null | undefined} onPaint
 * @returns {string}
 */
export function walkCssPaintValues(cssText, onPaint) {
  // Match `prop: value` for known paint properties inside CSS text.
  // Value runs until `;` or `}`.
  const propPattern = PAINT_ATTRIBUTES.map((p) =>
    p.replace(/-/g, "\\-")
  ).join("|");
  const re = new RegExp(
    `(^|[{;\\s])(${propPattern})\\s*:\\s*([^;}{]+)`,
    "gi"
  );

  return cssText.replace(re, (full, prefix, prop, value) => {
    const trimmed = value.trim();
    const next = onPaint(trimmed, prop.toLowerCase());
    if (next == null || next === trimmed) return full;
    // Preserve trailing whitespace from original value capture
    const trailingWs = value.match(/\s*$/)?.[0] ?? "";
    return `${prefix}${prop}: ${next}${trailingWs}`;
  });
}

/**
 * Extract grouped solid colors (+ optional special paints) from SVG markup.
 *
 * @param {string} svgString
 * @param {{ includeSpecial?: boolean }} [options]
 * @returns {{
 *   colors: Array<{
 *     canonical: string,
 *     samples: string[],
 *     count: number,
 *     display: string,
 *   }>,
 *   specials: Array<{ token: string, count: number }>,
 *   error: string | null,
 * }}
 */
export function extractSvgColors(svgString, options = {}) {
  const includeSpecial = options.includeSpecial !== false;
  const groups = new Map();
  const specials = new Map();

  if (!svgString || typeof svgString !== "string") {
    return { colors: [], specials: [], error: "No SVG content" };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    return {
      colors: [],
      specials: [],
      error: "Could not parse SVG",
    };
  }

  const elements = doc.querySelectorAll("*");
  elements.forEach((el) => {
    // Paint attributes
    for (const attr of PAINT_ATTRIBUTES) {
      if (!el.hasAttribute(attr)) continue;
      recordPaintToken(el.getAttribute(attr), groups, specials, {
        includeSpecial,
      });
    }

    // Inline style
    if (el.hasAttribute("style")) {
      const decls = parseStyleDeclarations(el.getAttribute("style"));
      decls.forEach((d) => {
        if (!PAINT_STYLE_PROPS.has(d.prop)) return;
        recordPaintToken(d.value, groups, specials, { includeSpecial });
      });
    }

    // <style> blocks
    if (el.localName === "style" || el.tagName?.toLowerCase() === "style") {
      const css = el.textContent || "";
      walkCssPaintValues(css, (value) => {
        recordPaintToken(value, groups, specials, { includeSpecial });
        return null; // extract only
      });
    }
  });

  const colors = Array.from(groups.values())
    .map((g) => {
      const samples = Array.from(g.samples.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([token]) => token);
      return {
        canonical: g.canonical,
        samples,
        count: g.count,
        display: samples[0] || g.canonical,
      };
    })
    .sort((a, b) => b.count - a.count || a.canonical.localeCompare(b.canonical));

  return {
    colors,
    specials: Array.from(specials.values()).sort((a, b) => b.count - a.count),
    error: null,
  };
}

/**
 * Decide the replacement for a raw paint token.
 *
 * @param {string} raw
 * @param {Record<string, string>} replacements  canonical hex → new color (or special key → new)
 * @param {{ replaceSpecial?: boolean }} options
 * @returns {string | null} new value, or null to leave unchanged
 */
function resolveReplacement(raw, replacements, options) {
  const token = String(raw ?? "").trim();
  if (!token) return null;

  const kind = classifyToken(token);

  if (kind === "special") {
    if (!options.replaceSpecial) return null;
    const key = token.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(replacements, key)) {
      return replacements[key];
    }
    // Also allow matching the display token as-is
    if (Object.prototype.hasOwnProperty.call(replacements, token)) {
      return replacements[token];
    }
    return null;
  }

  if (kind === "solid") {
    const canonical = normalizeSvgColor(token);
    if (
      canonical &&
      Object.prototype.hasOwnProperty.call(replacements, canonical)
    ) {
      const next = replacements[canonical];
      if (next == null || next === "" || next === token) return null;
      // Skip no-ops where normalized forms match
      const nextNorm = normalizeSvgColor(next);
      if (nextNorm && nextNorm === canonical) return null;
      return next;
    }
  }

  return null;
}

/**
 * Apply color replacements to SVG markup.
 *
 * @param {string} svgString
 * @param {Record<string, string>} replacements  map of canonical #rrggbb (or special token) → new value
 * @param {{ replaceSpecial?: boolean }} [options]
 * @returns {{ svg: string, changed: number, error: string | null }}
 */
export function replaceSvgColors(svgString, replacements, options = {}) {
  const replaceSpecial = Boolean(options.replaceSpecial);
  const map = replacements && typeof replacements === "object" ? replacements : {};

  if (!svgString || typeof svgString !== "string") {
    return { svg: "", changed: 0, error: "No SVG content" };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    return { svg: svgString, changed: 0, error: "Could not parse SVG" };
  }

  let changed = 0;

  const applyToken = (raw) => {
    const next = resolveReplacement(raw, map, { replaceSpecial });
    if (next != null) {
      changed += 1;
      return next;
    }
    return null;
  };

  const elements = doc.querySelectorAll("*");
  elements.forEach((el) => {
    for (const attr of PAINT_ATTRIBUTES) {
      if (!el.hasAttribute(attr)) continue;
      const current = el.getAttribute(attr);
      const next = applyToken(current);
      if (next != null) el.setAttribute(attr, next);
    }

    if (el.hasAttribute("style")) {
      const decls = parseStyleDeclarations(el.getAttribute("style"));
      let styleChanged = false;
      const nextDecls = decls.map((d) => {
        if (!PAINT_STYLE_PROPS.has(d.prop)) return d;
        const next = applyToken(d.value);
        if (next == null) return d;
        styleChanged = true;
        return { ...d, value: next };
      });
      if (styleChanged) {
        el.setAttribute("style", serializeStyleDeclarations(nextDecls));
      }
    }

    if (el.localName === "style" || el.tagName?.toLowerCase() === "style") {
      const css = el.textContent || "";
      const nextCss = walkCssPaintValues(css, (value) => applyToken(value));
      if (nextCss !== css) {
        el.textContent = nextCss;
      }
    }
  });

  const serializer = new XMLSerializer();
  return {
    svg: serializer.serializeToString(doc),
    changed,
    error: null,
  };
}

/**
 * Build one SVG per solid color by forcing all other solid paints to `none`.
 * Useful for export-by-color ZIP packs.
 *
 * @param {string} svgString
 * @param {Array<{ canonical: string, display?: string }>} colorGroups
 * @returns {Array<{ canonical: string, svg: string, filename: string }>}
 */
export function splitSvgByColor(svgString, colorGroups) {
  if (!Array.isArray(colorGroups) || colorGroups.length === 0) return [];

  return colorGroups.map((group, index) => {
    const keep = group.canonical;
    /** @type {Record<string, string>} */
    const replacements = {};
    colorGroups.forEach((g) => {
      if (g.canonical !== keep) {
        replacements[g.canonical] = "none";
      }
    });

    const { svg } = replaceSvgColors(svgString, replacements, {
      replaceSpecial: false,
    });

    const slug = keep.replace("#", "") || `color-${index + 1}`;
    return {
      canonical: keep,
      svg,
      filename: `color-${slug}.svg`,
    };
  });
}
