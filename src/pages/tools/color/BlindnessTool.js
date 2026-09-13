import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import {
  FaUpload,
  FaTrash,
  FaPalette,
  FaPlus,
  FaEye,
} from "react-icons/fa";
import { hexToRgb, rgbToHex } from "../../../utils/colorConversion";
import { consumeSessionPayload } from "../../../utils/tools/session";
import { openToolWithPayload } from "../../../utils/tools/handoff";

/**
 * CVD simulation matrices (linear RGB) - common Viénot / Machado-style sets
 * used by many client-side simulators.
 */
const CVD_TYPES = [
  { id: "protanopia", label: "Protanopia", hint: "No red cones" },
  { id: "deuteranopia", label: "Deuteranopia", hint: "No green cones" },
  { id: "tritanopia", label: "Tritanopia", hint: "No blue cones" },
  { id: "achromatopsia", label: "Achromatopsia", hint: "No color" },
];

const MATRICES = {
  protanopia: [
    [0.56667, 0.43333, 0],
    [0.55833, 0.44167, 0],
    [0, 0.24167, 0.75833],
  ],
  deuteranopia: [
    [0.625, 0.375, 0],
    [0.7, 0.3, 0],
    [0, 0.3, 0.7],
  ],
  tritanopia: [
    [0.95, 0.05, 0],
    [0, 0.43333, 0.56667],
    [0, 0.475, 0.525],
  ],
  achromatopsia: [
    [0.299, 0.587, 0.114],
    [0.299, 0.587, 0.114],
    [0.299, 0.587, 0.114],
  ],
};

const DEFAULT_PALETTE = [
  "#e63946",
  "#f4a261",
  "#e9c46a",
  "#2a9d8f",
  "#264653",
  "#457b9d",
  "#a8dadc",
  "#1d3557",
];

function clampByte(n) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function srgbToLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(c) {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  return clampByte(v * 255);
}

function applyMatrix(r, g, b, matrix) {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  const nr =
    matrix[0][0] * lr + matrix[0][1] * lg + matrix[0][2] * lb;
  const ng =
    matrix[1][0] * lr + matrix[1][1] * lg + matrix[1][2] * lb;
  const nb =
    matrix[2][0] * lr + matrix[2][1] * lg + matrix[2][2] * lb;
  return {
    r: linearToSrgb(nr),
    g: linearToSrgb(ng),
    b: linearToSrgb(nb),
  };
}

