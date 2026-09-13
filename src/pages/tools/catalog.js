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
    path: "/tools/data",
    description: "Convert between multiple data formats",
    color: "purple",
    tools: [
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
    path: "/tools/pdf",
    description: "View, modify, and merge PDF files",
    color: "red",
    tools: [
      { id: "viewer", label: "PDF Viewer" },
      { id: "merger", label: "PDF Merger" },
      { id: "to-images", label: "PDF to Images" },
      { id: "from-images", label: "Images to PDF" },
      { id: "reorder", label: "PDF Page Reorder" },
      { id: "rotate", label: "PDF Rotation" },
    ],
  },
  {
    id: "color",
    title: "Color Tools",
    path: "/tools/color",
    description: "Color picker, palette generator, and gradient creator",
    color: "pink",
    tools: [
      { id: "picker", label: "Color Picker" },
      { id: "palette", label: "Palette Generator" },
      { id: "gradient", label: "Gradient Generator" },
      { id: "contrast", label: "Contrast Checker" },
      { id: "extract", label: "Extract Colors" },
    ],
  },
  {
    id: "svg",
    title: "SVG Tools",
    path: "/tools/svg",
    description: "SVG optimization and manipulation tools",
    color: "blue",
    tools: [
      { id: "optimize", label: "SVG Optimizer" },
      { id: "colors", label: "Color Replacer" },
      { id: "viewbox", label: "ViewBox Calculator" },
      { id: "image-to-svg", label: "Image to SVG" },
    ],
  },
  {
    id: "image",
    title: "Image Tools",
    path: "/tools/image",
    description: "Resize, crop, compress, and convert images",
    color: "green",
    tools: [
      { id: "resize", label: "Image Resize" },
      { id: "compress", label: "Image Compress" },
      { id: "crop", label: "Image Crop" },
      { id: "convert", label: "Format Convert" },
      { id: "metadata", label: "Metadata Viewer" },
    ],
  },
  {
    id: "dev",
    title: "Developer Tools",
    path: "/tools/dev",
    description: "UUID, hash generator, regex tester, and more",
    color: "orange",
    tools: [
      { id: "uuid", label: "UUID Generator" },
      { id: "hash", label: "Hash Generator" },
      { id: "regex", label: "Regex Tester" },
      { id: "cron", label: "Cron Parser" },
      { id: "favicon", label: "Favicon Generator" },
    ],
  },
  {
    id: "text",
    title: "Text Tools",
    path: "/tools/text",
    description: "Text processing and conversion utilities",
    color: "teal",
    tools: [
      { id: "base64", label: "Base64 Encoder/Decoder" },
      { id: "url", label: "URL Encoder/Decoder" },
      { id: "jwt", label: "JWT Decoder" },
      { id: "case", label: "Case Converter" },
      { id: "markdown", label: "Markdown Preview" },
      { id: "lorem", label: "Lorem Ipsum Generator" },
    ],
  },
];

/** Build a deep-link path for a tool within a category. */
export function getToolPath(categoryPath, toolId) {
  return `${categoryPath}/${toolId}`;
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
