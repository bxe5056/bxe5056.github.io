import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCheck,
  FaCopy,
  FaDownload,
  FaExchangeAlt,
  FaExternalLinkAlt,
  FaMagic,
  FaSearch,
  FaCompressAlt,
} from "react-icons/fa";
import { copyText } from "../../../utils/tools/clipboard";
import { downloadText } from "../../../utils/tools/download";
import { openToolWithPayload } from "../../../utils/tools/handoff";
import { consumeSessionPayload } from "../../../utils/tools/session";

const FORMATS = ["JSON", "YAML", "TOML"];

const MIME = {
  JSON: "application/json",
  YAML: "text/yaml",
  TOML: "application/toml",
};

const EXT = {
  JSON: "json",
  YAML: "yaml",
  TOML: "toml",
};

let yamlPromise;
let tomlPromise;

function loadYaml() {
  if (!yamlPromise) {
    yamlPromise = import("js-yaml").then((m) => m.default ?? m);
  }
  return yamlPromise;
}

function loadToml() {
  if (!tomlPromise) {
    tomlPromise = import("smol-toml");
  }
  return tomlPromise;
}

/**
 * @param {unknown} err
 * @returns {{ message: string, line: number | null }}
 */
function normalizeError(err) {
  if (!err) return { message: "Unknown error", line: null };

  const message =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "Parse error";

  let line = null;

  if (typeof err === "object") {
    const mark = /** @type {{ line?: number, lineno?: number }} */ (err).mark;
    if (mark && typeof mark.line === "number") {
      // js-yaml mark.line is 0-based
      line = mark.line + 1;
    } else if (typeof /** @type {{ line?: number }} */ (err).line === "number") {
      line = /** @type {{ line: number }} */ (err).line;
    } else if (
      typeof /** @type {{ lineno?: number }} */ (err).lineno === "number"
    ) {
      line = /** @type {{ lineno: number }} */ (err).lineno;
    }
  }

  if (line == null) {
    const posMatch = message.match(/at position\s+(\d+)/i);
    const lineMatch = message.match(/line\s+(\d+)/i);
    if (lineMatch) {
      line = Number(lineMatch[1]);
    } else if (posMatch) {
      // JSON.parse: position → approximate line from content is done by callers
      line = null;
    }
  }

  return { message, line };
}

/**
 * Estimate line number from a JSON.parse "position N" message.
 * @param {string} text
 * @param {string} message
 * @returns {number | null}
 */
function lineFromJsonPosition(text, message) {
  const m = message.match(/position\s+(\d+)/i);
  if (!m) return null;
  const pos = Number(m[1]);
  if (!Number.isFinite(pos) || pos < 0) return null;
  let line = 1;
  const end = Math.min(pos, text.length);
  for (let i = 0; i < end; i += 1) {
    if (text[i] === "\n") line += 1;
  }
  return line;
}

/**
 * @param {string} format
 * @param {string} text
 * @returns {Promise<{ ok: true, data: unknown } | { ok: false, message: string, line: number | null }>}
 */
async function parseDocument(format, text) {
  const trimmed = String(text ?? "");
  if (!trimmed.trim()) {
    return { ok: false, message: "Document is empty", line: null };
  }

  try {
    if (format === "JSON") {
      try {
        return { ok: true, data: JSON.parse(trimmed) };
      } catch (err) {
        const normalized = normalizeError(err);
        const line =
          normalized.line ?? lineFromJsonPosition(trimmed, normalized.message);
        return { ok: false, message: normalized.message, line };
      }
    }

    if (format === "YAML") {
      const yaml = await loadYaml();
      try {
        const data = yaml.load(trimmed);
        return { ok: true, data };
      } catch (err) {
        return { ok: false, ...normalizeError(err) };
      }
    }

    if (format === "TOML") {
      const toml = await loadToml();
      try {
        return { ok: true, data: toml.parse(trimmed) };
      } catch (err) {
        return { ok: false, ...normalizeError(err) };
      }
    }

    return { ok: false, message: `Unsupported format: ${format}`, line: null };
  } catch (err) {
    return { ok: false, ...normalizeError(err) };
  }
}

