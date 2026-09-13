import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FaUpload, FaDownload, FaTrash, FaFilePdf } from "react-icons/fa";
import { downloadBlob } from "../../../utils/tools/download";
import { consumeSessionPayload } from "../../../utils/tools/session";

const PDF_WORKER_URL = `${process.env.PUBLIC_URL}/pdf.worker.min.js`;

const MODE_RANGES = "ranges";
const MODE_EACH = "each";
const MODE_CHUNKS = "chunks";

let pdfjsPromise;
const loadPdfJs = () => {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((pdfjsLib) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
      return pdfjsLib;
    });
  }
  return pdfjsPromise;
};

let pdfLibPromise;
const loadPdfLib = () => {
  if (!pdfLibPromise) {
    pdfLibPromise = import("pdf-lib");
  }
  return pdfLibPromise;
};

let jszipPromise;
const loadJSZip = () => {
  if (!jszipPromise) {
    jszipPromise = import("jszip").then((m) => m.default ?? m);
  }
  return jszipPromise;
};

/**
 * Parse 1-based page ranges like "1-3,5,8-10".
 * @param {string} input
 * @param {number} maxPages
 * @returns {{ pages?: number[], error?: string }}
 */
function parsePageRanges(input, maxPages) {
  const trimmed = String(input || "").trim();
  if (!trimmed) {
    return { error: "Enter at least one page or range (e.g. 1-3,5,8-10)." };
  }
  if (!Number.isFinite(maxPages) || maxPages < 1) {
    return { error: "No PDF loaded." };
  }

  const parts = trimmed.split(",").map((p) => p.trim()).filter(Boolean);
  if (!parts.length) {
    return { error: "Enter at least one page or range (e.g. 1-3,5,8-10)." };
  }

  const pageSet = new Set();
  for (const part of parts) {
    if (/^\d+$/.test(part)) {
      const n = Number(part);
      if (n < 1 || n > maxPages) {
        return {
          error: `Page ${n} is out of range. This PDF has ${maxPages} page${
            maxPages === 1 ? "" : "s"
          } (use 1–${maxPages}).`,
        };
      }
      pageSet.add(n);
      continue;
    }

    const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      let start = Number(rangeMatch[1]);
      let end = Number(rangeMatch[2]);
      if (start > end) {
        return {
          error: `Invalid range "${part}": start must be ≤ end (1-based).`,
        };
      }
      if (start < 1 || end > maxPages) {
        return {
          error: `Range ${part} is out of range. This PDF has ${maxPages} page${
            maxPages === 1 ? "" : "s"
          } (use 1–${maxPages}).`,
        };
      }
      for (let i = start; i <= end; i += 1) {
        pageSet.add(i);
      }
      continue;
    }

    return {
      error: `Invalid token "${part}". Use 1-based pages and ranges like 1-3,5,8-10.`,
    };
  }

  return { pages: [...pageSet].sort((a, b) => a - b) };
}

function baseName(fileName) {
  return String(fileName || "document")
    .replace(/\.pdf$/i, "")
    .trim() || "document";
}

function looksLikePdfPayload(payload) {
  if (!payload) return false;
  const mime = String(payload.mime || "").toLowerCase();
  const name = String(payload.fileName || "").toLowerCase();
  if (payload.type === "pdf") return true;
  if (payload.type === "file" && (mime.includes("pdf") || name.endsWith(".pdf"))) {
    return true;
  }
  if (payload.dataUrl && (mime.includes("pdf") || name.endsWith(".pdf"))) {
    return true;
  }
  return false;
}

async function dataUrlToFile(dataUrl, fileName, mime) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const type = mime || blob.type || "application/pdf";
  const name = fileName || "handoff.pdf";
  return new File([blob], name, { type, lastModified: Date.now() });
}

/**
 * Yield so the UI can paint progress updates.
 */
function yieldToUi() {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 0);
    }
  });
}

async function buildPdfFromPages(sourceDoc, zeroBasedIndices, onProgress) {
  const { PDFDocument } = await loadPdfLib();
  const outDoc = await PDFDocument.create();
  const total = zeroBasedIndices.length;
  for (let i = 0; i < total; i += 1) {
    const [copied] = await outDoc.copyPages(sourceDoc, [zeroBasedIndices[i]]);
    outDoc.addPage(copied);
    if (onProgress && (i % 5 === 0 || i === total - 1)) {
      onProgress(i + 1, total);
      await yieldToUi();
    }
  }
  return outDoc.save();
}