function normalizeHex(input) {
  if (input == null) return null;
  let s = String(input).trim();
  if (!s) return null;

  // rgb()/rgba()
  const rgbMatch = s.match(
    /^rgba?\(\s*([\d.]+)\s*[,/\s]+\s*([\d.]+)\s*[,/\s]+\s*([\d.]+)/i
  );
  if (rgbMatch) {
    return rgbToHex(
      clampByte(Number(rgbMatch[1])),
      clampByte(Number(rgbMatch[2])),
      clampByte(Number(rgbMatch[3]))
    ).toLowerCase();
  }

  if (!s.startsWith("#")) s = `#${s}`;
  if (/^#([0-9a-f]{3})$/i.test(s)) {
    const [, h] = s.match(/^#([0-9a-f]{3})$/i);
    s = `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
  }
  if (/^#([0-9a-f]{6})$/i.test(s)) return s.toLowerCase();
  if (/^#([0-9a-f]{8})$/i.test(s)) return `#${s.slice(1, 7)}`.toLowerCase();
  return null;
}

function simulateHex(hex, typeId) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const matrix = MATRICES[typeId];
  if (!matrix) return hex;
  const out = applyMatrix(rgb.r, rgb.g, rgb.b, matrix);
  return rgbToHex(out.r, out.g, out.b).toLowerCase();
}

function transformImageData(imageData, typeId) {
  const matrix = MATRICES[typeId];
  if (!matrix) return imageData;
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const out = applyMatrix(data[i], data[i + 1], data[i + 2], matrix);
    data[i] = out.r;
    data[i + 1] = out.g;
    data[i + 2] = out.b;
    // alpha unchanged
  }
  return imageData;
}

/**
 * Color blindness simulator for palettes + optional image (canvas pixel transform).
 */
const BlindnessTool = () => {
  const navigate = useNavigate();
  const [cvdType, setCvdType] = useState("deuteranopia");
  const [colors, setColors] = useState(DEFAULT_PALETTE);
  const [draftColor, setDraftColor] = useState("#536dfe");
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);

  const [sourcePreviewUrl, setSourcePreviewUrl] = useState("");
  const [simPreviewUrl, setSimPreviewUrl] = useState("");
  const [imageName, setImageName] = useState("");
  const [imageBusy, setImageBusy] = useState(false);

  const simulated = useMemo(
    () => colors.map((c) => simulateHex(c, cvdType)),
    [colors, cvdType]
  );

  useEffect(() => {
    const payload = consumeSessionPayload();
    if (!payload || typeof payload !== "object") return;
    if (payload.type === "colors" && Array.isArray(payload.colors)) {
      const next = payload.colors
        .map(normalizeHex)
        .filter(Boolean);
      if (next.length) {
        setColors(next);
        setStatus(`Loaded ${next.length} color${next.length === 1 ? "" : "s"} from session`);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (sourcePreviewUrl) URL.revokeObjectURL(sourcePreviewUrl);
      if (simPreviewUrl) URL.revokeObjectURL(simPreviewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- revoke on unmount
  }, []);

  const runImageSimulation = useCallback(
    async (dataUrl, name, typeId = cvdType) => {
      setImageBusy(true);
      setError(null);
      try {
        const img = await new Promise((resolve, reject) => {
          const el = new Image();
          el.onload = () => resolve(el);
          el.onerror = () => reject(new Error("Failed to load image"));
          el.src = dataUrl;
        });

        const maxEdge = 1024;
        const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("Canvas not available");
        ctx.drawImage(img, 0, 0, w, h);

        const imageData = ctx.getImageData(0, 0, w, h);
        transformImageData(imageData, typeId);
        ctx.putImageData(imageData, 0, 0);

        const simUrl = canvas.toDataURL("image/png");
        setSourcePreviewUrl((prev) => {
          if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
          return dataUrl;
        });
        setSimPreviewUrl(simUrl);
        setImageName(name || "image.png");
        setStatus(`Simulated image as ${typeId}`);
      } catch (err) {
        console.error(err);
        setError(err?.message || "Image simulation failed");
      } finally {
        setImageBusy(false);
      }
    },
    [cvdType]
  );

  // Re-run simulation when CVD type changes and an image is loaded
  useEffect(() => {
    if (!sourcePreviewUrl) return;
    runImageSimulation(sourcePreviewUrl, imageName, cvdType);
    // Only when type changes with an existing image - not on every sourcePreviewUrl update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cvdType]);

  const onDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || "");
        if (dataUrl) runImageSimulation(dataUrl, file.name, cvdType);
      };
      reader.onerror = () => setError("Failed to read image");
      reader.readAsDataURL(file);
    },
    [cvdType, runImageSimulation]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
      "image/gif": [".gif"],
    },
    maxFiles: 1,
  });

  const addColor = useCallback(() => {
    const hex = normalizeHex(draftColor);
    if (!hex) {
      setError("Enter a valid hex or rgb() color");
      return;
    }
    setError(null);
    setColors((prev) => [...prev, hex]);
  }, [draftColor]);

  const removeColor = useCallback((index) => {
    setColors((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateColor = useCallback((index, value) => {
    const hex = normalizeHex(value);
    if (!hex) return;
    setColors((prev) => prev.map((c, i) => (i === index ? hex : c)));
  }, []);

  const clearImage = useCallback(() => {
    setSourcePreviewUrl((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return "";
    });
    setSimPreviewUrl("");
    setImageName("");
  }, []);

  const resetPalette = useCallback(() => {
    setColors(DEFAULT_PALETTE);
    setStatus("Reset to sample palette");
  }, []);

  const handoffColors = useCallback(
    (which) => {
      const list = which === "simulated" ? simulated : colors;
      const path = openToolWithPayload({
        category: "color",
        toolId: "palette",
        payload: { type: "colors", colors: list },
        navigate,
      });
      if (path) {
        setStatus(
          `Opened Palette with ${which === "simulated" ? "simulated" : "original"} colors`
        );
      } else {
        setError("Could not open Palette tool");
      }
    },
    [colors, simulated, navigate]
  );

  const activeHint = CVD_TYPES.find((t) => t.id === cvdType)?.hint;

  return (
    <div className="space-y-6" data-tool="blindness">
      <div>
        <h3 className="text-lg font-semibold text-gray-800">
          Color blindness simulator
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Approximate how a palette or image appears under common CVD types.
          Runs entirely in your browser.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {CVD_TYPES.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => setCvdType(type.id)}
            className={`px-3 py-2 text-sm rounded border ${
              cvdType === type.id
                ? "border-primary-600 text-primary-600 bg-primary-50"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span className="inline-flex items-center">
              <FaEye className="mr-2 opacity-70" />
              {type.label}
            </span>
          </button>
        ))}
      </div>
      {activeHint && (
        <p className="text-xs text-gray-500 -mt-3">{activeHint}</p>
      )}

      {error && <p className="text-center text-red-600 text-sm">{error}</p>}
      {status && <p className="text-center text-green-700 text-sm">{status}</p>}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-sm font-medium text-gray-700">Palette</h4>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={resetPalette}
              className="px-3 py-1.5 text-sm border rounded text-gray-600 hover:bg-gray-50"
            >
              Sample palette
            </button>
            <button
              type="button"
              onClick={() => handoffColors("original")}
              className="px-3 py-1.5 text-sm border rounded text-gray-600 hover:bg-gray-50 flex items-center"
            >
              <FaPalette className="mr-2" />
              Open original in Palette
            </button>
            <button
              type="button"
              onClick={() => handoffColors("simulated")}
              className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 flex items-center"
            >
              <FaPalette className="mr-2" />
              Open simulated in Palette
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Add color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={normalizeHex(draftColor) || "#000000"}
                onChange={(e) => setDraftColor(e.target.value)}
                className="w-10 h-10 border rounded cursor-pointer"
                aria-label="Pick color"
              />
              <input
                type="text"
                value={draftColor}
                onChange={(e) => setDraftColor(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addColor();
                }}
                className="w-28 px-2 py-2 text-sm border rounded font-mono"
                placeholder="#rrggbb"
              />
              <button
                type="button"
                onClick={addColor}
                className="px-3 py-2 text-sm border rounded text-gray-600 hover:bg-gray-50 flex items-center"
              >
                <FaPlus className="mr-1" />
                Add
              </button>
            </div>
          </div>
        </div>

        {colors.length === 0 ? (
          <p className="text-sm text-gray-500">Add colors or receive a handoff.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {colors.map((original, index) => {
              const sim = simulated[index];
              return (
                <div
                  key={`${original}-${index}`}
                  className="border rounded bg-white p-3 flex gap-3 items-center"
                >
                  <div className="flex flex-1 gap-2 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500 mb-1">Original</div>
                      <div
                        className="h-12 rounded border shadow-sm"
                        style={{ backgroundColor: original }}
                        title={original}
                      />
                      <input
                        type="text"
                        value={original}
                        onChange={(e) => updateColor(index, e.target.value)}
                        className="mt-1 w-full text-xs font-mono border rounded px-1 py-0.5"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500 mb-1">Simulated</div>
                      <div
                        className="h-12 rounded border shadow-sm"
                        style={{ backgroundColor: sim }}
                        title={sim}
                      />
                      <div className="mt-1 text-xs font-mono text-gray-600 truncate px-1 py-0.5">
                        {sim}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeColor(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    aria-label="Remove color"
                  >
                    <FaTrash />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Compact strip comparison */}
        {colors.length > 0 && (
          <div className="space-y-2">
            <div className="flex h-8 rounded overflow-hidden border">
              {colors.map((c, i) => (
                <div
                  key={`o-${i}`}
                  className="flex-1"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
            <div className="flex h-8 rounded overflow-hidden border">
              {simulated.map((c, i) => (
                <div
                  key={`s-${i}`}
                  className="flex-1"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
            <p className="text-xs text-gray-400">
              Top: original · Bottom: {cvdType}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-sm font-medium text-gray-700">
            Optional image preview
          </h4>
          {sourcePreviewUrl && (
            <button
              type="button"
              onClick={clearImage}
              className="px-3 py-1.5 text-sm border rounded text-gray-600 hover:bg-gray-50 flex items-center"
            >
              <FaTrash className="mr-2" />
              Clear image
            </button>
          )}
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-primary-500 bg-primary-50"
              : "border-gray-300 hover:border-primary-500"
          }`}
        >
          <input {...getInputProps()} />
          <FaUpload className="mx-auto text-3xl mb-3 text-gray-400" />
          <p className="text-gray-600 text-sm">
            {isDragActive
              ? "Drop the image here"
              : "Drag & drop an image, or click to select"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            PNG, JPEG, WebP, GIF - pixels transformed with the selected matrix
          </p>
        </div>

        {imageBusy && (
          <p className="text-center text-gray-500 text-sm">Simulating image…</p>
        )}

        {sourcePreviewUrl && simPreviewUrl && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-2">
                Original{imageName ? ` · ${imageName}` : ""}
              </p>
              <img
                src={sourcePreviewUrl}
                alt="Original"
                className="w-full max-h-80 object-contain border rounded bg-white"
              />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">Simulated · {cvdType}</p>
              <img
                src={simPreviewUrl}
                alt={`Simulated ${cvdType}`}
                className="w-full max-h-80 object-contain border rounded bg-white"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlindnessTool;
