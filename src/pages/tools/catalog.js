/**
 * Single source of truth for tools hub categories and deep-link slugs.
 * Slugs must match the `:tool` route params handled by each category page.
 *
 * Data tools note — format matrix:
 * Deep links use `{source}To{target}` where source/target are SUPPORTED_FORMATS
 * keys lowercased (e.g. csvToJson, md_tableToJson, html_tableToJson).
 * data.js parses the path by splitting on "To" and uppercasing both sides, so
 * hub chips should point at a representative conversion into/out of that format
 * (not a bare format name). MD_TABLE / HTML_TABLE require the underscore form.
 */

export const TOOL_CATEGORIES = [
  {
    id: "data",
    title: "Data Tools",
    shortLabel: "Data",
    path: "/tools/data",
    description: "Convert between multiple data formats",
    color: "purple",
    tools: [
      { id: "editor", label: "JSON / YAML / TOML" },
      { id: "csvToJson", label: "CSV" },
      { id: "jsonToCsv", label: "JSON" },
      { id: "yamlToJson", label: "YAML" },
      { id: "xmlToJson", label: "XML" },
      { id: "md_tableToJson", label: "MD Table" },
      { id: "html_tableToJson", label: "HTML Table" },
    ],
  },
  {
    id: "pdf",
    title: "PDF Tools",
    shortLabel: "PDF",
    path: "/tools/pdf",
    description: "View, modify, and merge PDF files",
    color: "red",
    tools: [
      { id: "viewer", label: "PDF Viewer", shortLabel: "Viewer" },
      { id: "merger", label: "PDF Merger", shortLabel: "Merger" },
      { id: "to-images", label: "PDF to Images", shortLabel: "To Images" },
      { id: "from-images", label: "Images to PDF", shortLabel: "From Images" },
      { id: "reorder", label: "Page Reorder", shortLabel: "Reorder" },
      { id: "rotate", label: "Rotate PDF", shortLabel: "Rotate" },
      { id: "split", label: "Split / Extract", shortLabel: "Split" },
    ],
  },
  {
    id: "color",
    title: "Color Tools",
    shortLabel: "Color",
    path: "/tools/color",
    description: "Color picker, palette generator, and gradient creator",
    color: "pink",
    tools: [
      { id: "picker", label: "Color Picker", shortLabel: "Picker" },
      { id: "palette", label: "Palette Generator", shortLabel: "Palette" },
      { id: "gradient", label: "Gradient Generator", shortLabel: "Gradient" },
      { id: "contrast", label: "Contrast Checker", shortLabel: "Contrast" },
      { id: "extract", label: "Extract Colors", shortLabel: "Extract" },
      { id: "blindness", label: "Color Blindness", shortLabel: "Blindness" },
      // Palette export (CSS/SVG/ASE helpers) lives on extract/picker via paletteExport.js
    ],
  },
  {
    id: "svg",
    title: "SVG Tools",
    shortLabel: "SVG",
    path: "/tools/svg",
    description: "SVG optimization, color swap, and Photo ↔ SVG conversion",
    color: "blue",
    tools: [
      { id: "optimize", label: "Optimize", shortLabel: "Optimize" },
      { id: "colors", label: "Color Swap", shortLabel: "Colors" },
      { id: "viewbox", label: "ViewBox", shortLabel: "ViewBox" },
      { id: "image-to-svg", label: "Photo ↔ SVG", shortLabel: "Photo ↔ SVG" },
      { id: "sprite", label: "Sprite / Favicon Pack", shortLabel: "Sprite" },
    ],
  },
  {
    id: "image",
    title: "Image Tools",
    shortLabel: "Image",
    path: "/tools/image",
    description: "Resize, crop, compress, and convert images",
    color: "green",
    tools: [
      { id: "resize", label: "Resize", shortLabel: "Resize" },
      { id: "compress", label: "Compress", shortLabel: "Compress" },
      { id: "crop", label: "Crop", shortLabel: "Crop" },
      { id: "convert", label: "Convert", shortLabel: "Convert" },
      { id: "metadata", label: "EXIF / Metadata", shortLabel: "EXIF" },
    ],
  },
  {
    id: "dev",
    title: "Developer Tools",
    shortLabel: "Dev",
    path: "/tools/dev",
    description: "UUID, hash generator, regex tester, and more",
    color: "orange",
    tools: [
      { id: "uuid", label: "UUID Generator", shortLabel: "UUID" },
      { id: "hash", label: "Hash Generator", shortLabel: "Hash" },
      { id: "regex", label: "Regex Tester", shortLabel: "Regex" },
      { id: "cron", label: "Cron Parser", shortLabel: "Cron" },
      { id: "favicon", label: "Favicon Generator", shortLabel: "Favicon" },
      { id: "qr", label: "QR Code", shortLabel: "QR" },
      { id: "timestamp", label: "Timestamp", shortLabel: "Timestamp" },
      { id: "units", label: "Unit Converter", shortLabel: "Units" },
    ],
  },
  {
    id: "text",
    title: "Text Tools",
    shortLabel: "Text",
    path: "/tools/text",
    description: "Text processing and conversion utilities",
    color: "teal",
    tools: [
      { id: "base64", label: "Base64", shortLabel: "Base64" },
      { id: "url", label: "URL Encode/Decode", shortLabel: "URL" },
      { id: "jwt", label: "JWT Decode / Sign", shortLabel: "JWT" },
      { id: "case", label: "Case Converter", shortLabel: "Case" },
      { id: "markdown", label: "Markdown Preview", shortLabel: "Markdown" },
      { id: "lorem", label: "Lorem Ipsum Generator", shortLabel: "Lorem" },
      { id: "diff", label: "Diff / Patch", shortLabel: "Diff" },
      { id: "unicode", label: "Unicode", shortLabel: "Unicode" },
    ],
  },
];

/** Build a deep-link path for a tool within a category. */
export function getToolPath(categoryPath, toolId) {
  return `${categoryPath}/${toolId}`;
}

/** Look up a category by id (e.g. "pdf", "dev"). */
export function getCategory(categoryId) {
  return TOOL_CATEGORIES.find((category) => category.id === categoryId);
}

/** Tools list for a category (empty array if unknown). */
export function getCategoryTools(categoryId) {
  return getCategory(categoryId)?.tools ?? [];
}

/** Flat list of all tools with category context (handy for later ToolLayout). */
export function getAllTools() {
  return TOOL_CATEGORIES.flatMap((category) =>
    category.tools.map((tool) => ({
      ...tool,
      categoryId: category.id,
      categoryTitle: category.title,
      categoryPath: category.path,
      path: getToolPath(category.path, tool.id),
    }))
  );
}
