import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  FaUpload,
  FaDownload,
  FaTrash,
  FaFileArchive,
  FaCopy,
  FaImage,
} from "react-icons/fa";
import { copyText } from "../../../utils/tools/clipboard";
import {
  downloadBlob,
  downloadDataUrl,
  downloadText,
} from "../../../utils/tools/download";
import { consumeSessionPayload } from "../../../utils/tools/session";

const FAVICON_SIZES = [16, 32, 48, 180, 192, 512];

let jszipPromise;
const loadJSZip = () => {
  if (!jszipPromise) {
    jszipPromise = import("jszip").then((m) => m.default ?? m);
  }
  return jszipPromise;
};

function slugifyId(name, index) {
  const base = String(name || `icon-${index}`)
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || `icon-${index + 1}`;
}

function uniqueId(desired, used) {
  let id = desired;
  let n = 2;
  while (used.has(id)) {
    id = `${desired}-${n}`;
    n += 1;
  }
  used.add(id);
  return id;
}

function parseSvgMeta(svgText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, "image/svg+xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    return { error: "Invalid SVG markup" };
  }
  const root = doc.documentElement;
  if (!root || root.tagName.toLowerCase() !== "svg") {
    return { error: "Root element is not <svg>" };
  }

  let viewBox = root.getAttribute("viewBox");
  if (!viewBox) {
    const w = parseFloat(root.getAttribute("width"));
    const h = parseFloat(root.getAttribute("height"));
    if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
      viewBox = `0 0 ${w} ${h}`;
    } else {
      viewBox = "0 0 24 24";
    }
  }

  const clone = root.cloneNode(true);
  // Strip outer svg attributes that don't belong on <symbol>
  ["xmlns", "xmlns:xlink", "version", "width", "height", "x", "y"].forEach(
    (attr) => clone.removeAttribute(attr)
  );
  const inner = Array.from(clone.childNodes)
    .map((node) => new XMLSerializer().serializeToString(node))
    .join("")
    .trim();

  return { viewBox, inner };
}

