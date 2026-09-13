import React, { useEffect, useMemo, useState } from "react";
import { FaCopy } from "react-icons/fa";
import { copyText } from "../../../utils/tools/clipboard";
import { consumeSessionPayload } from "../../../utils/tools/session";

const FORMS = ["NFC", "NFD", "NFKC", "NFKD"];

/**
 * @param {unknown} payload
 * @returns {string | null}
 */
function extractSessionText(payload) {
  if (!payload || typeof payload !== "object") return null;
  if (typeof payload.text === "string" && payload.text.length > 0) {
    return payload.text;
  }
  return null;
}

/**
 * Iterate Unicode code points (handles surrogate pairs).
 * @param {string} text
 * @returns {{ char: string, codePoint: number, hex: string, utf8: string }[]}
 */
function breakdownCodePoints(text) {
  const encoder = new TextEncoder();
  /** @type {{ char: string, codePoint: number, hex: string, utf8: string }[]} */
  const rows = [];
  for (const char of text) {
    const codePoint = char.codePointAt(0);
    if (codePoint == null) continue;
    const hex = `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`;
    const utf8 = Array.from(encoder.encode(char))
      .map((b) => b.toString(16).toUpperCase().padStart(2, "0"))
      .join(" ");
    rows.push({ char, codePoint, hex, utf8 });
  }
  return rows;
}

/**
 * Escape text to \\uXXXX / \\u{XXXXX} sequences.
 * BMP → \\uXXXX; supplementary → \\u{XXXXX}.
 * @param {string} text
 * @returns {string}
 */
function escapeUnicode(text) {
  let out = "";
  for (const char of text) {
    const cp = char.codePointAt(0);
    if (cp == null) continue;
    if (cp <= 0xffff) {
      out += `\\u${cp.toString(16).toUpperCase().padStart(4, "0")}`;
    } else {
      out += `\\u{${cp.toString(16).toUpperCase()}}`;
    }
  }
  return out;
}

/**
 * Unescape \\uXXXX, \\u{XXXXX}, and common \\xHH / \\n-style escapes in a string literal sense.
 * Unknown backslash sequences are left as-is (backslash preserved).
 * @param {string} text
 * @returns {string}
 */
