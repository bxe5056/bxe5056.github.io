/**
 * SVG paint-token helpers for color extract / replace.
 *
 * Handles solid paints: #rgb, #rrggbb, #rrggbbaa (alpha ignored for RGB match),
 * rgb()/rgba() (incl. % channels), and CSS named colors.
 *
 * Non-solids left alone / flagged via isPaintServerOrSpecial / null from normalize:
 * - none, currentColor
 * - url(...) paint servers (gradients, patterns)
 * - transparent / rgba alpha === 0
 *
 * Intentionally not normalized (returns null): hsl()/hsla(), lab(), color(),
 * system colors (CanvasText, etc.), and unknown tokens. Wave 1 can extend.
 */

/** @type {Record<string, string>} CSS Level 4 named colors → #rrggbb */
const CSS_NAMED_COLORS = {
  aliceblue: "#f0f8ff",
  antiquewhite: "#faebd7",
  aqua: "#00ffff",
  aquamarine: "#7fffd4",
  azure: "#f0ffff",
  beige: "#f5f5dc",
  bisque: "#ffe4c4",
  black: "#000000",
  blanchedalmond: "#ffebcd",
  blue: "#0000ff",
  blueviolet: "#8a2be2",
  brown: "#a52a2a",
  burlywood: "#deb887",
  cadetblue: "#5f9ea0",
  chartreuse: "#7fff00",
  chocolate: "#d2691e",
  coral: "#ff7f50",
  cornflowerblue: "#6495ed",
  cornsilk: "#fff8dc",
  crimson: "#dc143c",
  cyan: "#00ffff",
  darkblue: "#00008b",
  darkcyan: "#008b8b",
  darkgoldenrod: "#b8860b",
  darkgray: "#a9a9a9",
  darkgreen: "#006400",
  darkgrey: "#a9a9a9",
  darkkhaki: "#bdb76b",
  darkmagenta: "#8b008b",
  darkolivegreen: "#556b2f",
  darkorange: "#ff8c00",
  darkorchid: "#9932cc",
  darkred: "#8b0000",
  darksalmon: "#e9967a",
  darkseagreen: "#8fbc8f",
  darkslateblue: "#483d8b",
  darkslategray: "#2f4f4f",
  darkslategrey: "#2f4f4f",
  darkturquoise: "#00ced1",
  darkviolet: "#9400d3",
  deeppink: "#ff1493",
  deepskyblue: "#00bfff",
  dimgray: "#696969",
  dimgrey: "#696969",
  dodgerblue: "#1e90ff",
  firebrick: "#b22222",
  floralwhite: "#fffaf0",
  forestgreen: "#228b22",
  fuchsia: "#ff00ff",
  gainsboro: "#dcdcdc",
  ghostwhite: "#f8f8ff",
  gold: "#ffd700",
  goldenrod: "#daa520",
  gray: "#808080",
  green: "#008000",
  greenyellow: "#adff2f",
  grey: "#808080",
  honeydew: "#f0fff0",
  hotpink: "#ff69b4",
  indianred: "#cd5c5c",
  indigo: "#4b0082",
  ivory: "#fffff0",
  khaki: "#f0e68c",
  lavender: "#e6e6fa",
  lavenderblush: "#fff0f5",
  lawngreen: "#7cfc00",
  lemonchiffon: "#fffacd",
  lightblue: "#add8e6",
  lightcoral: "#f08080",
  lightcyan: "#e0ffff",
  lightgoldenrodyellow: "#fafad2",
  lightgray: "#d3d3d3",
  lightgreen: "#90ee90",
  lightgrey: "#d3d3d3",
  lightpink: "#ffb6c1",
  lightsalmon: "#ffa07a",
  lightseagreen: "#20b2aa",
  lightskyblue: "#87cefa",
  lightslategray: "#778899",
  lightslategrey: "#778899",
  lightsteelblue: "#b0c4de",
  lightyellow: "#ffffe0",
  lime: "#00ff00",
  limegreen: "#32cd32",
  linen: "#faf0e6",
  magenta: "#ff00ff",
  maroon: "#800000",
  mediumaquamarine: "#66cdaa",
  mediumblue: "#0000cd",
  mediumorchid: "#ba55d3",
  mediumpurple: "#9370db",
  mediumseagreen: "#3cb371",
  mediumslateblue: "#7b68ee",
  mediumspringgreen: "#00fa9a",
  mediumturquoise: "#48d1cc",
  mediumvioletred: "#c71585",
  midnightblue: "#191970",
  mintcream: "#f5fffa",
  mistyrose: "#ffe4e1",
  moccasin: "#ffe4b5",
  navajowhite: "#ffdead",
  navy: "#000080",
  oldlace: "#fdf5e6",
  olive: "#808000",
  olivedrab: "#6b8e23",
  orange: "#ffa500",
  orangered: "#ff4500",
  orchid: "#da70d6",
  palegoldenrod: "#eee8aa",
  palegreen: "#98fb98",
  paleturquoise: "#afeeee",
  palevioletred: "#db7093",
  papayawhip: "#ffefd5",
  peachpuff: "#ffdab9",
  peru: "#cd853f",
  pink: "#ffc0cb",
  plum: "#dda0dd",
  powderblue: "#b0e0e6",
  purple: "#800080",
  rebeccapurple: "#663399",
  red: "#ff0000",
  rosybrown: "#bc8f8f",
  royalblue: "#4169e1",
  saddlebrown: "#8b4513",
  salmon: "#fa8072",
  sandybrown: "#f4a460",
  seagreen: "#2e8b57",
  seashell: "#fff5ee",
  sienna: "#a0522d",
  silver: "#c0c0c0",
  skyblue: "#87ceeb",
  slateblue: "#6a5acd",
  slategray: "#708090",
  slategrey: "#708090",
  snow: "#fffafa",
  springgreen: "#00ff7f",
  steelblue: "#4682b4",
  tan: "#d2b48c",
  teal: "#008080",
  thistle: "#d8bfd8",
  tomato: "#ff6347",
  turquoise: "#40e0d0",
  violet: "#ee82ee",
  wheat: "#f5deb3",
  white: "#ffffff",
  whitesmoke: "#f5f5f5",
  yellow: "#ffff00",
  yellowgreen: "#9acd32",
};

