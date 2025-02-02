import React, { useState, useCallback, useRef, useEffect } from "react";
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
} from "react-icons/fa";
import { v4 as uuidv4 } from "uuid";
import CryptoJS from "crypto-js";
import cronstrue from "cronstrue";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";

const validTools = ["uuid", "hash", "regex", "cron", "favicon"];
const defaultTool = "uuid";

const DevTools = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tool") || defaultTool
  );

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
    navigate(`/tools/dev/${tabId}`);
  };

  const [uuids, setUuids] = useState([]);
  const [uuidCount, setUuidCount] = useState(5);
  const [hashInput, setHashInput] = useState("");
  const [hashType, setHashType] = useState("md5");
  const [hashOutput, setHashOutput] = useState("");
  const [regexPattern, setRegexPattern] = useState("");
  const [regexFlags, setRegexFlags] = useState("g");
  const [regexText, setRegexText] = useState("");
  const [regexMatches, setRegexMatches] = useState([]);
  const [cronExpression, setCronExpression] = useState("* * * * *");
  const [cronDescription, setCronDescription] = useState("");
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

  // Regex Tester
  const testRegex = useCallback(() => {
    if (!regexPattern || !regexText) {
      setRegexMatches([]);
      return;
    }

    try {
      const regex = new RegExp(regexPattern, regexFlags);
      const matches = [];
      let match;

      while ((match = regex.exec(regexText)) !== null) {
        matches.push({
          value: match[0],
          index: match.index,
          groups: match.slice(1),
        });
        if (!regex.global) break;
      }

      setRegexMatches(matches);
    } catch (error) {
      setRegexMatches([{ error: error.message }]);
    }
  }, [regexPattern, regexFlags, regexText]);

  // Cron Expression Generator
  const parseCronExpression = useCallback(() => {
    try {
      const description = cronstrue.toString(cronExpression);
      setCronDescription(description);
    } catch (error) {
      setCronDescription("Invalid cron expression");
    }
  }, [cronExpression]);

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
                    className="w-full h-32 p-4 border rounded"
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
        return (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={regexPattern}
                  onChange={(e) => setRegexPattern(e.target.value)}
                  placeholder="Regular expression pattern"
                  className="flex-1 px-4 py-2 border rounded"
                />
                <input
                  type="text"
                  value={regexFlags}
                  onChange={(e) => setRegexFlags(e.target.value)}
                  placeholder="Flags"
                  className="w-20 px-4 py-2 border rounded"
                />
                <button
                  onClick={testRegex}
                  className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                >
                  Test
                </button>
              </div>
              <textarea
                value={regexText}
                onChange={(e) => setRegexText(e.target.value)}
                placeholder="Enter text to test..."
                className="w-full h-32 p-4 border rounded"
              />
            </div>
            {regexMatches.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">Matches ({regexMatches.length})</h3>
                {regexMatches.map((match, index) =>
                  match.error ? (
                    <div key={index} className="text-red-600">
                      {match.error}
                    </div>
                  ) : (
                    <div
                      key={index}
                      className="p-2 bg-gray-50 rounded space-y-1"
                    >
                      <div className="flex justify-between">
                        <span className="font-mono text-sm">
                          Match: {match.value}
                        </span>
                        <span className="text-gray-500">
                          Index: {match.index}
                        </span>
                      </div>
                      {match.groups.length > 0 && (
                        <div className="text-sm text-gray-600">
                          Groups: {match.groups.join(", ")}
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </motion.div>
        );

      case "cron":
        return (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <input
                type="text"
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                placeholder="Cron expression"
                className="w-full px-4 py-2 border rounded"
              />
              <button
                onClick={parseCronExpression}
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                Parse Expression
              </button>
            </div>
            {cronDescription && (
              <div className="p-4 bg-gray-50 rounded">
                <p>{cronDescription}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center text-sm">
              <div>
                <div className="font-medium">Minutes</div>
                <div className="text-gray-500">0-59</div>
              </div>
              <div>
                <div className="font-medium">Hours</div>
                <div className="text-gray-500">0-23</div>
              </div>
              <div>
                <div className="font-medium">Day of Month</div>
                <div className="text-gray-500">1-31</div>
              </div>
              <div>
                <div className="font-medium">Month</div>
                <div className="text-gray-500">1-12</div>
              </div>
              <div>
                <div className="font-medium">Day of Week</div>
                <div className="text-gray-500">0-6</div>
              </div>
            </div>
          </motion.div>
        );

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
    >
      <div className="space-y-6">
        {/* Tool Selection */}
        <div className="mb-6">
          {/* Mobile Dropdown */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="sm:hidden mb-4"
          >
            <select
              value={activeTab}
              onChange={(e) => handleTabChange(e.target.value)}
              className="w-full border-gray-300 rounded-md focus:border-primary-500 focus:ring-primary-500"
            >
              {[
                { id: "uuid", label: "UUID Generator", icon: FaRandom },
                { id: "hash", label: "Hash Generator", icon: FaKey },
                { id: "regex", label: "Regex Tester", icon: FaCode },
                { id: "cron", label: "Cron Parser", icon: FaClock },
                { id: "favicon", label: "Favicon Generator", icon: FaImage },
              ].map((tool) => (
                <option key={tool.id} value={tool.id}>
                  {tool.label}
                </option>
              ))}
            </select>
          </motion.div>

          {/* Desktop Tabs */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="hidden sm:block"
          >
            <nav className="flex flex-wrap border-b-2 border-gray-200 relative">
              {[
                { id: "uuid", label: "UUID Generator", icon: FaRandom },
                { id: "hash", label: "Hash Generator", icon: FaKey },
                { id: "regex", label: "Regex Tester", icon: FaCode },
                { id: "cron", label: "Cron Parser", icon: FaClock },
                { id: "favicon", label: "Favicon Generator", icon: FaImage },
              ].map((tool) => (
                <motion.button
                  key={tool.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleTabChange(tool.id)}
                  className={`
                    relative px-4 py-2 flex items-center ${
                      activeTab === tool.id
                        ? "text-primary-500"
                        : "text-gray-500 hover:text-gray-900"
                    }
                  `}
                >
                  <tool.icon className="h-4 w-4 mr-2" />
                  {tool.label}
                  {activeTab === tool.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-[-2px] left-0 right-0 h-0.5 bg-primary-500"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                </motion.button>
              ))}
            </nav>
          </motion.div>
        </div>

        {/* Tool Interface */}
        <AnimatePresence mode="wait">{renderTool()}</AnimatePresence>
      </div>
    </ToolLayout>
  );
};

export default DevTools;
