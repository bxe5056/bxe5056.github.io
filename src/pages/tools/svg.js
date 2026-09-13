import React, { useState, useCallback, useEffect, lazy, Suspense } from "react";
import ToolLayout from "../../components/tools/ToolLayout";
import ToolScaffold from "../../components/tools/ToolScaffold";
import { useDropzone } from "react-dropzone";
import {
  FaUpload,
  FaDownload,
  FaCopy,
  FaCode,
  FaCompress,
  FaPalette,
  FaRuler,
  FaImage,
} from "react-icons/fa";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { getCategoryTools } from "./catalog";

const SvgColorTool = lazy(() => import("./svg/SvgColorTool"));
const SvgPhotoTool = lazy(() => import("./svg/SvgPhotoTool"));
const SpriteTool = lazy(() => import("./svg/SpriteTool"));

const validTools = ["optimize", "colors", "viewbox", "image-to-svg", "sprite"];
const defaultTool = "optimize";

const SVG_ICONS = {
  optimize: FaCompress,
  colors: FaPalette,
  viewbox: FaRuler,
  "image-to-svg": FaImage,
  sprite: FaCode,
};

const SVG_TAB_ITEMS = getCategoryTools("svg").map((tool) => ({
  ...tool,
  icon: SVG_ICONS[tool.id],
}));

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
  const [fillColor, setFillColor] = useState("#000000");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(1);
  const [error, setError] = useState(null);
  // Keep Color Swap mounted after first visit so its local SVG state survives tab changes
  const [colorToolMounted, setColorToolMounted] = useState(() => {
    const pathParam = location.pathname.split("/").pop();
    if (pathParam === "colors") return true;
    return (searchParams.get("tool") || defaultTool) === "colors";
  });
  // Keep Photo ↔ SVG mounted after first visit (owns its own upload / trace state)
  const [photoToolMounted, setPhotoToolMounted] = useState(() => {
    const pathParam = location.pathname.split("/").pop();
    if (pathParam === "image-to-svg") return true;
    return (searchParams.get("tool") || defaultTool) === "image-to-svg";
  });
  const [spriteToolMounted, setSpriteToolMounted] = useState(() => {
    const pathParam = location.pathname.split("/").pop();
    if (pathParam === "sprite") return true;
    return (searchParams.get("tool") || defaultTool) === "sprite";
  });

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

      // Handle SVG files for optimize / viewbox (photo tool has its own dropzone)
      if (file.type === "image/svg+xml") {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result;
          // Clean any existing comments and add our metadata right away
          const cleanedContent = removeOtherComments(content);
          const contentWithMetadata = addMetadata(cleanedContent);

          setSvgContent(contentWithMetadata);
          setProcessedSvg(contentWithMetadata);

          // Extract viewBox from SVG
          const parser = new DOMParser();
          const doc = parser.parseFromString(content, "image/svg+xml");
          const svg = doc.querySelector("svg");

          // Calculate viewBox if not present
          if (svg) {
            if (!svg.getAttribute("viewBox")) {
              const width = svg.getAttribute("width") || "100";
              const height = svg.getAttribute("height") || "100";
              const viewBoxValue = `0 0 ${parseFloat(width)} ${parseFloat(
                height
              )}`;
              svg.setAttribute("viewBox", viewBoxValue);
              setViewBox({
                x: 0,
                y: 0,
                width: parseFloat(width),
                height: parseFloat(height),
              });
            } else {
              const [x, y, width, height] = svg
                .getAttribute("viewBox")
                .split(" ")
                .map(Number);
              setViewBox({ x, y, width, height });
            }
          }
        };
        reader.readAsText(file);
      }
    },
    [removeOtherComments, addMetadata]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/svg+xml": [".svg"] },
    maxFiles: 1,
  });

  const optimizeSvg = useCallback(async () => {
    if (!svgContent) return;

    setLoading(true);
    try {
      const { optimize } = await import("svgo/dist/svgo.browser");
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
    } catch (error) {
      console.error("Error optimizing SVG:", error);
      alert("Error optimizing SVG");
    } finally {
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

  const downloadProcessedSvg = () => {
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

  const svgDropzone = (
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
  );

  const renderOptimizeTool = () => {
    const originalSize = svgContent ? new Blob([svgContent]).size : 0;
    const optimizedSize = processedSvg ? new Blob([processedSvg]).size : 0;
    const reduction =
      originalSize > 0
        ? Math.round(((originalSize - optimizedSize) / originalSize) * 100)
        : 0;

    return (
      <ToolScaffold
        title="Optimize"
        description="Compress SVG markup with SVGO while preserving visual quality."
        input={!svgContent ? svgDropzone : null}
        controls={
          svgContent ? (
            <>
              <button
                onClick={optimizeSvg}
                disabled={!svgContent || loading}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:bg-gray-400"
              >
                {loading ? "Optimizing..." : "Optimize SVG"}
              </button>
              {processedSvg && (
                <div className="w-full text-sm text-gray-600">
                  Original size: {originalSize} bytes
                  <br />
                  Optimized size: {optimizedSize} bytes
                  <br />
                  Reduction: {reduction}%
                </div>
              )}
            </>
          ) : null
        }
        preview={
          processedSvg ? (
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="relative w-full aspect-video overflow-hidden">
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    dangerouslySetInnerHTML={{
                      __html: processedSvg.replace(
                        /<svg/,
                        '<svg class="w-full h-full svg-preview" preserveAspectRatio="xMidYMid meet"'
                      ),
                    }}
                  />
                </div>
              </div>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto svg-output">
                {processedSvg}
              </pre>
            </div>
          ) : null
        }
        actions={
          processedSvg ? (
            <>
              <button
                onClick={() => copyToClipboard(processedSvg)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center justify-center"
              >
                <FaCopy className="mr-2" />
                Copy SVG
              </button>
              <button
                onClick={downloadProcessedSvg}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center"
              >
                <FaDownload className="mr-2" />
                Download SVG
              </button>
            </>
          ) : null
        }
      />
    );
  };

  const renderTool = () => {
    switch (activeTab) {
      case "optimize":
        // Rendered via ToolScaffold below
        return null;

      case "colors":
        // Rendered via keep-alive below so upload state survives tab switches
        return null;

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

      case "image-to-svg":
        // Rendered via keep-alive below so upload / trace state survives tab switches
        return null;

      case "sprite":
        return null;

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

  // Keep SVG / image work when switching tabs (Color Swap owns its own state).
  // Only clear transient error banners on tab change.
  useEffect(() => {
    setError(null);
    if (activeTab === "colors") {
      setColorToolMounted(true);
    }
    if (activeTab === "image-to-svg") {
      setPhotoToolMounted(true);
    }
    if (activeTab === "sprite") {
      setSpriteToolMounted(true);
    }
  }, [activeTab]);

  return (
    <ToolLayout
      title="SVG Tools"
      description="A collection of SVG manipulation and optimization tools"
      tools={SVG_TAB_ITEMS}
      activeToolId={activeTab}
      onToolChange={handleTabChange}
      toolNavLabel="SVG tool"
    >
      <div className="space-y-6">
        {activeTab === "optimize" && renderOptimizeTool()}

        {/* File Selector — ViewBox only (Optimize uses ToolScaffold input) */}
        {activeTab === "viewbox" && !svgContent && svgDropzone}

        {/* Color Swap keep-alive (lazy) — prefer editing ./svg/* over this shell */}
        {colorToolMounted && (
          <div className={activeTab === "colors" ? "block" : "hidden"}>
            <Suspense
              fallback={
                <div className="text-center text-gray-500 py-8">
                  Loading color tool…
                </div>
              }
            >
              <SvgColorTool />
            </Suspense>
          </div>
        )}

        {/* Photo ↔ SVG keep-alive (lazy) */}
        {photoToolMounted && (
          <div className={activeTab === "image-to-svg" ? "block" : "hidden"}>
            <Suspense
              fallback={
                <div className="text-center text-gray-500 py-8">
                  Loading photo tool…
                </div>
              }
            >
              <SvgPhotoTool />
            </Suspense>
          </div>
        )}

        {/* Sprite / Favicon Pack keep-alive (lazy) */}
        {spriteToolMounted && (
          <div className={activeTab === "sprite" ? "block" : "hidden"}>
            <Suspense
              fallback={
                <div className="text-center text-gray-500 py-8">
                  Loading sprite tool…
                </div>
              }
            >
              <SpriteTool />
            </Suspense>
          </div>
        )}

        {/* Tool Interface — ViewBox (and any non-scaffold tabs) */}
        {activeTab === "viewbox" && svgContent && renderTool()}

        {/* Preview and Actions — ViewBox only (Optimize uses ToolScaffold) */}
        {activeTab === "viewbox" && processedSvg && (
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
                        '<svg class="w-full h-full svg-preview" preserveAspectRatio="xMidYMid meet"'
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
                onClick={downloadProcessedSvg}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center"
              >
                <FaDownload className="mr-2" />
                Download SVG
              </button>
            </div>
            <div className="mt-4">
              <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto svg-output">
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
