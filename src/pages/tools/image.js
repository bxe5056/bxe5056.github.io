import React, { useState, useCallback, useRef, useEffect } from "react";
import ToolLayout from "../../components/tools/ToolLayout";
import { useDropzone } from "react-dropzone";
import {
  FaImage,
  FaDownload,
  FaCrop,
  FaCompress,
  FaRuler,
  FaInfo,
  FaTimes,
  FaExchangeAlt,
  FaEraser,
} from "react-icons/fa";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { downloadDataUrl } from "../../utils/tools/download";
import { consumeSessionPayload } from "../../utils/tools/session";

const validTools = ["resize", "compress", "crop", "convert", "metadata"];
const defaultTool = "resize";
const MIN_CROP_SIZE = 2;
const STRIP_JPEG_QUALITY = 0.92;

/** Preferred EXIF/IPTC/XMP keys shown first when present. */
const EXIF_KEY_PRIORITY = [
  "Make",
  "Model",
  "LensModel",
  "Software",
  "DateTimeOriginal",
  "CreateDate",
  "ModifyDate",
  "Orientation",
  "ImageWidth",
  "ImageHeight",
  "ExifImageWidth",
  "ExifImageHeight",
  "ExposureTime",
  "FNumber",
  "ISO",
  "ISOSpeedRatings",
  "FocalLength",
  "Flash",
  "WhiteBalance",
  "MeteringMode",
  "latitude",
  "longitude",
  "GPSLatitude",
  "GPSLongitude",
  "GPSAltitude",
  "Artist",
  "Copyright",
  "ImageDescription",
  "Caption",
  "Keywords",
  "Creator",
  "Title",
];

const formatExtension = (mime) => {
  if (mime === "image/jpeg") return "jpg";
  return (mime || "image/png").split("/")[1] || "png";
};

const hasValidCrop = (start, end) => {
  if (!start || !end) return false;
  return (
    Math.abs(end.x - start.x) >= MIN_CROP_SIZE &&
    Math.abs(end.y - start.y) >= MIN_CROP_SIZE
  );
};

const formatExifLabel = (key) =>
  String(key)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());

const formatExifValue = (value) => {
  if (value == null) return "—";
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return String(value);
    if (Number.isInteger(value)) return String(value);
    return Number(value.toFixed(6)).toString();
  }
  if (Array.isArray(value)) {
    return value.map((item) => formatExifValue(item)).join(", ");
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
};

const sortExifEntries = (exif) => {
  if (!exif || typeof exif !== "object") return [];
  const entries = Object.entries(exif).filter(
    ([, value]) => value != null && value !== ""
  );
  const priority = new Map(EXIF_KEY_PRIORITY.map((key, i) => [key, i]));
  return entries.sort(([a], [b]) => {
    const ai = priority.has(a) ? priority.get(a) : EXIF_KEY_PRIORITY.length;
    const bi = priority.has(b) ? priority.get(b) : EXIF_KEY_PRIORITY.length;
    if (ai !== bi) return ai - bi;
    return a.localeCompare(b);
  });
};

const dataUrlToFile = async (dataUrl, fileName, mime) => {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const type = mime || blob.type || "image/png";
  const name =
    fileName || `image.${formatExtension(type)}`;
  return new File([blob], name, { type, lastModified: Date.now() });
};

let exifrModulePromise = null;
const loadExifr = () => {
  if (!exifrModulePromise) {
    exifrModulePromise = import("exifr");
  }
  return exifrModulePromise;
};

const parseImageExif = async (source) => {
  const exifr = await loadExifr();
  const parsed = await exifr.parse(source, {
    tiff: true,
    ifd0: true,
    exif: true,
    gps: true,
    iptc: true,
    xmp: true,
    icc: false,
    jfif: true,
    ihdr: true,
    interop: true,
    translateKeys: true,
    translateValues: true,
    reviveValues: true,
    sanitize: true,
    mergeOutput: true,
  });
  return parsed && typeof parsed === "object" ? parsed : null;
};

