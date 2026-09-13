import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCopy,
  FaDownload,
  FaExchangeAlt,
  FaExternalLinkAlt,
  FaTrash,
} from "react-icons/fa";
import { copyText } from "../../../utils/tools/clipboard";
import { downloadText } from "../../../utils/tools/download";
import { openToolWithPayload } from "../../../utils/tools/handoff";
import { consumeSessionPayload } from "../../../utils/tools/session";

/** Split into lines without dropping a trailing empty line after a final newline. */
function splitLines(text) {
  if (text == null || text === "") return [];
  const normalized = String(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return normalized.split("\n");
}

/**
 * Classic LCS line diff. Returns ops newest-first from the walk, then reversed.
 * Each op: { type: 'equal'|'add'|'remove', text, aLine?, bLine? }
 */
function diffLinesLcs(aLines, bLines) {
  const m = aLines.length;
  const n = bLines.length;
  /** @type {number[][]} */
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      if (aLines[i - 1] === bLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  /** @type {{ type: string, text: string, aLine?: number, bLine?: number }[]} */
  const ops = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && aLines[i - 1] === bLines[j - 1]) {
      ops.push({ type: "equal", text: aLines[i - 1], aLine: i, bLine: j });
      i -= 1;
      j -= 1;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push({ type: "add", text: bLines[j - 1], bLine: j });
      j -= 1;
    } else {
      ops.push({ type: "remove", text: aLines[i - 1], aLine: i });
      i -= 1;
    }
  }

  ops.reverse();
  return ops;
}

/**
 * Build a unified diff patch from LCS ops.
 * @param {{ type: string, text: string, aLine?: number, bLine?: number }[]} ops
 * @param {string} aLabel
 * @param {string} bLabel
 * @param {number} [context=3]
 */
function buildUnifiedPatch(ops, aLabel = "a", bLabel = "b", context = 3) {
  if (!ops.length) {
    return `--- ${aLabel}\n+++ ${bLabel}\n`;
  }

  const changeIndexes = [];
  ops.forEach((op, idx) => {
    if (op.type !== "equal") changeIndexes.push(idx);
  });

  if (changeIndexes.length === 0) {
    return `--- ${aLabel}\n+++ ${bLabel}\n`;
  }

  /** @type {{ start: number, end: number }[]} */
  const hunks = [];
  let hunkStart = Math.max(0, changeIndexes[0] - context);
  let hunkEnd = Math.min(ops.length - 1, changeIndexes[0] + context);

  for (let c = 1; c < changeIndexes.length; c += 1) {
    const idx = changeIndexes[c];
    const nextStart = Math.max(0, idx - context);
    if (nextStart <= hunkEnd + 1) {
      hunkEnd = Math.min(ops.length - 1, idx + context);
    } else {
      hunks.push({ start: hunkStart, end: hunkEnd });
      hunkStart = nextStart;
      hunkEnd = Math.min(ops.length - 1, idx + context);
    }
  }
  hunks.push({ start: hunkStart, end: hunkEnd });

  const lines = [`--- ${aLabel}`, `+++ ${bLabel}`];

  hunks.forEach(({ start, end }) => {
    let aStart = 0;
    let bStart = 0;
    let aCount = 0;
    let bCount = 0;
    const body = [];

    for (let i = start; i <= end; i += 1) {
      const op = ops[i];
      if (op.type === "equal") {
        if (!aStart && op.aLine) aStart = op.aLine;
        if (!bStart && op.bLine) bStart = op.bLine;
        aCount += 1;
        bCount += 1;
        body.push(` ${op.text}`);
      } else if (op.type === "remove") {
        if (!aStart && op.aLine) aStart = op.aLine;
        aCount += 1;
        body.push(`-${op.text}`);
      } else if (op.type === "add") {
        if (!bStart && op.bLine) bStart = op.bLine;
        bCount += 1;
        body.push(`+${op.text}`);
      }
    }

    // Find first a/b line numbers if hunk starts with only adds/removes
    if (!aStart) {
      for (let i = start; i <= end; i += 1) {
        if (ops[i].aLine) {
          aStart = ops[i].aLine;
          break;
        }
      }
    }
    if (!bStart) {
      for (let i = start; i <= end; i += 1) {
        if (ops[i].bLine) {
          bStart = ops[i].bLine;
          break;
        }
      }
    }
    if (!aStart) aStart = 1;
    if (!bStart) bStart = 1;

    lines.push(`@@ -${aStart},${aCount} +${bStart},${bCount} @@`);
    lines.push(...body);
  });

  return `${lines.join("\n")}\n`;
}