/**
 * @param {unknown} token
 * @returns {string}
 */
function trimToken(token) {
  return String(token ?? "").trim();
}

/**
 * True for none, currentColor, and url(...) paint servers — not solid RGB paints.
 *
 * @param {unknown} token
 * @returns {boolean}
 */
export function isPaintServerOrSpecial(token) {
  const t = trimToken(token).toLowerCase();
  if (!t) return false;
  if (t === "none" || t === "currentcolor") return true;
  // url(#grad) / url("...") — gradients & patterns
  if (/^url\s*\(/i.test(t)) return true;
  return false;
}

/**
 * @param {number} n
 * @returns {string}
 */
function toHexByte(n) {
  const clamped = Math.max(0, Math.min(255, Math.round(n)));
  return clamped.toString(16).padStart(2, "0");
}

/**
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {string}
 */
function rgbToCanonicalHex(r, g, b) {
  return `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`;
}

/**
 * Parse a single rgb()/rgba() channel (0–255 number or 0%–100%).
 * @param {string} part
 * @returns {number | null}
 */
function parseRgbChannel(part) {
  const s = part.trim();
  if (!s) return null;
  if (s.endsWith("%")) {
    const pct = parseFloat(s.slice(0, -1));
    if (Number.isNaN(pct)) return null;
    return (pct / 100) * 255;
  }
  const n = parseFloat(s);
  return Number.isNaN(n) ? null : n;
}

/**
 * @param {string} raw
 * @returns {string | null} canonical #rrggbb, or null if fully transparent / unparseable
 */
function normalizeHex(raw) {
  const hex = raw.startsWith("#") ? raw.slice(1) : raw;
  if (!/^[0-9a-f]+$/i.test(hex)) return null;

  if (hex.length === 3 || hex.length === 4) {
    // #rgb / #rgba — expand; ignore alpha nibble for opaque RGB canonical form
    if (hex.length === 4) {
      const a = parseInt(hex[3] + hex[3], 16);
      if (a === 0) return null;
    }
    const r = hex[0] + hex[0];
    const g = hex[1] + hex[1];
    const b = hex[2] + hex[2];
    return `#${r}${g}${b}`.toLowerCase();
  }

  if (hex.length === 6 || hex.length === 8) {
    // #rrggbb / #rrggbbaa — drop alpha; treat alpha 0 as non-solid
    if (hex.length === 8) {
      const a = parseInt(hex.slice(6, 8), 16);
      if (a === 0) return null;
    }
    return `#${hex.slice(0, 6).toLowerCase()}`;
  }

  return null;
}

/**
 * @param {string} raw lowercase trimmed
 * @returns {string | null}
 */
function normalizeRgbFunction(raw) {
  const match = raw.match(/^rgba?\(\s*([^)]+)\s*\)$/i);
  if (!match) return null;

  // Support comma-separated and modern space-separated (optional / alpha)
  const body = match[1].trim();
  let parts;
  if (body.includes(",")) {
    parts = body.split(",").map((p) => p.trim());
  } else {
    // rgb(255 128 0 / 0.5) or rgb(100% 50% 0%)
    const slash = body.split("/");
    parts = slash[0]
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (slash[1] != null) parts.push(slash[1].trim());
  }

  if (parts.length < 3) return null;

  const r = parseRgbChannel(parts[0]);
  const g = parseRgbChannel(parts[1]);
  const b = parseRgbChannel(parts[2]);
  if (r == null || g == null || b == null) return null;

  if (parts.length >= 4) {
    const aRaw = parts[3].trim();
    let alpha;
    if (aRaw.endsWith("%")) {
      alpha = parseFloat(aRaw) / 100;
    } else {
      alpha = parseFloat(aRaw);
    }
    if (!Number.isNaN(alpha) && alpha === 0) return null;
  }

  return rgbToCanonicalHex(r, g, b);
}

