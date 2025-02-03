import React, { useState, useRef, useEffect } from "react";
import ToolLayout from "../../components/tools/ToolLayout";
import { FaCopy } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";

const validTools = ["base64", "url", "jwt", "case", "markdown", "lorem"];

const TextTools = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tool") || "base64"
  );
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [caseName, setCaseName] = useState("camelCase");
  const textareaRef = useRef(null);
  const previewRef = useRef(null);
  const [loremLength, setLoremLength] = useState(50);
  const [loremType, setLoremType] = useState("words");
  const [loremOutput, setLoremOutput] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (activeTab === "markdown") {
      const syncHeight = () => {
        const textarea = textareaRef.current;
        const preview = previewRef.current;
        if (textarea && preview) {
          // Reset heights to auto to get proper scroll height
          textarea.style.height = "auto";
          preview.style.height = "auto";

          // Get the maximum height between both elements
          const maxHeight = Math.max(
            textarea.scrollHeight,
            preview.scrollHeight,
            256 // minimum height of 16rem (16 * 16px)
          );

          // Set both elements to the maximum height
          textarea.style.height = `${maxHeight}px`;
          preview.style.height = `${maxHeight}px`;
        }
      };

      // Run on mount and content changes
      syncHeight();

      // Create observer for preview content changes
      const resizeObserver = new ResizeObserver(syncHeight);
      if (previewRef.current) {
        resizeObserver.observe(previewRef.current);
      }

      // Handle window resizes
      window.addEventListener("resize", syncHeight);

      return () => {
        resizeObserver.disconnect();
        window.removeEventListener("resize", syncHeight);
      };
    }
  }, [activeTab, input]);

  // Add effect to clear inputs on tab change
  useEffect(() => {
    // Clear all inputs when tab changes
    setInput("");
    setOutput("");
    setLoremOutput("");
  }, [activeTab]);

  // Handle initial URL params
  useEffect(() => {
    // Check for URL parameter first (backward compatibility)
    const toolParam = searchParams.get("tool");
    // Check for path parameter
    const pathParam = location.pathname.split("/").pop();

    // Use path parameter if it exists and is valid, otherwise fall back to URL parameter
    const tool = validTools.includes(pathParam) ? pathParam : toolParam;

    if (tool && validTools.includes(tool)) {
      setActiveTab(tool);
    }
  }, [searchParams, location]);

  const handleBase64 = (action) => {
    try {
      if (action === "encode") {
        setOutput(btoa(input));
      } else {
        setOutput(atob(input));
      }
    } catch (error) {
      setOutput("Invalid input for Base64 " + action);
    }
  };

  const handleUrl = (action) => {
    try {
      if (action === "encode") {
        setOutput(encodeURIComponent(input));
      } else {
        setOutput(decodeURIComponent(input));
      }
    } catch (error) {
      setOutput("Invalid input for URL " + action);
    }
  };

  const handleJwtDecode = () => {
    try {
      const parts = input.split(".");
      if (parts.length !== 3) throw new Error("Invalid JWT format");

      const decoded = {
        header: JSON.parse(atob(parts[0])),
        payload: JSON.parse(atob(parts[1])),
        signature: parts[2],
      };

      setOutput(JSON.stringify(decoded, null, 2));
    } catch (error) {
      setOutput("Invalid JWT token");
    }
  };

  const handleCaseConversion = () => {
    let result = input;

    // First convert to camelCase
    result = result
      .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
      .replace(/^([A-Z])/, (m) => m.toLowerCase());

    switch (caseName) {
      case "camelCase":
        // Already in camelCase
        break;
      case "PascalCase":
        result = result.charAt(0).toUpperCase() + result.slice(1);
        break;
      case "snake_case":
        result = result
          .replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
          .replace(/^_/, "");
        break;
      case "kebab-case":
        result = result
          .replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
          .replace(/^-/, "");
        break;
      case "CONSTANT_CASE":
        result = result
          .replace(/[A-Z]/g, (letter) => `_${letter}`)
          .replace(/^_/, "")
          .toUpperCase();
        break;
      default:
        break;
    }

    setOutput(result);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    } catch (err) {
      alert("Failed to copy text");
    }
  };

  const generateLorem = () => {
    const words = [
      "lorem",
      "ipsum",
      "dolor",
      "sit",
      "amet",
      "consectetur",
      "adipiscing",
      "elit",
      "sed",
      "do",
      "eiusmod",
      "tempor",
      "incididunt",
      "ut",
      "labore",
      "et",
      "dolore",
      "magna",
      "aliqua",
      "enim",
      "ad",
      "minim",
      "veniam",
      "quis",
      "nostrud",
      "exercitation",
      "ullamco",
      "laboris",
      "nisi",
      "aliquip",
      "ex",
      "ea",
      "commodo",
      "consequat",
      "duis",
      "aute",
      "irure",
      "in",
      "reprehenderit",
      "voluptate",
      "velit",
      "esse",
      "cillum",
      "eu",
      "fugiat",
      "nulla",
      "pariatur",
      "excepteur",
      "sint",
      "occaecat",
      "cupidatat",
      "non",
      "proident",
      "sunt",
      "culpa",
      "qui",
      "officia",
      "deserunt",
      "mollit",
      "anim",
      "id",
      "est",
      "laborum",
    ];

    const getRandomWord = () => words[Math.floor(Math.random() * words.length)];
    const getRandomSentence = () => {
      const length = Math.floor(Math.random() * 10) + 5;
      return (
        getRandomWord().charAt(0).toUpperCase() +
        getRandomWord().slice(1) +
        " " +
        Array.from({ length }, () => getRandomWord()).join(" ") +
        "."
      );
    };

    let result = "";
    if (loremType === "words") {
      result = Array.from({ length: loremLength }, getRandomWord).join(" ");
    } else if (loremType === "sentences") {
      result = Array.from({ length: loremLength }, getRandomSentence).join(" ");
    }

    setLoremOutput(result);
  };

  const renderTool = () => {
    switch (activeTab) {
      case "base64":
        return (
          <div>
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => handleBase64("encode")}
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                Encode
              </button>
              <button
                onClick={() => handleBase64("decode")}
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                Decode
              </button>
            </div>
          </div>
        );

      case "url":
        return (
          <div>
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => handleUrl("encode")}
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                Encode
              </button>
              <button
                onClick={() => handleUrl("decode")}
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                Decode
              </button>
            </div>
          </div>
        );

      case "jwt":
        return (
          <div>
            <button
              onClick={handleJwtDecode}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 mb-4"
            >
              Decode JWT
            </button>
          </div>
        );

      case "case":
        return (
          <div>
            <select
              value={caseName}
              onChange={(e) => setCaseName(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            >
              <option value="camelCase">camelCase</option>
              <option value="PascalCase">PascalCase</option>
              <option value="snake_case">snake_case</option>
              <option value="kebab-case">kebab-case</option>
              <option value="CONSTANT_CASE">CONSTANT_CASE</option>
            </select>
            <button
              onClick={handleCaseConversion}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 mb-4"
            >
              Convert Case
            </button>
          </div>
        );

      case "markdown":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Markdown Input</h3>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full p-2 border rounded font-mono resize-none min-h-[16rem] overflow-y-auto markdown-input"
                placeholder="Enter Markdown text..."
                style={{ height: "16rem" }}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Preview</h3>
              <div
                ref={previewRef}
                className="prose max-w-none border rounded p-4 overflow-y-auto min-h-[16rem] markdown-preview"
                style={{ height: "16rem" }}
              >
                <ReactMarkdown>{input}</ReactMarkdown>
              </div>
            </div>
          </div>
        );

      case "lorem":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={loremLength}
                  onChange={(e) => setLoremLength(Number(e.target.value))}
                  className="w-24 px-3 py-2 border rounded"
                />
                <select
                  value={loremType}
                  onChange={(e) => setLoremType(e.target.value)}
                  className="px-4 py-2 border rounded"
                >
                  <option value="words">Words</option>
                  <option value="sentences">Sentences</option>
                </select>
                <button
                  onClick={generateLorem}
                  className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                >
                  Generate
                </button>
              </div>
              {loremOutput && (
                <button
                  onClick={() => copyToClipboard(loremOutput)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 border rounded hover:bg-gray-50"
                >
                  <FaCopy />
                  Copy to Clipboard
                </button>
              )}
            </div>
            {loremOutput && (
              <div className="p-4 border rounded bg-gray-50 lorem-output">
                <p>{loremOutput}</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Update URL when tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Update URL to use the new path pattern
    navigate(`/tools/text/${tabId}`);
  };

  return (
    <ToolLayout
      title="Text Tools"
      description="A collection of text processing and conversion tools"
    >
      <div className="space-y-6" data-tool="text">
        {/* Tool Selection */}
        <div>
          {/* Mobile Dropdown */}
          <div className="sm:hidden">
            <select
              value={activeTab}
              onChange={(e) => handleTabChange(e.target.value)}
              className="w-full px-4 py-2 text-lg font-medium bg-white border-b border-gray-200 focus:outline-none focus:ring-0 focus:border-gray-200"
            >
              {[
                { id: "base64", label: "Base64" },
                { id: "url", label: "URL Encode/Decode" },
                { id: "jwt", label: "JWT Decoder" },
                { id: "case", label: "Case Converter" },
                { id: "markdown", label: "Markdown Preview" },
                { id: "lorem", label: "Lorem Ipsum Generator" },
              ].map((tool) => (
                <option key={tool.id} value={tool.id}>
                  {tool.label}
                </option>
              ))}
            </select>
          </div>

          {/* Desktop Tabs */}
          <div className="hidden sm:block">
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="flex space-x-2 border-b border-gray-200 min-w-max px-4 sm:px-0">
                {[
                  { id: "base64", label: "Base64" },
                  { id: "url", label: "URL Encode/Decode" },
                  { id: "jwt", label: "JWT Decoder" },
                  { id: "case", label: "Case Converter" },
                  { id: "markdown", label: "Markdown Preview" },
                  { id: "lorem", label: "Lorem Ipsum Generator" },
                ].map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => handleTabChange(tool.id)}
                    className={`px-4 py-2 -mb-px whitespace-nowrap ${
                      activeTab === tool.id
                        ? "border-b-2 border-primary-600 text-primary-600"
                        : "text-gray-500"
                    }`}
                  >
                    {tool.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Input/Output Section */}
        {activeTab !== "markdown" && activeTab !== "lorem" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Input
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full h-32 p-2 border rounded font-mono text-input"
                placeholder="Enter text to process..."
              />
            </div>

            {renderTool()}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Output
              </label>
              <div className="relative">
                <textarea
                  value={output}
                  readOnly
                  className="w-full h-32 p-2 border rounded font-mono bg-gray-50 text-output"
                />
                <button
                  onClick={() => copyToClipboard(output)}
                  className="absolute top-2 right-2 p-2 text-gray-500 hover:text-primary-600"
                  title="Copy to clipboard"
                >
                  <FaCopy />
                </button>
              </div>
            </div>
          </div>
        )}
        {(activeTab === "markdown" || activeTab === "lorem") && renderTool()}
      </div>
    </ToolLayout>
  );
};

export default TextTools;