function tryPrettyJson(text) {
  const trimmed = String(text ?? "").trim();
  if (!trimmed) {
    return { ok: false, pretty: "", error: "Empty" };
  }
  try {
    const parsed = JSON.parse(trimmed);
    return {
      ok: true,
      pretty: `${JSON.stringify(parsed, null, 2)}\n`,
      error: null,
    };
  } catch (err) {
    return {
      ok: false,
      pretty: "",
      error: err instanceof Error ? err.message : "Invalid JSON",
    };
  }
}

const MODE_TEXT = "text";
const MODE_JSON = "json";

const DiffTool = () => {
  const navigate = useNavigate();
  const [paneA, setPaneA] = useState("");
  const [paneB, setPaneB] = useState("");
  const [mode, setMode] = useState(MODE_TEXT);
  const [showPatch, setShowPatch] = useState(false);
  const [status, setStatus] = useState(null);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);

  useEffect(() => {
    const payload = consumeSessionPayload();
    if (!payload) return;

    const text =
      payload.text != null
        ? String(payload.text)
        : payload.type === "file" && payload.text != null
          ? String(payload.text)
          : null;

    if (text == null && payload.type !== "text" && payload.type !== "json") {
      return;
    }

    if (payload.type === "json" || payload.type === "text" || text != null) {
      const value = text != null ? text : "";
      if (value) setPaneA(value);
      if (payload.type === "json") setMode(MODE_JSON);
      setStatus("Loaded text into pane A from handoff");
    }
  }, []);

  const prepared = useMemo(() => {
    if (mode === MODE_JSON) {
      const a = tryPrettyJson(paneA);
      const b = tryPrettyJson(paneB);
      return {
        aText: a.ok ? a.pretty : paneA,
        bText: b.ok ? b.pretty : paneB,
        aJsonOk: a.ok,
        bJsonOk: b.ok,
        aJsonError: a.error,
        bJsonError: b.error,
        bothJson: a.ok && b.ok,
      };
    }
    return {
      aText: paneA,
      bText: paneB,
      aJsonOk: null,
      bJsonOk: null,
      aJsonError: null,
      bJsonError: null,
      bothJson: false,
    };
  }, [paneA, paneB, mode]);

  const normalizeForCompare = useCallback(
    (line) => (ignoreWhitespace ? line.replace(/\s+/g, " ").trim() : line),
    [ignoreWhitespace]
  );

  const { ops, stats, patch } = useMemo(() => {
    const rawA = splitLines(prepared.aText);
    const rawB = splitLines(prepared.bText);

    // Preserve display text; compare with optional whitespace normalize via mapped keys
    const keyA = rawA.map(normalizeForCompare);
    const keyB = rawB.map(normalizeForCompare);

    // Diff on normalized keys, then reattach original display lines
    const keyOps = diffLinesLcs(keyA, keyB);

    // Rebuild with original line text by walking both sides
    let ai = 0;
    let bi = 0;
    /** @type {{ type: string, text: string, aLine?: number, bLine?: number }[]} */
    const displayOps = [];
    keyOps.forEach((op) => {
      if (op.type === "equal") {
        displayOps.push({
          type: "equal",
          text: rawA[ai],
          aLine: ai + 1,
          bLine: bi + 1,
        });
        ai += 1;
        bi += 1;
      } else if (op.type === "remove") {
        displayOps.push({
          type: "remove",
          text: rawA[ai],
          aLine: ai + 1,
        });
        ai += 1;
      } else {
        displayOps.push({
          type: "add",
          text: rawB[bi],
          bLine: bi + 1,
        });
        bi += 1;
      }
    });

    const added = displayOps.filter((o) => o.type === "add").length;
    const removed = displayOps.filter((o) => o.type === "remove").length;
    const equal = displayOps.filter((o) => o.type === "equal").length;

    const labelA = mode === MODE_JSON ? "a.json" : "a.txt";
    const labelB = mode === MODE_JSON ? "b.json" : "b.txt";
    const unified = buildUnifiedPatch(displayOps, labelA, labelB);

    return {
      ops: displayOps,
      stats: { added, removed, equal },
      patch: unified,
    };
  }, [prepared.aText, prepared.bText, normalizeForCompare, mode]);

  const hasContent = paneA.length > 0 || paneB.length > 0;
  const hasChanges = stats.added > 0 || stats.removed > 0;

  const handleSwap = () => {
    setPaneA(paneB);
    setPaneB(paneA);
    setStatus("Swapped panes A and B");
  };

  const handleClear = () => {
    setPaneA("");
    setPaneB("");
    setStatus(null);
  };

  const handleCopyPatch = async () => {
    if (!patch) return;
    const ok = await copyText(patch);
    setStatus(ok ? "Copied unified patch" : "Could not copy to clipboard");
  };

  const handleDownloadPatch = () => {
    if (!patch) return;
    downloadText(patch, "diff.patch", "text/x-diff");
    setStatus("Downloaded diff.patch");
  };

  const handleCopyResult = async () => {
    const text = showPatch ? patch : ops.map(formatOpLine).join("\n");
    const ok = await copyText(text);
    setStatus(ok ? "Copied diff output" : "Could not copy to clipboard");
  };

  const handoffText = useMemo(() => {
    if (mode === MODE_JSON && prepared.bothJson) {
      return prepared.bText || prepared.aText;
    }
    if (showPatch && patch) return patch;
    if (paneB) return paneB;
    return paneA;
  }, [mode, prepared, showPatch, patch, paneA, paneB]);

  const handleOpenInEditor = () => {
    if (!handoffText) return;
    const isJson =
      mode === MODE_JSON ||
      (() => {
        try {
          JSON.parse(handoffText);
          return true;
        } catch {
          return false;
        }
      })();

    openToolWithPayload({
      category: "data",
      toolId: "editor",
      payload: {
        type: isJson ? "json" : "text",
        text: handoffText,
      },
      navigate,
    });
  };

  return (
    <div className="space-y-6" data-tool="diff">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setMode(MODE_TEXT)}
              className={`px-3 py-1.5 text-sm ${
                mode === MODE_TEXT
                  ? "bg-primary-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Text
            </button>
            <button
              type="button"
              onClick={() => setMode(MODE_JSON)}
              className={`px-3 py-1.5 text-sm border-l border-gray-200 ${
                mode === MODE_JSON
                  ? "bg-primary-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              JSON
            </button>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none ml-1">
            <input
              type="checkbox"
              checked={ignoreWhitespace}
              onChange={(e) => setIgnoreWhitespace(e.target.checked)}
              className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
            />
            Ignore whitespace
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showPatch}
              onChange={(e) => setShowPatch(e.target.checked)}
              className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
            />
            Unified patch
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSwap}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50"
            title="Swap A and B"
          >
            <FaExchangeAlt />
            Swap
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={!hasContent}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FaTrash />
            Clear
          </button>
        </div>
      </div>

      {mode === MODE_JSON && (
        <div className="text-sm text-gray-600 bg-gray-50 border rounded px-3 py-2">
          {prepared.bothJson ? (
            <span>
              Both sides are valid JSON — comparing pretty-printed forms.
            </span>
          ) : (
            <span>
              JSON mode pretty-prints each side when valid.
              {!prepared.aJsonOk && paneA.trim() ? (
                <span className="text-amber-700"> Pane A: {prepared.aJsonError}.</span>
              ) : null}
              {!prepared.bJsonOk && paneB.trim() ? (
                <span className="text-amber-700"> Pane B: {prepared.bJsonError}.</span>
              ) : null}
              {!paneA.trim() && !paneB.trim() ? (
                <span> Paste JSON into A and B to compare structure.</span>
              ) : null}
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">A (original)</h3>
            <span className="text-xs text-gray-400">
              {splitLines(paneA).length} lines
            </span>
          </div>
          <textarea
            value={paneA}
            onChange={(e) => setPaneA(e.target.value)}
            className="w-full p-3 border rounded font-mono text-sm resize-y min-h-[14rem] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder={
              mode === MODE_JSON
                ? '{\n  "hello": "world"\n}'
                : "Paste original text…"
            }
            spellCheck={false}
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">B (modified)</h3>
            <span className="text-xs text-gray-400">
              {splitLines(paneB).length} lines
            </span>
          </div>
          <textarea
            value={paneB}
            onChange={(e) => setPaneB(e.target.value)}
            className="w-full p-3 border rounded font-mono text-sm resize-y min-h-[14rem] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder={
              mode === MODE_JSON
                ? '{\n  "hello": "there"\n}'
                : "Paste modified text…"
            }
            spellCheck={false}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-gray-600">
            {hasContent ? (
              <>
                <span className="text-emerald-700 font-medium">
                  +{stats.added}
                </span>
                <span className="mx-1 text-gray-300">/</span>
                <span className="text-rose-700 font-medium">
                  −{stats.removed}
                </span>
                <span className="mx-1 text-gray-300">/</span>
                <span className="text-gray-500">{stats.equal} unchanged</span>
              </>
            ) : (
              <span className="text-gray-400">Enter text in A and B to diff</span>
            )}
          </span>
          {status && (
            <span className="text-xs text-primary-700 bg-primary-50 px-2 py-1 rounded">
              {status}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyResult}
            disabled={!hasContent}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FaCopy />
            Copy
          </button>
          <button
            type="button"
            onClick={handleCopyPatch}
            disabled={!hasContent || !hasChanges}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FaCopy />
            Copy patch
          </button>
          <button
            type="button"
            onClick={handleDownloadPatch}
            disabled={!hasContent || !hasChanges}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FaDownload />
            Download patch
          </button>
          <button
            type="button"
            onClick={handleOpenInEditor}
            disabled={!handoffText}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Open result in Data → JSON / YAML / TOML editor"
          >
            <FaExternalLinkAlt />
            Open in editor
          </button>
        </div>
      </div>

      <div className="border rounded overflow-hidden bg-white">
        <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">
            {showPatch ? "Unified patch" : "Visual diff"}
          </h3>
          {!hasChanges && hasContent && (
            <span className="text-xs text-emerald-700">Identical</span>
          )}
        </div>

        {showPatch ? (
          <pre className="p-3 font-mono text-xs sm:text-sm overflow-x-auto whitespace-pre max-h-[28rem] overflow-y-auto text-gray-800 bg-gray-50">
            {hasContent ? patch : "—"}
          </pre>
        ) : (
          <div className="font-mono text-xs sm:text-sm max-h-[28rem] overflow-auto">
            {!hasContent ? (
              <p className="p-4 text-gray-400 text-sm">Diff output appears here.</p>
            ) : (
              <table className="w-full border-collapse">
                <tbody>
                  {ops.map((op, idx) => {
                    const rowClass =
                      op.type === "add"
                        ? "bg-emerald-50 text-emerald-900"
                        : op.type === "remove"
                          ? "bg-rose-50 text-rose-900"
                          : "bg-white text-gray-700";
                    const marker =
                      op.type === "add" ? "+" : op.type === "remove" ? "−" : " ";
                    const markerClass =
                      op.type === "add"
                        ? "text-emerald-600"
                        : op.type === "remove"
                          ? "text-rose-600"
                          : "text-gray-300";

                    return (
                      <tr key={`${idx}-${op.type}-${op.aLine ?? ""}-${op.bLine ?? ""}`} className={rowClass}>
                        <td className="w-10 select-none text-right pr-2 pl-2 py-0.5 text-gray-400 border-r border-gray-100 align-top tabular-nums">
                          {op.aLine ?? ""}
                        </td>
                        <td className="w-10 select-none text-right pr-2 pl-2 py-0.5 text-gray-400 border-r border-gray-100 align-top tabular-nums">
                          {op.bLine ?? ""}
                        </td>
                        <td
                          className={`w-6 select-none text-center py-0.5 font-semibold align-top ${markerClass}`}
                        >
                          {marker}
                        </td>
                        <td className="py-0.5 pr-3 pl-1 whitespace-pre-wrap break-all align-top">
                          {op.text === "" ? "\u00a0" : op.text}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

function formatOpLine(op) {
  if (op.type === "add") return `+ ${op.text}`;
  if (op.type === "remove") return `- ${op.text}`;
  return `  ${op.text}`;
}

export default DiffTool;