/**
 * @param {string} format
 * @param {unknown} data
 * @param {{ minify?: boolean }} [options]
 * @returns {Promise<string>}
 */
async function serializeDocument(format, data, options = {}) {
  const minify = Boolean(options.minify);

  if (format === "JSON") {
    return minify
      ? JSON.stringify(data)
      : `${JSON.stringify(data, null, 2)}\n`;
  }

  if (format === "YAML") {
    const yaml = await loadYaml();
    const dumped = yaml.dump(data, {
      indent: minify ? 0 : 2,
      lineWidth: minify ? -1 : 80,
      noRefs: true,
      sortingKeys: false,
    });
    return minify ? dumped.replace(/\n+/g, "\n").trim() : dumped;
  }

  if (format === "TOML") {
    const toml = await loadToml();
    // smol-toml stringify; minify by collapsing blank lines
    const dumped = toml.stringify(data);
    if (!minify) return dumped.endsWith("\n") ? dumped : `${dumped}\n`;
    return dumped
      .split("\n")
      .map((line) => line.trimEnd())
      .filter((line, idx, arr) => {
        if (line !== "") return true;
        // drop consecutive blank lines
        return idx > 0 && arr[idx - 1] !== "";
      })
      .join("\n")
      .trim();
  }

  throw new Error(`Unsupported format: ${format}`);
}

/**
 * jq-lite: `.foo.bar`, `.items[0].name`, bare `keys`, `.foo | keys`
 * @param {unknown} root
 * @param {string} query
 * @returns {{ ok: true, value: unknown } | { ok: false, message: string }}
 */
function evalJqLite(root, query) {
  const raw = String(query ?? "").trim();
  if (!raw) {
    return { ok: false, message: "Enter a path like .foo.bar or keys" };
  }

  // Optional trailing `| keys`
  let wantKeys = false;
  let pathPart = raw;
  const pipeKeys = raw.match(/^(.*?)\s*\|\s*keys\s*$/i);
  if (pipeKeys) {
    pathPart = pipeKeys[1].trim() || ".";
    wantKeys = true;
  } else if (/^keys$/i.test(raw)) {
    pathPart = ".";
    wantKeys = true;
  }

  if (pathPart === "." || pathPart === "") {
    const value = wantKeys ? objectKeys(root) : root;
    if (wantKeys && value === null) {
      return { ok: false, message: "keys requires an object or array" };
    }
    return { ok: true, value };
  }

  if (!pathPart.startsWith(".")) {
    return {
      ok: false,
      message: "Path must start with . (e.g. .foo.bar) or be keys",
    };
  }

  /** @type {unknown} */
  let cur = root;
  const body = pathPart.slice(1);
  /** @type {{ type: 'key' | 'index', value: string | number }[]} */
  const segments = [];
  const simple = body.match(
    /([A-Za-z_][\w-]*)|\[(\d+)\]|\["((?:\\.|[^"\\])*)"\]|\['((?:\\.|[^'\\])*)'\]/g
  );

  if (!simple || simple.length === 0) {
    return { ok: false, message: `Could not parse path: ${pathPart}` };
  }

  for (const seg of simple) {
    if (seg.startsWith("[")) {
      if (/^\[\d+\]$/.test(seg)) {
        segments.push({ type: "index", value: Number(seg.slice(1, -1)) });
      } else if (seg.startsWith('["') && seg.endsWith('"]')) {
        segments.push({
          type: "key",
          value: JSON.parse(`"${seg.slice(2, -2)}"`),
        });
      } else if (seg.startsWith("['") && seg.endsWith("']")) {
        segments.push({ type: "key", value: seg.slice(2, -2) });
      } else {
        return { ok: false, message: `Unsupported segment: ${seg}` };
      }
    } else {
      segments.push({ type: "key", value: seg });
    }
  }

  for (const seg of segments) {
    if (cur == null || (typeof cur !== "object" && !Array.isArray(cur))) {
      return {
        ok: false,
        message: `Cannot read ${
          seg.type === "index" ? `[${seg.value}]` : `.${seg.value}`
        } on ${cur === null ? "null" : typeof cur}`,
      };
    }
    if (seg.type === "index") {
      if (!Array.isArray(cur)) {
        return { ok: false, message: `Expected array before [${seg.value}]` };
      }
      cur = cur[seg.value];
    } else {
      cur = /** @type {Record<string, unknown>} */ (cur)[seg.value];
    }
  }

  if (wantKeys) {
    const keys = objectKeys(cur);
    if (keys === null) {
      return { ok: false, message: "keys requires an object or array at path" };
    }
    return { ok: true, value: keys };
  }

  return { ok: true, value: cur };
}

