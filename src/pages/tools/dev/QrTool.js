import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCamera,
  FaCopy,
  FaDownload,
  FaStop,
  FaUpload,
} from "react-icons/fa";
import { copyText } from "../../../utils/tools/clipboard";
import { downloadDataUrl } from "../../../utils/tools/download";
import { openToolWithPayload } from "../../../utils/tools/handoff";
import { consumeSessionPayload } from "../../../utils/tools/session";

const MODE_GENERATE = "generate";
const MODE_SCAN = "scan";

const ERROR_LEVELS = [
  { value: "L", label: "L — ~7% recovery" },
  { value: "M", label: "M — ~15% recovery" },
  { value: "Q", label: "Q — ~25% recovery" },
  { value: "H", label: "H — ~30% recovery" },
];

const QR_SIZE = 280;

/**
 * @param {unknown} payload
 * @returns {string | null}
 */
function extractSessionText(payload) {
  if (!payload || typeof payload !== "object") return null;
  if (typeof payload.text === "string" && payload.text.trim()) {
    return payload.text;
  }
  return null;
}

/**
 * Draw an ImageBitmap/HTMLImageElement onto a canvas and return ImageData.
 * @param {CanvasImageSource} source
 * @param {number} width
 * @param {number} height
 * @returns {ImageData}
 */
function getImageData(source, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
}

/**
 * @param {File} file
 * @param {(data: ImageData) => unknown} decode
 * @returns {Promise<string | null>}
 */
async function decodeQrFromFile(file, decode) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not load image"));
      el.src = url;
    });
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    if (!width || !height) return null;
    const imageData = getImageData(img, width, height);
    const result = decode(imageData.data, imageData.width, imageData.height);
    return result?.data ?? null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

