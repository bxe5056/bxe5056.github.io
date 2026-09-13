import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  lazy,
  Suspense,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import ToolLayout from "../../components/tools/ToolLayout";
import {
  FaRandom,
  FaKey,
  FaCode,
  FaClock,
  FaFont,
  FaImage,
  FaCopy,
  FaDownload,
  FaPlay,
  FaCheck,
  FaQrcode,
  FaExchangeAlt,
} from "react-icons/fa";
import { v4 as uuidv4 } from "uuid";
import CryptoJS from "crypto-js";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { getCategoryTools } from "./catalog";

const QrTool = lazy(() => import("./dev/QrTool"));
const TimestampTool = lazy(() => import("./dev/TimestampTool"));
const UnitsTool = lazy(() => import("./dev/UnitsTool"));
const CronTool = lazy(() => import("./dev/CronTool"));
const RegexTool = lazy(() => import("./dev/RegexTool"));

const validTools = [
  "uuid",
  "hash",
  "regex",
  "cron",
  "favicon",
  "qr",
  "timestamp",
  "units",
];
const defaultTool = "uuid";
const LAZY_DEV_TOOLS = ["qr", "timestamp", "units", "cron", "regex"];

const DEV_ICONS = {
  uuid: FaRandom,
  hash: FaKey,
  regex: FaCode,
  cron: FaClock,
  favicon: FaImage,
  qr: FaQrcode,
  timestamp: FaClock,
  units: FaExchangeAlt,
};

const DEV_TAB_ITEMS = getCategoryTools("dev").map((tool) => ({
  ...tool,
  icon: DEV_ICONS[tool.id],
}));

