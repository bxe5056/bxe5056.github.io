import React, { useState, useCallback, useEffect } from "react";
import ToolLayout from "../../components/tools/ToolLayout";
import { useDropzone } from "react-dropzone";
import {
  FaUpload,
  FaDownload,
  FaCopy,
  FaCode,
  FaExchangeAlt,
  FaTable,
  FaFileCode,
} from "react-icons/fa";
import yaml from "js-yaml";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import JSON5 from "json5";
import HtmlTableToJson from "html-table-to-json";
import { markdownTable } from "markdown-table";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";

// Define supported formats and their metadata
const SUPPORTED_FORMATS = {
  CSV: {
    name: "CSV",
    extensions: [".csv"],
    mimeTypes: ["text/csv"],
    needsOptions: true,
  },
  JSON: {
    name: "JSON",
    extensions: [".json"],
    mimeTypes: ["application/json"],
    needsOptions: false,
  },
  JSON5: {
    name: "JSON5",
    extensions: [".json5"],
    mimeTypes: ["application/json"],
    needsOptions: false,
  },
  YAML: {
    name: "YAML",
    extensions: [".yaml", ".yml"],
    mimeTypes: ["text/yaml"],
    needsOptions: false,
  },
  XML: {
    name: "XML",
    extensions: [".xml"],
    mimeTypes: ["application/xml"],
    needsOptions: false,
  },
  MD_TABLE: {
    name: "Markdown Table",
    extensions: [".md"],
    mimeTypes: ["text/markdown"],
    needsOptions: true,
  },
  HTML_TABLE: {
    name: "HTML Table",
    extensions: [".html"],
    mimeTypes: ["text/html"],
    needsOptions: true,
  },
};

// Define conversion compatibility matrix
const CONVERSION_MATRIX = {
  CSV: ["JSON", "YAML", "XML", "MD_TABLE", "HTML_TABLE"],
  JSON: ["CSV", "YAML", "XML", "MD_TABLE", "HTML_TABLE"],
  JSON5: ["JSON", "YAML", "XML", "CSV", "MD_TABLE", "HTML_TABLE"],
  YAML: ["JSON", "CSV", "XML", "MD_TABLE", "HTML_TABLE"],
  XML: ["JSON", "CSV", "YAML", "MD_TABLE", "HTML_TABLE"],
  MD_TABLE: ["JSON", "CSV", "YAML", "XML", "HTML_TABLE"],
  HTML_TABLE: ["JSON", "CSV", "YAML", "XML", "MD_TABLE"],
};

// Function to check if conversion is supported
const isConversionSupported = (sourceFormat, targetFormat) => {
  return CONVERSION_MATRIX[sourceFormat]?.includes(targetFormat) || false;
};

// XML conversion helper functions
const xmlToJson = (node) => {
  // Handle text nodes
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.nodeValue.trim();
    return text ? text : null;
  }

  // Create the base object
  const obj = {};

  // Handle attributes
  if (node.attributes) {
    Array.from(node.attributes).forEach((attr) => {
      obj[`@${attr.nodeName}`] = attr.nodeValue;
    });
  }

  // Handle child nodes
  Array.from(node.childNodes).forEach((child) => {
    // Skip empty text nodes
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.nodeValue.trim();
      if (text) {
        obj["#text"] = text;
      }
      return;
    }

    // Handle element nodes
    if (child.nodeType === Node.ELEMENT_NODE) {
      const childObj = xmlToJson(child);

      if (obj[child.nodeName]) {
        // If the property already exists, convert it to an array
        if (!Array.isArray(obj[child.nodeName])) {
          obj[child.nodeName] = [obj[child.nodeName]];
        }
        obj[child.nodeName].push(childObj);
      } else {
        obj[child.nodeName] = childObj;
      }
    }
  });

  return obj;
};