/**
 * @param {unknown} value
 * @returns {string[] | number[] | null}
 */
function objectKeys(value) {
  if (Array.isArray(value)) {
    return value.map((_, i) => i);
  }
  if (value != null && typeof value === "object") {
    return Object.keys(/** @type {object} */ (value));
  }
  return null;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function formatQueryResult(value) {
  if (typeof value === "string") return value;
  try {
    return `${JSON.stringify(value, null, 2)}\n`;
  } catch {
    return String(value);
  }
}

/**
 * Guess format from session payload / content heuristics.
 * @param {string} text
 * @param {string | undefined} hint
 * @returns {typeof FORMATS[number]}
 */
function guessFormat(text, hint) {
  const h = String(hint || "").toLowerCase();
  if (h.includes("yaml") || h.includes("yml")) return "YAML";
  if (h.includes("toml")) return "TOML";
  if (h.includes("json")) return "JSON";

  const t = String(text ?? "").trim();
  if (!t) return "JSON";
  if (t.startsWith("{") || t.startsWith("[")) return "JSON";
  if (/^---\s*$/m.test(t) || /^[\w.-]+\s*:\s*\S/m.test(t)) {
    // Prefer YAML for colon maps; TOML often has [tables]
    if (/^\s*\[[^\]]+\]\s*$/m.test(t) && /=/.test(t)) return "TOML";
    return "YAML";
  }
  if (/^\s*\[[^\]]+\]\s*$/m.test(t) || /^[\w.-]+\s*=\s*/m.test(t)) {
    return "TOML";
  }
  return "JSON";
}

const SAMPLE = `{
  "foo": {
    "bar": 42
  },
  "items": [
    { "name": "alpha" },
    { "name": "beta" }
  ]
}
`;

