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
  FaImage,
} from "react-icons/fa";
import { optimize } from "svgo/dist/svgo.browser";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";

const validTools = ["optimize", "colors", "viewbox", "image-to-svg"];
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
  const [error, setError] = useState(null);
  
  // Image to SVG states
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imageColors, setImageColors] = useState([]);
  const [numColors, setNumColors] = useState(8);
  const [editableColors, setEditableColors] = useState([]);
  const [generatedSvgs, setGeneratedSvgs] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

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

  // Color quantization algorithm using k-means clustering
  const quantizeColors = useCallback((imageData, numColors) => {
    const pixels = [];
    for (let i = 0; i < imageData.length; i += 4) {
      const r = imageData[i];
      const g = imageData[i + 1];
      const b = imageData[i + 2];
      const a = imageData[i + 3];
      if (a > 128) { // Only include non-transparent pixels
        pixels.push([r, g, b]);
      }
    }

    if (pixels.length === 0) return [];

    // Initialize centroids randomly
    const centroids = [];
    for (let i = 0; i < numColors; i++) {
      const randomPixel = pixels[Math.floor(Math.random() * pixels.length)];
      centroids.push([...randomPixel]);
    }

    // K-means iterations
    for (let iter = 0; iter < 20; iter++) {
      const clusters = Array(numColors).fill().map(() => []);
      
      // Assign pixels to nearest centroid
      pixels.forEach(pixel => {
        let minDist = Infinity;
        let nearestCentroid = 0;
        
        centroids.forEach((centroid, index) => {
          const dist = Math.sqrt(
            Math.pow(pixel[0] - centroid[0], 2) +
            Math.pow(pixel[1] - centroid[1], 2) +
            Math.pow(pixel[2] - centroid[2], 2)
          );
          if (dist < minDist) {
            minDist = dist;
            nearestCentroid = index;
          }
        });
        
        clusters[nearestCentroid].push(pixel);
      });

      // Update centroids
      centroids.forEach((centroid, index) => {
        if (clusters[index].length > 0) {
          const avgR = clusters[index].reduce((sum, pixel) => sum + pixel[0], 0) / clusters[index].length;
          const avgG = clusters[index].reduce((sum, pixel) => sum + pixel[1], 0) / clusters[index].length;
          const avgB = clusters[index].reduce((sum, pixel) => sum + pixel[2], 0) / clusters[index].length;
          centroids[index] = [Math.round(avgR), Math.round(avgG), Math.round(avgB)];
        }
      });
    }

    // Convert to hex colors
    return centroids.map(([r, g, b]) => {
      const toHex = (n) => n.toString(16).padStart(2, '0');
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    });
  }, []);

  // Process uploaded image for color extraction
  const processImageForColors = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          const colors = quantizeColors(imageData, numColors);
          resolve({ colors, imageUrl: e.target.result, width: img.width, height: img.height });
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, [numColors, quantizeColors]);

  // Utility function to convert hex to RGB
  const hexToRgb = useCallback((hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }, []);

  // Generate SVG from image with color separation
  const generateSvgsFromImage = useCallback((imageUrl, colors, width, height) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, width, height);
        const svgs = [];

        // Generate SVG for each color
        colors.forEach((targetColor, colorIndex) => {
          const paths = [];
          const visited = new Set();

          const targetRgb = hexToRgb(targetColor);
          if (!targetRgb) return;

          // Find pixels that match this color (with tolerance)
          const tolerance = 50;
          const matchesColor = (r, g, b) => {
            const distance = Math.sqrt(
              Math.pow(r - targetRgb.r, 2) +
              Math.pow(g - targetRgb.g, 2) +
              Math.pow(b - targetRgb.b, 2)
            );
            return distance <= tolerance;
          };

          // Create rectangles for matching pixels (simplified approach)
          for (let y = 0; y < height; y += 4) { // Sample every 4 pixels for performance
            for (let x = 0; x < width; x += 4) {
              const index = (y * width + x) * 4;
              const r = imageData.data[index];
              const g = imageData.data[index + 1];
              const b = imageData.data[index + 2];
              const a = imageData.data[index + 3];

              if (a > 128 && matchesColor(r, g, b)) {
                const key = `${x},${y}`;
                if (!visited.has(key)) {
                  visited.add(key);
                  paths.push(`<rect x="${x}" y="${y}" width="4" height="4" fill="${targetColor}"/>`);
                }
              }
            }
          }

          if (paths.length > 0) {
            const svgContent = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Generated from image - Color layer ${colorIndex + 1}: ${targetColor} -->
  ${paths.join('\n  ')}
</svg>`;

            svgs.push({
              color: targetColor,
              content: svgContent,
              name: `layer-${colorIndex + 1}-${targetColor.replace('#', '')}.svg`
            });
          }
        });

        // Generate combined SVG
        const allPaths = [];
        colors.forEach((targetColor, colorIndex) => {
          const targetRgb = hexToRgb(targetColor);
          if (!targetRgb) return;

          const tolerance = 50;
          const matchesColor = (r, g, b) => {
            const distance = Math.sqrt(
              Math.pow(r - targetRgb.r, 2) +
              Math.pow(g - targetRgb.g, 2) +
              Math.pow(b - targetRgb.b, 2)
            );
            return distance <= tolerance;
          };

          for (let y = 0; y < height; y += 4) {
            for (let x = 0; x < width; x += 4) {
              const index = (y * width + x) * 4;
              const r = imageData.data[index];
              const g = imageData.data[index + 1];
              const b = imageData.data[index + 2];
              const a = imageData.data[index + 3];

              if (a > 128 && matchesColor(r, g, b)) {
                allPaths.push(`<rect x="${x}" y="${y}" width="4" height="4" fill="${targetColor}"/>`);
              }
            }
          }
        });

        const combinedSvg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Generated from image - All color layers combined -->
  ${allPaths.join('\n  ')}
</svg>`;

        svgs.push({
          color: 'combined',
          content: combinedSvg,
          name: 'combined-all-layers.svg'
        });

        resolve(svgs);
      };
      img.src = imageUrl;
    });
  }, [hexToRgb]);

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

      // Handle image files for image-to-svg conversion
      if (activeTab === "image-to-svg" && file.type.startsWith('image/')) {
        setIsProcessing(true);
        try {
          const result = await processImageForColors(file);
          setUploadedImage(result.imageUrl);
          setImageColors(result.colors);
          setEditableColors(result.colors.map(color => ({ original: color, edited: color })));
          
          // Generate SVGs
          const svgs = await generateSvgsFromImage(result.imageUrl, result.colors, result.width, result.height);
          setGeneratedSvgs(svgs);
        } catch (error) {
          console.error('Error processing image:', error);
          setError('Error processing image. Please try a different image.');
        } finally {
          setIsProcessing(false);
        }
        return;
      }

      // Handle SVG files for other tools
      if (file.type === "image/svg+xml") {
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
    [activeTab, extractColors, removeOtherComments, addMetadata, processImageForColors, generateSvgsFromImage]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: activeTab === "image-to-svg" 
      ? { "image/*": [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"] }
      : { "image/svg+xml": [".svg"] },
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

  // Handle color editing for image-to-svg
  const updateEditableColor = useCallback((index, newColor) => {
    setEditableColors(prev => 
      prev.map((color, i) => i === index ? { ...color, edited: newColor } : color)
    );
  }, []);

  // Regenerate SVGs with edited colors
  const regenerateSvgs = useCallback(async () => {
    if (!uploadedImage || editableColors.length === 0) return;
    
    setIsProcessing(true);
    try {
      const colors = editableColors.map(c => c.edited);
      
      // Get image dimensions
      const img = new Image();
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = uploadedImage;
      });
      
      const svgs = await generateSvgsFromImage(uploadedImage, colors, img.width, img.height);
      setGeneratedSvgs(svgs);
    } catch (error) {
      console.error('Error regenerating SVGs:', error);
      setError('Error regenerating SVGs. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [uploadedImage, editableColors, generateSvgsFromImage]);

  // Download individual SVG
  const downloadSvg = useCallback((svgData) => {
    const blob = new Blob([svgData.content], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = svgData.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  // Download all SVGs as zip
  const downloadAllSvgs = useCallback(async () => {
    if (generatedSvgs.length === 0) return;

    // For now, download each SVG individually
    // In a real app, you might want to use a zip library
    generatedSvgs.forEach((svg, index) => {
      setTimeout(() => {
        downloadSvg(svg);
      }, index * 100); // Small delay between downloads
    });
  }, [generatedSvgs, downloadSvg]);

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
          <div className="space-y-6" data-tool="color-swap">
            {svgColors.length > 0 ? (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Click on any <span className="font-medium">New</span> color
                  swatch to choose a replacement color. You can also type the
                  color value and press Enter or click outside to apply.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-4 mx-auto">
                  {svgColors.map((color, index) => (
                    <div
                      key={index}
                      className="flex items-center p-3 border rounded bg-white"
                    >
                      <div className="flex items-center justify-between w-full">
                        {/* Original Color Section */}
                        <div className="flex items-center space-x-3">
                          <div
                            className="flex-none w-10 h-10 rounded border shadow-sm"
                            style={{ backgroundColor: color }}
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-500">
                              Original
                            </div>
                            <div className="text-sm font-mono mt-1">
                              {color}
                            </div>
                          </div>
                        </div>

                        {/* Arrow */}
                        <div className="text-gray-400 text-lg mx-2">→</div>

                        {/* New Color Section */}
                        <div className="flex items-center space-x-5">
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
                              className="block w-10 h-10 rounded border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                              style={{
                                backgroundColor:
                                  colorReplacements[color] || color,
                              }}
                            />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-500">
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
                              className="w-28 px-2 py-1 text-sm font-mono border rounded"
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
                Select an SVG to replace its colors
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

      case "image-to-svg":
        return (
          <div className="space-y-6">
            {uploadedImage && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Image Preview */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Original Image</h3>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <img
                      src={uploadedImage}
                      alt="Uploaded for conversion"
                      className="max-w-full h-auto mx-auto max-h-64 object-contain"
                    />
                  </div>
                </div>

                {/* Controls */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Colors: {numColors}
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="16"
                      value={numColors}
                      onChange={(e) => setNumColors(Number(e.target.value))}
                      className="w-full"
                      disabled={isProcessing}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>2</span>
                      <span>16</span>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      if (!uploadedImage) return;
                      setIsProcessing(true);
                      try {
                        const file = await fetch(uploadedImage).then(r => r.blob());
                        const result = await processImageForColors(file);
                        setImageColors(result.colors);
                        setEditableColors(result.colors.map(color => ({ original: color, edited: color })));
                        const svgs = await generateSvgsFromImage(uploadedImage, result.colors, result.width, result.height);
                        setGeneratedSvgs(svgs);
                      } catch (error) {
                        console.error('Error reprocessing:', error);
                        setError('Error reprocessing image.');
                      } finally {
                        setIsProcessing(false);
                      }
                    }}
                    disabled={isProcessing}
                    className="w-full px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:bg-gray-400"
                  >
                    {isProcessing ? "Processing..." : "Reprocess with New Color Count"}
                  </button>
                </div>
              </div>
            )}

            {/* Color Editing */}
            {editableColors.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Edit Colors</h3>
                  <button
                    onClick={regenerateSvgs}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {isProcessing ? "Generating..." : "Regenerate SVGs"}
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {editableColors.map((colorData, index) => (
                    <div key={index} className="space-y-2">
                      <div className="text-sm font-medium text-gray-700">
                        Color {index + 1}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-8 h-8 rounded border border-gray-300"
                          style={{ backgroundColor: colorData.original }}
                          title={`Original: ${colorData.original}`}
                        />
                        <span className="text-gray-400">→</span>
                        <input
                          type="color"
                          value={colorData.edited}
                          onChange={(e) => updateEditableColor(index, e.target.value)}
                          className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                        />
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        {colorData.edited}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generated SVGs */}
            {generatedSvgs.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Generated SVGs</h3>
                  <button
                    onClick={downloadAllSvgs}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                  >
                    <FaDownload />
                    Download All
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generatedSvgs.map((svg, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium">
                          {svg.color === 'combined' ? 'Combined' : `Layer ${index + 1}`}
                        </div>
                        <button
                          onClick={() => downloadSvg(svg)}
                          className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                          <FaDownload />
                        </button>
                      </div>
                      {svg.color !== 'combined' && (
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: svg.color }}
                          />
                          <span className="text-xs font-mono">{svg.color}</span>
                        </div>
                      )}
                      <div className="bg-gray-50 p-2 rounded max-h-32 overflow-hidden">
                        <div
                          dangerouslySetInnerHTML={{ __html: svg.content }}
                          className="w-full h-24 flex items-center justify-center"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-red-800">{error}</div>
              </div>
            )}
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

  // Reset state when changing tabs
  useEffect(() => {
    setSvgContent(null);
    setProcessedSvg(null);
    setSvgColors([]);
    setColorReplacements({});
    setViewBox({ x: 0, y: 0, width: 0, height: 0 });
    setError(null);
    
    // Reset image-to-svg states
    setUploadedImage(null);
    setImageColors([]);
    setEditableColors([]);
    setGeneratedSvgs([]);
    setIsProcessing(false);
  }, [activeTab]);

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
                { id: "image-to-svg", label: "Image to SVG", icon: FaImage },
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
                  { id: "image-to-svg", label: "Image to SVG", icon: FaImage },
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

        {/* File Selector */}
        {((activeTab !== "image-to-svg" && !svgContent) || (activeTab === "image-to-svg" && !uploadedImage)) && (
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
                ? (activeTab === "image-to-svg" ? "Drop the image here" : "Drop the SVG here")
                : (activeTab === "image-to-svg" 
                  ? "Drag & drop an image file here, or click to select" 
                  : "Drag & drop an SVG file here, or click to select")}
            </p>
          </div>
        )}

        {/* Tool Interface */}
        {((activeTab !== "image-to-svg" && svgContent) || (activeTab === "image-to-svg" && uploadedImage)) && renderTool()}

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
