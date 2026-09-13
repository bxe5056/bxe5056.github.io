import React, { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  FaUpload,
  FaDownload,
  FaCopy,
  FaTrash,
  FaExchangeAlt,
} from "react-icons/fa";
import { copyText } from "../../../utils/tools/clipboard";
import { downloadBlob, downloadText } from "../../../utils/tools/download";
import { rasterToSvg, svgToRasterBlob } from "./imageTrace";

const MODES = {
  rasterToSvg: "raster-to-svg",
  svgToRaster: "svg-to-raster",
};

/**
 * Photo ↔ SVG: path-based raster vectorization and SVG→PNG/JPEG export.
 * Self-contained so parent tab switches do not wipe work (keep-alive shell).
 */
const SvgPhotoTool = () => {
  const [mode, setMode] = useState(MODES.rasterToSvg);

  // Raster → SVG
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState("");
  const [sourceFileName, setSourceFileName] = useState("image.png");
  const [sourceBlob, setSourceBlob] = useState(null);
  const [numberOfColors, setNumberOfColors] = useState(8);
  const [detail, setDetail] = useState(5);
  const [tracedSvg, setTracedSvg] = useState("");
  const [traceMeta, setTraceMeta] = useState(null);
  const [svgPreviewUrl, setSvgPreviewUrl] = useState("");

  // SVG → Raster
  const [svgInput, setSvgInput] = useState("");
  const [svgFileName, setSvgFileName] = useState("drawing.svg");
  const [rasterFormat, setRasterFormat] = useState("png");
  const [rasterScale, setRasterScale] = useState(1);
  const [jpegQuality, setJpegQuality] = useState(0.92);
  const [rasterPreviewUrl, setRasterPreviewUrl] = useState("");
  const [rasterBlob, setRasterBlob] = useState(null);
  const [rasterMeta, setRasterMeta] = useState(null);

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);

  // Preview blob URL for traced SVG
  useEffect(() => {
    if (!tracedSvg) {
      setSvgPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return "";
      });
      return undefined;
    }
    const blob = new Blob([tracedSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    setSvgPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    return () => URL.revokeObjectURL(url);
  }, [tracedSvg]);

  // Cleanup source / raster preview URLs on unmount
  useEffect(() => {
    return () => {
      if (sourcePreviewUrl) URL.revokeObjectURL(sourcePreviewUrl);
      if (rasterPreviewUrl) URL.revokeObjectURL(rasterPreviewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- revoke only on unmount
  }, []);

  const clearRasterToSvg = useCallback(() => {
    setSourcePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
    setSourceBlob(null);
    setSourceFileName("image.png");
    setTracedSvg("");
    setTraceMeta(null);
    setError(null);
    setStatus(null);
    setProgress(null);
  }, []);

  const clearSvgToRaster = useCallback(() => {
    setSvgInput("");
    setSvgFileName("drawing.svg");
    setRasterBlob(null);
    setRasterMeta(null);
    setRasterPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
    setError(null);
    setStatus(null);
    setProgress(null);
  }, []);

  const runTrace = useCallback(
    async (blob, name) => {
      if (!blob) return;
      setBusy(true);
      setError(null);
      setStatus(null);
      setProgress("Starting…");
      try {
        const result = await rasterToSvg(blob, {
          numberOfColors,
          detail,
          onProgress: setProgress,
        });
        setTracedSvg(result.svg);
        setTraceMeta({
          width: result.width,
          height: result.height,
          scale: result.scale,
          originalWidth: result.originalWidth,
          originalHeight: result.originalHeight,
          fileName: name || sourceFileName,
        });
        setStatus(
          result.scale < 1
            ? `Traced at ${result.width}×${result.height} (source ${result.originalWidth}×${result.originalHeight})`
            : `Traced ${result.width}×${result.height}`
        );
      } catch (err) {
        console.error(err);
        setError(err?.message || "Tracing failed");
        setTracedSvg("");
        setTraceMeta(null);
      } finally {
        setBusy(false);
        setProgress(null);
      }
    },
    [numberOfColors, detail, sourceFileName]
  );

  const ingestRasterFile = useCallback(
    async (file) => {
      if (!file) return;
      clearRasterToSvg();
      const preview = URL.createObjectURL(file);
      setSourcePreviewUrl(preview);
      setSourceBlob(file);
      setSourceFileName(file.name || "image.png");
      await runTrace(file, file.name || "image.png");
    },
    [clearRasterToSvg, runTrace]
  );

  const ingestSvgText = useCallback((text, name) => {
    setError(null);
    setStatus(null);
    setSvgInput(String(text || ""));
    setSvgFileName(name || "drawing.svg");
    setRasterBlob(null);
    setRasterMeta(null);
    setRasterPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
  }, []);

  const onDropRaster = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;
      ingestRasterFile(file);
    },
    [ingestRasterFile]
  );

  const onDropSvg = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        ingestSvgText(String(e.target?.result ?? ""), file.name || "drawing.svg");
      };
      reader.onerror = () => setError("Failed to read SVG file");
      reader.readAsText(file);
    },
    [ingestSvgText]
  );

  const rasterDropzone = useDropzone({
    onDrop: onDropRaster,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
      "image/gif": [".gif"],
      "image/bmp": [".bmp"],
    },
    maxFiles: 1,
    disabled: busy,
  });

  const svgDropzone = useDropzone({
    onDrop: onDropSvg,
    accept: { "image/svg+xml": [".svg"] },
    maxFiles: 1,
    disabled: busy,
  });

  const handleRetrace = useCallback(() => {
    if (!sourceBlob) return;
    runTrace(sourceBlob, sourceFileName);
  }, [sourceBlob, sourceFileName, runTrace]);

  const handleConvertSvg = useCallback(async () => {
    if (!svgInput.trim()) {
      setError("Paste or upload an SVG first");
      return;
    }
    setBusy(true);
    setError(null);
    setStatus(null);
    setProgress("Rendering SVG…");
    try {
      const { blob, width, height } = await svgToRasterBlob(svgInput, {
        format: rasterFormat,
        quality: jpegQuality,
        scale: rasterScale,
        background: rasterFormat === "jpeg" ? "#ffffff" : null,
      });
      const url = URL.createObjectURL(blob);
      setRasterPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      setRasterBlob(blob);
      setRasterMeta({ width, height, format: rasterFormat });
      setStatus(`Rendered ${width}×${height} ${rasterFormat.toUpperCase()}`);
    } catch (err) {
      console.error(err);
      setError(err?.message || "SVG render failed");
      setRasterBlob(null);
      setRasterMeta(null);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }, [svgInput, rasterFormat, jpegQuality, rasterScale]);

  const downloadTracedSvg = useCallback(() => {
    if (!tracedSvg) return;
    const base = (traceMeta?.fileName || sourceFileName).replace(
      /\.[^.]+$/,
      ""
    );
    downloadText(tracedSvg, `${base || "traced"}.svg`, "image/svg+xml");
  }, [tracedSvg, traceMeta, sourceFileName]);

  const copyTracedSvg = useCallback(async () => {
    if (!tracedSvg) return;
    const ok = await copyText(tracedSvg);
    setStatus(ok ? "SVG copied to clipboard" : "Copy failed");
  }, [tracedSvg]);

  const downloadRaster = useCallback(() => {
    if (!rasterBlob) return;
    const base = svgFileName.replace(/\.svg$/i, "") || "export";
    const ext = rasterFormat === "jpeg" ? "jpg" : "png";
    downloadBlob(rasterBlob, `${base}.${ext}`);
  }, [rasterBlob, svgFileName, rasterFormat]);

  return (
    <div className="space-y-6" data-tool="photo-svg">
      {/* Mode switch */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        <button
          type="button"
          onClick={() => setMode(MODES.rasterToSvg)}
          className={`px-4 py-2 rounded text-sm font-medium ${
            mode === MODES.rasterToSvg
              ? "bg-primary-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Raster → SVG
        </button>
        <button
          type="button"
          onClick={() => setMode(MODES.svgToRaster)}
          className={`px-4 py-2 rounded text-sm font-medium flex items-center gap-2 ${
            mode === MODES.svgToRaster
              ? "bg-primary-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <FaExchangeAlt className="opacity-80" />
          SVG → Raster
        </button>
      </div>

      {mode === MODES.rasterToSvg ? (
        <div className="space-y-6">
          <p className="text-sm text-gray-500">
            Trace a photo into real SVG paths (color posterize). Runs fully in
            your browser - large images are downsampled before tracing.
          </p>

          {!sourceBlob ? (
            <div
              {...rasterDropzone.getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                rasterDropzone.isDragActive
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-300 hover:border-primary-500"
              }`}
            >
              <input {...rasterDropzone.getInputProps()} />
              <FaUpload className="mx-auto text-4xl mb-4 text-gray-400" />
              <p className="text-gray-600">
                {rasterDropzone.isDragActive
                  ? "Drop the image here"
                  : "Drag & drop a PNG, JPEG, WebP, or GIF - or click to select"}
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Photo to SVG
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{sourceFileName}</p>
                </div>
                <button
                  type="button"
                  onClick={clearRasterToSvg}
                  disabled={busy}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-red-600 flex items-center gap-2"
                >
                  <FaTrash /> Clear
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Source</h4>
                  <div className="border rounded-lg p-4 bg-gray-50 flex items-center justify-center min-h-[12rem]">
                    {sourcePreviewUrl && (
                      <img
                        src={sourcePreviewUrl}
                        alt="Source"
                        className="max-w-full max-h-64 object-contain"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Colors: {numberOfColors}
                    </label>
                    <input
                      type="range"
                      min={2}
                      max={24}
                      value={numberOfColors}
                      onChange={(e) =>
                        setNumberOfColors(Number(e.target.value))
                      }
                      disabled={busy}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>2</span>
                      <span>24</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Detail: {detail}
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={detail}
                      onChange={(e) => setDetail(Number(e.target.value))}
                      disabled={busy}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Coarse</span>
                      <span>Fine</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRetrace}
                    disabled={busy || !sourceBlob}
                    className="w-full px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:bg-gray-400"
                  >
                    {busy ? progress || "Tracing…" : "Re-trace with settings"}
                  </button>

                  <div
                    {...rasterDropzone.getRootProps()}
                    className="text-center text-sm text-primary-600 cursor-pointer hover:underline"
                  >
                    <input {...rasterDropzone.getInputProps()} />
                    Replace image…
                  </div>
                </div>
              </div>

              {busy && progress && (
                <div className="rounded-lg border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-800">
                  {progress}
                </div>
              )}

              {tracedSvg && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h4 className="text-sm font-medium text-gray-700">
                      Vector preview
                      {traceMeta
                        ? ` · ${traceMeta.width}×${traceMeta.height}`
                        : ""}
                    </h4>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={copyTracedSvg}
                        className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2 text-sm"
                      >
                        <FaCopy /> Copy
                      </button>
                      <button
                        type="button"
                        onClick={downloadTracedSvg}
                        className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2 text-sm"
                      >
                        <FaDownload /> Download SVG
                      </button>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4 bg-[length:16px_16px] bg-[linear-gradient(45deg,#f3f4f6_25%,transparent_25%,transparent_75%,#f3f4f6_75%),linear-gradient(45deg,#f3f4f6_25%,transparent_25%,transparent_75%,#f3f4f6_75%)] bg-[position:0_0,8px_8px]">
                    {svgPreviewUrl && (
                      <img
                        src={svgPreviewUrl}
                        alt="Traced SVG"
                        className="max-w-full max-h-80 mx-auto object-contain"
                      />
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-gray-500">
            Render SVG markup to PNG or JPEG via an untainted blob URL. External
            cross-origin images inside the SVG may fail; keep assets inline.
          </p>

          {!svgInput ? (
            <div
              {...svgDropzone.getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                svgDropzone.isDragActive
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-300 hover:border-primary-500"
              }`}
            >
              <input {...svgDropzone.getInputProps()} />
              <FaUpload className="mx-auto text-4xl mb-4 text-gray-400" />
              <p className="text-gray-600">
                {svgDropzone.isDragActive
                  ? "Drop the SVG here"
                  : "Drag & drop an SVG, or paste markup below"}
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  SVG to raster
                </h3>
                <p className="text-sm text-gray-500 mt-1">{svgFileName}</p>
              </div>
              <button
                type="button"
                onClick={clearSvgToRaster}
                disabled={busy}
                className="px-3 py-2 text-sm text-gray-600 hover:text-red-600 flex items-center gap-2"
              >
                <FaTrash /> Clear
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SVG markup
            </label>
            <textarea
              value={svgInput}
              onChange={(e) => ingestSvgText(e.target.value, svgFileName)}
              rows={8}
              spellCheck={false}
              placeholder="<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; …>"
              className="w-full px-3 py-2 border rounded font-mono text-sm"
              disabled={busy}
            />
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              <div
                {...svgDropzone.getRootProps()}
                className="text-primary-600 hover:underline cursor-pointer"
              >
                <input {...svgDropzone.getInputProps()} />
                Upload SVG file…
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Format
              </label>
              <select
                value={rasterFormat}
                onChange={(e) => setRasterFormat(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                disabled={busy}
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scale: {rasterScale.toFixed(2)}×
              </label>
              <input
                type="range"
                min={0.5}
                max={3}
                step={0.25}
                value={rasterScale}
                onChange={(e) => setRasterScale(Number(e.target.value))}
                disabled={busy}
                className="w-full"
              />
            </div>
            {rasterFormat === "jpeg" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  JPEG quality: {Math.round(jpegQuality * 100)}%
                </label>
                <input
                  type="range"
                  min={0.5}
                  max={1}
                  step={0.02}
                  value={jpegQuality}
                  onChange={(e) => setJpegQuality(Number(e.target.value))}
                  disabled={busy}
                  className="w-full"
                />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleConvertSvg}
            disabled={busy || !svgInput.trim()}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:bg-gray-400"
          >
            {busy ? progress || "Rendering…" : "Convert to image"}
          </button>

          {rasterPreviewUrl && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="text-sm font-medium text-gray-700">
                  Raster preview
                  {rasterMeta
                    ? ` · ${rasterMeta.width}×${rasterMeta.height}`
                    : ""}
                </h4>
                <button
                  type="button"
                  onClick={downloadRaster}
                  className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2 text-sm"
                >
                  <FaDownload /> Download{" "}
                  {rasterFormat === "jpeg" ? "JPEG" : "PNG"}
                </button>
              </div>
              <div className="border rounded-lg p-4 bg-gray-50 flex items-center justify-center">
                <img
                  src={rasterPreviewUrl}
                  alt="Rasterized SVG"
                  className="max-w-full max-h-80 object-contain"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {error}
        </div>
      )}
      {status && !error && (
        <div className="text-sm text-gray-600">{status}</div>
      )}
    </div>
  );
};

export default SvgPhotoTool;