/**
 * Normalize a solid SVG color token to canonical lowercase #rrggbb.
 * Returns null for non-solids, transparent, or unrecognized forms.
 *
 * @param {unknown} token
 * @returns {string | null}
 */
export function normalizeSvgColor(token) {
  const raw = trimToken(token);
  if (!raw) return null;

  if (isPaintServerOrSpecial(raw)) return null;

  const lower = raw.toLowerCase();

  // Fully transparent keyword
  if (lower === "transparent") return null;

  if (lower.startsWith("#") || /^[0-9a-f]{3,8}$/i.test(raw)) {
    return normalizeHex(lower.startsWith("#") ? lower : `#${lower}`);
  }

  if (lower.startsWith("rgb")) {
    return normalizeRgbFunction(lower);
  }

  if (Object.prototype.hasOwnProperty.call(CSS_NAMED_COLORS, lower)) {
    return CSS_NAMED_COLORS[lower];
  }

  return null;
}

/**
 * Compare two paint tokens as equivalent solid colors after normalization.
 * Special/non-solid tokens only match if their trimmed forms are equal (case-insensitive).
 *
 * @param {unknown} a
 * @param {unknown} b
 * @returns {boolean}
 */
export function colorsEquivalent(a, b) {
  const na = normalizeSvgColor(a);
  const nb = normalizeSvgColor(b);
  if (na && nb) return na === nb;

  // Both non-solid / unnormalized: compare raw tokens loosely
  const ta = trimToken(a).toLowerCase();
  const tb = trimToken(b).toLowerCase();
  if (!ta || !tb) return false;
  if (na || nb) return false; // one solid, one not
  return ta === tb;
}
