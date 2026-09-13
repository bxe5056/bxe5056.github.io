import React, { useCallback, useId, useRef, useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaClipboard,
  FaFileUpload,
  FaTimes,
  FaExternalLinkAlt,
} from "react-icons/fa";
import {
  subscribeSession,
  getSessionSnapshot,
  setSessionPayload,
  clearSessionPayload,
} from "../../utils/tools/session";
import { openToolWithPayload } from "../../utils/tools/handoff";

const TEXT_MIME_PREFIXES = ["text/", "application/json", "application/xml"];
const TEXT_EXTENSIONS = [
  ".txt",
  ".md",
  ".csv",
  ".tsv",
  ".json",
  ".yaml",
  ".yml",
  ".toml",
  ".xml",
  ".html",
  ".htm",
  ".svg",
  ".css",
  ".js",
  ".ts",
  ".jsx",
  ".tsx",
];

function looksLikeText(file) {
  const mime = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();
  if (TEXT_MIME_PREFIXES.some((prefix) => mime.startsWith(prefix) || mime === prefix)) {
    return true;
  }
  if (mime === "image/svg+xml") return true;
  return TEXT_EXTENSIONS.some((ext) => name.endsWith(ext));
}

function inferPayloadType(file, text) {
  const mime = (file?.type || "").toLowerCase();
  const name = (file?.name || "").toLowerCase();
  if (mime.includes("svg") || name.endsWith(".svg") || (text && /^\s*<svg[\s>]/i.test(text))) {
    return "svg";
  }
  if (mime.startsWith("image/")) return "image";
  if (mime.includes("json") || name.endsWith(".json") || (text && looksLikeJson(text))) {
    return "json";
  }
  if (file && !looksLikeText(file) && !text) return "file";
  return "text";
}

function looksLikeJson(text) {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) return false;
  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function previewSnippet(payload) {
  if (!payload) return "";
  if (payload.fileName) return payload.fileName;
  const text = payload.text || "";
  if (text) {
    const oneLine = text.replace(/\s+/g, " ").trim();
    return oneLine.length > 64 ? `${oneLine.slice(0, 64)}…` : oneLine;
  }
  if (Array.isArray(payload.colors) && payload.colors.length) {
    return payload.colors.slice(0, 4).join(", ");
  }
  if (payload.mime) return payload.mime;
  return "";
}

function handoffsForPayload(payload) {
  if (!payload?.type) return [];
  switch (payload.type) {
    case "json":
      return [
        { category: "data", toolId: "editor", label: "Editor" },
        { category: "text", toolId: "diff", label: "Diff" },
        { category: "text", toolId: "base64", label: "Base64" },
      ];
    case "svg":
      return [
        { category: "svg", toolId: "optimize", label: "Optimize" },
        { category: "svg", toolId: "colors", label: "Color Swap" },
        { category: "color", toolId: "extract", label: "Extract" },
      ];
    case "image":
      return [
        { category: "image", toolId: "resize", label: "Resize" },
        { category: "color", toolId: "extract", label: "Extract" },
        { category: "svg", toolId: "image-to-svg", label: "Photo↔SVG" },
      ];
    case "colors":
      return [
        { category: "color", toolId: "palette", label: "Palette" },
        { category: "color", toolId: "contrast", label: "Contrast" },
        { category: "svg", toolId: "colors", label: "Color Swap" },
      ];
    case "file":
      return [
        { category: "text", toolId: "base64", label: "Base64" },
        { category: "data", toolId: "editor", label: "Editor" },
      ];
    case "text":
    default:
      return [
        { category: "text", toolId: "diff", label: "Diff" },
        { category: "text", toolId: "base64", label: "Base64" },
        { category: "dev", toolId: "regex", label: "Regex" },
        { category: "data", toolId: "editor", label: "Editor" },
      ];
  }
}

async function fileToPayload(file) {
  const mime = file.type || undefined;
  const fileName = file.name || undefined;

  if (looksLikeText(file)) {
    const text = await readFileAsText(file);
    const type = inferPayloadType(file, text);
    return { type, text, fileName, mime };
  }

  const dataUrl = await readFileAsDataUrl(file);
  const type = inferPayloadType(file, null);
  return { type, dataUrl, fileName, mime };
}

