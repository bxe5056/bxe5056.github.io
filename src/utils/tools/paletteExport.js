/**
 * Palette export helpers (browser-local, no heavy deps).
 * Feature agents (Color extract/picker, SVG Color Swap) should import these.
 *
 * TODO(ASE): Adobe Swatch Exchange (.ase) is a binary RIFF-like format.
 * Add a pure-JS encoder here later if needed - prefer CSS + SVG for now.
 */

/**
 * @param {string[]} colors - hex/rgb color strings
 * @param {{ prefix?: string }} [options]
 * @returns {string} CSS custom properties block
 */
export function paletteToCssVariables(colors, options = {}) {
  const prefix = options.prefix || "color";
  const list = Array.isArray(colors) ? colors.filter(Boolean) : [];
  const lines = list.map((color, index) => {
    const name = `--${prefix}-${index + 1}`;
    return `  ${name}: ${color};`;
  });
  return `:root {\n${lines.join("\n")}\n}\n`;
}

/**
 * Build a simple SVG document of color swatches.
 * @param {string[]} colors
 * @param {{ swatchSize?: number, gap?: number, columns?: number }} [options]
 * @returns {string} SVG markup
 */
export function paletteToSvgSwatches(colors, options = {}) {
  const list = Array.isArray(colors) ? colors.filter(Boolean) : [];
  const size = options.swatchSize || 48;
  const gap = options.gap ?? 8;
  const columns = options.columns || Math.min(list.length || 1, 8);
  const rows = Math.max(1, Math.ceil(list.length / columns));
  const width = columns * size + (columns + 1) * gap;
  const height = rows * size + (rows + 1) * gap;

  const rects = list
    .map((color, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = gap + col * (size + gap);
      const y = gap + row * (size + gap);
      return `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${escapeXml(
        color
      )}" rx="4" />`;
    })
    .join("\n  ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${rects}
</svg>
`;
}

/**
 * @param {string[]} colors
 * @returns {{ css: string, svg: string }}
 */
export function exportPalette(colors) {
  return {
    css: paletteToCssVariables(colors),
    svg: paletteToSvgSwatches(colors),
  };
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