const QrTool = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const scanCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const jsQrRef = useRef(null);
  const fileInputRef = useRef(null);

  const [mode, setMode] = useState(MODE_GENERATE);
  const [text, setText] = useState("");
  const [errorLevel, setErrorLevel] = useState("M");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [genError, setGenError] = useState(null);
  const [genBusy, setGenBusy] = useState(false);

  const [scannedText, setScannedText] = useState("");
  const [scanError, setScanError] = useState(null);
  const [scanBusy, setScanBusy] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraHint, setCameraHint] = useState(null);
  const [status, setStatus] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    const payload = consumeSessionPayload();
    const sessionText = extractSessionText(payload);
    if (sessionText) {
      setText(sessionText);
      setMode(MODE_GENERATE);
      setStatus("Loaded text into generator from handoff");
    }
  }, []);

  // Generate QR whenever text / error level changes
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const value = text;
      if (!value.trim()) {
        setPreviewUrl(null);
        setGenError(null);
        setGenBusy(false);
        return;
      }

      setGenBusy(true);
      setGenError(null);

      try {
        const QRCode = (await import("qrcode")).default;
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        await QRCode.toCanvas(canvas, value, {
          errorCorrectionLevel: errorLevel,
          width: QR_SIZE,
          margin: 2,
          color: { dark: "#000000", light: "#ffffff" },
        });

        if (cancelled) return;
        setPreviewUrl(canvas.toDataURL("image/png"));
        setGenError(null);
      } catch (err) {
        if (cancelled) return;
        setPreviewUrl(null);
        setGenError(err?.message || "Could not generate QR code");
      } finally {
        if (!cancelled) setGenBusy(false);
      }
    };

    const timer = setTimeout(run, 120);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text, errorLevel]);

  const stopCamera = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  useEffect(() => {
    if (mode !== MODE_SCAN) stopCamera();
  }, [mode, stopCamera]);

  const loadJsQr = useCallback(async () => {
    if (jsQrRef.current) return jsQrRef.current;
    const mod = await import("jsqr");
    jsQrRef.current = mod.default || mod;
    return jsQrRef.current;
  }, []);

  const handleCopyText = async (key, value) => {
    if (!value) return;
    const ok = await copyText(value);
    setStatus(ok ? "Copied to clipboard" : "Could not copy to clipboard");
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    }
  };

  const handleDownloadPng = () => {
    if (!previewUrl) return;
    downloadDataUrl(previewUrl, "qrcode.png");
    setStatus("Downloaded qrcode.png");
  };

  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !previewUrl) return;

    try {
      if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
        setStatus("Image copy is not supported in this browser");
        return;
      }

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      if (!blob) {
        setStatus("Could not create PNG for clipboard");
        return;
      }

      await navigator.clipboard.write([
        new window.ClipboardItem({ "image/png": blob }),
      ]);
      setStatus("QR image copied to clipboard");
      setCopiedKey("image");
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      setStatus("Could not copy image (permission or browser limit)");
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setScanBusy(true);
    setScanError(null);
    setStatus(null);

    try {
      const jsQR = await loadJsQr();
      const decoded = await decodeQrFromFile(
        file,
        (data, width, height) => jsQR(data, width, height)
      );
      if (decoded) {
        setScannedText(decoded);
        setStatus("QR code decoded from image");
      } else {
        setScannedText("");
        setScanError("No QR code found in that image");
      }
    } catch (err) {
      setScannedText("");
      setScanError(err?.message || "Could not decode image");
    } finally {
      setScanBusy(false);
    }
  };

  const scanVideoFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = scanCanvasRef.current;
    const jsQR = jsQrRef.current;
    if (!video || !canvas || !jsQR || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) {
      rafRef.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const result = jsQR(imageData.data, imageData.width, imageData.height);

    if (result?.data) {
      setScannedText(result.data);
      setScanError(null);
      setStatus("QR code detected from camera");
      stopCamera();
      return;
    }

    rafRef.current = requestAnimationFrame(scanVideoFrame);
  }, [stopCamera]);

  const startCamera = async () => {
    setScanError(null);
    setCameraHint(null);
    setStatus(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraHint("Camera access is not available in this browser");
      return;
    }

    try {
      await loadJsQr();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
      setCameraActive(true);
      setStatus("Point the camera at a QR code");
      rafRef.current = requestAnimationFrame(scanVideoFrame);
    } catch (err) {
      stopCamera();
      const name = err?.name || "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setCameraHint(
          "Camera permission denied. You can still upload an image instead."
        );
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setCameraHint("No camera found. Upload an image to scan instead.");
      } else {
        setCameraHint(err?.message || "Could not start camera");
      }
    }
  };

  const handoffToText = (toolId) => {
    if (!scannedText) return;
    openToolWithPayload({
      category: "text",
      toolId,
      payload: { type: "text", text: scannedText },
      navigate,
    });
  };

  const useScannedInGenerator = () => {
    if (!scannedText) return;
    setText(scannedText);
    setMode(MODE_GENERATE);
    setStatus("Moved scanned text into generator");
  };

  return (
    <div className="space-y-6" data-tool="qr">
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        <button
          type="button"
          onClick={() => setMode(MODE_GENERATE)}
          className={`px-4 py-2 rounded text-sm font-medium ${
            mode === MODE_GENERATE
              ? "bg-primary-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Generate
        </button>
        <button
          type="button"
          onClick={() => setMode(MODE_SCAN)}
          className={`px-4 py-2 rounded text-sm font-medium ${
            mode === MODE_SCAN
              ? "bg-primary-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Scan
        </button>
      </div>

      {status && (
        <p className="text-sm text-primary-700 bg-primary-50 border border-primary-100 rounded px-3 py-2">
          {status}
        </p>
      )}

      {mode === MODE_GENERATE && (
        <div className="space-y-6">
          <p className="text-sm text-gray-500">
            Encode text or a URL as a QR code. Everything stays in your browser.
          </p>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Text / URL
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="https://example.com or any text…"
              className="w-full px-4 py-2 border rounded font-mono text-sm"
              spellCheck={false}
            />
          </div>

          <div className="space-y-2 max-w-md">
            <label className="block text-sm font-medium text-gray-700">
              Error correction
            </label>
            <select
              value={errorLevel}
              onChange={(e) => setErrorLevel(e.target.value)}
              className="w-full px-4 py-2 border rounded bg-white"
            >
              {ERROR_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          {genError && (
            <p className="text-sm text-red-600">{genError}</p>
          )}

          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="shrink-0 p-4 bg-gray-50 rounded border border-gray-200 inline-flex items-center justify-center min-h-[200px] min-w-[200px]">
              <canvas
                ref={canvasRef}
                width={QR_SIZE}
                height={QR_SIZE}
                className={previewUrl ? "block max-w-full" : "hidden"}
                aria-label="QR code preview"
              />
              {!previewUrl && (
                <p className="text-sm text-gray-400 text-center px-4">
                  {genBusy
                    ? "Generating…"
                    : "Enter text above to preview a QR code"}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownloadPng}
                disabled={!previewUrl}
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 text-sm"
              >
                <FaDownload /> Download PNG
              </button>
              <button
                type="button"
                onClick={handleCopyImage}
                disabled={!previewUrl}
                className="px-4 py-2 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 text-sm"
              >
                <FaCopy />
                {copiedKey === "image" ? "Copied" : "Copy image"}
              </button>
              <button
                type="button"
                onClick={() => handleCopyText("gen-text", text)}
                disabled={!text.trim()}
                className="px-4 py-2 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 text-sm"
              >
                <FaCopy />
                {copiedKey === "gen-text" ? "Copied" : "Copy text"}
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === MODE_SCAN && (
        <div className="space-y-6">
          <p className="text-sm text-gray-500">
            Decode a QR code from an image file or your camera. Processing stays
            local — nothing is uploaded.
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={scanBusy}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 inline-flex items-center gap-2 text-sm"
            >
              <FaUpload />
              {scanBusy ? "Decoding…" : "Upload image"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {!cameraActive ? (
              <button
                type="button"
                onClick={startCamera}
                className="px-4 py-2 border border-gray-300 rounded bg-white hover:bg-gray-50 inline-flex items-center gap-2 text-sm"
              >
                <FaCamera /> Use camera
              </button>
            ) : (
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2 border border-red-200 text-red-700 rounded bg-white hover:bg-red-50 inline-flex items-center gap-2 text-sm"
              >
                <FaStop /> Stop camera
              </button>
            )}
          </div>

          {cameraHint && (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded px-3 py-2">
              {cameraHint}
            </p>
          )}

          {scanError && <p className="text-sm text-red-600">{scanError}</p>}

          <div
            className={`relative overflow-hidden rounded border border-gray-200 bg-black ${
              cameraActive ? "block" : "hidden"
            }`}
          >
            <video
              ref={videoRef}
              className="w-full max-h-80 object-contain"
              playsInline
              muted
            />
            <canvas ref={scanCanvasRef} className="hidden" />
          </div>

          {scannedText && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded">
                <div className="min-w-0">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Decoded text
                  </div>
                  <code className="font-mono text-sm break-all text-gray-900 whitespace-pre-wrap">
                    {scannedText}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyText("scan", scannedText)}
                  className="shrink-0 text-gray-500 hover:text-gray-700 p-2"
                  title="Copy decoded text"
                  aria-label="Copy decoded text"
                >
                  {copiedKey === "scan" ? (
                    <span className="text-xs text-primary-600 font-medium">
                      Copied
                    </span>
                  ) : (
                    <FaCopy />
                  )}
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={useScannedInGenerator}
                  className="px-3 py-2 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50"
                >
                  Use in Generate
                </button>
                <button
                  type="button"
                  onClick={() => handoffToText("url")}
                  className="px-3 py-2 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50"
                >
                  Open in URL tools
                </button>
                <button
                  type="button"
                  onClick={() => handoffToText("base64")}
                  className="px-3 py-2 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50"
                >
                  Open in Base64
                </button>
                <button
                  type="button"
                  onClick={() => handoffToText("diff")}
                  className="px-3 py-2 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50"
                >
                  Open in Diff
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QrTool;