function unescapeUnicode(text) {
  return text.replace(
    /\\u\{([0-9a-fA-F]{1,6})\}|\\u([0-9a-fA-F]{4})|\\x([0-9a-fA-F]{2})|\\([\\"\\/bfnrt])/g,
    (match, braced, four, hex, simple) => {
      if (braced != null) {
        const cp = parseInt(braced, 16);
        if (cp > 0x10ffff) return match;
        return String.fromCodePoint(cp);
      }
      if (four != null) {
        return String.fromCharCode(parseInt(four, 16));
      }
      if (hex != null) {
        return String.fromCharCode(parseInt(hex, 16));
      }
      const map = {
        b: "\b",
        f: "\f",
        n: "\n",
        r: "\r",
        t: "\t",
        '"': '"',
        "\\": "\\",
        "/": "/",
      };
      return map[simple] ?? match;
    }
  );
}

export default function UnicodeTool() {
  const [input, setInput] = useState("");
  const [form, setForm] = useState("NFC");
  const [escaped, setEscaped] = useState("");
  const [unescaped, setUnescaped] = useState("");
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const payload = consumeSessionPayload();
    const text = extractSessionText(payload);
    if (text == null) return;
    setInput(text);
    setStatus("Loaded text from handoff");
  }, []);

  const normalized = useMemo(() => {
    if (!input) return "";
    try {
      return input.normalize(form);
    } catch {
      return input;
    }
  }, [input, form]);

  const formsPreview = useMemo(() => {
    if (!input) return [];
    return FORMS.map((f) => {
      let value = "";
      try {
        value = input.normalize(f);
      } catch {
        value = input;
      }
      return {
        form: f,
        value,
        changed: value !== input,
        length: [...value].length,
      };
    });
  }, [input]);

  const points = useMemo(() => breakdownCodePoints(normalized || input), [normalized, input]);

  const handleNormalizeApply = () => {
    setInput(normalized);
    setStatus(`Applied ${form} normalization to input`);
  };

  const handleEscape = () => {
    const result = escapeUnicode(input);
    setEscaped(result);
    setStatus("Escaped to \\u / \\u{} sequences");
  };

  const handleUnescape = () => {
    const source = escaped || input;
    const result = unescapeUnicode(source);
    setUnescaped(result);
    setStatus("Unescaped sequences");
  };

  const handleCopy = async (text, label) => {
    if (text == null || text === "") return;
    const ok = await copyText(text);
    setStatus(ok ? `Copied ${label}` : "Could not copy to clipboard");
  };

  const displayText = normalized || input;

  return (
    <div className="space-y-6" data-tool="unicode">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Input text
          </label>
          {input && (
            <button
              type="button"
              onClick={() => handleCopy(input, "input")}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600"
            >
              <FaCopy />
              Copy
            </button>
          )}
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full h-28 p-2 border rounded font-mono text-sm"
          placeholder="Paste text, combining marks, emoji…"
          spellCheck={false}
        />
      </div>

      {/* Normalization */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800">Normalize</h3>
        <div className="flex flex-wrap items-center gap-2">
          {FORMS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setForm(f)}
              className={`px-3 py-1.5 text-sm rounded border ${
                form === f
                  ? "bg-primary-600 text-white border-primary-600"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {f}
            </button>
          ))}
          <button
            type="button"
            onClick={handleNormalizeApply}
            disabled={!input || normalized === input}
            className={`ml-auto px-3 py-1.5 text-sm rounded ${
              !input || normalized === input
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-primary-600 text-white hover:bg-primary-700"
            }`}
          >
            Apply to input
          </button>
        </div>
        {input && (
          <div className="overflow-x-auto border rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Form</th>
                  <th className="px-3 py-2 font-medium">Result</th>
                  <th className="px-3 py-2 font-medium">Chars</th>
                  <th className="px-3 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {formsPreview.map((row) => (
                  <tr key={row.form} className="border-t">
                    <td className="px-3 py-2 font-mono font-medium">
                      {row.form}
                      {row.form === form ? " ★" : ""}
                    </td>
                    <td className="px-3 py-2 font-mono break-all max-w-md">
                      {row.value || <span className="text-gray-400">(empty)</span>}
                    </td>
                    <td className="px-3 py-2 text-gray-600">{row.length}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleCopy(row.value, row.form)}
                        className="text-gray-500 hover:text-primary-600 p-1"
                        title={`Copy ${row.form}`}
                      >
                        <FaCopy />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Code points */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            Code points
            {form && input ? (
              <span className="ml-2 text-sm font-normal text-gray-500">
                (from {form} result)
              </span>
            ) : null}
          </h3>
          {displayText && (
            <button
              type="button"
              onClick={() => handleCopy(displayText, "normalized text")}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600"
            >
              <FaCopy />
              Copy text
            </button>
          )}
        </div>
        {!displayText ? (
          <p className="text-sm text-gray-500">Enter text to see code points.</p>
        ) : (
          <div className="overflow-x-auto border rounded max-h-72 overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600 sticky top-0">
                <tr>
                  <th className="px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Char</th>
                  <th className="px-3 py-2 font-medium">Code point</th>
                  <th className="px-3 py-2 font-medium">UTF-8</th>
                </tr>
              </thead>
              <tbody>
                {points.map((row, idx) => (
                  <tr key={`${row.hex}-${idx}`} className="border-t">
                    <td className="px-3 py-1.5 text-gray-500">{idx + 1}</td>
                    <td className="px-3 py-1.5 font-mono text-lg leading-none">
                      {row.char === " " ? (
                        <span className="text-gray-400">␠</span>
                      ) : row.char === "\n" ? (
                        <span className="text-gray-400">⏎</span>
                      ) : row.char === "\t" ? (
                        <span className="text-gray-400">⇥</span>
                      ) : (
                        row.char
                      )}
                    </td>
                    <td className="px-3 py-1.5 font-mono">{row.hex}</td>
                    <td className="px-3 py-1.5 font-mono text-gray-600">
                      {row.utf8}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Escape / unescape */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800">
          Escape / unescape
        </h3>
        <p className="text-sm text-gray-600">
          Escape produces <code className="text-xs bg-gray-100 px-1 rounded">\uXXXX</code>{" "}
          for BMP and{" "}
          <code className="text-xs bg-gray-100 px-1 rounded">\u{"{XXXXX}"}</code>{" "}
          for supplementary planes. Unescape accepts both forms.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleEscape}
            disabled={!input}
            className={`px-4 py-2 rounded text-white ${
              !input
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-primary-600 hover:bg-primary-700"
            }`}
          >
            Escape input
          </button>
          <button
            type="button"
            onClick={handleUnescape}
            disabled={!escaped && !input}
            className={`px-4 py-2 rounded text-white ${
              !escaped && !input
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-primary-600 hover:bg-primary-700"
            }`}
          >
            Unescape
          </button>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Escaped
            </label>
            {escaped && (
              <button
                type="button"
                onClick={() => handleCopy(escaped, "escaped")}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600"
              >
                <FaCopy />
                Copy
              </button>
            )}
          </div>
          <textarea
            value={escaped}
            onChange={(e) => setEscaped(e.target.value)}
            className="w-full h-24 p-2 border rounded font-mono text-sm"
            placeholder="\u0048\u0065\u006C\u006C\u006F or \u{1F600}"
            spellCheck={false}
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Unescaped result
            </label>
            {unescaped && (
              <button
                type="button"
                onClick={() => handleCopy(unescaped, "unescaped")}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600"
              >
                <FaCopy />
                Copy
              </button>
            )}
          </div>
          <textarea
            value={unescaped}
            readOnly
            className="w-full h-24 p-2 border rounded font-mono text-sm bg-gray-50"
            placeholder="Unescaped text appears here…"
            spellCheck={false}
          />
        </div>
      </section>

      {status && (
        <p className="text-sm text-gray-600" role="status">
          {status}
        </p>
      )}
    </div>
  );
}