const StructuredEditorTool = () => {
  const navigate = useNavigate();
  const [format, setFormat] = useState("JSON");
  const [text, setText] = useState(SAMPLE);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState(".foo.bar");
  const [queryResult, setQueryResult] = useState("");
  const [queryError, setQueryError] = useState(null);
  const [convertTarget, setConvertTarget] = useState("YAML");

  useEffect(() => {
    const payload = consumeSessionPayload();
    if (!payload || typeof payload !== "object") return;

    const incoming =
      payload.text != null
        ? String(payload.text)
        : payload.type === "file" && payload.text != null
          ? String(payload.text)
          : null;

    if (incoming == null) {
      if (payload.type !== "text" && payload.type !== "json") return;
      return;
    }

    if (
      payload.type === "json" ||
      payload.type === "text" ||
      payload.type === "file" ||
      incoming
    ) {
      if (!incoming) return;
      setText(incoming);
      const nextFormat = guessFormat(
        incoming,
        payload.mime || payload.fileName || payload.type
      );
      setFormat(nextFormat);
      setConvertTarget(
        FORMATS.find((f) => f !== nextFormat) || "YAML"
      );
      setStatus(`Loaded ${nextFormat} from handoff`);
      setError(null);
    }
  }, []);

  const otherFormats = useMemo(
    () => FORMATS.filter((f) => f !== format),
    [format]
  );

  useEffect(() => {
    if (!otherFormats.includes(convertTarget)) {
      setConvertTarget(otherFormats[0] || "YAML");
    }
  }, [format, otherFormats, convertTarget]);

  const flash = useCallback((msg) => {
    setStatus(msg);
  }, []);

  const runValidate = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await parseDocument(format, text);
      if (result.ok) {
        flash("Valid");
        setError(null);
      } else {
        setError(result);
        flash(null);
      }
    } finally {
      setBusy(false);
    }
  }, [format, text, flash]);

  const runFormat = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await parseDocument(format, text);
      if (!result.ok) {
        setError(result);
        return;
      }
      const pretty = await serializeDocument(format, result.data, {
        minify: false,
      });
      setText(pretty);
      flash("Formatted");
    } catch (err) {
      setError(normalizeError(err));
    } finally {
      setBusy(false);
    }
  }, [format, text, flash]);

  const runMinify = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await parseDocument(format, text);
      if (!result.ok) {
        setError(result);
        return;
      }
      const min = await serializeDocument(format, result.data, {
        minify: true,
      });
      setText(min);
      flash("Minified");
    } catch (err) {
      setError(normalizeError(err));
    } finally {
      setBusy(false);
    }
  }, [format, text, flash]);

  const runConvert = useCallback(async () => {
    if (convertTarget === format) return;
    setBusy(true);
    setError(null);
    try {
      const result = await parseDocument(format, text);
      if (!result.ok) {
        setError(result);
        return;
      }
      // TOML cannot represent root arrays / primitives the same way
      if (
        convertTarget === "TOML" &&
        (Array.isArray(result.data) ||
          result.data == null ||
          typeof result.data !== "object")
      ) {
        setError({
          message:
            "TOML requires a root object (not an array or primitive). Wrap data first.",
          line: null,
        });
        return;
      }
      const out = await serializeDocument(convertTarget, result.data, {
        minify: false,
      });
      setText(out);
      setFormat(convertTarget);
      flash(`Converted ${format} → ${convertTarget}`);
    } catch (err) {
      setError({
        ...normalizeError(err),
        message: `Convert failed: ${normalizeError(err).message}`,
      });
    } finally {
      setBusy(false);
    }
  }, [convertTarget, format, text, flash]);

  const runQuery = useCallback(async () => {
    setQueryError(null);
    setBusy(true);
    try {
      const result = await parseDocument(format, text);
      if (!result.ok) {
        setError(result);
        setQueryError(result.message);
        return;
      }
      const q = evalJqLite(result.data, query);
      if (!q.ok) {
        setQueryError(q.message);
        setQueryResult("");
        return;
      }
      setQueryResult(formatQueryResult(q.value));
      flash("Query applied");
    } finally {
      setBusy(false);
    }
  }, [format, text, query, flash]);

  const handleCopy = async () => {
    const ok = await copyText(text);
    flash(ok ? "Copied document" : "Could not copy");
  };

  const handleCopyQuery = async () => {
    if (!queryResult) return;
    const ok = await copyText(queryResult);
    flash(ok ? "Copied query result" : "Could not copy");
  };

  const handleDownload = () => {
    downloadText(
      text,
      `document.${EXT[format] || "txt"}`,
      MIME[format] || "text/plain"
    );
    flash(`Downloaded document.${EXT[format]}`);
  };

  const handleOpenInDiff = () => {
    if (!text.trim()) return;
    openToolWithPayload({
      category: "text",
      toolId: "diff",
      payload: {
        type: format === "JSON" ? "json" : "text",
        text,
      },
      navigate,
    });
  };

  const handleOpenInText = () => {
    if (!text.trim()) return;
    openToolWithPayload({
      category: "text",
      toolId: "case",
      payload: { type: "text", text },
      navigate,
    });
  };

  const applyQueryToEditor = () => {
    if (!queryResult) return;
    setText(queryResult);
    setFormat("JSON");
    flash("Replaced editor with query result (JSON)");
  };

  const lineCount = useMemo(
    () => (text ? text.replace(/\r\n/g, "\n").split("\n").length : 0),
    [text]
  );

  return (
    <div className="space-y-6" data-tool="structured-editor">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded border border-gray-200 overflow-hidden">
          {FORMATS.map((f, idx) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                setFormat(f);
                setError(null);
              }}
              className={`px-3 py-1.5 text-sm ${
                idx > 0 ? "border-l border-gray-200" : ""
              } ${
                format === f
                  ? "bg-primary-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={runValidate}
            disabled={busy || !text.trim()}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FaCheck />
            Validate
          </button>
          <button
            type="button"
            onClick={runFormat}
            disabled={busy || !text.trim()}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FaMagic />
            Format
          </button>
          <button
            type="button"
            onClick={runMinify}
            disabled={busy || !text.trim()}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FaCompressAlt />
            Minify
          </button>
        </div>
      </div>

      {(error || status) && (
        <div
          className={`text-sm border rounded px-3 py-2 ${
            error
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-primary-50 border-primary-100 text-primary-800"
          }`}
        >
          {error ? (
            <span>
              {error.line != null ? (
                <span className="font-medium">Line {error.line}: </span>
              ) : null}
              {error.message}
            </span>
          ) : (
            status
          )}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700">Document</h3>
          <span className="text-xs text-gray-400">{lineCount} lines</span>
        </div>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
          className="w-full p-3 border rounded font-mono text-sm resize-y min-h-[18rem] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder={`Paste ${format} here…`}
          spellCheck={false}
          aria-label={`${format} document editor`}
        />
      </div>

      <div className="flex flex-wrap items-end gap-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">
            Convert to
          </label>
          <select
            value={convertTarget}
            onChange={(e) => setConvertTarget(e.target.value)}
            className="px-3 py-2 border rounded text-sm bg-white"
          >
            {otherFormats.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={runConvert}
          disabled={busy || !text.trim() || convertTarget === format}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FaExchangeAlt />
          Convert {format} → {convertTarget}
        </button>

        <div className="flex-1" />

        <button
          type="button"
          onClick={handleCopy}
          disabled={!text}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed bg-white"
        >
          <FaCopy />
          Copy
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={!text}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed bg-white"
        >
          <FaDownload />
          Download
        </button>
        <button
          type="button"
          onClick={handleOpenInDiff}
          disabled={!text.trim()}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed bg-white"
          title="Open in Text → Diff"
        >
          <FaExternalLinkAlt />
          Open in Diff
        </button>
        <button
          type="button"
          onClick={handleOpenInText}
          disabled={!text.trim()}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed bg-white"
          title="Open in Text tools"
        >
          <FaExternalLinkAlt />
          Open in Text
        </button>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-gray-700">
            jq-lite path query
          </h3>
          <span className="text-xs text-gray-400">
            `.foo.bar` · `.items[0].name` · `keys` · `.foo | keys`
          </span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                runQuery();
              }
            }}
            className="flex-1 px-3 py-2 border rounded font-mono text-sm"
            placeholder=".items[0].name"
            spellCheck={false}
            aria-label="jq-lite query"
          />
          <button
            type="button"
            onClick={runQuery}
            disabled={busy || !text.trim()}
            className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FaSearch />
            Query
          </button>
        </div>
        {queryError && (
          <p className="text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded px-3 py-2">
            {queryError}
          </p>
        )}
        {queryResult !== "" && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopyQuery}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 border rounded hover:bg-gray-50"
              >
                <FaCopy />
                Copy result
              </button>
              <button
                type="button"
                onClick={applyQueryToEditor}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 border rounded hover:bg-gray-50"
              >
                Use as document
              </button>
            </div>
            <pre className="p-3 font-mono text-xs sm:text-sm overflow-auto max-h-64 bg-gray-50 border rounded text-gray-800 whitespace-pre-wrap break-all">
              {queryResult}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default StructuredEditorTool;