function buildSpriteMarkup(items) {
  const symbols = items
    .map(
      (item) =>
        `  <symbol id="${item.id}" viewBox="${item.viewBox}">\n${item.inner
          .split("\n")
          .map((line) => `    ${line}`)
          .join("\n")}\n  </symbol>`
    )
    .join("\n");

  const uses = items
    .map((item, i) => {
      const x = (i % 4) * 48;
      const y = Math.floor(i / 4) * 48;
      return `  <use href="#${item.id}" x="${x}" y="${y}" width="40" height="40" />`;
    })
    .join("\n");

  const rows = Math.max(1, Math.ceil(items.length / 4));
  const width = Math.min(4, items.length) * 48;
  const height = rows * 48;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
${symbols}
  </defs>
${uses}
</svg>`;
}

function buildSpriteDefsOnly(items) {
  const symbols = items
    .map(
      (item) =>
        `  <symbol id="${item.id}" viewBox="${item.viewBox}">\n${item.inner
          .split("\n")
          .map((line) => `    ${line}`)
          .join("\n")}\n  </symbol>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
  <defs>
${symbols}
  </defs>
</svg>`;
}

function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
}

function canvasToPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas export failed"));
      },
      "image/png"
    );
  });
}

async function renderFaviconPng(img, size) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available");

  // Contain fit centered on transparent canvas
  const scale = Math.min(size / img.naturalWidth, size / img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  const x = (size - w) / 2;
  const y = (size - h) / 2;
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(img, x, y, w, h);

  const blob = await canvasToPngBlob(canvas);
  const dataUrl = canvas.toDataURL("image/png");
  return { size, blob, dataUrl };
}

/**
 * SVG sprite (symbol/defs) builder + favicon pack from one raster image.
 * Self-contained so parent tab keep-alive does not wipe sibling tools.
 */
const SpriteTool = () => {
  const [mode, setMode] = useState("sprite"); // sprite | favicon
  /** @type {{ id: string, name: string, viewBox: string, inner: string, text: string }[]} */
  const [items, setItems] = useState([]);
  const [spriteMarkup, setSpriteMarkup] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);

  // Favicon state
  const [faviconSourceUrl, setFaviconSourceUrl] = useState("");
  const [faviconFileName, setFaviconFileName] = useState("favicon.png");
  /** @type {{ size: number, blob: Blob, dataUrl: string }[]} */
  const [faviconPack, setFaviconPack] = useState([]);
  const [faviconBusy, setFaviconBusy] = useState(false);
  const [zipBusy, setZipBusy] = useState(false);

  const addSvgText = useCallback((text, name) => {
    const meta = parseSvgMeta(text);
    if (meta.error) {
      setError(meta.error);
      return false;
    }
    setError(null);
    setItems((prev) => {
      const used = new Set(prev.map((p) => p.id));
      const id = uniqueId(slugifyId(name, prev.length), used);
      return [
        ...prev,
        {
          id,
          name: name || `${id}.svg`,
          viewBox: meta.viewBox,
          inner: meta.inner,
          text,
        },
      ];
    });
    return true;
  }, []);

  const buildFaviconFromDataUrl = useCallback(async (dataUrl, name) => {
    setFaviconBusy(true);
    setError(null);
    setStatus(null);
    try {
      const img = await loadImageFromDataUrl(dataUrl);
      const pack = [];
      for (const size of FAVICON_SIZES) {
        pack.push(await renderFaviconPng(img, size));
      }
      setFaviconSourceUrl((prev) => {
        if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
        return dataUrl;
      });
      setFaviconFileName(name || "favicon.png");
      setFaviconPack(pack);
      setMode("favicon");
      setStatus(`Generated ${pack.length} favicon sizes`);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Favicon generation failed");
      setFaviconPack([]);
    } finally {
      setFaviconBusy(false);
    }
  }, []);

  // Session handoff (svg / image)
  useEffect(() => {
    const payload = consumeSessionPayload();
    if (!payload || typeof payload !== "object") return;

    if (payload.type === "svg" && payload.text) {
      setMode("sprite");
      if (addSvgText(String(payload.text), payload.fileName || "handoff.svg")) {
        setStatus("Loaded SVG from session handoff");
      }
      return;
    }

    if (payload.type === "image" && payload.dataUrl) {
      buildFaviconFromDataUrl(
        payload.dataUrl,
        payload.fileName || "handoff.png"
      );
    }
  }, [addSvgText, buildFaviconFromDataUrl]);

  // Rebuild sprite markup when items change
  useEffect(() => {
    if (items.length === 0) {
      setSpriteMarkup("");
      return;
    }
    setSpriteMarkup(buildSpriteMarkup(items));
  }, [items]);

  // Preview blob URL
  useEffect(() => {
    if (!spriteMarkup) {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return "";
      });
      return undefined;
    }
    const blob = new Blob([spriteMarkup], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    return () => URL.revokeObjectURL(url);
  }, [spriteMarkup]);

  useEffect(() => {
    return () => {
      if (faviconSourceUrl && faviconSourceUrl.startsWith("blob:")) {
        URL.revokeObjectURL(faviconSourceUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- revoke only on unmount
  }, []);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (!acceptedFiles?.length) return;
      setError(null);
      setStatus(null);

      const svgFiles = acceptedFiles.filter(
        (f) =>
          f.type === "image/svg+xml" ||
          /\.svg$/i.test(f.name) ||
          f.type === "text/xml" ||
          f.type === "application/xml"
      );
      const rasterFiles = acceptedFiles.filter(
        (f) =>
          /^image\/(png|jpeg|jpg|webp)$/i.test(f.type) ||
          /\.(png|jpe?g|webp)$/i.test(f.name)
      );

      if (svgFiles.length > 0) {
        setMode("sprite");
        let added = 0;
        for (const file of svgFiles) {
          const text = await file.text();
          if (addSvgText(text, file.name)) added += 1;
        }
        if (added > 0) {
          setStatus(
            `Added ${added} SVG${added === 1 ? "" : "s"} to sprite`
          );
        }
      }

      if (rasterFiles.length > 0) {
        const file = rasterFiles[0];
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = String(reader.result || "");
          if (dataUrl) buildFaviconFromDataUrl(dataUrl, file.name);
        };
        reader.onerror = () => setError("Failed to read image");
        reader.readAsDataURL(file);
      }

      if (svgFiles.length === 0 && rasterFiles.length === 0) {
        setError("Drop SVG files (sprite) or one PNG/JPEG (favicon pack)");
      }
    },
    [addSvgText, buildFaviconFromDataUrl]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/svg+xml": [".svg"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
    },
    multiple: true,
  });

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateItemId = useCallback((oldId, nextId) => {
    const cleaned = slugifyId(nextId, 0);
    if (!cleaned) return;
    setItems((prev) => {
      if (prev.some((p) => p.id === cleaned && p.id !== oldId)) {
        setError(`Symbol id "${cleaned}" is already used`);
        return prev;
      }
      setError(null);
      return prev.map((item) =>
        item.id === oldId ? { ...item, id: cleaned } : item
      );
    });
  }, []);

  const handleClearSprite = useCallback(() => {
    setItems([]);
    setSpriteMarkup("");
    setError(null);
    setStatus(null);
  }, []);

  const handleClearFavicon = useCallback(() => {
    setFaviconSourceUrl((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return "";
    });
    setFaviconPack([]);
    setFaviconFileName("favicon.png");
    setError(null);
    setStatus(null);
  }, []);

  const defsOnly = useMemo(
    () => (items.length ? buildSpriteDefsOnly(items) : ""),
    [items]
  );

  const handleDownloadSprite = useCallback(() => {
    if (!spriteMarkup) return;
    downloadText(spriteMarkup, "sprite.svg", "image/svg+xml");
    setStatus("Downloaded sprite.svg");
  }, [spriteMarkup]);

  const handleDownloadDefs = useCallback(() => {
    if (!defsOnly) return;
    downloadText(defsOnly, "sprite-defs.svg", "image/svg+xml");
    setStatus("Downloaded defs-only sprite");
  }, [defsOnly]);

  const handleCopySprite = useCallback(async () => {
    if (!spriteMarkup) return;
    const ok = await copyText(spriteMarkup);
    setStatus(ok ? "Copied sprite SVG" : "Could not copy");
  }, [spriteMarkup]);

  const handleDownloadSize = useCallback((entry) => {
    downloadDataUrl(entry.dataUrl, `favicon-${entry.size}x${entry.size}.png`);
  }, []);

  const handleDownloadZip = useCallback(async () => {
    if (faviconPack.length === 0) return;
    setZipBusy(true);
    setError(null);
    try {
      const JSZip = await loadJSZip();
      const zip = new JSZip();
      faviconPack.forEach((entry) => {
        zip.file(`favicon-${entry.size}x${entry.size}.png`, entry.blob);
      });
      const base =
        faviconFileName.replace(/\.(png|jpe?g|webp)$/i, "") || "favicon";
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(blob, `${base}-pack.zip`);
      setStatus("Downloaded favicon pack ZIP");
    } catch (err) {
      console.error(err);
      setError("ZIP export failed");
    } finally {
      setZipBusy(false);
    }
  }, [faviconPack, faviconFileName]);

  return (
    <div className="space-y-6" data-tool="sprite">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode("sprite")}
          className={`px-3 py-2 text-sm rounded border ${
            mode === "sprite"
              ? "border-primary-600 text-primary-600 bg-primary-50"
              : "border-gray-300 text-gray-600 hover:bg-gray-50"
          }`}
        >
          SVG Sprite
        </button>
        <button
          type="button"
          onClick={() => setMode("favicon")}
          className={`px-3 py-2 text-sm rounded border ${
            mode === "favicon"
              ? "border-primary-600 text-primary-600 bg-primary-50"
              : "border-gray-300 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Favicon Pack
        </button>
      </div>

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
            ? "Drop files here"
            : "Drag & drop SVGs and/or one image, or click to select"}
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Multiple SVGs → symbol sprite · One PNG/JPEG → favicon sizes (16-512)
        </p>
      </div>

      {error && <p className="text-center text-red-600 text-sm">{error}</p>}
      {status && <p className="text-center text-green-700 text-sm">{status}</p>}
      {faviconBusy && (
        <p className="text-center text-gray-500 text-sm">Generating favicons…</p>
      )}

      {mode === "sprite" && (
        <>
          {items.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Sprite symbols
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {items.length} symbol{items.length === 1 ? "" : "s"} ·
                    download preview sheet or defs-only sheet
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleClearSprite}
                    className="px-3 py-2 text-sm border rounded text-gray-600 hover:bg-gray-50 flex items-center"
                  >
                    <FaTrash className="mr-2" />
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={handleCopySprite}
                    className="px-3 py-2 text-sm border rounded text-gray-600 hover:bg-gray-50 flex items-center"
                  >
                    <FaCopy className="mr-2" />
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadDefs}
                    className="px-3 py-2 text-sm border rounded text-gray-600 hover:bg-gray-50 flex items-center"
                  >
                    <FaDownload className="mr-2" />
                    Defs only
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadSprite}
                    className="px-3 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 flex items-center"
                  >
                    <FaDownload className="mr-2" />
                    Download sprite
                  </button>
                </div>
              </div>

              <ul className="divide-y border rounded bg-white">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center gap-3 p-3"
                  >
                    <div className="w-10 h-10 flex items-center justify-center border rounded bg-gray-50">
                      <svg
                        width="28"
                        height="28"
                        viewBox={item.viewBox}
                        dangerouslySetInnerHTML={{ __html: item.inner }}
                      />
                    </div>
                    <div className="flex-1 min-w-[12rem]">
                      <label className="block text-xs text-gray-500 mb-1">
                        Symbol id
                      </label>
                      <input
                        type="text"
                        defaultValue={item.id}
                        onBlur={(e) => updateItemId(item.id, e.target.value)}
                        className="w-full px-2 py-1 text-sm border rounded font-mono"
                      />
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        {item.name} · viewBox {item.viewBox}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                      aria-label={`Remove ${item.id}`}
                    >
                      <FaTrash />
                    </button>
                  </li>
                ))}
              </ul>

              {previewUrl && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Preview
                  </h4>
                  <div className="border rounded bg-[linear-gradient(45deg,#f3f4f6_25%,transparent_25%),linear-gradient(-45deg,#f3f4f6_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f3f4f6_75%),linear-gradient(-45deg,transparent_75%,#f3f4f6_75%)] bg-[length:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0] p-6 flex justify-center">
                    <img
                      src={previewUrl}
                      alt="SVG sprite preview"
                      className="max-w-full h-auto"
                      style={{ imageRendering: "auto" }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {items.length === 0 && (
            <p className="text-center text-gray-500 text-sm">
              Upload one or more SVG files to build a &lt;symbol&gt; sprite.
            </p>
          )}
        </>
      )}

      {mode === "favicon" && (
        <>
          {faviconPack.length > 0 ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Favicon pack
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {faviconFileName} · sizes{" "}
                    {FAVICON_SIZES.map((s) => `${s}²`).join(", ")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleClearFavicon}
                    className="px-3 py-2 text-sm border rounded text-gray-600 hover:bg-gray-50 flex items-center"
                  >
                    <FaTrash className="mr-2" />
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadZip}
                    disabled={zipBusy}
                    className="px-3 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 flex items-center"
                  >
                    <FaFileArchive className="mr-2" />
                    {zipBusy ? "Zipping…" : "Download ZIP"}
                  </button>
                </div>
              </div>

              {faviconSourceUrl && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <FaImage className="text-gray-400" />
                  <img
                    src={faviconSourceUrl}
                    alt="Source"
                    className="w-12 h-12 object-contain border rounded bg-white"
                  />
                  <span>Source image</span>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {faviconPack.map((entry) => (
                  <div
                    key={entry.size}
                    className="border rounded bg-white p-3 flex flex-col items-center gap-2"
                  >
                    <div className="w-16 h-16 flex items-center justify-center bg-[linear-gradient(45deg,#f3f4f6_25%,transparent_25%),linear-gradient(-45deg,#f3f4f6_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f3f4f6_75%),linear-gradient(-45deg,transparent_75%,#f3f4f6_75%)] bg-[length:8px_8px] bg-[position:0_0,0_4px,4px_-4px,-4px_0] border rounded">
                      <img
                        src={entry.dataUrl}
                        alt={`${entry.size}×${entry.size}`}
                        width={Math.min(48, entry.size)}
                        height={Math.min(48, entry.size)}
                        style={{ imageRendering: entry.size <= 32 ? "pixelated" : "auto" }}
                      />
                    </div>
                    <span className="text-xs font-mono text-gray-600">
                      {entry.size}×{entry.size}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDownloadSize(entry)}
                      className="text-xs text-primary-600 hover:underline flex items-center"
                    >
                      <FaDownload className="mr-1" />
                      PNG
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500 text-sm">
              Upload a PNG or JPEG to generate a favicon pack locally in your
              browser.
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default SpriteTool;