const DevTools = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tool") || defaultTool
  );
  const [lazyMounted, setLazyMounted] = useState(() => {
    const pathParam = location.pathname.split("/").pop();
    const initial = LAZY_DEV_TOOLS.includes(pathParam)
      ? pathParam
      : searchParams.get("tool");
    return new Set(LAZY_DEV_TOOLS.includes(initial) ? [initial] : []);
  });

  // Handle initial URL params and direct navigation
  useEffect(() => {
    const pathParam = location.pathname.split("/").pop();
    if (validTools.includes(pathParam)) {
      setActiveTab(pathParam);
    }
  }, [location]);

  useEffect(() => {
    if (LAZY_DEV_TOOLS.includes(activeTab)) {
      setLazyMounted((prev) => {
        if (prev.has(activeTab)) return prev;
        const next = new Set(prev);
        next.add(activeTab);
        return next;
      });
    }
  }, [activeTab]);

  // Update URL when tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    navigate(`/tools/dev/${tabId}`);
  };

  const [uuids, setUuids] = useState([]);
  const [uuidCount, setUuidCount] = useState(5);
  const [hashInput, setHashInput] = useState("");
  const [hashType, setHashType] = useState("md5");
  const [hashOutput, setHashOutput] = useState("");
  const [faviconText, setFaviconText] = useState("");
  const [faviconColor, setFaviconColor] = useState("#000000");
  const [faviconBg, setFaviconBg] = useState("#ffffff");
  const canvasRef = useRef(null);
  const [hashFile, setHashFile] = useState(null);
  const [hashFileContent, setHashFileContent] = useState(null);
  const fileInputRef = useRef(null);

  // UUID Generator
  const generateUuids = useCallback(() => {
    const newUuids = Array.from({ length: uuidCount }, () => uuidv4());
    setUuids(newUuids);
  }, [uuidCount]);

  const copyAllUuids = async () => {
    try {
      await navigator.clipboard.writeText(uuids.join("\n"));
      alert("All UUIDs copied to clipboard!");
    } catch (err) {
      alert("Failed to copy UUIDs");
    }
  };

  // Hash Generator
  const generateHash = useCallback(() => {
    if (!hashInput && !hashFileContent) return;

    let hash = "";
    if (hashFileContent) {
      // Handle file content
      switch (hashType) {
        case "md5":
          hash = CryptoJS.MD5(hashFileContent).toString();
          break;
        case "sha1":
          hash = CryptoJS.SHA1(hashFileContent).toString();
          break;
        case "sha256":
          hash = CryptoJS.SHA256(hashFileContent).toString();
          break;
        case "sha512":
          hash = CryptoJS.SHA512(hashFileContent).toString();
          break;
        default:
          break;
      }
    } else {
      // Handle text input
      switch (hashType) {
        case "md5":
          hash = CryptoJS.MD5(hashInput).toString();
          break;
        case "sha1":
          hash = CryptoJS.SHA1(hashInput).toString();
          break;
        case "sha256":
          hash = CryptoJS.SHA256(hashInput).toString();
          break;
        case "sha512":
          hash = CryptoJS.SHA512(hashInput).toString();
          break;
        default:
          break;
      }
    }
    setHashOutput(hash);
  }, [hashInput, hashType, hashFileContent]);

  const handleFileForHash = (event) => {
    const file = event.target.files[0];
    if (!file) {
      setHashFile(null);
      setHashFileContent(null);
      setHashOutput("");
      return;
    }

    setHashFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const wordArray = CryptoJS.lib.WordArray.create(e.target.result);
      setHashFileContent(wordArray);
      setHashOutput("");
    };
    reader.readAsArrayBuffer(file);
  };

  // Favicon Generator
  const generateFavicon = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Clear canvas
    ctx.fillStyle = faviconBg;
    ctx.fillRect(0, 0, 64, 64);

    // Draw text
    ctx.fillStyle = faviconColor;
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(faviconText.charAt(0).toUpperCase(), 32, 32);
  }, [faviconText, faviconColor, faviconBg]);

  const downloadFavicon = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = "favicon.png";
    link.href = canvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    } catch (err) {
      alert("Failed to copy text");
    }
  };

  const renderTool = () => {
    switch (activeTab) {
      case "uuid":
        return (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={uuidCount}
                  onChange={(e) => setUuidCount(Number(e.target.value))}
                  className="w-24 px-3 py-2 border rounded"
                />
                <button
                  onClick={generateUuids}
                  className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                >
                  Generate UUIDs
                </button>
              </div>
              {uuids.length > 0 && (
                <button
                  onClick={copyAllUuids}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border rounded hover:bg-gray-50"
                >
                  <FaCopy className="inline mr-2" />
                  Copy All
                </button>
              )}
            </div>
            <div className="space-y-2">
              {uuids.map((uuid, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <code className="font-mono text-sm">{uuid}</code>
                  <button
                    onClick={() => copyToClipboard(uuid)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FaCopy />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case "hash":
        return (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Text Input
                  </label>
                  <textarea
                    value={hashInput}
                    onChange={(e) => {
                      setHashInput(e.target.value);
                      setHashOutput("");
                      // Clear file input when typing text
                      if (hashFile) {
                        setHashFile(null);
                        setHashFileContent(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }
                    }}
                    placeholder="Enter text to hash..."
                    className="w-full h-32 p-4 border rounded hash-input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    File Input
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileForHash}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary-50 file:text-primary-700
                      hover:file:bg-primary-100"
                  />
                  {hashFile && (
                    <p className="text-sm text-gray-700">
                      Selected file: {hashFile.name}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Select a file to generate its hash
                  </p>
                </div>
              </div>

              {/* Hash Controls Section */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      Hash Type:
                    </label>
                    <select
                      value={hashType}
                      onChange={(e) => {
                        setHashType(e.target.value);
                        setHashOutput("");
                      }}
                      className="px-4 py-2 border rounded bg-white"
                    >
                      <option value="md5">MD5</option>
                      <option value="sha1">SHA-1</option>
                      <option value="sha256">SHA-256</option>
                      <option value="sha512">SHA-512</option>
                    </select>
                  </div>
                  <button
                    onClick={generateHash}
                    className="px-6 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 min-w-[200px]"
                  >
                    {hashFile
                      ? "Generate Hash from File"
                      : "Generate Hash from Text"}
                  </button>
                </div>
              </div>
            </div>
            {hashOutput && (
              <div className="p-4 bg-gray-50 rounded">
                <div className="flex justify-between items-center">
                  <div className="font-mono text-sm break-all">
                    <span className="font-semibold text-gray-700 mr-2">
                      {hashType.toUpperCase()}:
                    </span>
                    <code>{hashOutput}</code>
                  </div>
                  <button
                    onClick={() => copyToClipboard(hashOutput)}
                    className="text-gray-500 hover:text-gray-700 ml-2"
                    title="Copy hash value"
                  >
                    <FaCopy />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        );

      case "regex":
      case "qr":
      case "timestamp":
      case "units":
      case "cron":
        return null;

      case "favicon":
        return (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text
                </label>
                <input
                  type="text"
                  value={faviconText}
                  onChange={(e) => setFaviconText(e.target.value)}
                  maxLength={1}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Single character"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text Color
                </label>
                <input
                  type="color"
                  value={faviconColor}
                  onChange={(e) => setFaviconColor(e.target.value)}
                  className="w-full h-10 p-1 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Background
                </label>
                <input
                  type="color"
                  value={faviconBg}
                  onChange={(e) => setFaviconBg(e.target.value)}
                  className="w-full h-10 p-1 border rounded"
                />
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={generateFavicon}
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                Generate Favicon
              </button>
              <button
                onClick={downloadFavicon}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                <FaDownload className="inline mr-2" />
                Download
              </button>
            </div>
            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                width="64"
                height="64"
                className="border rounded"
              />
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <ToolLayout
      title="Developer Utilities"
      description="A collection of useful tools for developers"
      tools={DEV_TAB_ITEMS}
      activeToolId={activeTab}
      onToolChange={handleTabChange}
      toolNavLabel="Developer tool"
    >
      <div className="space-y-6" data-tool="dev">
        {/* Lazy placeholders keep-alive */}
        {lazyMounted.has("qr") && (
          <div className={activeTab === "qr" ? "block" : "hidden"}>
            <Suspense
              fallback={
                <div className="text-center text-gray-500 py-8">
                  Loading QR tool…
                </div>
              }
            >
              <QrTool />
            </Suspense>
          </div>
        )}
        {lazyMounted.has("timestamp") && (
          <div className={activeTab === "timestamp" ? "block" : "hidden"}>
            <Suspense
              fallback={
                <div className="text-center text-gray-500 py-8">
                  Loading timestamp tool…
                </div>
              }
            >
              <TimestampTool />
            </Suspense>
          </div>
        )}
        {lazyMounted.has("units") && (
          <div className={activeTab === "units" ? "block" : "hidden"}>
            <Suspense
              fallback={
                <div className="text-center text-gray-500 py-8">
                  Loading units tool…
                </div>
              }
            >
              <UnitsTool />
            </Suspense>
          </div>
        )}
        {lazyMounted.has("cron") && (
          <div className={activeTab === "cron" ? "block" : "hidden"}>
            <Suspense
              fallback={
                <div className="text-center text-gray-500 py-8">
                  Loading cron tool…
                </div>
              }
            >
              <CronTool />
            </Suspense>
          </div>
        )}
        {lazyMounted.has("regex") && (
          <div className={activeTab === "regex" ? "block" : "hidden"}>
            <Suspense
              fallback={
                <div className="text-center text-gray-500 py-8">
                  Loading regex tool…
                </div>
              }
            >
              <RegexTool />
            </Suspense>
          </div>
        )}

        {/* Tool Interface */}
        {!LAZY_DEV_TOOLS.includes(activeTab) && (
          <AnimatePresence mode="wait">{renderTool()}</AnimatePresence>
        )}
      </div>
    </ToolLayout>
  );
};

export default DevTools;