const jsonToXml = (obj, indent = "") => {
  if (obj === null || obj === undefined) return "";

  let xml = "";

  const addNode = (name, content, nodeIndent) => {
    // Skip special property names
    if (name.startsWith("@") || name === "#text") return "";

    const hasAttributes = Object.keys(content).some((key) =>
      key.startsWith("@")
    );
    let xmlContent = "";

    // Add attributes
    let attributes = "";
    if (hasAttributes) {
      attributes = Object.entries(content)
        .filter(([key]) => key.startsWith("@"))
        .map(([key, value]) => `${key.slice(1)}="${value}"`)
        .join(" ");
      if (attributes) attributes = " " + attributes;
    }

    // Handle different content types
    if (typeof content === "object" && content !== null) {
      // Get text content if it exists
      const textContent = content["#text"] || "";

      // Get child elements
      const children = Object.entries(content)
        .filter(([key]) => !key.startsWith("@") && key !== "#text")
        .map(([key, value]) => addNode(key, value, nodeIndent + "  "))
        .join("");

      xmlContent = children || textContent;
    } else {
      xmlContent = String(content);
    }

    // Return formatted XML
    return `${nodeIndent}<${name}${attributes}>${
      xmlContent ? "\n" + xmlContent + nodeIndent : ""
    }${xmlContent ? "</" : "</"}${name}>\n`;
  };

  // Handle root object
  Object.entries(obj).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      // Handle arrays by creating multiple elements
      value.forEach((item) => {
        xml += addNode(key, item, indent);
      });
    } else {
      xml += addNode(key, value, indent);
    }
  });

  return `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`;
};

const validTools = [
  "csvToJson",
  "jsonToCsv",
  "yamlToJson",
  "jsonToYaml",
  "xmlToJson",
  "jsonToXml",
];
const defaultTool = "csvToJson";

