/**
 * Client-side raster→SVG helpers (imagetracerjs loaded lazily by callers).
 */

/** Soft cap so tracing stays responsive in the browser. */
export const MAX_TRACE_EDGE = 900;

/**
 * Dynamically import imagetracerjs (kept out of other SVG tab chunks).
 * @returns {Promise<object>} ImageTracer singleton
 */
export async function loadImageTracer() {
  const mod = await import("imagetracerjs");
  return mod?.default ?? mod;
}

/**
 * Map UI controls to imagetracer options.
 * @param {{ numberOfColors?: number, detail?: number, pathOmit?: number }} controls
 */
export function buildTraceOptions(controls = {}) {
  const numberOfColors = clampInt(controls.numberOfColors ?? 8, 2, 32);
  // detail 1 (coarse) … 10 (fine)
  const detail = clampInt(controls.detail ?? 5, 1, 10);
  const pathOmit = clampInt(
    controls.pathOmit ?? Math.round(lerp(24, 2, (detail - 1) / 9)),
    0,
    40
  );

  // Higher detail → lower tolerances (more path points)
  const t = (detail - 1) / 9;
  const ltres = lerp(2.5, 0.4, t);
  const qtres = lerp(2.5, 0.4, t);

  return {
    numberofcolors: numberOfColors,
    colorsampling: 2,
    colorquantcycles: 3,
    pathomit: pathOmit,
    ltres,
    qtres,
    rightangleenhance: true,
    linefilter: false,
    blurradius: detail <= 3 ? 1 : 0,
    strokewidth: 0,
    scale: 1,
    roundcoords: 1,
  };
}

/**
 * Decode a raster File/Blob into HTMLImageElement via object URL.
 * @param {Blob} blob
 * @returns {Promise<{ img: HTMLImageElement, objectUrl: string }>}
 */
export function loadImageFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => resolve({ img, objectUrl });
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to decode image"));
    };
    img.src = objectUrl;
  });
}

/**
 * Draw image to canvas, optionally downsampling so the longest edge ≤ maxEdge.
 * @param {HTMLImageElement} img
 * @param {number} [maxEdge=MAX_TRACE_EDGE]
 * @returns {{ canvas: HTMLCanvasElement, width: number, height: number, scale: number, originalWidth: number, originalHeight: number }}
 */
export function drawImageForTrace(img, maxEdge = MAX_TRACE_EDGE) {
  const originalWidth = img.naturalWidth || img.width;
  const originalHeight = img.naturalHeight || img.height;
  if (!originalWidth || !originalHeight) {
    throw new Error("Image has no dimensions");
  }

  const longest = Math.max(originalWidth, originalHeight);
  const scale = longest > maxEdge ? maxEdge / longest : 1;
  const width = Math.max(1, Math.round(originalWidth * scale));
  const height = Math.max(1, Math.round(originalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D unavailable");
  ctx.drawImage(img, 0, 0, width, height);

  return {
    canvas,
    width,
    height,
    scale,
    originalWidth,
    originalHeight,
  };
}

/**
 * @param {HTMLCanvasElement} canvas
 * @returns {ImageData}
 */
export function getImageData(canvas) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D unavailable");
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * Run imagetracer off the current call stack so the UI can paint progress.
 * @param {object} ImageTracer
 * @param {ImageData} imageData
 * @param {object} options
 * @returns {Promise<string>}
 */
export function traceImageDataToSvg(ImageTracer, imageData, options) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const svg = ImageTracer.imagedataToSVG(imageData, options);
        resolve(typeof svg === "string" ? svg : String(svg));
      } catch (err) {
        reject(err);
      }
    }, 0);
  });
}

/**
 * Full pipeline: blob → (downsample) → path SVG.
 * @param {Blob} blob
 * @param {{ numberOfColors?: number, detail?: number, pathOmit?: number, maxEdge?: number, onProgress?: (msg: string) => void }} [opts]
 * @returns {Promise<{ svg: string, width: number, height: number, scale: number, originalWidth: number, originalHeight: number }>}
 */
