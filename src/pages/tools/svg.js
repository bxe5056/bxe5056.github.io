import React, { useState, useCallback, useEffect } from "react";
import ToolLayout from "../../components/tools/ToolLayout";
import { useDropzone } from "react-dropzone";
import {
  FaUpload,
  FaDownload,
  FaCopy,
  FaCode,
  FaCompress,
  FaPalette,
  FaRuler,
} from "react-icons/fa";
import { optimize } from "svgo/dist/svgo.browser";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";

const validTools = ["optimize", "colors", "viewbox"];
const defaultTool = "optimize";

const SvgTools = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tool") || defaultTool
  );
  const [svgContent, setSvgContent] = useState("");
  const [processedSvg, setProcessedSvg] = useState("");
  const [loading, setLoading] = useState(false);
  const [viewBox, setViewBox] = useState({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });
  const [svgColors, setSvgColors] = useState([]);
  const [colorReplacements, setColorReplacements] = useState({});
  const [tempInputValues, setTempInputValues] = useState({});
  const [fillColor, setFillColor] = useState("#000000");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(1);

  const extractColors = useCallback((content) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "image/svg+xml");
    const elements = doc.querySelectorAll("*");
    const uniqueColors = new Set();

    elements.forEach((el) => {
      const fill = el.getAttribute("fill");
      const stroke = el.getAttribute("stroke");
      const style = el.getAttribute("style");

      if (fill && fill !== "none") uniqueColors.add(fill);
      if (stroke && stroke !== "none") uniqueColors.add(stroke);
      if (style) {
        const fillMatch = style.match(/fill:\s*([^;]+)/);
        const strokeMatch = style.match(/stroke:\s*([^;]+)/);
        if (fillMatch && fillMatch[1] !== "none")
          uniqueColors.add(fillMatch[1]);
        if (strokeMatch && strokeMatch[1] !== "none")
          uniqueColors.add(strokeMatch[1]);
      }
    });

    return Array.from(uniqueColors);
  }, []);

  const addMetadata = useCallback((svgString) => {
    const now = new Date().toISOString();
    const metadata = `<!-- Modified with the SVG Toolset on bentheguy.me - ${now} -->`;

    if (svgString.includes("Modified with the SVG Toolset on bentheguy.me")) {
      return svgString.replace(
        /<!-- Modified with the SVG Toolset on bentheguy\.me[^>]*-->/,
        metadata
      );
    }

    return svgString.replace(/<svg/, `${metadata}\n<svg`);
  }, []);

  const removeOtherComments = useCallback((svgString) => {
    // Preserve our metadata comment but remove all others
    const ourMetadata = svgString.match(
      /<!-- Modified with the SVG Toolset on bentheguy\.me[^>]*-->/
    );
    // Remove all comments
    let result = svgString.replace(/<!--[\s\S]*?-->/g, "");
    // Add back our metadata if it existed
    if (ourMetadata) {
      result = result.replace(/<svg/, `${ourMetadata[0]}\n<svg`);
    }
    return result;
  }, []);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        // Clean any existing comments and add our metadata right away
        const cleanedContent = removeOtherComments(content);
        const contentWithMetadata = addMetadata(cleanedContent);

        setSvgContent(contentWithMetadata);
        setProcessedSvg(contentWithMetadata);

        // Extract colors from SVG
        const colors = extractColors(content);
        setSvgColors(colors);
        // Initialize color replacements object
        const initialReplacements = {};
        colors.forEach((color) => {
          initialReplacements[color] = color;
        });
        setColorReplacements(initialReplacements);

        // Extract viewBox from SVG
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, "image/svg+xml");
        const svg = doc.querySelector("svg");
        if (svg && svg.getAttribute("viewBox")) {
          const [x, y, width, height] = svg
            .getAttribute("viewBox")
            .split(" ")
            .map(Number);
          setViewBox({ x, y, width, height });
        }
      };
      reader.readAsText(file);
    },
    [extractColors, removeOtherComments, addMetadata]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/svg+xml": [".svg"] },
    maxFiles: 1,
  });

  const optimizeSvg = useCallback(() => {
    if (!svgContent) return;

    setLoading(true);
    try {
      const result = optimize(svgContent, {
        multipass: true,
        plugins: [
          {
            name: "preset-default",
            params: {
              overrides: {
                removeViewBox: false,
                removeComments: true, // Remove all comments during optimization
              },
            },
          },
          "removeDoctype",
          "removeXMLProcInst",
          "removeComments",
          "removeMetadata",
          "removeEditorsNSData",
          "cleanupAttrs",
          "mergeStyles",
          "inlineStyles",
          "minifyStyles",
          "cleanupIds",
          "removeUselessDefs",
          "cleanupNumericValues",
          "convertColors",
          "removeUnknownsAndDefaults",
          "removeNonInheritableGroupAttrs",
          "removeUselessStrokeAndFill",
          "cleanupEnableBackground",
          "removeHiddenElems",
          "removeEmptyText",
          "convertShapeToPath",
          "convertEllipseToCircle",
          "moveElemsAttrsToGroup",
          "moveGroupAttrsToElems",
          "collapseGroups",
          "convertPathData",
          "convertTransform",
          "removeEmptyAttrs",
          "removeEmptyContainers",
          "mergePaths",
          "removeUnusedNS",
          "sortDefsChildren",
          "removeTitle",
          "removeDesc",
        ],
      });

      // Add our metadata after optimization
      setProcessedSvg(addMetadata(result.data));
      setLoading(false);
    } catch (error) {
      console.error("Error optimizing SVG:", error);
      alert("Error optimizing SVG");
      setLoading(false);
    }
  }, [svgContent, addMetadata]);

  const updateColors = useCallback(() => {
    if (!svgContent) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, "image/svg+xml");
    const elements = doc.querySelectorAll(
      "path, circle, rect, polygon, polyline"
    );

    elements.forEach((el) => {
      if (fillColor) el.setAttribute("fill", fillColor);
      if (strokeColor) el.setAttribute("stroke", strokeColor);
      if (strokeWidth) el.setAttribute("stroke-width", strokeWidth);
    });

    const serializer = new XMLSerializer();
    setProcessedSvg(addMetadata(serializer.serializeToString(doc)));
  }, [svgContent, fillColor, strokeColor, strokeWidth, addMetadata]);

  const updateViewBox = useCallback(() => {
    if (!svgContent) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, "image/svg+xml");
    const svg = doc.querySelector("svg");

    if (svg) {
      svg.setAttribute(
        "viewBox",
        `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`
      );
      const serializer = new XMLSerializer();
      let result = serializer.serializeToString(doc);
      result = removeOtherComments(result);
      setProcessedSvg(addMetadata(result));
    }
  }, [svgContent, viewBox, removeOtherComments, addMetadata]);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    } catch (err) {
      alert("Failed to copy text");
    }
  };

  const downloadSvg = () => {
    if (!processedSvg) return;

    // Ensure metadata is present in the final download
    const finalSvg = processedSvg.includes(
      "Modified with the SVG Toolset on bentheguy.me"
    )
      ? processedSvg
      : addMetadata(processedSvg);

    const blob = new Blob([finalSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "processed.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const replaceColors = useCallback(() => {
    if (!svgContent) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, "image/svg+xml");
    const elements = doc.querySelectorAll("*");

    elements.forEach((el) => {
      const fill = el.getAttribute("fill");
      const stroke = el.getAttribute("stroke");
      const style = el.getAttribute("style");

      if (fill && fill !== "none" && colorReplacements[fill]) {
        el.setAttribute("fill", colorReplacements[fill]);
      }
      if (stroke && stroke !== "none" && colorReplacements[stroke]) {
        el.setAttribute("stroke", colorReplacements[stroke]);
      }
      if (style) {
        let newStyle = style;
        Object.entries(colorReplacements).forEach(([oldColor, newColor]) => {
          newStyle = newStyle.replace(
            new RegExp(`fill:\\s*${oldColor}`, "g"),
            `fill: ${newColor}`
          );
          newStyle = newStyle.replace(
            new RegExp(`stroke:\\s*${oldColor}`, "g"),
            `stroke: ${newColor}`
          );
        });
        if (newStyle !== style) {
          el.setAttribute("style", newStyle);
        }
      }
    });

    const serializer = new XMLSerializer();
    let result = serializer.serializeToString(doc);
    result = removeOtherComments(result);
    setProcessedSvg(addMetadata(result));
  }, [svgContent, colorReplacements, removeOtherComments, addMetadata]);

  const renderTool = () => {
    switch (activeTab) {
      case "optimize":
        return (
          <div className="space-y-6">
            <button
              onClick={optimizeSvg}
              disabled={!svgContent || loading}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:bg-gray-400"
            >
              {loading ? "Optimizing..." : "Optimize SVG"}
            </button>
            {processedSvg && (
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  Original size: {new Blob([svgContent]).size} bytes
                  <br />
                  Optimized size: {new Blob([processedSvg]).size} bytes
                  <br />
                  Reduction:{" "}
                  {Math.round(
                    ((new Blob([svgContent]).size -
                      new Blob([processedSvg]).size) /
                      new Blob([svgContent]).size) *
                      100
                  )}
                  %
                </div>
              </div>
            )}
          </div>
        );

      case "colors":
        return (
          <div className="space-y-6">
            {svgColors.length > 0 ? (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Click on any <span className="font-medium">New</span> color
                  swatch to choose a replacement color. You can also type the
                  color value and press Enter or click outside to apply.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 justify-center">
                  {svgColors.map((color, index) => (
                    <div
                      key={index}
                      className="flex items-center p-2 border rounded bg-white"
                    >
                      <div className="flex items-center space-x-4">
                        {/* Original Color Section */}
                        <div className="flex items-center space-x-2">
                          <div
                            className="flex-none w-8 h-8 rounded border shadow-sm"
                            style={{ backgroundColor: color }}
                          />
                          <div>
                            <div className="text-xs font-medium text-gray-500">
                              Original
                            </div>
                            <div className="text-xs font-mono mt-1">
                              {color}
                            </div>
                          </div>
                        </div>

                        {/* Arrow */}
                        <div className="text-gray-400 text-sm">→</div>

                        {/* New Color Section */}
                        <div className="flex items-center space-x-2">
                          <div className="relative">
                            <input
                              type="color"
                              value={colorReplacements[color] || color}
                              onChange={(e) =>
                                setColorReplacements((prev) => ({
                                  ...prev,
                                  [color]: e.target.value,
                                }))
                              }
                              className="sr-only"
                              id={`color-picker-${index}`}
                            />
                            <label
                              htmlFor={`color-picker-${index}`}
                              className="block w-8 h-8 rounded border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                              style={{
                                backgroundColor:
                                  colorReplacements[color] || color,
                              }}
                            />
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-500">
                              New
                            </div>
                            <input
                              type="text"
                              value={
                                tempInputValues[color] ??
                                (colorReplacements[color] || color)
                              }
                              onChange={(e) => {
                                const newValue = e.target.value;
                                setTempInputValues((prev) => ({
                                  ...prev,
                                  [color]: newValue,
                                }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.target.blur();
                                }
                              }}
                              onBlur={(e) => {
                                const newValue = e.target.value;
                                const isValidHex =
                                  /^#([0-9A-Fa-f]{3}){1,2}$/.test(newValue);
                                const isValidRgb =
                                  /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/.test(
                                    newValue
                                  );

                                if (isValidHex || isValidRgb) {
                                  setColorReplacements((prev) => ({
                                    ...prev,
                                    [color]: newValue,
                                  }));
                                } else {
                                  // Reset input to the last valid color
                                  setTempInputValues((prev) => ({
                                    ...prev,
                                    [color]: colorReplacements[color] || color,
                                  }));
                                }
                              }}
                              className="w-[4.5rem] px-1 py-0.5 text-xs font-mono border rounded mt-1"
                              placeholder="#000000"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    // Clear any temporary input values
                    setTempInputValues({});
                    replaceColors();
                  }}
                  disabled={!svgContent}
                  className="w-full max-w-[1200px] mx-auto px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:bg-gray-400"
                >
                  Replace Colors
                </button>
              </>
            ) : (
              <p className="text-center text-gray-500">
                Upload an SVG to replace its colors
              </p>
            )}
          </div>
        );

      case "viewbox":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  X
                </label>
                <input
                  type="number"
                  value={viewBox.x}
                  onChange={(e) =>
                    setViewBox((prev) => ({
                      ...prev,
                      x: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Y
                </label>
                <input
                  type="number"
                  value={viewBox.y}
                  onChange={(e) =>
                    setViewBox((prev) => ({
                      ...prev,
                      y: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Width
                </label>
                <input
                  type="number"
                  value={viewBox.width}
                  onChange={(e) =>
                    setViewBox((prev) => ({
                      ...prev,
                      width: Number(e.target.value),
                    }))
                  }
                  min="1"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height
                </label>
                <input
                  type="number"
                  value={viewBox.height}
                  onChange={(e) =>
                    setViewBox((prev) => ({
                      ...prev,
                      height: Number(e.target.value),
                    }))
                  }
                  min="1"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>
            <button
              onClick={updateViewBox}
              disabled={!svgContent}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:bg-gray-400"
            >
              Update ViewBox
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  // Handle initial URL params and direct navigation
  useEffect(() => {
    const pathParam = location.pathname.split("/").pop();
    if (validTools.includes(pathParam)) {
      setActiveTab(pathParam);
    }
  }, [location]);

  // Update URL when tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    navigate(`/tools/svg/${tabId}`);
  };

  return (
    <ToolLayout
      title="SVG Tools"
      description="A collection of SVG manipulation and optimization tools"
    >
      <div className="space-y-6">
        {/* Tool Selection */}
        <div>
          {/* Mobile Dropdown */}
          <div className="sm:hidden">
            <select
              value={activeTab}
              onChange={(e) => handleTabChange(e.target.value)}
              className="w-full px-4 py-2 text-lg font-medium bg-white border-b border-gray-200 focus:outline-none focus:ring-0 focus:border-gray-200"
            >
              {[
                { id: "optimize", label: "Optimize", icon: FaCompress },
                { id: "colors", label: "Color Swap", icon: FaPalette },
                { id: "viewbox", label: "ViewBox", icon: FaRuler },
              ].map((tool) => (
                <option key={tool.id} value={tool.id}>
                  {tool.label}
                </option>
              ))}
            </select>
          </div>

          {/* Desktop Tabs */}
          <div className="hidden sm:block">
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="flex space-x-2 border-b border-gray-200 min-w-max px-4 sm:px-0">
                {[
                  { id: "optimize", label: "Optimize", icon: FaCompress },
                  { id: "colors", label: "Color Swap", icon: FaPalette },
                  { id: "viewbox", label: "ViewBox", icon: FaRuler },
                ].map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => handleTabChange(tool.id)}
                    className={`px-4 py-2 -mb-px flex items-center whitespace-nowrap ${
                      activeTab === tool.id
                        ? "border-b-2 border-primary-600 text-primary-600"
                        : "text-gray-500"
                    }`}
                  >
                    <tool.icon className="mr-2" />
                    {tool.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* File Upload */}
        {!svgContent && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-primary-500 bg-primary-50"
                : "border-gray-300 hover:border-primary-500"
            }`}
          >
            <input {...getInputProps()} />
            <FaUpload className="mx-auto text-4xl mb-4 text-gray-400" />
            <p className="text-gray-600">
              {isDragActive
                ? "Drop the SVG here"
                : "Drag & drop an SVG file here, or click to select"}
            </p>
          </div>
        )}

        {/* Tool Interface */}
        {svgContent && renderTool()}

        {/* Preview and Actions */}
        {processedSvg && (
          <div className="space-y-4">
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Preview</h3>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="relative w-full aspect-video overflow-hidden">
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    dangerouslySetInnerHTML={{
                      __html: processedSvg.replace(
                        /<svg/,
                        '<svg class="w-full h-full" preserveAspectRatio="xMidYMid meet"'
                      ),
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => copyToClipboard(processedSvg)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center justify-center"
              >
                <FaCopy className="mr-2" />
                Copy SVG
              </button>
              <button
                onClick={downloadSvg}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center"
              >
                <FaDownload className="mr-2" />
                Download SVG
              </button>
            </div>
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">
                  SVG Code
                </label>
                <button
                  onClick={() => copyToClipboard(processedSvg)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaCode className="inline mr-1" />
                  Copy
                </button>
              </div>
              <pre className="text-sm overflow-x-auto p-4 bg-white border rounded">
                {processedSvg}
              </pre>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default SvgTools;