export default function PdfSplitTool() {
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [thumbnails, setThumbnails] = useState([]);
  const [mode, setMode] = useState(MODE_RANGES);
  const [rangeInput, setRangeInput] = useState("");
  const [chunkSize, setChunkSize] = useState(2);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [loadingMeta, setLoadingMeta] = useState(false);

  const bytesRef = useRef(null);
  const sessionLoadedRef = useRef(false);
  const thumbGenRef = useRef(0);

  const clearFile = useCallback(() => {
    thumbGenRef.current += 1;
    bytesRef.current = null;
    setFile(null);
    setPageCount(0);
    setThumbnails([]);
    setError(null);
    setProgress(null);
    setBusy(false);
    setLoadingMeta(false);
  }, []);

  const loadPdfFile = useCallback(async (nextFile) => {
    if (!nextFile) return;
    setLoadingMeta(true);
    setError(null);
    setProgress(null);
    setThumbnails([]);
    setPageCount(0);
    bytesRef.current = null;

    const gen = ++thumbGenRef.current;

    try {
      const bytes = await nextFile.arrayBuffer();
      if (gen !== thumbGenRef.current) return;

      const { PDFDocument } = await loadPdfLib();
      const doc = await PDFDocument.load(bytes);
      const count = doc.getPageCount();
      if (count < 1) {
        throw new Error("This PDF has no pages.");
      }

      // Keep an independent copy — loaders may detach the original buffer.
      bytesRef.current = bytes.slice(0);
      setFile(nextFile);
      setPageCount(count);
      setRangeInput(count > 1 ? `1-${count}` : "1");
      setChunkSize(Math.min(2, count));
      setLoadingMeta(false);

      // Optional thumbnail strip (best-effort; skip if superseded)
      try {
        const pdfjsLib = await loadPdfJs();
        if (gen !== thumbGenRef.current) return;
        const pdf = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
        if (gen !== thumbGenRef.current) return;

        const thumbs = [];
        const maxThumbs = Math.min(count, 40);
        for (let i = 1; i <= maxThumbs; i += 1) {
          if (gen !== thumbGenRef.current) return;
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.25 });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: context, viewport }).promise;
          thumbs.push({ pageNumber: i, preview: canvas.toDataURL("image/jpeg", 0.7) });
          if (i % 4 === 0) {
            setThumbnails([...thumbs]);
            await yieldToUi();
          }
        }
        if (gen === thumbGenRef.current) {
          setThumbnails(thumbs);
        }
      } catch (thumbErr) {
        console.warn("Thumbnail strip skipped:", thumbErr);
      }
    } catch (err) {
      console.error("Failed to load PDF:", err);
      bytesRef.current = null;
      setFile(null);
      setPageCount(0);
      setThumbnails([]);
      setError(
        err?.message
          ? `Could not read that PDF: ${err.message}`
          : "Could not read that PDF. It may be corrupted or password-protected."
      );
      setLoadingMeta(false);
    }
  }, []);

  const onDrop = useCallback(
    (accepted) => {
      const pdf = accepted?.[0];
      if (!pdf) {
        setError("Please drop a PDF file.");
        return;
      }
      loadPdfFile(pdf);
    },
    [loadPdfFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    multiple: false,
    disabled: busy || loadingMeta,
  });

  // Best-effort session handoff (file/pdf with dataUrl)
  useEffect(() => {
    if (sessionLoadedRef.current) return;
    sessionLoadedRef.current = true;

    const payload = consumeSessionPayload({ clear: false });
    if (!payload || !looksLikePdfPayload(payload) || !payload.dataUrl) {
      return;
    }
    consumeSessionPayload({ clear: true });

    let cancelled = false;
    (async () => {
      try {
        const handed = await dataUrlToFile(
          payload.dataUrl,
          payload.fileName || "handoff.pdf",
          payload.mime || "application/pdf"
        );
        if (!cancelled) await loadPdfFile(handed);
      } catch (err) {
        console.error("Session PDF load failed:", err);
        if (!cancelled) {
          setError("Could not load the handed-off PDF.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadPdfFile]);

  const runSplit = useCallback(async () => {
    if (!file || !bytesRef.current || pageCount < 1) {
      setError("Upload a PDF first.");
      return;
    }

    setError(null);
    setBusy(true);
    setProgress("Preparing…");

    try {
      const sourceBytes = bytesRef.current;
      const name = baseName(file.name);

      let rangePages = null;
      let chunkN = null;

      if (mode === MODE_RANGES) {
        const parsed = parsePageRanges(rangeInput, pageCount);
        if (parsed.error) {
          setError(parsed.error);
          return;
        }
        rangePages = parsed.pages;
      } else if (mode === MODE_CHUNKS) {
        const n = Number(chunkSize);
        if (!Number.isInteger(n) || n < 1) {
          setError("Chunk size must be a whole number ≥ 1.");
          return;
        }
        if (n > pageCount) {
          setError(
            `Chunk size (${n}) cannot exceed the page count (${pageCount}).`
          );
          return;
        }
        chunkN = n;
      }

      const { PDFDocument } = await loadPdfLib();
      const sourceDoc = await PDFDocument.load(sourceBytes);

      if (mode === MODE_RANGES) {
        const zeroBased = rangePages.map((p) => p - 1);
        setProgress(`Extracting ${rangePages.length} page(s)…`);
        const pdfBytes = await buildPdfFromPages(
          sourceDoc,
          zeroBased,
          (done, total) => setProgress(`Copying pages… ${done}/${total}`)
        );
        setProgress("Downloading…");
        downloadBlob(
          new Blob([pdfBytes], { type: "application/pdf" }),
          `${name}-extract.pdf`
        );
      } else if (mode === MODE_EACH) {
        const JSZip = await loadJSZip();
        const zip = new JSZip();
        setProgress(`Splitting ${pageCount} page(s)…`);
        for (let i = 0; i < pageCount; i += 1) {
          const pdfBytes = await buildPdfFromPages(sourceDoc, [i]);
          zip.file(`${name}-page-${i + 1}.pdf`, pdfBytes);
          setProgress(`Writing page ${i + 1} of ${pageCount}…`);
          await yieldToUi();
        }
        setProgress("Building ZIP…");
        const blob = await zip.generateAsync({ type: "blob" });
        downloadBlob(blob, `${name}-pages.zip`);
      } else if (mode === MODE_CHUNKS) {
        const n = chunkN;
        const JSZip = await loadJSZip();
        const zip = new JSZip();
        const partCount = Math.ceil(pageCount / n);
        setProgress(`Splitting into ${partCount} chunk(s)…`);

        for (let part = 0; part < partCount; part += 1) {
          const start = part * n;
          const end = Math.min(start + n, pageCount);
          const indices = [];
          for (let i = start; i < end; i += 1) indices.push(i);
          const pdfBytes = await buildPdfFromPages(sourceDoc, indices);
          const from = start + 1;
          const to = end;
          zip.file(`${name}-pages-${from}-${to}.pdf`, pdfBytes);
          setProgress(`Writing chunk ${part + 1} of ${partCount}…`);
          await yieldToUi();
        }

        setProgress("Building ZIP…");
        const blob = await zip.generateAsync({ type: "blob" });
        downloadBlob(blob, `${name}-chunks.zip`);
      }
    } catch (err) {
      console.error("Split/extract failed:", err);
      setError(
        err?.message
          ? `Split failed: ${err.message}`
          : "Split failed. The PDF may be corrupted or use unsupported features."
      );
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }, [file, pageCount, mode, rangeInput, chunkSize]);

  const canRun =
    !!file && pageCount > 0 && !busy && !loadingMeta;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-sm text-red-700 whitespace-pre-line">{error}</p>
          <button
            type="button"
            className="mt-2 text-xs text-red-500 hover:text-red-700 underline"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {!file ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer h-[300px] flex flex-col justify-center ${
            isDragActive
              ? "border-primary-500 bg-primary-50"
              : "border-gray-300 hover:border-blue-500"
          } ${loadingMeta ? "opacity-60 pointer-events-none" : ""}`}
        >
          <input {...getInputProps()} />
          <FaUpload className="mx-auto text-6xl mb-6 text-gray-400" />
          <p className="text-lg">
            {loadingMeta
              ? "Reading PDF…"
              : isDragActive
                ? "Drop the PDF here"
                : "Drag & drop a PDF file here, or click to select one"}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Runs entirely in your browser — files never leave this device.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border rounded p-4 bg-gray-50">
            <div className="flex items-center gap-3 min-w-0">
              <FaFilePdf className="text-red-500 text-2xl flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 break-words">
                  {file.name}
                </p>
                <p className="text-sm text-gray-600">
                  {pageCount} page{pageCount === 1 ? "" : "s"}
                  {loadingMeta ? " · loading…" : ""}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearFile}
              disabled={busy}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
            >
              <FaTrash /> Clear
            </button>
          </div>

          {thumbnails.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Pages
                {thumbnails.length < pageCount
                  ? ` (showing first ${thumbnails.length})`
                  : ""}
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {thumbnails.map((thumb) => (
                  <div
                    key={thumb.pageNumber}
                    className="flex-shrink-0 w-16 text-center"
                  >
                    <div className="w-16 h-20 bg-white border rounded overflow-hidden">
                      <img
                        src={thumb.preview}
                        alt={`Page ${thumb.pageNumber}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {thumb.pageNumber}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-gray-800 mb-1">
              Split mode
            </legend>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="pdf-split-mode"
                className="mt-1"
                checked={mode === MODE_RANGES}
                onChange={() => setMode(MODE_RANGES)}
                disabled={busy}
              />
              <span>
                <span className="font-medium text-gray-800">
                  Extract page ranges
                </span>
                <span className="block text-sm text-gray-500">
                  Build one new PDF from selected pages (1-based).
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="pdf-split-mode"
                className="mt-1"
                checked={mode === MODE_EACH}
                onChange={() => setMode(MODE_EACH)}
                disabled={busy}
              />
              <span>
                <span className="font-medium text-gray-800">
                  Each page as separate PDF
                </span>
                <span className="block text-sm text-gray-500">
                  Download a ZIP with one PDF per page.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="pdf-split-mode"
                className="mt-1"
                checked={mode === MODE_CHUNKS}
                onChange={() => setMode(MODE_CHUNKS)}
                disabled={busy}
              />
              <span>
                <span className="font-medium text-gray-800">
                  Split into chunks of N pages
                </span>
                <span className="block text-sm text-gray-500">
                  Download a ZIP of multi-page parts.
                </span>
              </span>
            </label>
          </fieldset>

          {mode === MODE_RANGES && (
            <div>
              <label
                htmlFor="pdf-split-ranges"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Pages / ranges
              </label>
              <input
                id="pdf-split-ranges"
                type="text"
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
                disabled={busy}
                placeholder="e.g. 1-3,5,8-10"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                1-based page numbers. Example:{" "}
                <code className="bg-gray-100 px-1 rounded">1-3,5,8-10</code>
              </p>
            </div>
          )}

          {mode === MODE_CHUNKS && (
            <div>
              <label
                htmlFor="pdf-split-chunk-size"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Pages per chunk
              </label>
              <input
                id="pdf-split-chunk-size"
                type="number"
                min={1}
                max={pageCount}
                value={chunkSize}
                onChange={(e) => setChunkSize(e.target.value)}
                disabled={busy}
                className="w-32 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                {Number(chunkSize) > 0 && Number(chunkSize) <= pageCount
                  ? `Creates ${Math.ceil(pageCount / Number(chunkSize))} file(s).`
                  : `Enter a size from 1 to ${pageCount}.`}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={runSplit}
              disabled={!canRun}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:bg-gray-400"
            >
              <FaDownload />
              {busy
                ? progress || "Working…"
                : mode === MODE_RANGES
                  ? "Extract & download PDF"
                  : mode === MODE_EACH
                    ? "Split pages (ZIP)"
                    : "Split chunks (ZIP)"}
            </button>
            {busy && progress && (
              <span className="text-sm text-gray-600">{progress}</span>
            )}
          </div>

          <div
            {...getRootProps()}
            className="border border-dashed border-gray-300 rounded p-4 text-center text-sm text-gray-500 cursor-pointer hover:border-blue-400"
          >
            <input {...getInputProps()} />
            Replace PDF — drop another file or click to choose
          </div>
        </>
      )}
    </div>
  );
}