export async function rasterToSvg(blob, opts = {}) {
  const onProgress = opts.onProgress || (() => {});
  onProgress("Loading tracer…");
  const ImageTracer = await loadImageTracer();

  onProgress("Decoding image…");
  const { img, objectUrl } = await loadImageFromBlob(blob);
  try {
    onProgress("Preparing pixels…");
    const drawn = drawImageForTrace(img, opts.maxEdge ?? MAX_TRACE_EDGE);
    const imageData = getImageData(drawn.canvas);
    const options = buildTraceOptions(opts);

    onProgress(
      drawn.scale < 1
        ? `Tracing ${drawn.width}×${drawn.height} (downsampled)…`
        : `Tracing ${drawn.width}×${drawn.height}…`
    );
    const svg = await traceImageDataToSvg(ImageTracer, imageData, options);
    onProgress("Done");
    return {
      svg,
      width: drawn.width,
      height: drawn.height,
      scale: drawn.scale,
      originalWidth: drawn.originalWidth,
      originalHeight: drawn.originalHeight,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Render SVG markup to a PNG/JPEG blob via blob: URL Image → canvas (untainted).
 * @param {string} svgText
 * @param {{ format?: 'png'|'jpeg', quality?: number, scale?: number, background?: string | null }} [opts]
 * @returns {Promise<{ blob: Blob, width: number, height: number }>}
 */
export async function svgToRasterBlob(svgText, opts = {}) {
  const format = opts.format === "jpeg" ? "jpeg" : "png";
  const quality = typeof opts.quality === "number" ? opts.quality : 0.92;
  const scale = Math.max(0.25, Math.min(4, opts.scale ?? 1));
  const background = opts.background === undefined ? null : opts.background;

  const normalized = ensureSvgXmlns(String(svgText || "").trim());
  if (!normalized) {
    throw new Error("SVG content is empty");
  }

  const { width: baseW, height: baseH } = await measureSvgSize(normalized);
  const width = Math.max(1, Math.round(baseW * scale));
  const height = Math.max(1, Math.round(baseH * scale));

  const blob = new Blob([normalized], { type: "image/svg+xml;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);

  try {
    const img = await loadImageElement(objectUrl);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D unavailable");

    if (format === "jpeg" || background) {
      ctx.fillStyle = background || "#ffffff";
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.clearRect(0, 0, width, height);
    }

    ctx.drawImage(img, 0, 0, width, height);

    const mime = format === "jpeg" ? "image/jpeg" : "image/png";
    const out = await canvasToBlob(canvas, mime, quality);
    return { blob: out, width, height };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function ensureSvgXmlns(svg) {
  if (!svg) return "";
  if (/xmlns\s*=/.test(svg)) return svg;
  return svg.replace(
    /<svg\b/i,
    '<svg xmlns="http://www.w3.org/2000/svg"'
  );
}

async function measureSvgSize(svgText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, "image/svg+xml");
  if (doc.querySelector("parsererror")) {
    throw new Error("Invalid SVG markup");
  }
  const svg = doc.querySelector("svg");
  if (!svg) throw new Error("No <svg> root found");

  let width = parseLength(svg.getAttribute("width"));
  let height = parseLength(svg.getAttribute("height"));
  const vb = svg.getAttribute("viewBox");
  if ((!width || !height) && vb) {
    const parts = vb.trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
      width = width || parts[2];
      height = height || parts[3];
    }
  }

  width = width || 512;
  height = height || 512;
  return { width, height };
}

function parseLength(value) {
  if (value == null || value === "") return null;
  const n = parseFloat(String(value).replace(/px$/i, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function loadImageElement(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to render SVG to image"));
    img.src = url;
  });
}

function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve, reject) => {
    if (canvas.toBlob) {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas export failed"));
        },
        mime,
        quality
      );
      return;
    }
    try {
      const dataUrl = canvas.toDataURL(mime, quality);
      const bin = atob(dataUrl.split(",")[1] || "");
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
      resolve(new Blob([bytes], { type: mime }));
    } catch (err) {
      reject(err);
    }
  });
}

function clampInt(n, min, max) {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return min;
  return Math.min(max, Math.max(min, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}
