import React, { useState, useCallback, useEffect, useRef } from "react";
import ToolLayout from "../../components/tools/ToolLayout";
import { HexColorPicker, HexColorInput } from "react-colorful";
import {
  FaCopy,
  FaImage,
  FaCheck,
  FaPlus,
  FaSave,
  FaTrash,
  FaPalette,
  FaArrowLeft,
  FaArrowRight,
  FaCode,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useDropzone } from "react-dropzone";
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
} from "../../utils/colorConversion";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";

const validTools = ["picker", "palette", "gradient", "contrast", "extract"];
const defaultTool = "picker";

// Update QuickActionButtons component
const QuickActionButtons = ({
  color,
  setColor,
  setActiveTab,
  small = false,
}) => (
  <div className={`flex flex-wrap gap-2 ${small ? "mt-2" : "mt-4"}`}>
    <button
      onClick={() => {
        setColor(color);
        setActiveTab("palette");
      }}
      className={`${
        small
          ? "px-2 py-1 text-xs bg-white bg-opacity-20 text-white"
          : "px-3 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
      } rounded transition-colors flex items-center gap-1`}
    >
      <FaPalette className="text-xs" />
      Generate Palette
    </button>
    <button
      onClick={() => {
        setColor(color);
        setActiveTab("gradient");
      }}
      className={`${
        small
          ? "px-2 py-1 text-xs bg-white bg-opacity-20 text-white"
          : "px-3 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
      } rounded transition-colors flex items-center gap-1`}
    >
      <FaImage className="text-xs" />
      Create Gradient
    </button>
    <button
      onClick={() => {
        setColor(color);
        setActiveTab("contrast");
      }}
      className={`${
        small
          ? "px-2 py-1 text-xs bg-white bg-opacity-20 text-white"
          : "px-3 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
      } rounded transition-colors flex items-center gap-1`}
    >
      <FaCheck className="text-xs" />
      Test Contrast
    </button>
  </div>
);