const ImageTools = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => {
    const pathParam = location.pathname.split("/").pop();
    if (validTools.includes(pathParam)) return pathParam;
    const queryTool = searchParams.get("tool");
    if (validTools.includes(queryTool)) return queryTool;
    return defaultTool;
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState(null);
  const [exifData, setExifData] = useState(null);
  const [exifLoading, setExifLoading] = useState(false);
  const [stripQuality, setStripQuality] = useState(STRIP_JPEG_QUALITY);
  const [cropStart, setCropStart] = useState(null);
  const [cropEnd, setCropEnd] = useState(null);
  const [aspectRatio, setAspectRatio] = useState("free");
  const [quality, setQuality] = useState(75);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [error, setError] = useState(null);
  const [activeHandle, setActiveHandle] = useState(null);
  const [isMovingCrop, setIsMovingCrop] = useState(false);
  const [moveStart, setMoveStart] = useState(null);
  const [convertFormat, setConvertFormat] = useState("image/png");
  const [convertQuality, setConvertQuality] = useState(0.92);
  const sessionLoadedRef = useRef(false);
  const skipTabResetRef = useRef(true);

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
    navigate(`/tools/image/${tabId}`);
  };

  // Reset state when changing tabs (skip initial mount so session handoff survives)
  useEffect(() => {
    if (skipTabResetRef.current) {
      skipTabResetRef.current = false;
      return;
    }
    setProcessedImage((prevImage) => {
      if (prevImage && prevImage.startsWith("blob:")) {
        URL.revokeObjectURL(prevImage);
      }
      return null;
    });
    setSelectedFile(null);
    setLoading(false);
    setMetadata(null);
    setExifData(null);
    setExifLoading(false);
    setDimensions({ width: 0, height: 0 });
    setCropStart(null);
    setCropEnd(null);
    setError(null);
    setActiveHandle(null);
    setIsMovingCrop(false);
    setMoveStart(null);
    setIsDragging(false);
    setIsFullscreen(false);
  }, [activeTab]);

  const redrawCropCanvas = (start = cropStart, end = cropEnd) => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    if (!start || !end) return;

    // Calculate crop rectangle coordinates (use args — avoid stale state during drag)
    const startX = Math.min(start.x, end.x);
    const startY = Math.min(start.y, end.y);
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);

    // Create clipping path for the crop area
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.rect(startX, startY, width, height);
    ctx.clip("evenodd");

    // Draw semi-transparent overlay only outside the crop area
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Draw dotted border
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, startY, width, height);

    // Reset line dash for handles
    ctx.setLineDash([]);

    // Draw corner handles
    const handleSize = 12;
    ctx.fillStyle = "white";
    ctx.strokeStyle = "rgb(25, 118, 210)";
    ctx.lineWidth = 2;

    // Helper function to draw a handle
    const drawHandle = (x, y) => {
      ctx.beginPath();
      ctx.arc(x, y, handleSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    };

    // Draw handles at corners and midpoints
    drawHandle(startX, startY);
    drawHandle(startX + width, startY);
    drawHandle(startX, startY + height);
    drawHandle(startX + width, startY + height);
    drawHandle(startX + width / 2, startY);
    drawHandle(startX + width / 2, startY + height);
    drawHandle(startX, startY + height / 2);
    drawHandle(startX + width, startY + height / 2);
  };

  const loadImageFile = useCallback(async (file) => {
    if (!file) return;

    if (file.type === "image/svg+xml") {
      setError(
        "SVG files are not supported. Please select a raster image (PNG, JPG, etc)."
      );
      return;
    }

    setError(null);
    setExifData(null);
    setSelectedFile(file);

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    try {
      await new Promise((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = objectUrl;
      });
    } catch {
      URL.revokeObjectURL(objectUrl);
      setError("Failed to load image. Please try another file.");
      setSelectedFile(null);
      return;
    }

    setDimensions({ width: img.width, height: img.height });
    setProcessedImage((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return objectUrl;
    });

    setMetadata({
      name: file.name,
      type: file.type || "image/unknown",
      size: (file.size / 1024).toFixed(2) + " KB",
      dimensions: `${img.width}x${img.height}`,
      lastModified: new Date(file.lastModified).toLocaleString(),
    });

    setExifLoading(true);
    try {
      const parsed = await parseImageExif(file);
      setExifData(parsed);
    } catch (err) {
      console.error("EXIF parse error:", err);
      setExifData(null);
    } finally {
      setExifLoading(false);
    }
  }, []);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;
      await loadImageFile(file);
    },
    [loadImageFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
  });

  // Accept image handoffs from other tools (dataUrl)
  useEffect(() => {
    if (sessionLoadedRef.current) return;
    sessionLoadedRef.current = true;

    const payload = consumeSessionPayload({ clear: false });
    if (!payload?.dataUrl) return;
    if (payload.type && payload.type !== "image" && payload.type !== "file") {
      return;
    }
    consumeSessionPayload({ clear: true });

    let cancelled = false;
    (async () => {
      try {
        const file = await dataUrlToFile(
          payload.dataUrl,
          payload.fileName,
          payload.mime
        );
        if (!cancelled) await loadImageFile(file);
      } catch (err) {
        console.error("Session image load failed:", err);
        if (!cancelled) {
          setError("Could not load the handed-off image.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadImageFile]);

  const handleResize = useCallback(() => {
    if (!selectedFile || !dimensions.width || !dimensions.height) return;

    setLoading(true);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);

      canvas.toBlob((blob) => {
        const resizedFile = new File([blob], selectedFile.name, {
          type: selectedFile.type,
          lastModified: new Date().getTime(),
        });
        setSelectedFile(resizedFile);
        setProcessedImage(URL.createObjectURL(blob));

        // Update metadata with resize info
        setMetadata((prev) => ({
          ...prev,
          originalSize: prev.size,
          size: (blob.size / 1024).toFixed(2) + " KB",
          dimensions: `${dimensions.width.toFixed(
            2
          )}x${dimensions.height.toFixed(2)}`,
          resized: true,
          lastModified: new Date().toLocaleString(),
        }));

        setLoading(false);
      }, selectedFile.type);
    };
    img.src = URL.createObjectURL(selectedFile);
  }, [selectedFile, dimensions]);

  const handleCompress = useCallback(async () => {
    if (!selectedFile) return;

    setLoading(true);
    try {
      const { default: imageCompression } = await import(
        "browser-image-compression"
      );
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        quality: quality / 100,
      };

      const compressedFile = await imageCompression(selectedFile, options);
      const compressedUrl = URL.createObjectURL(compressedFile);
      setProcessedImage(compressedUrl);

      // Update metadata with compression info
      setMetadata((prev) => ({
        ...prev,
        originalSize: prev.size,
        size: (compressedFile.size / 1024).toFixed(2) + " KB",
        compressed: true,
        lastModified: new Date().toLocaleString(),
      }));

      // Update selected file to use compressed version for future operations
      setSelectedFile(compressedFile);
    } catch (error) {
      console.error("Error compressing image:", error);
      setError("Error compressing image: " + error.message);
    }
    setLoading(false);
  }, [selectedFile, quality]);

  const handleCrop = useCallback(() => {
    if (!selectedFile || !hasValidCrop(cropStart, cropEnd)) {
      setError("Drag on the image to select a crop area first.");
      return;
    }

    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) {
      setError("Crop preview is not ready yet. Try reloading the image.");
      return;
    }

    setError(null);
    setLoading(true);

    // Calculate the scale between displayed size and actual image size
    const scaleX = img.naturalWidth / canvas.width;
    const scaleY = img.naturalHeight / canvas.height;

    const cropWidth = Math.abs(cropEnd.x - cropStart.x);
    const cropHeight = Math.abs(cropEnd.y - cropStart.y);
    const startX = Math.min(cropStart.x, cropEnd.x);
    const startY = Math.min(cropStart.y, cropEnd.y);

    // Scale the crop dimensions to match the original image size
    const scaledStartX = startX * scaleX;
    const scaledStartY = startY * scaleY;
    const scaledWidth = Math.max(1, Math.round(cropWidth * scaleX));
    const scaledHeight = Math.max(1, Math.round(cropHeight * scaleY));

    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = scaledWidth;
    outputCanvas.height = scaledHeight;
    const outputCtx = outputCanvas.getContext("2d");

    outputCtx.drawImage(
      img,
      scaledStartX,
      scaledStartY,
      cropWidth * scaleX,
      cropHeight * scaleY,
      0,
      0,
      scaledWidth,
      scaledHeight
    );

    outputCanvas.toBlob((blob) => {
      if (!blob) {
        setError("Failed to crop image. Please try again.");
        setLoading(false);
        return;
      }

      const croppedFile = new File([blob], selectedFile.name, {
        type: selectedFile.type || "image/png",
        lastModified: Date.now(),
      });

      setSelectedFile(croppedFile);
      setProcessedImage((prev) => {
        if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });

      setDimensions({
        width: scaledWidth,
        height: scaledHeight,
      });

      setMetadata((prev) => ({
        ...prev,
        size: (blob.size / 1024).toFixed(2) + " KB",
        dimensions: `${scaledWidth}x${scaledHeight}`,
        lastModified: new Date().toLocaleString(),
      }));

      setCropStart(null);
      setCropEnd(null);
      setLoading(false);
    }, selectedFile.type || "image/png");
  }, [selectedFile, cropStart, cropEnd]);

  const getScaledCoordinates = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const getHandle = (e, canvas) => {
    if (!cropStart || !cropEnd) return null;

    const coords = getScaledCoordinates(e, canvas);
    const startX = Math.min(cropStart.x, cropEnd.x);
    const startY = Math.min(cropStart.y, cropEnd.y);
    const width = Math.abs(cropEnd.x - cropStart.x);
    const height = Math.abs(cropEnd.y - cropStart.y);
    const handleSize = 12;

    const isNearPoint = (x, y) => {
      const dx = coords.x - x;
      const dy = coords.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= handleSize;
    };

    // Check corners
    if (isNearPoint(startX, startY)) return "tl";
    if (isNearPoint(startX + width, startY)) return "tr";
    if (isNearPoint(startX, startY + height)) return "bl";
    if (isNearPoint(startX + width, startY + height)) return "br";

    // Check midpoints
    if (isNearPoint(startX + width / 2, startY)) return "t";
    if (isNearPoint(startX + width / 2, startY + height)) return "b";
    if (isNearPoint(startX, startY + height / 2)) return "l";
    if (isNearPoint(startX + width, startY + height / 2)) return "r";

    // Check if inside crop box
    if (
      coords.x >= startX &&
      coords.x <= startX + width &&
      coords.y >= startY &&
      coords.y <= startY + height
    ) {
      return "move";
    }

    return null;
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (activeTab !== "crop") return;

    const canvas = canvasRef.current;
    const handle = getHandle(e, canvas);
    const coords = getScaledCoordinates(e, canvas);

    if (handle === "move") {
      setIsMovingCrop(true);
      setMoveStart(coords);
    } else if (handle) {
      setActiveHandle(handle);
    } else {
      // Start new crop if there isn't one, or if we have a complete crop
      if (!cropStart || (cropStart && cropEnd && !isDragging)) {
        setCropStart(coords);
        setCropEnd(null); // Clear end point when starting new crop
        setIsDragging(true);
      }
    }
  };

  const handleMouseMove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (activeTab !== "crop") return;

    const canvas = canvasRef.current;
    const coords = getScaledCoordinates(e, canvas);

    // Handle crop box creation
    if (cropStart && isDragging && !isMovingCrop && !activeHandle) {
      let newEnd = {
        x: Math.max(0, Math.min(canvas.width, coords.x)),
        y: Math.max(0, Math.min(canvas.height, coords.y)),
      };

      if (aspectRatio !== "free") {
        const width = Math.abs(newEnd.x - cropStart.x);
        const [ratioWidth, ratioHeight] = aspectRatio.split(":").map(Number);
        const targetHeight = (width * ratioHeight) / ratioWidth;
        newEnd.y =
          newEnd.y > cropStart.y
            ? cropStart.y + targetHeight
            : cropStart.y - targetHeight;
        newEnd.y = Math.max(0, Math.min(canvas.height, newEnd.y));
      }

      setCropEnd(newEnd);
      redrawCropCanvas(cropStart, newEnd);
      return;
    }

    // Handle moving existing crop box (preserve size; clamp within canvas)
    if (isMovingCrop && moveStart && cropStart && cropEnd) {
      const dx = coords.x - moveStart.x;
      const dy = coords.y - moveStart.y;
      const width = Math.abs(cropEnd.x - cropStart.x);
      const height = Math.abs(cropEnd.y - cropStart.y);
      const minX = Math.min(cropStart.x, cropEnd.x);
      const minY = Math.min(cropStart.y, cropEnd.y);

      const newMinX = Math.max(0, Math.min(canvas.width - width, minX + dx));
      const newMinY = Math.max(0, Math.min(canvas.height - height, minY + dy));
      const startIsLeft = cropStart.x <= cropEnd.x;
      const startIsTop = cropStart.y <= cropEnd.y;

      const newStart = {
        x: startIsLeft ? newMinX : newMinX + width,
        y: startIsTop ? newMinY : newMinY + height,
      };
      const newEnd = {
        x: startIsLeft ? newMinX + width : newMinX,
        y: startIsTop ? newMinY + height : newMinY,
      };

      setCropStart(newStart);
      setCropEnd(newEnd);
      setMoveStart(coords);
      redrawCropCanvas(newStart, newEnd);
      return;
    }

    // Handle resizing via handles
    if (activeHandle && cropStart && cropEnd) {
      let newStart = { ...cropStart };
      let newEnd = { ...cropEnd };
      const clamped = {
        x: Math.max(0, Math.min(canvas.width, coords.x)),
        y: Math.max(0, Math.min(canvas.height, coords.y)),
      };

      switch (activeHandle) {
        case "tl":
          newStart = clamped;
          break;
        case "tr":
          newStart = { ...newStart, y: clamped.y };
          newEnd = { ...newEnd, x: clamped.x };
          break;
        case "bl":
          newStart = { ...newStart, x: clamped.x };
          newEnd = { ...newEnd, y: clamped.y };
          break;
        case "br":
          newEnd = clamped;
          break;
        case "t":
          newStart = { ...newStart, y: clamped.y };
          break;
        case "b":
          newEnd = { ...newEnd, y: clamped.y };
          break;
        case "l":
          newStart = { ...newStart, x: clamped.x };
          break;
        case "r":
          newEnd = { ...newEnd, x: clamped.x };
          break;
        default:
          break;
      }

      if (
        aspectRatio !== "free" &&
        ["tl", "tr", "bl", "br"].includes(activeHandle)
      ) {
        const width = Math.abs(newEnd.x - newStart.x);
        const [ratioWidth, ratioHeight] = aspectRatio.split(":").map(Number);
        const targetHeight = (width * ratioHeight) / ratioWidth;
        newEnd.y =
          newEnd.y > newStart.y
            ? newStart.y + targetHeight
            : newStart.y - targetHeight;
        newEnd.y = Math.max(0, Math.min(canvas.height, newEnd.y));
      }

      setCropStart(newStart);
      setCropEnd(newEnd);
      redrawCropCanvas(newStart, newEnd);
    }

    // Update cursor based on handle
    const handle = getHandle(e, canvas);
    if (handle === "tl" || handle === "br") canvas.style.cursor = "nw-resize";
    else if (handle === "tr" || handle === "bl")
      canvas.style.cursor = "ne-resize";
    else if (handle === "t" || handle === "b")
      canvas.style.cursor = "ns-resize";
    else if (handle === "l" || handle === "r")
      canvas.style.cursor = "ew-resize";
    else if (handle === "move") canvas.style.cursor = "move";
    else canvas.style.cursor = "crosshair";
  };

  const handleMouseUp = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isDragging && cropStart && !cropEnd) {
      // If we're dragging but haven't set an end point, use current mouse position
      const canvas = canvasRef.current;
      if (canvas) {
        const coords = getScaledCoordinates(e, canvas);
        setCropEnd(coords);
        redrawCropCanvas(cropStart, coords);
      }
    }

    setIsDragging(false);
    setIsMovingCrop(false);
    setActiveHandle(null);
    setMoveStart(null);

    document.body.style.userSelect = "";
    document.body.style.WebkitUserSelect = "";
    document.body.style.MozUserSelect = "";
    document.body.style.msUserSelect = "";
  };

  const handleCancelCrop = () => {
    setCropStart(null);
    setCropEnd(null);
    setError(null);
    redrawCropCanvas(null, null);
  };

  const downloadImage = () => {
    if (!processedImage || !selectedFile) {
      setError("Select or process an image before downloading.");
      return;
    }

    const baseName = selectedFile.name.replace(/\.[^.]+$/, "") || "image";
    const ext =
      formatExtension(selectedFile.type) ||
      selectedFile.name.split(".").pop() ||
      "png";
    downloadDataUrl(processedImage, `processed-${baseName}.${ext}`);
  };

  const handleClearImage = () => {
    setProcessedImage((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    setSelectedFile(null);
    setMetadata(null);
    setExifData(null);
    setExifLoading(false);
    setDimensions({ width: 0, height: 0 });
    setCropStart(null);
    setCropEnd(null);
    setError(null);
  };

  const handleStripExif = useCallback(() => {
    if (!selectedFile || !processedImage) {
      setError("Select an image before stripping metadata.");
      return;
    }

    setError(null);
    setLoading(true);

    const img = new Image();
    const sourceUrl = processedImage;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");

      const outputType =
        selectedFile.type === "image/jpeg" ||
        selectedFile.type === "image/webp" ||
        selectedFile.type === "image/png"
          ? selectedFile.type
          : "image/png";

      if (outputType === "image/jpeg") {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      const qualityArg =
        outputType === "image/jpeg" || outputType === "image/webp"
          ? stripQuality
          : undefined;

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setError("Failed to strip metadata. Please try again.");
            setLoading(false);
            return;
          }

          const ext = formatExtension(outputType);
          const baseName =
            selectedFile.name.replace(/\.[^.]+$/, "") || "image";
          const strippedName = `${baseName}-no-exif.${ext}`;
          const strippedFile = new File([blob], strippedName, {
            type: outputType,
            lastModified: Date.now(),
          });

          setSelectedFile(strippedFile);
          setProcessedImage((prev) => {
            if (prev && prev.startsWith("blob:") && prev !== sourceUrl) {
              URL.revokeObjectURL(prev);
            }
            return URL.createObjectURL(blob);
          });

          setMetadata({
            name: strippedName,
            type: outputType,
            size: (blob.size / 1024).toFixed(2) + " KB",
            dimensions: `${canvas.width}x${canvas.height}`,
            lastModified: new Date().toLocaleString(),
            stripped: true,
          });
          setExifData(null);
          setDimensions({ width: canvas.width, height: canvas.height });

          const reader = new FileReader();
          reader.onload = () => {
            downloadDataUrl(reader.result, strippedName);
            setLoading(false);
          };
          reader.onerror = () => {
            setError("Stripped image created, but download failed.");
            setLoading(false);
          };
          reader.readAsDataURL(blob);
        },
        outputType,
        qualityArg
      );
    };

    img.onerror = () => {
      setError("Failed to load image for metadata stripping.");
      setLoading(false);
    };

    img.src = sourceUrl;
  }, [selectedFile, processedImage, stripQuality]);

  const FullscreenModal = ({ image, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="relative max-w-full max-h-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 rounded-full bg-black bg-opacity-50"
        >
          <FaTimes size={24} />
        </button>
        <img
          src={image}
          alt="Fullscreen preview"
          className="max-w-full max-h-[90vh] object-contain"
        />
      </div>
    </div>
  );

  const renderPreview = (size = "w-32 h-32") => (
    <div className={`${size} relative group`}>
      <img
        src={processedImage}
        alt="Preview"
        className="w-full h-full object-contain rounded image-thumbnail"
      />
    </div>
  );

  const handleConvert = useCallback(() => {
    if (!selectedFile) {
      setError("Select an image before converting.");
      return;
    }

    setError(null);
    setLoading(true);
    const img = new Image();
    const objectUrl = URL.createObjectURL(selectedFile);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      // Opaque backdrop when converting to JPEG (no alpha)
      if (convertFormat === "image/jpeg") {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      const ext = formatExtension(convertFormat);
      const qualityArg =
        convertFormat === "image/jpeg" || convertFormat === "image/webp"
          ? convertQuality
          : undefined;

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setError(
              "Failed to convert image. Try PNG, JPEG, or WebP instead."
            );
            setLoading(false);
            return;
          }

          const convertedFile = new File([blob], `converted.${ext}`, {
            type: convertFormat,
            lastModified: Date.now(),
          });

          setSelectedFile(convertedFile);
          setProcessedImage((prev) => {
            if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
            return URL.createObjectURL(blob);
          });

          setMetadata((prev) => ({
            ...prev,
            originalType: prev?.type || selectedFile.type,
            type: convertFormat,
            size: (blob.size / 1024).toFixed(2) + " KB",
            converted: true,
            lastModified: new Date().toLocaleString(),
          }));

          setLoading(false);
        },
        convertFormat,
        qualityArg
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setError("Failed to load image for conversion.");
      setLoading(false);
    };

    img.src = objectUrl;
  }, [selectedFile, convertFormat, convertQuality]);

  const renderTool = () => {
    switch (activeTab) {
      case "resize":
        return (
          <div className="space-y-6">
            <div className="border rounded-lg p-4 bg-gray-50">
              <img
                src={processedImage}
                alt="Preview"
                className="max-h-64 mx-auto object-contain"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Width (px)
                </label>
                <input
                  type="number"
                  value={dimensions.width}
                  onChange={(e) => {
                    const width = Number(e.target.value);
                    setDimensions((prev) => ({
                      width,
                      height: maintainAspectRatio
                        ? Math.round(width * (prev.height / prev.width))
                        : prev.height,
                    }));
                  }}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (px)
                </label>
                <input
                  type="number"
                  value={dimensions.height}
                  onChange={(e) => {
                    const height = Number(e.target.value);
                    setDimensions((prev) => ({
                      width: maintainAspectRatio
                        ? Math.round(height * (prev.width / prev.height))
                        : prev.width,
                      height,
                    }));
                  }}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="maintain-aspect"
                checked={maintainAspectRatio}
                onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                className="mr-2"
              />
              <label
                htmlFor="maintain-aspect"
                className="text-sm text-gray-600"
              >
                Maintain aspect ratio
              </label>
            </div>
            <button
              onClick={handleResize}
              disabled={!selectedFile || loading}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:bg-gray-400"
            >
              {loading ? "Processing..." : "Resize Image"}
            </button>
            {metadata && processedImage && metadata.resized && (
              <div className="text-sm text-gray-600">
                Original size: {metadata.originalSize}
                <br />
                New size: {metadata.size}
                <br />
                New dimensions: {metadata.dimensions}
              </div>
            )}
          </div>
        );

      case "compress":
        return (
          <div className="space-y-6">
            <div className="border rounded-lg p-4 bg-gray-50">
              <img
                src={processedImage}
                alt="Preview"
                className="max-h-64 mx-auto object-contain"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quality ({quality}%)
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <button
              onClick={handleCompress}
              disabled={!selectedFile || loading}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:bg-gray-400"
            >
              {loading ? "Processing..." : "Compress Image"}
            </button>
            {metadata && processedImage && metadata.compressed && (
              <div className="text-sm text-gray-600">
                Original size: {metadata.originalSize || metadata.size}
                <br />
                New size: {metadata.size}
              </div>
            )}
          </div>
        );

      case "crop": {
        const cropReady = hasValidCrop(cropStart, cropEnd);
        return (
          <div className="space-y-6">
            <p className="text-sm text-gray-600">
              Drag on the image to select a crop area. Drag handles to resize,
              or drag inside the selection to move it.
            </p>
            <div className="flex flex-wrap justify-between items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aspect Ratio
                </label>
                <select
                  value={aspectRatio}
                  onChange={(e) => {
                    setAspectRatio(e.target.value);
                    setCropStart(null);
                    setCropEnd(null);
                    redrawCropCanvas(null, null);
                  }}
                  className="px-4 py-2 border rounded"
                >
                  <option value="free">Free Form</option>
                  <option value="1:1">1:1 Square</option>
                  <option value="4:3">4:3</option>
                  <option value="16:9">16:9</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Select New Image
                </button>
                {processedImage && !cropStart && !cropEnd && (
                  <button
                    type="button"
                    onClick={downloadImage}
                    className="w-10 h-10 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center"
                    title="Download Modified Image"
                  >
                    <FaDownload />
                  </button>
                )}
                {(cropStart || cropEnd) && (
                  <button
                    type="button"
                    onClick={handleCancelCrop}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Reset Crop
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCrop}
                  disabled={!cropReady || loading}
                  className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  title={
                    cropReady
                      ? "Apply crop"
                      : "Select a crop area on the image first"
                  }
                >
                  {loading ? "Cropping..." : "Crop Image"}
                </button>
              </div>
            </div>
            {!cropReady && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                No crop selected yet — drag across the preview to create a
                selection.
              </p>
            )}
            <div className="relative">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onDragStart={(e) => e.preventDefault()}
                className="border rounded max-w-full cursor-crosshair select-none"
                style={{
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  MozUserSelect: "none",
                  msUserSelect: "none",
                  KhtmlUserSelect: "none",
                  WebkitTouchCallout: "none",
                  WebkitUserDrag: "none",
                  WebkitTapHighlightColor: "rgba(0,0,0,0)",
                  touchAction: "none",
                  pointerEvents: "auto",
                }}
                draggable="false"
              />
              <img
                ref={imageRef}
                src={processedImage}
                alt="Preview"
                className="hidden"
                onLoad={(e) => {
                  const canvas = canvasRef.current;
                  if (!canvas) return;
                  const ctx = canvas.getContext("2d");
                  canvas.width = e.target.naturalWidth || e.target.width;
                  canvas.height = e.target.naturalHeight || e.target.height;
                  ctx.drawImage(e.target, 0, 0);
                }}
              />
            </div>
          </div>
        );
      }

      case "metadata": {
        const exifEntries = sortExifEntries(exifData);
        const basicEntries = metadata
          ? Object.entries(metadata).filter(
              ([key]) =>
                !["compressed", "resized", "converted", "stripped"].includes(
                  key
                )
            )
          : [];
        const isLossy =
          selectedFile?.type === "image/jpeg" ||
          selectedFile?.type === "image/webp";

        return (
          <div className="space-y-6">
            <div className="border rounded-lg p-4 bg-gray-50">
              <img
                src={processedImage}
                alt="Preview"
                className="max-h-64 mx-auto object-contain"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleClearImage}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Select New Image
              </button>
              <button
                type="button"
                onClick={handleStripExif}
                disabled={!selectedFile || loading}
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                <FaEraser className="mr-2" />
                {loading ? "Stripping…" : "Strip EXIF & Download"}
              </button>
            </div>

            {isLossy && (
              <div className="space-y-2 rounded border border-amber-200 bg-amber-50 px-3 py-3">
                <p className="text-sm text-amber-900">
                  Stripping re-encodes the image via canvas, which removes
                  EXIF/IPTC/XMP but can reduce quality for JPEG/WebP. Prefer PNG
                  when lossless output matters.
                </p>
                <label className="block text-sm font-medium text-amber-900">
                  Re-encode quality ({Math.round(stripQuality * 100)}%)
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1"
                  step="0.01"
                  value={stripQuality}
                  onChange={(e) => setStripQuality(parseFloat(e.target.value))}
                  disabled={loading}
                  className="w-full disabled:opacity-50"
                />
              </div>
            )}

            {!isLossy && (
              <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
                Stripping redraws the image to a new file without embedded
                metadata. Processing stays in your browser.
              </p>
            )}

            {metadata?.stripped && (
              <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded px-3 py-2">
                Metadata stripped. A clean copy was downloaded; EXIF readout
                below is empty for the new file.
              </p>
            )}

            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                File info
              </h3>
              {basicEntries.length > 0 ? (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {basicEntries.map(([key, value]) => (
                    <div
                      key={key}
                      className="border rounded px-3 py-2 bg-white"
                    >
                      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        {formatExifLabel(key)}
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 break-all">
                        {String(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-gray-500">No file loaded.</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                EXIF / IPTC / XMP
              </h3>
              {exifLoading ? (
                <p className="text-sm text-gray-500">Reading metadata…</p>
              ) : exifEntries.length > 0 ? (
                <dl className="divide-y divide-gray-100 border rounded bg-white">
                  {exifEntries.map(([key, value]) => (
                    <div
                      key={key}
                      className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 px-3 py-2"
                    >
                      <dt className="sm:w-48 shrink-0 text-sm font-medium text-gray-600">
                        {formatExifLabel(key)}
                      </dt>
                      <dd className="text-sm text-gray-900 break-all">
                        {formatExifValue(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-gray-500 border rounded px-3 py-4 bg-gray-50">
                  No embedded EXIF, IPTC, or XMP tags found in this image.
                </p>
              )}
            </div>
          </div>
        );
      }

      case "convert":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Convert to Format
                </label>
                <select
                  value={convertFormat}
                  onChange={(e) => setConvertFormat(e.target.value)}
                  disabled={!selectedFile || loading}
                  className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="image/png">PNG</option>
                  <option value="image/jpeg">JPEG</option>
                  <option value="image/webp">WebP</option>
                  <option value="image/gif">GIF</option>
                </select>

                {convertFormat === "image/jpeg" ||
                convertFormat === "image/webp" ? (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Quality ({Math.round(convertQuality * 100)}%)
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.01"
                      value={convertQuality}
                      onChange={(e) =>
                        setConvertQuality(parseFloat(e.target.value))
                      }
                      disabled={!selectedFile || loading}
                      className="w-full disabled:opacity-50"
                    />
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={handleConvert}
                  disabled={!selectedFile || loading}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Converting..." : "Convert Image"}
                </button>

                {metadata && metadata.converted && (
                  <>
                    <div className="text-sm text-gray-600 mt-4">
                      Original format: {metadata.originalType}
                      <br />
                      New format: {metadata.type}
                      <br />
                      New size: {metadata.size}
                    </div>
                    <button
                      type="button"
                      onClick={downloadImage}
                      disabled={!processedImage || loading}
                      className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      <FaDownload className="mr-2" />
                      Download Converted Image
                    </button>
                  </>
                )}
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Preview
                </label>
                <div className="border rounded-lg p-4 bg-gray-50 min-h-[200px] flex items-center justify-center">
                  {processedImage ? (
                    <img
                      src={processedImage}
                      alt="Preview"
                      className="max-w-full max-h-[300px] object-contain"
                    />
                  ) : (
                    <div className="text-gray-400 text-center px-4">
                      No image selected — drop a file to get started.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <ToolLayout
      title="Image Tools"
      description="A collection of image manipulation and conversion tools"
    >
      <div className="space-y-6" data-tool="image">
        {isFullscreen && (
          <FullscreenModal
            image={processedImage}
            onClose={() => setIsFullscreen(false)}
          />
        )}
        {/* Tool Selection */}
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="flex space-x-2 border-b border-gray-200 min-w-max px-4 sm:px-0">
            {[
              { id: "resize", label: "Resize", icon: FaRuler },
              { id: "compress", label: "Compress", icon: FaCompress },
              { id: "crop", label: "Crop", icon: FaCrop },
              { id: "convert", label: "Convert", icon: FaExchangeAlt },
              { id: "metadata", label: "EXIF / Metadata", icon: FaInfo },
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

        {/* File Selector */}
        {!selectedFile && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-primary-500 bg-primary-50"
                : "border-gray-300 hover:border-primary-500"
            }`}
          >
            <input {...getInputProps()} />
            <FaImage className="mx-auto text-4xl mb-4 text-gray-400" />
            <p className="text-gray-600">
              {isDragActive
                ? "Drop the image here"
                : "Drag & drop an image here, or click to select"}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              PNG, JPEG, WebP, and other raster formats. SVG is not supported
              here.
            </p>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2"
          >
            {error}
          </div>
        )}

        {/* Tool Interface */}
        {selectedFile && renderTool()}
      </div>
    </ToolLayout>
  );
};

export default ImageTools;
