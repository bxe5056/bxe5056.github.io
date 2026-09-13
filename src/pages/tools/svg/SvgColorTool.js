import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  FaUpload,
  FaDownload,
  FaCopy,
  FaTrash,
  FaFileArchive,
} from "react-icons/fa";
import { copyText } from "../../../utils/tools/clipboard";
import { downloadText, downloadBlob } from "../../../utils/tools/download";
import {
  extractSvgColors,
  replaceSvgColors,
  splitSvgByColor,
} from "./svgColorEngine";

/**
 * Self-contained SVG color extract + replace UI.
 * Owns its own file state so parent tab switches do not wipe work.
 */
const SvgColorTool = () => {
  const [sourceSvg, setSourceSvg] = useState("");
  const [workingSvg, setWorkingSvg] = useState("");
  const [fileName, setFileName] = useState("colors.svg");
  const [colorGroups, setColorGroups] = useState([]);
  const [specials, setSpecials] = useState([]);
  /** @type {Record<string, string>} canonical → replacement */
  const [replacements, setReplacements] = useState({});
  const [tempInputs, setTempInputs] = useState({});
  const [replaceSpecial, setReplaceSpecial] = useState(false);
  const [specialReplacements, setSpecialReplacements] = useState({});
  const [outputSvg, setOutputSvg] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [zipBusy, setZipBusy] = useState(false);

  const ingestSvg = useCallback((text, name) => {
    setError(null);
    setStatus(null);
    const extracted = extractSvgColors(text);
    if (extracted.error) {
      setError(extracted.error);
      setSourceSvg("");
      setWorkingSvg("");
      setColorGroups([]);
      setSpecials([]);
      setReplacements({});
      setOutputSvg("");
      return;
    }

    setSourceSvg(text);
    setWorkingSvg(text);
    setFileName(name || "colors.svg");
    setColorGroups(extracted.colors);
    setSpecials(extracted.specials);

    const initial = {};
    extracted.colors.forEach((c) => {
      initial[c.canonical] = c.canonical;
    });
    setReplacements(initial);
    setTempInputs({});

    const specialInit = {};
    extracted.specials.forEach((s) => {
      specialInit[s.token.toLowerCase()] = s.token;
    });
    setSpecialReplacements(specialInit);

    // Start with original as output / preview
    setOutputSvg(text);
  }, []);

  const onDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        ingestSvg(String(e.target?.result ?? ""), file.name || "colors.svg");
      };
      reader.onerror = () => setError("Failed to read file");
      reader.readAsText(file);
    },
    [ingestSvg]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/svg+xml": [".svg"] },
    maxFiles: 1,
  });

  // Live preview via blob URL (prefer over dangerouslySetInnerHTML)
  useEffect(() => {
    if (!outputSvg) {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return "";
      });
      return undefined;
    }

    const blob = new Blob([outputSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [outputSvg]);

  const hasPendingChanges = useMemo(() => {
    return colorGroups.some((c) => {
      const next = replacements[c.canonical];
      return next && next.toLowerCase() !== c.canonical.toLowerCase();
    });
  }, [colorGroups, replacements]);

  const applyReplacements = useCallback(() => {
    if (!workingSvg) return;
    setError(null);

    const map = { ...replacements };
    if (replaceSpecial) {
      Object.assign(map, specialReplacements);
    }

    const result = replaceSvgColors(workingSvg, map, { replaceSpecial });
    if (result.error) {
      setError(result.error);
      return;
    }

    setOutputSvg(result.svg);
    setStatus(
      result.changed > 0
        ? `Updated ${result.changed} paint value${result.changed === 1 ? "" : "s"}`
        : "No paint values changed"
    );

    // Re-extract from result so the list reflects the new document
    const extracted = extractSvgColors(result.svg);
    if (!extracted.error) {
      setColorGroups(extracted.colors);
      setSpecials(extracted.specials);
      const nextMap = {};
      extracted.colors.forEach((c) => {
        nextMap[c.canonical] = c.canonical;
      });
      setReplacements(nextMap);
      setTempInputs({});
      // Keep working from the replaced document for further edits
      setWorkingSvg(result.svg);
    }
  }, [workingSvg, replacements, replaceSpecial, specialReplacements]);

  const handleDownload = useCallback(() => {
    if (!outputSvg) return;
    const base = fileName.replace(/\.svg$/i, "") || "colors";
    downloadText(outputSvg, `${base}-recolored.svg`, "image/svg+xml");
  }, [outputSvg, fileName]);

  const handleCopy = useCallback(async () => {
    if (!outputSvg) return;
    const ok = await copyText(outputSvg);
    setStatus(ok ? "Copied SVG to clipboard" : "Could not copy to clipboard");
  }, [outputSvg]);

  const handleClear = useCallback(() => {
    setSourceSvg("");
    setWorkingSvg("");
    setOutputSvg("");
    setColorGroups([]);
    setSpecials([]);
    setReplacements({});
    setTempInputs({});
    setSpecialReplacements({});
    setError(null);
    setStatus(null);
    setFileName("colors.svg");
  }, []);

  const handleExportZip = useCallback(async () => {
    if (!sourceSvg || colorGroups.length === 0) return;
    setZipBusy(true);
    setError(null);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      // Layer split from the uploaded original so counts stay stable
      const originalColors = extractSvgColors(sourceSvg).colors;
      const layers = splitSvgByColor(sourceSvg, originalColors);
      layers.forEach((layer) => {
        zip.file(layer.filename, layer.svg);
      });
      zip.file("original.svg", sourceSvg);
      if (outputSvg && outputSvg !== sourceSvg) {
        zip.file("recolored.svg", outputSvg);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const base = fileName.replace(/\.svg$/i, "") || "colors";
      downloadBlob(blob, `${base}-by-color.zip`);
      setStatus(`Exported ${layers.length} color layer${layers.length === 1 ? "" : "s"} as ZIP`);
    } catch (err) {
      console.error(err);
      setError("ZIP export failed");
    } finally {
      setZipBusy(false);
    }
  }, [sourceSvg, colorGroups, outputSvg, fileName]);

  const commitTextReplacement = useCallback((canonical, rawValue) => {
    const value = String(rawValue ?? "").trim();
    const isHex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(value);
    const isRgb = /^rgba?\(\s*[\d.%]+\s*[,/\s]+[\d.%]+\s*[,/\s]+[\d.%]+(?:\s*[,/]\s*[\d.%]+)?\s*\)$/i.test(
      value
    );
    const isNamed = /^[a-zA-Z]+$/.test(value);

    if (isHex || isRgb || isNamed) {
      setReplacements((prev) => ({ ...prev, [canonical]: value }));
      setTempInputs((prev) => {
        const next = { ...prev };
        delete next[canonical];
        return next;
      });
    } else {
      setTempInputs((prev) => ({
        ...prev,
        [canonical]: replacements[canonical] || canonical,
      }));
    }
  }, [replacements]);

  if (!workingSvg) {
    return (
      <div className="space-y-6" data-tool="color-swap">
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
          <p className="text-sm text-gray-400 mt-2">
            Extract fills, strokes, gradients stops, and style colors — then swap them locally in your browser.
          </p>
        </div>
        {error && (
          <p className="text-center text-red-600 text-sm">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6" data-tool="color-swap">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Color extract & replace</h3>
          <p className="text-sm text-gray-500 mt-1">
            {fileName} · {colorGroups.length} solid color
            {colorGroups.length === 1 ? "" : "s"}
            {specials.length > 0
              ? ` · ${specials.length} special paint${specials.length === 1 ? "" : "s"}`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-2 text-sm border rounded text-gray-600 hover:bg-gray-50 flex items-center"
          >
            <FaTrash className="mr-2" />
            Clear
          </button>
          <div {...getRootProps()} className="inline-block">
            <input {...getInputProps()} />
            <button
              type="button"
              className="px-3 py-2 text-sm border rounded text-gray-600 hover:bg-gray-50 flex items-center"
            >
              <FaUpload className="mr-2" />
              Replace file
            </button>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600">
        Equivalent colors (e.g. <code className="text-xs">#f00</code> and{" "}
        <code className="text-xs">red</code>) are grouped.{" "}
        <span className="font-medium">none</span>,{" "}
        <span className="font-medium">currentColor</span>, and{" "}
        <span className="font-medium">url(...)</span> paints are left alone unless you opt in below.
      </p>

      {colorGroups.length === 0 ? (
        <p className="text-center text-gray-500 py-4">
          No solid colors found in this SVG.
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {colorGroups.map((group, index) => {
            const current = replacements[group.canonical] || group.canonical;
            const inputValue = tempInputs[group.canonical] ?? current;
            return (
              <div
                key={group.canonical}
                className="flex items-center p-3 border rounded bg-white"
              >
                <div className="flex items-center justify-between w-full gap-2">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className="flex-none w-10 h-10 rounded border shadow-sm"
                      style={{ backgroundColor: group.canonical }}
                      title={group.samples.join(", ")}
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-500">
                        Original · {group.count}×
                      </div>
                      <div className="text-sm font-mono mt-1 truncate">
                        {group.canonical}
                      </div>
                      {group.samples.length > 1 && (
                        <div className="text-xs text-gray-400 truncate">
                          also {group.samples.slice(1, 3).join(", ")}
                          {group.samples.length > 3 ? "…" : ""}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-gray-400 text-lg flex-none">→</div>

                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <input
                        type="color"
                        value={
                          /^#[0-9A-Fa-f]{6}$/.test(current)
                            ? current
                            : group.canonical
                        }
                        onChange={(e) =>
                          setReplacements((prev) => ({
                            ...prev,
                            [group.canonical]: e.target.value,
                          }))
                        }
                        className="sr-only"
                        id={`svg-color-picker-${index}`}
                      />
                      <label
                        htmlFor={`svg-color-picker-${index}`}
                        className="block w-10 h-10 rounded border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                        style={{ backgroundColor: current }}
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">New</div>
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setTempInputs((prev) => ({
                            ...prev,
                            [group.canonical]: newValue,
                          }));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.target.blur();
                        }}
                        onBlur={(e) =>
                          commitTextReplacement(group.canonical, e.target.value)
                        }
                        className="w-28 px-2 py-1 text-sm font-mono border rounded"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {specials.length > 0 && (
        <div className="border rounded p-4 bg-gray-50 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={replaceSpecial}
              onChange={(e) => setReplaceSpecial(e.target.checked)}
              className="mt-1"
            />
            <span className="text-sm text-gray-700">
              Also replace special paints (
              {specials.map((s) => s.token).join(", ")})
            </span>
          </label>
          {replaceSpecial && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
              {specials.map((s) => {
                const key = s.token.toLowerCase();
                return (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    <code className="font-mono text-xs bg-white border px-2 py-1 rounded truncate max-w-[40%]">
                      {s.token}
                    </code>
                    <span className="text-gray-400">→</span>
                    <input
                      type="text"
                      value={specialReplacements[key] ?? s.token}
                      onChange={(e) =>
                        setSpecialReplacements((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                      className="flex-1 px-2 py-1 text-sm font-mono border rounded"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={applyReplacements}
        disabled={!workingSvg || (!hasPendingChanges && !replaceSpecial)}
        className="w-full px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:bg-gray-400"
      >
        Replace Colors
      </button>

      {(error || status) && (
        <p
          className={`text-sm text-center ${
            error ? "text-red-600" : "text-gray-600"
          }`}
        >
          {error || status}
        </p>
      )}

      {previewUrl && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Preview</h3>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="relative w-full aspect-video overflow-hidden flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="SVG color preview"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 min-w-[140px] px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center justify-center"
            >
              <FaCopy className="mr-2" />
              Copy SVG
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex-1 min-w-[140px] px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center"
            >
              <FaDownload className="mr-2" />
              Download SVG
            </button>
            <button
              type="button"
              onClick={handleExportZip}
              disabled={zipBusy || colorGroups.length === 0}
              className="flex-1 min-w-[140px] px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 flex items-center justify-center"
            >
              <FaFileArchive className="mr-2" />
              {zipBusy ? "Zipping…" : "Export by color (ZIP)"}
            </button>
          </div>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs max-h-64 svg-output">
            {outputSvg}
          </pre>
        </div>
      )}
    </div>
  );
};

export default SvgColorTool;