// Update the saved palette display in SavedPalettesSection
const SavedPalettesSection = ({
  type,
  clearAllPalettes,
  deletePalette,
  copyToClipboard,
  onColorSelect,
  setColor,
  setActiveTab,
}) => {
  const storageKey = `savedPalettes_${type}`;
  const savedPalettes = JSON.parse(localStorage.getItem(storageKey) || "[]");

  if (savedPalettes.length === 0) {
    return null;
  }

  const renderColorPickerCard = (palette) => (
    <div
      key={palette.id}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 space-y-4"
    >
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">
          {new Date(palette.timestamp).toLocaleDateString()}
        </span>
        <button
          onClick={() => deletePalette(palette.id, type)}
          className="text-red-400 hover:text-red-600"
          title="Delete"
        >
          <FaTrash />
        </button>
      </div>
      {palette.colors.map((color, i) => {
        const rgb = hexToRgb(color);
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

        return (
          <div key={i} className="group relative">
            <div className="flex items-center gap-3">
              <div
                className="w-16 h-16 rounded"
                style={{ backgroundColor: color }}
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(color)}
                    className="text-gray-400 hover:text-gray-600"
                    title="Copy HEX"
                  >
                    <FaCopy className="text-xs" />
                  </button>
                  <span className="font-mono text-sm">{color}</span>
                </div>
                <div className="text-xs text-gray-500 space-y-0.5">
                  <div>
                    RGB: {rgb.r}, {rgb.g}, {rgb.b}
                  </div>
                  <div>
                    HSL: {Math.round(hsl.h)}°, {Math.round(hsl.s)}%,{" "}
                    {Math.round(hsl.l)}%
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  setColor(color);
                  setActiveTab("palette");
                }}
                className="flex-1 px-3 py-1.5 text-xs border border-gray-300 text-gray-700 hover:bg-gray-50 rounded transition-colors flex items-center justify-center gap-1"
                title="Generate Palette"
              >
                <FaPalette className="text-xs" />
                Palette
              </button>
              <button
                onClick={() => {
                  setColor(color);
                  setActiveTab("gradient");
                }}
                className="flex-1 px-3 py-1.5 text-xs border border-gray-300 text-gray-700 hover:bg-gray-50 rounded transition-colors flex items-center justify-center gap-1"
                title="Create Gradient"
              >
                <FaImage className="text-xs" />
                Gradient
              </button>
              <button
                onClick={() => {
                  setColor(color);
                  setActiveTab("contrast");
                }}
                className="flex-1 px-3 py-1.5 text-xs border border-gray-300 text-gray-700 hover:bg-gray-50 rounded transition-colors flex items-center justify-center gap-1"
                title="Test Contrast"
              >
                <FaCheck className="text-xs" />
                Contrast
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderPaletteCard = (palette) => (
    <div
      key={palette.id}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 space-y-4"
    >
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">
          {new Date(palette.timestamp).toLocaleDateString()}
        </span>
        <button
          onClick={() => deletePalette(palette.id, type)}
          className="text-red-400 hover:text-red-600"
          title="Delete"
        >
          <FaTrash />
        </button>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {palette.colors.map((color, i) => {
          const rgb = hexToRgb(color);
          if (!rgb) {
            return (
              <div key={i} className="space-y-1">
                <div className="w-full aspect-square rounded cursor-pointer group relative bg-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(color);
                    }}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black bg-opacity-50 transition-opacity"
                  >
                    <FaCopy className="text-white" />
                  </button>
                </div>
                <div className="text-center">
                  <div
                    className="font-mono text-xs truncate text-red-500"
                    title="Invalid color"
                  >
                    Invalid
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={i} className="space-y-1">
              <div
                className="w-full aspect-square rounded cursor-pointer group relative border border-gray-200"
                style={{ backgroundColor: color }}
                onClick={() => onColorSelect && onColorSelect(color)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(color);
                  }}
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black bg-opacity-50 transition-opacity"
                >
                  <FaCopy className="text-white" />
                </button>
              </div>
              <div className="text-center">
                <div className="font-mono text-xs truncate" title={color}>
                  {color}
                </div>
                <div className="text-xs text-gray-500">
                  {`${rgb.r},${rgb.g},${rgb.b}`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="mt-12 pt-8 border-t border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {type === "picker"
            ? "Saved colors"
            : type === "extracted"
            ? "Previously extracted colors"
            : `Saved ${type} palettes`}
        </h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {savedPalettes.length} {type === "picker" ? "colors" : "palettes"}{" "}
            saved
          </span>
          <button
            onClick={() => clearAllPalettes(type)}
            className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-600 hover:border-red-800 rounded"
          >
            Clear all
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {savedPalettes.map((palette) =>
          type === "picker"
            ? renderColorPickerCard(palette)
            : renderPaletteCard(palette)
        )}
      </div>
    </div>
  );
};

// Add function to calculate color difference (before the ColorTools component)
const getColorDifference = (color1, color2) => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
      Math.pow(rgb1.g - rgb2.g, 2) +
      Math.pow(rgb1.b - rgb2.b, 2)
  );
};

const ColorTools = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tool") || defaultTool
  );
  const [color, setColor] = useState("#536dfe");
  const [gradientStops, setGradientStops] = useState([
    { color: "#536dfe", position: 0 },
    { color: "#32408f", position: 100 },
  ]);
  const [gradientType, setGradientType] = useState("linear");
  const [gradientAngle, setGradientAngle] = useState(90);
  const [extractedColors, setExtractedColors] = useState(() => {
    const saved = localStorage.getItem("extractedColors");
    return saved ? JSON.parse(saved) : [];
  });
  const [paletteType, setPaletteType] = useState("analogous");
  const [palette, setPalette] = useState([]);
  const [contrastText, setContrastText] = useState("#000000");
  const [numColors, setNumColors] = useState(5);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [paletteTag, setPaletteTag] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const autoSaving = React.useRef(false);
  const [gradientCSS, setGradientCSS] = useState("");
  const cssUpdateTimeout = useRef(null);
  const [tempGradientCSS, setTempGradientCSS] = useState("");
  const [cssError, setCssError] = useState(false);

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
    navigate(`/tools/color/${tabId}`);
  };

  // Save colors to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("extractedColors", JSON.stringify(extractedColors));
  }, [extractedColors]);

  // Update the auto-save effect for extracted colors
  useEffect(() => {
    if (extractedColors.length > 0) {
      const storageKey = "savedPalettes_extracted";
      const savedPalettes = JSON.parse(
        localStorage.getItem(storageKey) || "[]"
      );

      // Find the most recent extracted palette
      const existingPaletteIndex = savedPalettes.findIndex(
        (p) => p.source === "extracted"
      );

      if (existingPaletteIndex !== -1) {
        // Update existing palette
        savedPalettes[existingPaletteIndex] = {
          ...savedPalettes[existingPaletteIndex],
          colors: extractedColors,
          timestamp: new Date().toISOString(),
        };
      } else {
        // Create new palette if none exists
        savedPalettes.push({
          id: Date.now(),
          colors: extractedColors,
          timestamp: new Date().toISOString(),
          source: "extracted",
        });
      }

      localStorage.setItem(storageKey, JSON.stringify(savedPalettes));
    }
  }, [extractedColors]);

  // Also auto-save generated palettes
  useEffect(() => {
    if (palette.length > 0) {
      const savedPalettes = JSON.parse(
        localStorage.getItem("savedPalettes") || "[]"
      );
      const newPalette = {
        id: Date.now(),
        colors: palette,
        timestamp: new Date().toISOString(),
        source: "generated",
      };
      localStorage.setItem(
        "savedPalettes",
        JSON.stringify([...savedPalettes, newPalette])
      );
    }
  }, [palette]);

  // Update the savePalette function to be more explicit
  const savePalette = (colors, type, tag = "") => {
    const storageKey = `savedPalettes_${type}`;
    const savedPalettes = JSON.parse(localStorage.getItem(storageKey) || "[]");

    // Convert colors array to string for comparison
    const colorsString = JSON.stringify(colors.sort());

    // Check if this exact palette already exists
    const paletteExists = savedPalettes.some(
      (palette) => JSON.stringify(palette.colors.sort()) === colorsString
    );

    if (!paletteExists) {
      const newPalette = {
        id: Date.now(),
        colors,
        timestamp: new Date().toISOString(),
        type,
        tags: tag ? [tag] : [],
      };
      const updatedPalettes = [...savedPalettes, newPalette];
      localStorage.setItem(storageKey, JSON.stringify(updatedPalettes));
      // Force re-render without modifying extractedColors
      setActiveTab((prev) => prev);
    }
  };

  // Add function to update palette tags
  const updatePaletteTags = (paletteId, type, tags) => {
    const storageKey = `savedPalettes_${type}`;
    const savedPalettes = JSON.parse(localStorage.getItem(storageKey) || "[]");
    const updatedPalettes = savedPalettes.map((palette) =>
      palette.id === paletteId ? { ...palette, tags } : palette
    );
    localStorage.setItem(storageKey, JSON.stringify(updatedPalettes));
    setExtractedColors([...extractedColors]); // Force re-render
  };

  // Add function to delete palette
  const deletePalette = (paletteId, type) => {
    const storageKey = `savedPalettes_${type}`;
    const savedPalettes = JSON.parse(localStorage.getItem(storageKey) || "[]");
    const updatedPalettes = savedPalettes.filter((p) => p.id !== paletteId);
    localStorage.setItem(storageKey, JSON.stringify(updatedPalettes));
    setExtractedColors([...extractedColors]); // Force re-render
  };

  // Add function to clear all palettes of a type
  const clearAllPalettes = (type) => {
    if (
      window.confirm(`Are you sure you want to clear all ${type} palettes?`)
    ) {
      localStorage.setItem(`savedPalettes_${type}`, "[]");
      setExtractedColors([...extractedColors]); // Force re-render
    }
  };

  // Update the useEffect for auto-saving
  useEffect(() => {
    if (extractedColors.length > 0 && !autoSaving.current) {
      autoSaving.current = true;
      savePalette(extractedColors, "extracted", paletteTag);
      setTimeout(() => {
        autoSaving.current = false;
      }, 1000); // Debounce saving
    }
  }, [extractedColors, paletteTag]);

  useEffect(() => {
    if (palette.length > 0 && !autoSaving.current) {
      autoSaving.current = true;
      savePalette(palette, "generated", paletteTag);
      setTimeout(() => {
        autoSaving.current = false;
      }, 1000); // Debounce saving
    }
  }, [palette, paletteTag]);

  useEffect(() => {
    if (gradientStops.length >= 2 && !autoSaving.current) {
      autoSaving.current = true;
      savePalette(
        gradientStops.map((stop) => stop.color),
        "gradient",
        paletteTag
      );
      setTimeout(() => {
        autoSaving.current = false;
      }, 1000); // Debounce saving
    }
  }, [gradientStops, paletteTag]);

  // Update the extractColors function to avoid similar colors
  const extractColors = useCallback((imageData, count, existingColors = []) => {
    const colorMap = new Map();

    // Sample colors every 10 pixels
    for (let i = 0; i < imageData.length; i += 40) {
      const r = imageData[i];
      const g = imageData[i + 1];
      const b = imageData[i + 2];
      const hex = rgbToHex(r, g, b);
      colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
    }

    // Convert to array and sort by frequency
    let colors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([color]) => color);

    // Filter out similar colors
    const uniqueColors = [];
    const minDifference = 50; // Adjust this threshold to control how different colors should be

    for (const color of colors) {
      let isDifferentEnough = true;

      // Check against existing colors
      for (const existingColor of existingColors) {
        if (getColorDifference(color, existingColor) < minDifference) {
          isDifferentEnough = false;
          break;
        }
      }

      // Check against already selected colors
      for (const selectedColor of uniqueColors) {
        if (getColorDifference(color, selectedColor) < minDifference) {
          isDifferentEnough = false;
          break;
        }
      }

      if (isDifferentEnough) {
        uniqueColors.push(color);
        if (uniqueColors.length === count) break;
      }
    }

    return uniqueColors;
  }, []);

  // Update the onDrop callback to save only after extraction
  const onDrop = useCallback(
    async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          ).data;
          const extractedColors = extractColors(imageData, numColors);
          setUploadedImage(e.target.result);
          setExtractedColors(extractedColors);
          savePalette(extractedColors, "extracted", paletteTag);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    [numColors, extractColors, paletteTag]
  );

  // Initialize dropzone after onDrop is defined
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
  });

  // Color conversion utilities
  const rgbToCmyk = (r, g, b) => {
    let c = 1 - r / 255;
    let m = 1 - g / 255;
    let y = 1 - b / 255;
    let k = Math.min(c, m, y);

    if (k === 1) {
      return { c: 0, m: 0, y: 0, k: 100 };
    }

    c = Math.round(((c - k) / (1 - k)) * 100);
    m = Math.round(((m - k) / (1 - k)) * 100);
    y = Math.round(((y - k) / (1 - k)) * 100);
    k = Math.round(k * 100);

    return { c, m, y, k };
  };

  const rgbToHsv = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h,
      s = max === 0 ? 0 : d / max,
      v = max;

    if (max === min) {
      h = 0;
    } else {
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
        default:
          break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      v: Math.round(v * 100),
    };
  };

  const rgbToLab = (r, g, b) => {
    // Convert RGB to XYZ
    r = r / 255;
    g = g / 255;
    b = b / 255;

    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

    r = r * 100;
    g = g * 100;
    b = b * 100;

    const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
    const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
    const z = r * 0.0193 + g * 0.1192 + b * 0.9505;

    // Convert XYZ to Lab
    const xn = 95.047;
    const yn = 100.0;
    const zn = 108.883;

    const xyz2lab = (t) =>
      t > 0.008856 ? Math.pow(t, 1 / 3) : 7.787 * t + 16 / 116;

    const fx = xyz2lab(x / xn);
    const fy = xyz2lab(y / yn);
    const fz = xyz2lab(z / zn);

    const l = Math.round(116 * fy - 16);
    const a = Math.round(500 * (fx - fy));
    const lab_b = Math.round(200 * (fy - fz));

    return { l, a, lab_b };
  };

  // Update the generatePalette function to save only when button is clicked
  const generatePalette = useCallback(() => {
    const rgb = hexToRgb(color);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    let newColors = [];

    switch (paletteType) {
      case "analogous":
        // Generate colors with similar hues
        for (let i = -2; i <= 2; i++) {
          if (i === 0) continue;
          const newHue = (hsl.h + i * 30 + 360) % 360;
          const { r, g, b } = hslToRgb(newHue, hsl.s, hsl.l);
          newColors.push(rgbToHex(r, g, b));
        }
        break;

      case "complementary":
        // Generate complementary color (opposite on color wheel)
        const compHue = (hsl.h + 180) % 360;
        const comp = hslToRgb(compHue, hsl.s, hsl.l);
        newColors = [rgbToHex(comp.r, comp.g, comp.b)];
        break;

      case "triadic":
        // Generate colors 120 degrees apart
        for (let i = 1; i <= 2; i++) {
          const newHue = (hsl.h + i * 120) % 360;
          const { r, g, b } = hslToRgb(newHue, hsl.s, hsl.l);
          newColors.push(rgbToHex(r, g, b));
        }
        break;

      case "monochromatic":
        // Generate variations in lightness
        for (let i = 20; i <= 80; i += 20) {
          const { r, g, b } = hslToRgb(hsl.h, hsl.s, i);
          newColors.push(rgbToHex(r, g, b));
        }
        break;

      default:
        break;
    }

    const generatedPalette = [color, ...newColors];
    setPalette(generatedPalette);
    savePalette(generatedPalette, "generated", paletteTag);
  }, [color, paletteType, paletteTag]);

  // Calculate contrast ratio
  const getLuminance = (r, g, b) => {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const getContrastRatio = (fg, bg) => {
    const fgRgb = hexToRgb(fg);
    const bgRgb = hexToRgb(bg);
    const fgLum = getLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
    const bgLum = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
    const ratio =
      (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05);
    return ratio.toFixed(2);
  };

  // Add removeColor function
  const removeColor = (indexToRemove) => {
    setExtractedColors((colors) =>
      colors.filter((_, index) => index !== indexToRemove)
    );
    setNumColors((prev) => prev - 1);
  };

  // Update the addMoreColors function
  const addMoreColors = useCallback(() => {
    if (!uploadedImage) return;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      ).data;
      const newColors = extractColors(imageData, 1, extractedColors);

      if (newColors.length > 0) {
        const updatedColors = [...extractedColors, ...newColors];
        setExtractedColors(updatedColors);
        setNumColors((prev) => prev + 1);

        // Immediately update the saved palette
        const storageKey = "savedPalettes_extracted";
        const savedPalettes = JSON.parse(
          localStorage.getItem(storageKey) || "[]"
        );
        const existingPaletteIndex = savedPalettes.findIndex(
          (p) => p.source === "extracted"
        );

        if (existingPaletteIndex !== -1) {
          savedPalettes[existingPaletteIndex] = {
            ...savedPalettes[existingPaletteIndex],
            colors: updatedColors,
            timestamp: new Date().toISOString(),
          };
        } else {
          savedPalettes.push({
            id: Date.now(),
            colors: updatedColors,
            timestamp: new Date().toISOString(),
            source: "extracted",
          });
        }

        localStorage.setItem(storageKey, JSON.stringify(savedPalettes));
      }
    };
    img.src = uploadedImage;
  }, [uploadedImage, extractedColors, extractColors]);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    } catch (err) {
      alert("Failed to copy text");
    }
  };

  const addGradientStop = () => {
    const lastStop = gradientStops[gradientStops.length - 1];
    const newPosition = Math.min(lastStop.position + 20, 100);
    setGradientStops([
      ...gradientStops,
      { color: "#ffffff", position: newPosition },
    ]);
  };

  const removeGradientStop = (index) => {
    if (gradientStops.length <= 2) return; // Keep at least 2 stops
    setGradientStops(gradientStops.filter((_, i) => i !== index));
  };

  const updateGradientStop = (index, updates) => {
    setGradientStops(
      gradientStops.map((stop, i) =>
        i === index ? { ...stop, ...updates } : stop
      )
    );
  };

  // Update the useEffect to set the initial tempGradientCSS
  useEffect(() => {
    const getGradientCSS = () => {
      const sortedStops = [...gradientStops].sort(
        (a, b) => a.position - b.position
      );
      const stopsCSS = sortedStops
        .map((stop) => `${stop.color} ${stop.position}%`)
        .join(", ");

      return gradientType === "linear"
        ? `linear-gradient(${gradientAngle}deg, ${stopsCSS})`
        : `radial-gradient(circle, ${stopsCSS})`;
    };

    const css = getGradientCSS();
    setGradientCSS(css);
    setTempGradientCSS(css);
  }, [gradientType, gradientAngle, gradientStops, paletteTag]);

  // Update the parseAndApplyCSS function to track errors
  const parseAndApplyCSS = (css) => {
    try {
      setGradientCSS(css);

      // Parse gradient type
      if (css.startsWith("linear-gradient")) {
        setGradientType("linear");

        // Parse angle
        const angleMatch = css.match(/(\d+)deg/);
        if (angleMatch) {
          setGradientAngle(Number(angleMatch[1]));
        }
      } else if (css.startsWith("radial-gradient")) {
        setGradientType("radial");
      } else {
        throw new Error("Invalid gradient format");
      }

      // Parse color stops
      const stopsMatch = css.match(
        /(?:rgba?\([^)]+\)|#[A-Fa-f0-9]+|\w+)\s+\d+%/g
      );
      if (stopsMatch) {
        const newStops = stopsMatch.map((stop) => {
          const [color, position] = stop.split(/\s+/);
          return {
            color: color,
            position: parseInt(position),
          };
        });
        if (newStops.length >= 2) {
          setGradientStops(newStops);
          setCssError(false);
        } else {
          throw new Error("At least 2 color stops required");
        }
      } else {
        throw new Error("Invalid color stops format");
      }
    } catch (error) {
      console.error("Failed to parse gradient CSS:", error);
      setCssError(error.message || "Invalid gradient format");
    }
  };

  // Add debounced parse function
  const debouncedParseAndApplyCSS = (css) => {
    setTempGradientCSS(css);
    if (cssUpdateTimeout.current) {
      clearTimeout(cssUpdateTimeout.current);
    }
    cssUpdateTimeout.current = setTimeout(() => {
      parseAndApplyCSS(css);
    }, 500);
  };

  // Add this component for the tag input
  const TagInput = ({ value, onChange }) => (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700">Tag:</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Add a tag..."
        className="px-3 py-1 border rounded text-sm"
      />
    </div>
  );

  // Add function to handle color selection from saved palettes
  const handleColorSelect = (selectedColor) => {
    setColor(selectedColor);
    // Optionally switch to a different tool
    if (activeTab === "picker") {
      // If we're in picker, just set the color
      setColor(selectedColor);
    } else {
      // If we're in another tool, ask if user wants to switch to picker or use color here
      if (
        window.confirm("Would you like to open this color in the color picker?")
      ) {
        setColor(selectedColor);
        setActiveTab("picker");
      } else {
        setColor(selectedColor);
      }
    }
  };

  // Update the moveGradientStop function
  const moveGradientStop = (index, direction) => {
    const newStops = [...gradientStops];
    if (direction === "left" && index > 0) {
      [newStops[index], newStops[index - 1]] = [
        newStops[index - 1],
        newStops[index],
      ];
      setGradientStops(newStops);
    } else if (direction === "right" && index < gradientStops.length - 1) {
      [newStops[index], newStops[index + 1]] = [
        newStops[index + 1],
        newStops[index],
      ];
      setGradientStops(newStops);
    }
  };

  const renderTool = () => {
    switch (activeTab) {
      case "picker":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-[0.8fr,1fr] lg:grid-cols-[0.6fr,2fr] gap-8">
              <div className="space-y-4">
                <HexColorPicker color={color} onChange={setColor} />
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hex Color
                    </label>
                    <div className="flex">
                      <HexColorInput
                        color={color}
                        onChange={setColor}
                        className="flex-1 px-3 py-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <button
                        onClick={() => copyToClipboard(color)}
                        className="px-3 py-2 bg-gray-100 border border-l-0 rounded-r hover:bg-gray-200"
                      >
                        <FaCopy />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      RGB
                    </label>
                    <div className="flex">
                      <input
                        readOnly
                        value={`rgb(${Object.values(hexToRgb(color)).join(
                          ", "
                        )})`}
                        className="flex-1 px-3 py-2 border rounded-l bg-gray-50"
                      />
                      <button
                        onClick={() =>
                          copyToClipboard(
                            `rgb(${Object.values(hexToRgb(color)).join(", ")})`
                          )
                        }
                        className="px-3 py-2 bg-gray-100 border border-l-0 rounded-r hover:bg-gray-200"
                      >
                        <FaCopy />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      HSL
                    </label>
                    <div className="flex">
                      <input
                        readOnly
                        value={(() => {
                          const rgb = hexToRgb(color);
                          const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
                          return `hsl(${Math.round(hsl.h)}deg, ${Math.round(
                            hsl.s
                          )}%, ${Math.round(hsl.l)}%)`;
                        })()}
                        className="flex-1 px-3 py-2 border rounded-l bg-gray-50"
                      />
                      <button
                        onClick={() => {
                          const rgb = hexToRgb(color);
                          const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
                          copyToClipboard(
                            `hsl(${Math.round(hsl.h)}deg, ${Math.round(
                              hsl.s
                            )}%, ${Math.round(hsl.l)}%)`
                          );
                        }}
                        className="px-3 py-2 bg-gray-100 border border-l-0 rounded-r hover:bg-gray-200"
                      >
                        <FaCopy />
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => savePalette([color], "picker", "")}
                  className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-lg transition-colors"
                >
                  Save Color
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setColor(color);
                      setActiveTab("palette");
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded transition-colors flex items-center justify-center gap-1 whitespace-nowrap text-sm"
                  >
                    <FaPalette className="text-xs" />
                    Generate Palette
                  </button>
                  <button
                    onClick={() => {
                      setColor(color);
                      setActiveTab("gradient");
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded transition-colors flex items-center justify-center gap-1 whitespace-nowrap text-sm"
                  >
                    <FaImage className="text-xs" />
                    Create Gradient
                  </button>
                  <button
                    onClick={() => {
                      setColor(color);
                      setActiveTab("contrast");
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded transition-colors flex items-center justify-center gap-1 whitespace-nowrap text-sm"
                  >
                    <FaCheck className="text-xs" />
                    Test Contrast
                  </button>
                </div>
              </div>
              <div className="flex flex-col">
                <div
                  className="flex-1 rounded-lg shadow-sm"
                  style={{ backgroundColor: color }}
                ></div>
              </div>
            </div>
            <SavedPalettesSection
              type="picker"
              clearAllPalettes={clearAllPalettes}
              deletePalette={deletePalette}
              copyToClipboard={copyToClipboard}
              onColorSelect={handleColorSelect}
              setColor={setColor}
              setActiveTab={setActiveTab}
            />
          </div>
        );

      case "palette":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Color
                </label>
                <HexColorPicker
                  color={color}
                  onChange={setColor}
                  className="w-full"
                />
                <div className="mt-4">
                  <HexColorInput
                    color={color}
                    onChange={setColor}
                    prefixed
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter HEX color"
                  />
                </div>
              </div>
              <div className="w-64 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Palette Type
                  </label>
                  <select
                    value={paletteType}
                    onChange={(e) => setPaletteType(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="analogous">Analogous</option>
                    <option value="complementary">Complementary</option>
                    <option value="triadic">Triadic</option>
                    <option value="monochromatic">Monochromatic</option>
                  </select>
                </div>
                <TagInput value={paletteTag} onChange={setPaletteTag} />
                <button
                  onClick={generatePalette}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                >
                  Generate Palette
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {palette.map((color, index) => (
                <div
                  key={index}
                  className="relative group rounded-lg overflow-hidden shadow-lg"
                >
                  <div
                    className="h-32 transition-transform group-hover:scale-105"
                    style={{ backgroundColor: color }}
                  ></div>
                  <button
                    onClick={() => copyToClipboard(color)}
                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="text-white font-mono">{color}</span>
                  </button>
                </div>
              ))}
            </div>
            <SavedPalettesSection
              type="generated"
              clearAllPalettes={clearAllPalettes}
              deletePalette={deletePalette}
              copyToClipboard={copyToClipboard}
              onColorSelect={handleColorSelect}
              setColor={setColor}
              setActiveTab={setActiveTab}
            />
          </div>
        );

      case "gradient":
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-[1fr,1.5fr] gap-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gradient Type
                  </label>
                  <select
                    value={gradientType}
                    onChange={(e) => setGradientType(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="linear">Linear</option>
                    <option value="radial">Radial</option>
                  </select>
                </div>
                {gradientType === "linear" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Angle
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={gradientAngle}
                      onChange={(e) => setGradientAngle(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-center text-sm text-gray-600">
                      {gradientAngle}°
                    </div>
                  </div>
                )}
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <button
                      onClick={addGradientStop}
                      className="px-4 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 rounded transition-colors flex items-center gap-2"
                    >
                      <FaPlus className="text-xs" />
                      Add Color Stop
                    </button>
                    <button
                      onClick={() =>
                        savePalette(
                          gradientStops.map((stop) => stop.color),
                          "gradient",
                          paletteTag
                        )
                      }
                      className="px-4 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 rounded transition-colors"
                    >
                      Save Gradient
                    </button>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      CSS
                    </label>
                    <div className="relative">
                      <textarea
                        value={tempGradientCSS}
                        onChange={(e) =>
                          debouncedParseAndApplyCSS(e.target.value)
                        }
                        className={`w-full h-24 px-3 py-2 text-sm border rounded font-mono resize-none ${
                          cssError ? "border-red-500 focus:ring-red-500" : ""
                        }`}
                        spellCheck="false"
                      />
                      <div className="absolute top-2 right-2 flex items-center gap-2">
                        {cssError && (
                          <div className="relative group">
                            <FaExclamationTriangle className="text-red-500" />
                            <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-red-50 border border-red-200 rounded shadow-lg text-xs text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                              {cssError}
                            </div>
                          </div>
                        )}
                        <button
                          onClick={() => copyToClipboard(tempGradientCSS)}
                          className="p-1 text-gray-500 hover:text-gray-700"
                          title="Copy CSS"
                        >
                          <FaCopy className="text-xs" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className="h-64 rounded-lg shadow-lg"
                style={{ background: gradientCSS }}
              ></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {gradientStops.map((stop, index) => (
                <div
                  key={index}
                  className="bg-gray-50 p-6 rounded-lg space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700">
                      Color {index + 1}
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {index > 0 && (
                          <button
                            onClick={() => moveGradientStop(index, "left")}
                            className="text-gray-500 hover:text-gray-700"
                            title="Move Left"
                          >
                            <FaArrowLeft className="text-xs" />
                          </button>
                        )}
                        {index < gradientStops.length - 1 && (
                          <button
                            onClick={() => moveGradientStop(index, "right")}
                            className="text-gray-500 hover:text-gray-700"
                            title="Move Right"
                          >
                            <FaArrowRight className="text-xs" />
                          </button>
                        )}
                      </div>
                      {gradientStops.length > 2 && (
                        <button
                          onClick={() => removeGradientStop(index)}
                          className="text-red-500 hover:text-red-700"
                          title="Remove Color"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <HexColorPicker
                      color={stop.color}
                      onChange={(color) => updateGradientStop(index, { color })}
                      className="w-full"
                    />
                    <HexColorInput
                      color={stop.color}
                      onChange={(color) => updateGradientStop(index, { color })}
                      prefixed
                      className="w-full px-3 py-2 text-sm border rounded"
                    />
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">
                        Position: {stop.position}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={stop.position}
                        onChange={(e) =>
                          updateGradientStop(index, {
                            position: Number(e.target.value),
                          })
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <SavedPalettesSection
              type="gradient"
              clearAllPalettes={clearAllPalettes}
              deletePalette={deletePalette}
              copyToClipboard={copyToClipboard}
              onColorSelect={handleColorSelect}
              setColor={setColor}
              setActiveTab={setActiveTab}
            />
          </div>
        );

      case "contrast":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background Color
                  </label>
                  <HexColorPicker color={color} onChange={setColor} />
                  <div className="mt-2">
                    <HexColorInput
                      color={color}
                      onChange={setColor}
                      prefixed
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Text Color
                  </label>
                  <HexColorPicker
                    color={contrastText}
                    onChange={setContrastText}
                  />
                  <div className="mt-2">
                    <HexColorInput
                      color={contrastText}
                      onChange={setContrastText}
                      prefixed
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div
                  className="p-8 rounded-lg shadow-lg min-h-[200px] flex items-center justify-center text-center"
                  style={{
                    backgroundColor: color,
                    color: contrastText,
                  }}
                >
                  <div>
                    <div className="text-3xl font-bold mb-4">Sample Text</div>
                    <div className="text-base">
                      This is how your text will look on the selected
                      background.
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <div className="text-xl font-semibold mb-4">
                    Contrast Ratio: {getContrastRatio(contrastText, color)}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full ${
                          getContrastRatio(contrastText, color) >= 4.5
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      ></div>
                      <span>WCAG AA Standard (4.5:1) - Normal Text</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full ${
                          getContrastRatio(contrastText, color) >= 7
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      ></div>
                      <span>WCAG AAA Standard (7:1) - Normal Text</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "extract":
        return (
          <div className="space-y-6">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input {...getInputProps()} />
              <div className="space-y-4">
                <div className="text-gray-600">
                  {isDragActive
                    ? "Drop the image here..."
                    : "Drag and drop an image here, or click to select one"}
                </div>
                {uploadedImage && (
                  <img
                    src={uploadedImage}
                    alt="Uploaded"
                    className="max-h-64 mx-auto"
                  />
                )}
              </div>
            </div>
            {extractedColors.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Extracted colors
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => removeColor(extractedColors.length - 1)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 flex items-center gap-2"
                      disabled={extractedColors.length <= 1}
                    >
                      <FaTrash className="text-xs" />
                      Remove Color
                    </button>
                    <button
                      onClick={addMoreColors}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FaPlus className="text-xs" />
                      Add Color
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {extractedColors.map((color, index) => (
                    <div
                      key={index}
                      className="relative group rounded-lg overflow-hidden shadow-lg"
                    >
                      <div
                        className="h-32 transition-transform group-hover:scale-105"
                        style={{ backgroundColor: color }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyToClipboard(color)}
                            className="p-2 bg-white bg-opacity-10 rounded hover:bg-opacity-20"
                            title="Copy Color"
                          >
                            <FaCopy className="text-white" />
                          </button>
                          <button
                            onClick={() => removeColor(index)}
                            className="p-2 bg-white bg-opacity-10 rounded hover:bg-opacity-20"
                            title="Remove Color"
                          >
                            <FaTrash className="text-white" />
                          </button>
                        </div>
                      </div>
                      <div className="absolute bottom-0 inset-x-0 bg-black bg-opacity-75 text-white text-center py-1">
                        <span className="font-mono text-sm">{color}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <SavedPalettesSection
              type="extracted"
              clearAllPalettes={clearAllPalettes}
              deletePalette={deletePalette}
              copyToClipboard={copyToClipboard}
              onColorSelect={handleColorSelect}
              setColor={setColor}
              setActiveTab={setActiveTab}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <ToolLayout
      title="Color Tools"
      description="A collection of color manipulation and generation tools"
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
                { id: "picker", label: "Color Picker" },
                { id: "palette", label: "Palette Generator" },
                { id: "gradient", label: "Gradient Generator" },
                { id: "contrast", label: "Contrast Checker" },
                { id: "extract", label: "Extract Colors" },
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
                  { id: "picker", label: "Color Picker" },
                  { id: "palette", label: "Palette Generator" },
                  { id: "gradient", label: "Gradient Generator" },
                  { id: "contrast", label: "Contrast Checker" },
                  { id: "extract", label: "Extract Colors" },
                ].map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => handleTabChange(tool.id)}
                    className={`px-4 py-2 -mb-px whitespace-nowrap ${
                      activeTab === tool.id
                        ? "border-b-2 border-primary-600 text-primary-600"
                        : "text-gray-500"
                    }`}
                  >
                    {tool.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {renderTool()}
      </div>
    </ToolLayout>
  );
};

export default ColorTools;