const SharedPasteBar = () => {
  const navigate = useNavigate();
  const fileInputId = useId();
  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const payload = useSyncExternalStore(
    subscribeSession,
    getSessionSnapshot,
    () => null
  );

  const ingestText = useCallback((raw) => {
    const text = String(raw ?? "");
    if (!text.trim()) {
      setError("Nothing to paste");
      return;
    }
    setError("");
    setSessionPayload({
      type: inferPayloadType(null, text),
      text,
    });
  }, []);

  const ingestFile = useCallback(async (file) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const next = await fileToPayload(file);
      setSessionPayload(next);
    } catch {
      setError("Could not read that file");
    } finally {
      setBusy(false);
    }
  }, []);

  const handlePasteClick = useCallback(async () => {
    setError("");
    try {
      if (!navigator.clipboard?.readText) {
        setError("Clipboard paste isn’t available here");
        return;
      }
      const text = await navigator.clipboard.readText();
      ingestText(text);
    } catch {
      setError("Clipboard access blocked — drop a file instead");
    }
  }, [ingestText]);

  const handleClear = useCallback(() => {
    setError("");
    clearSessionPayload();
  }, []);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
  }, []);

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      setDragging(false);
      const file = event.dataTransfer?.files?.[0];
      if (file) {
        ingestFile(file);
        return;
      }
      const text = event.dataTransfer?.getData("text/plain");
      if (text) ingestText(text);
    },
    [ingestFile, ingestText]
  );

  const handleFileChange = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      if (file) ingestFile(file);
      event.target.value = "";
    },
    [ingestFile]
  );

  const handoffs = handoffsForPayload(payload);
  const snippet = previewSnippet(payload);

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`mb-4 rounded-lg border px-3 py-2.5 transition-colors ${
        dragging
          ? "border-blue-400 bg-blue-50/80"
          : "border-gray-200 bg-gray-50/80"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
          <FaClipboard className="opacity-70" aria-hidden />
          Shared
        </span>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handlePasteClick}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60"
          >
            Paste
          </button>
          <label
            htmlFor={fileInputId}
            className={`inline-flex cursor-pointer items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 ${
              busy ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <FaFileUpload className="opacity-70" aria-hidden />
            File
          </label>
          <input
            ref={fileInputRef}
            id={fileInputId}
            type="file"
            className="sr-only"
            onChange={handleFileChange}
          />
          {payload && (
            <button
              type="button"
              onClick={handleClear}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-md border border-transparent px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-60"
              title="Clear shared session"
            >
              <FaTimes aria-hidden />
              Clear
            </button>
          )}
        </div>

        <p className="w-full text-[11px] text-slate-400 sm:ml-auto sm:w-auto sm:text-right">
          {dragging ? "Drop to load into shared session" : "Drop a file anywhere on this bar"}
        </p>
      </div>

      {payload ? (
        <div className="mt-2 flex flex-col gap-2 border-t border-gray-200/80 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 text-xs text-slate-600">
            <span className="mr-2 inline-flex rounded bg-slate-200/70 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-slate-700">
              {payload.type || "payload"}
            </span>
            {payload.fileName && (
              <span className="mr-2 font-medium text-slate-700">{payload.fileName}</span>
            )}
            {snippet && snippet !== payload.fileName && (
              <span className="break-all text-slate-500">{snippet}</span>
            )}
          </div>

          {handoffs.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] uppercase tracking-wide text-slate-400">
                Open in
              </span>
              {handoffs.map((target) => (
                <button
                  key={`${target.category}-${target.toolId}`}
                  type="button"
                  onClick={() =>
                    openToolWithPayload({
                      category: target.category,
                      toolId: target.toolId,
                      payload,
                      navigate,
                    })
                  }
                  className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-[11px] font-medium text-blue-600 hover:border-blue-200 hover:bg-blue-50"
                >
                  {target.label}
                  <FaExternalLinkAlt className="text-[9px] opacity-60" aria-hidden />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="mt-1.5 text-[11px] text-slate-400">
          Paste or drop once, then hand off across tools in this tab.
        </p>
      )}

      {error && (
        <p className="mt-1.5 text-[11px] text-red-600" role="status">
          {error}
        </p>
      )}
    </div>
  );
};

export default SharedPasteBar;