const DataTools = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Add state for source and target formats
  const [sourceFormat, setSourceFormat] = useState("CSV");
  const [targetFormat, setTargetFormat] = useState("JSON");
  const [activeTab, setActiveTab] = useState(() => {
    const pathParam = location.pathname.split("/").pop();
    if (pathParam && pathParam.includes("To")) {
      return pathParam;
    }
    return searchParams.get("tool") || "csvToJson";
  });

  const [inputData, setInputData] = useState("");
  const [outputData, setOutputData] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [options, setOptions] = useState({
    header: true,
    skipEmptyLines: true,
    delimiter: ",",
    collapseDelimiters: false,
    customDelimiter: false,
  });

  const SPECIAL_DELIMITERS = {
    ",": "Comma (,)",
    "\t": "Tab (\\t)",
    " ": "Space ( )",
    ";": "Semicolon (;)",
    "|": "Pipe (|)",
  };

  // Detect file format from extension
  const detectFileFormat = useCallback((file) => {
    const extension = file.name.split(".").pop().toLowerCase();
    for (const [format, metadata] of Object.entries(SUPPORTED_FORMATS)) {
      if (
        metadata.extensions.some((ext) => ext.toLowerCase().includes(extension))
      ) {
        return format;
      }
    }
    return null;
  }, []);

  // Convert data function
  const convertData = useCallback(
    (input = inputData) => {
      if (!input) return;

      setLoading(true);
      setError("");

      try {
        let result = "";
        const currentOptions = {
          ...options,
          delimiter: options.delimiter || ",",
        };

        // Helper functions for conversions
        const parseToJson = (input, format) => {
          switch (format) {
            case "CSV":
              const parsedCsv = Papa.parse(input, currentOptions);
              if (parsedCsv.errors.length > 0) {
                throw new Error(parsedCsv.errors[0].message);
              }
              return parsedCsv.data;
            case "JSON":
              return JSON.parse(input);
            case "JSON5":
              return JSON5.parse(input);
            case "YAML":
              return yaml.load(input);
            case "XML":
              const parser = new DOMParser();
              const xmlDoc = parser.parseFromString(input, "text/xml");
              return xmlToJson(xmlDoc);
            default:
              throw new Error(`Unsupported input format: ${format}`);
          }
        };

        const convertFromJson = (data, format) => {
          switch (format) {
            case "CSV":
              return Papa.unparse(data, currentOptions);
            case "JSON":
              return JSON.stringify(data, null, 2);
            case "JSON5":
              return JSON5.stringify(data, null, 2);
            case "YAML":
              return yaml.dump(data);
            case "XML":
              return jsonToXml(data);
            case "MD_TABLE":
              const headers = Object.keys(data[0]);
              const rows = data.map((row) =>
                headers.map((header) => row[header])
              );
              return markdownTable([headers, ...rows]);
            case "HTML_TABLE":
              const tableHeaders = Object.keys(data[0]);
              const tableRows = data.map((row) =>
                tableHeaders.map((header) => row[header])
              );
              return `<table>
                <thead>
                  <tr>${tableHeaders.map((h) => `<th>${h}</th>`).join("")}</tr>
                </thead>
                <tbody>
                  ${tableRows
                    .map(
                      (row) =>
                        `<tr>${row
                          .map((cell) => `<td>${cell}</td>`)
                          .join("")}</tr>`
                    )
                    .join("\n")}
                </tbody>
              </table>`;
            default:
              throw new Error(`Unsupported output format: ${format}`);
          }
        };

        // Convert from source to JSON (if needed)
        let jsonData =
          sourceFormat === "JSON"
            ? JSON.parse(input)
            : parseToJson(input, sourceFormat);

        // Convert from JSON to target format
        result =
          targetFormat === "JSON"
            ? JSON.stringify(jsonData, null, 2)
            : convertFromJson(jsonData, targetFormat);

        setOutputData(result);
        setError("");
      } catch (error) {
        setError("Error converting data: " + error.message);
        setOutputData("");
      } finally {
        setLoading(false);
      }
    },
    [sourceFormat, targetFormat, options, inputData]
  );

  // Handle format changes
  const handleFormatChange = useCallback(
    (type, format) => {
      if (type === "source") {
        setSourceFormat(format);
        const newTab = `${format.toLowerCase()}To${targetFormat.toLowerCase()}`;
        setActiveTab(newTab);
        navigate(`/tools/data/${newTab}`);
      } else {
        setTargetFormat(format);
        const newTab = `${sourceFormat.toLowerCase()}To${format.toLowerCase()}`;
        setActiveTab(newTab);
        navigate(`/tools/data/${newTab}`);
      }
      setError("");
    },
    [sourceFormat, targetFormat, navigate]
  );

  // File drop handler
  const onDrop = useCallback(
    async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Detect and set the source format based on file type
      const detectedFormat = detectFileFormat(file);
      if (detectedFormat) {
        setSourceFormat(detectedFormat);
        const newTab = `${detectedFormat.toLowerCase()}To${targetFormat.toLowerCase()}`;
        setActiveTab(newTab);
        navigate(`/tools/data/${newTab}`);
      }

      setError("");
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          let content = e.target.result;

          // For Excel files, we need to process them differently
          if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
            const workbook = XLSX.read(content, { type: "binary" });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            content = XLSX.utils.sheet_to_csv(firstSheet);
          }

          setInputData(content);
          convertData(content);
        } catch (error) {
          setError("Error reading file: " + error.message);
        }
      };

      if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        reader.readAsBinaryString(file);
      } else {
        reader.readAsText(file);
      }
    },
    [targetFormat, detectFileFormat, navigate, convertData]
  );

  // Add dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: Object.values(SUPPORTED_FORMATS).reduce((acc, format) => {
      format.extensions.forEach((ext) => {
        format.mimeTypes.forEach((mime) => {
          if (!acc[mime]) acc[mime] = [];
          acc[mime].push(ext);
        });
      });
      return acc;
    }, {}),
    maxFiles: 1,
  });

  // Handle initial URL params
  useEffect(() => {
    const pathParam = location.pathname.split("/").pop();
    if (pathParam && pathParam.includes("To")) {
      const [source, target] = pathParam
        .split("To")
        .map((f) => f.toUpperCase());
      if (SUPPORTED_FORMATS[source] && SUPPORTED_FORMATS[target]) {
        setSourceFormat(source);
        setTargetFormat(target);
      }
    }
  }, [location]);

  // Effect to convert data when input changes
  useEffect(() => {
    if (inputData) {
      convertData(inputData);
    }
  }, [inputData, convertData]);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    } catch (err) {
      alert("Failed to copy text");
    }
  };

  const downloadOutput = () => {
    if (!outputData) return;

    let extension = ".txt";
    let type = "text/plain";

    switch (activeTab) {
      case "csvToJson":
      case "yamlToJson":
      case "xmlToJson":
        extension = ".json";
        type = "application/json";
        break;
      case "jsonToCsv":
        extension = ".csv";
        type = "text/csv";
        break;
      case "jsonToYaml":
        extension = ".yaml";
        type = "text/yaml";
        break;
      case "jsonToXml":
        extension = ".xml";
        type = "application/xml";
        break;
      default:
        extension = ".txt";
        type = "text/plain";
        break;
    }

    const blob = new Blob([outputData], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `converted${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderOptions = () => {
    const [sourceFormat] = activeTab.split("To").map((f) => f.toUpperCase());
    const format = SUPPORTED_FORMATS[sourceFormat];

    if (!format?.needsOptions) return null;

    const renderCheckbox = (checked, onChange, label) => (
      <label className="flex items-center hover:bg-gray-50 cursor-pointer transition-colors">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => {
            onChange(e.target.checked);
            if (inputData) convertData(inputData);
          }}
          className="mr-2 h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
        />
        <span className="text-sm text-gray-700">{label}</span>
      </label>
    );

    switch (sourceFormat) {
      case "CSV":
        return (
          <div className="flex flex-wrap gap-4 items-center justify-center">
            {/* Delimiter Selection */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Delimiter:
              </label>
              <select
                value={options.customDelimiter ? "custom" : options.delimiter}
                onChange={(e) => {
                  const value = e.target.value;
                  setOptions((prev) => ({
                    ...prev,
                    delimiter: value === "custom" ? prev.delimiter : value,
                    customDelimiter: value === "custom",
                  }));
                  if (inputData) convertData(inputData);
                }}
                className="text-sm border rounded-md bg-white focus:ring-primary-500 focus:border-primary-500 px-2 py-1"
              >
                {Object.entries(SPECIAL_DELIMITERS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
                <option value="custom">Custom...</option>
              </select>
              {options.customDelimiter && (
                <input
                  type="text"
                  value={options.delimiter}
                  onChange={(e) => {
                    setOptions((prev) => ({
                      ...prev,
                      delimiter: e.target.value,
                    }));
                    if (inputData) convertData(inputData);
                  }}
                  onBlur={() => {
                    if (inputData) convertData(inputData);
                  }}
                  className="w-12 px-2 py-1 border rounded-md text-sm bg-white focus:ring-primary-500 focus:border-primary-500"
                  maxLength={1}
                  placeholder="?"
                />
              )}
            </div>

            {/* Checkboxes */}
            <div className="flex flex-wrap items-center gap-4">
              {renderCheckbox(
                options.header,
                (checked) =>
                  setOptions((prev) => ({ ...prev, header: checked })),
                "First row is header"
              )}
              {renderCheckbox(
                options.skipEmptyLines,
                (checked) =>
                  setOptions((prev) => ({
                    ...prev,
                    skipEmptyLines: checked,
                  })),
                "Skip empty lines"
              )}
              {renderCheckbox(
                options.collapseDelimiters,
                (checked) =>
                  setOptions((prev) => ({
                    ...prev,
                    collapseDelimiters: checked,
                  })),
                "Treat multiple delimiters as one"
              )}
            </div>
          </div>
        );

      case "MD_TABLE":
      case "HTML_TABLE":
        return (
          <div className="flex justify-center">
            {renderCheckbox(
              options.header,
              (checked) => setOptions((prev) => ({ ...prev, header: checked })),
              "First row is header"
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const renderFormatSelection = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start mb-6">
      {/* Source Format Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          From
        </label>
        <select
          value={sourceFormat}
          onChange={(e) => handleFormatChange("source", e.target.value)}
          className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
        >
          {Object.keys(SUPPORTED_FORMATS).map((format) => (
            <option key={format} value={format}>
              {SUPPORTED_FORMATS[format].name}
            </option>
          ))}
        </select>
      </div>

      {/* Conversion Arrow */}
      <div className="flex items-center justify-center pt-8">
        <FaExchangeAlt className="text-2xl text-gray-400" />
      </div>

      {/* Target Format Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          To
        </label>
        <div className="relative">
          <select
            value={targetFormat}
            onChange={(e) => handleFormatChange("target", e.target.value)}
            className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
          >
            {Object.keys(SUPPORTED_FORMATS).map((format) => {
              const isSupported = isConversionSupported(sourceFormat, format);
              const isSameFormat = format === sourceFormat;
              const isDisabled = !isSupported || isSameFormat;

              return (
                <option
                  key={format}
                  value={format}
                  disabled={isDisabled}
                  className={`
                    ${isDisabled ? "text-gray-300 bg-gray-50" : ""}
                    ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"}
                  `}
                >
                  {SUPPORTED_FORMATS[format].name}
                  {!isSupported && " (Not Supported)"}
                  {isSameFormat && " (Same as Source)"}
                </option>
              );
            })}
          </select>
          {!isConversionSupported(sourceFormat, targetFormat) && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-8 pointer-events-none">
              <span className="text-red-500 text-sm bg-red-50 px-2 py-1 rounded">
                Not supported
              </span>
            </div>
          )}
        </div>
        {!isConversionSupported(sourceFormat, targetFormat) && (
          <p className="mt-1 text-sm text-red-500">
            Direct conversion from {SUPPORTED_FORMATS[sourceFormat].name} to{" "}
            {SUPPORTED_FORMATS[targetFormat].name} is not supported.
          </p>
        )}
      </div>
    </div>
  );

  return (
    <ToolLayout
      title="Data Conversion Tools"
      description="Convert between different data formats"
    >
      <div className="space-y-6">
        {/* Tool Selection */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h2 className="text-base font-medium text-gray-900 mb-4 text-center">
            Choose Conversion
          </h2>
          <div className="max-w-4xl mx-auto">{renderFormatSelection()}</div>
        </div>

        {/* CSV Options when needed */}
        {(activeTab === "csvToJson" || activeTab === "jsonToCsv") && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h2 className="text-base font-medium text-gray-900 mb-4 text-center">
              CSV Options
            </h2>
            <div className="max-w-2xl mx-auto">{renderOptions()}</div>
          </div>
        )}

        {/* File Upload and Text Input Area */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h2 className="text-base font-medium text-gray-900 mb-4">
            Input Data
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left side - File Upload */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors flex flex-col items-center justify-center ${
                  isDragActive
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-300 hover:border-primary-500"
                }`}
              >
                <input {...getInputProps()} />
                <FaUpload className="text-4xl mb-4 text-gray-400" />
                <p className="text-gray-600">
                  {isDragActive
                    ? "Drop the file here"
                    : "Drag & drop a file here, or click to select"}
                </p>
              </div>

              {/* Right side - Text Input */}
              <div className="border-2 border-gray-300 rounded-lg flex flex-col">
                <label className="text-sm font-medium text-gray-700 p-2 border-b">
                  Or paste your data here:
                </label>
                <textarea
                  value={inputData}
                  onChange={(e) => {
                    setInputData(e.target.value);
                    if (e.target.value) convertData(e.target.value);
                  }}
                  className="w-full flex-1 p-4 font-mono text-sm rounded-b-lg resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Enter or paste your data here..."
                />
              </div>
            </div>

            {/* Output Area */}
            {(inputData || error) && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-700">
                    Output
                  </label>
                  <div className="space-x-2">
                    <button
                      onClick={() => copyToClipboard(outputData)}
                      disabled={!outputData}
                      className="text-sm text-gray-600 hover:text-gray-800 disabled:text-gray-400"
                    >
                      <FaCopy className="inline mr-1" />
                      Copy
                    </button>
                    <button
                      onClick={downloadOutput}
                      disabled={!outputData}
                      className="text-sm text-gray-600 hover:text-gray-800 disabled:text-gray-400"
                    >
                      <FaDownload className="inline mr-1" />
                      Download
                    </button>
                  </div>
                </div>
                {error ? (
                  <div className="w-full h-40 p-4 border rounded bg-red-50 text-red-600">
                    {error}
                  </div>
                ) : (
                  <textarea
                    value={outputData}
                    readOnly
                    className="w-full h-40 p-4 border rounded font-mono text-sm bg-gray-50"
                    placeholder="Converted data will appear here..."
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};

export default DataTools;
