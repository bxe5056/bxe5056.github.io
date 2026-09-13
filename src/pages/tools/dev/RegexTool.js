import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  FaArrowDown,
  FaArrowUp,
  FaCopy,
  FaInfoCircle,
  FaPlus,
  FaTrash,
} from "react-icons/fa";
import ToolScaffold from "../../../components/tools/ToolScaffold";
import { copyText } from "../../../utils/tools/clipboard";
import { consumeSessionPayload } from "../../../utils/tools/session";

const REGEX_CHEATSHEET = [
  { token: ".", desc: "Any character except newline" },
  { token: "\\d", desc: "Digit (0–9)" },
  { token: "\\w", desc: "Word character [A-Za-z0-9_]" },
  { token: "\\s", desc: "Whitespace" },
  { token: "\\D / \\W / \\S", desc: "Negated digit / word / space" },
  { token: "^ / $", desc: "Start / end of string (or line with m)" },
  { token: "*", desc: "0 or more" },
  { token: "+", desc: "1 or more" },
  { token: "?", desc: "0 or 1 (optional)" },
  { token: "{n,m}", desc: "Between n and m times" },
  { token: "a|b", desc: "Alternation (a or b)" },
  { token: "[abc]", desc: "Character class" },
  { token: "[^abc]", desc: "Negated class" },
  { token: "(…)", desc: "Capturing group" },
  { token: "(?:…)", desc: "Non-capturing group" },
  { token: "(?<name>…)", desc: "Named capturing group" },
  { token: "\\1 / $1", desc: "Backreference / replace group" },
  { token: "(?=…) / (?!…)", desc: "Positive / negative lookahead" },
  { token: "g i m s u y", desc: "Common flags" },
];

const FLAG_OPTIONS = [
  {
    id: "g",
    label: "Global (g)",
    title: "Global",
    description: "Find all matches, not just the first",
  },
  {
    id: "i",
    label: "Ignore case (i)",
    title: "Ignore case",
    description: "Case-insensitive matching",
  },
  {
    id: "m",
    label: "Multiline (m)",
    title: "Multiline",
    description: "^ and $ match line starts/ends",
  },
  {
    id: "s",
    label: "DotAll (s)",
    title: "DotAll",
    description: ". matches newline characters",
  },
  {
    id: "u",
    label: "Unicode (u)",
    title: "Unicode",
    description: "Pattern as Unicode code points",
  },
  {
    id: "y",
    label: "Sticky (y)",
    title: "Sticky",
    description: "Match only from lastIndex",
  },
];

/** @typedef {"literal"|"any"|"digit"|"word"|"space"|"oneOrMore"|"optional"|"repeat"|"group"|"class"|"negClass"|"start"|"end"|"alt"} BlockType */

const BLOCK_PALETTE = [
  {
    type: "literal",
    label: "Literal",
    hint: "Exact text",
    defaults: { value: "abc" },
  },
  {
    type: "any",
    label: "Any char",
    hint: ".",
    defaults: {},
  },
  {
    type: "digit",
    label: "Digit",
    hint: "\\d",
    defaults: {},
  },
  {
    type: "word",
    label: "Word",
    hint: "\\w",
    defaults: {},
  },
  {
    type: "space",
    label: "Whitespace",
    hint: "\\s",
    defaults: {},
  },
  {
    type: "oneOrMore",
    label: "One or more",
    hint: "+",
    defaults: {},
  },
  {
    type: "optional",
    label: "Optional",
    hint: "?",
    defaults: {},
  },
  {
    type: "repeat",
    label: "Repeat",
    hint: "{n,m}",
    defaults: { min: 1, max: 3 },
  },
  {
    type: "group",
    label: "Group",
    hint: "()",
    defaults: { value: "..." },
  },
  {
    type: "class",
    label: "Char class",
    hint: "[abc]",
    defaults: { value: "abc" },
  },
  {
    type: "negClass",
    label: "Negated class",
    hint: "[^abc]",
    defaults: { value: "abc" },
  },
  {
    type: "start",
    label: "Start",
    hint: "^",
    defaults: {},
  },
  {
    type: "end",
    label: "End",
    hint: "$",
    defaults: {},
  },
  {
    type: "alt",
    label: "Alternation",
    hint: "|",
    defaults: {},
  },
];

let blockIdCounter = 0;
function nextBlockId() {
  blockIdCounter += 1;
  return `b${blockIdCounter}`;
}

/**
 * Escape a string for use as a regex literal.
 * @param {string} text
 * @returns {string}
 */
export function escapeRegexLiteral(text) {
  return String(text ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * @param {{ type: BlockType, value?: string, min?: number, max?: number }} block
 * @returns {string}
 */
function blockToPattern(block) {
  switch (block.type) {
    case "literal":
      return escapeRegexLiteral(block.value ?? "");
    case "any":
      return ".";
    case "digit":
      return "\\d";
    case "word":
      return "\\w";
    case "space":
      return "\\s";
    case "oneOrMore":
      return "+";
    case "optional":
      return "?";
    case "repeat": {
      const min = Math.max(0, Number(block.min) || 0);
      const maxRaw = block.max;
      if (maxRaw === "" || maxRaw == null) return `{${min},}`;
      const max = Math.max(min, Number(maxRaw) || min);
      if (min === max) return `{${min}}`;
      return `{${min},${max}}`;
    }
    case "group":
      return `(${block.value ?? ""})`;
    case "class":
      return `[${block.value ?? ""}]`;
    case "negClass":
      return `[^${block.value ?? ""}]`;
    case "start":
      return "^";
    case "end":
      return "$";
    case "alt":
      return "|";
    default:
      return "";
  }
}

/**
 * @param {Array<{ type: BlockType, value?: string, min?: number, max?: number }>} blocks
 * @returns {string}
 */
function blocksToPattern(blocks) {
  return blocks.map(blockToPattern).join("");
}

/**
 * Best-effort parse of a simple pattern into builder blocks.
 * Returns null when the pattern is too complex to represent.
 * @param {string} pattern
 * @returns {Array<object> | null}
 */
function patternToBlocks(pattern) {
  const src = String(pattern ?? "");
  if (!src) return [];

  const blocks = [];
  let i = 0;

  const push = (type, extra = {}) => {
    blocks.push({ id: nextBlockId(), type, ...extra });
  };

  while (i < src.length) {
    const ch = src[i];

    if (ch === "\\") {
      const next = src[i + 1];
      if (next === "d") {
        push("digit");
        i += 2;
        continue;
      }
      if (next === "w") {
        push("word");
        i += 2;
        continue;
      }
      if (next === "s") {
        push("space");
        i += 2;
        continue;
      }
      if (next != null) {
        // Escaped literal character
        push("literal", { value: next });
        i += 2;
        continue;
      }
      return null;
    }

    if (ch === ".") {
      push("any");
      i += 1;
      continue;
    }
    if (ch === "+") {
      push("oneOrMore");
      i += 1;
      continue;
    }
    if (ch === "?") {
      push("optional");
      i += 1;
      continue;
    }
    if (ch === "^") {
      push("start");
      i += 1;
      continue;
    }
    if (ch === "$") {
      push("end");
      i += 1;
      continue;
    }
    if (ch === "|") {
      push("alt");
      i += 1;
      continue;
    }

    if (ch === "{") {
      const close = src.indexOf("}", i + 1);
      if (close < 0) return null;
      const inside = src.slice(i + 1, close);
      const m = inside.match(/^(\d+)(,(\d*))?$/);
      if (!m) return null;
      const min = Number(m[1]);
      const max = m[2] == null ? min : m[3] === "" ? "" : Number(m[3]);
      push("repeat", { min, max });
      i = close + 1;
      continue;
    }

    if (ch === "(") {
      let depth = 1;
      let j = i + 1;
      while (j < src.length && depth > 0) {
        if (src[j] === "\\" && j + 1 < src.length) {
          j += 2;
          continue;
        }
        if (src[j] === "(") depth += 1;
        else if (src[j] === ")") depth -= 1;
        if (depth > 0) j += 1;
      }
      if (depth !== 0) return null;
      const inner = src.slice(i + 1, j);
      // Skip advanced group forms we can't edit in the simple builder
      if (inner.startsWith("?") && !inner.startsWith("?:")) return null;
      push("group", {
        value: inner.startsWith("?:") ? inner.slice(2) : inner,
      });
      i = j + 1;
      continue;
    }

    if (ch === "[") {
      let j = i + 1;
      let negated = false;
      if (src[j] === "^") {
        negated = true;
        j += 1;
      }
      let content = "";
      while (j < src.length) {
        if (src[j] === "\\" && j + 1 < src.length) {
          content += src[j] + src[j + 1];
          j += 2;
          continue;
        }
        if (src[j] === "]") break;
        content += src[j];
        j += 1;
      }
      if (src[j] !== "]") return null;
      push(negated ? "negClass" : "class", { value: content });
      i = j + 1;
      continue;
    }

    // Accumulate consecutive plain literals
    let lit = "";
    while (i < src.length) {
      const c = src[i];
      if (/[.*+?^${}()|[\]\\]/.test(c)) break;
      lit += c;
      i += 1;
    }
    if (lit) {
      push("literal", { value: lit });
      continue;
    }

    return null;
  }

  return blocks;
}

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

const TOOLTIP_VIEWPORT_MARGIN = 8;

function FlagInfoButton({ flag, active }) {
  const tipId = useId();
  const btnRef = useRef(null);
  const tipRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const anchor = btnRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const tip = tipRef.current;
    const tipWidth = tip?.offsetWidth || 224;
    const tipHeight = tip?.offsetHeight || 48;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = TOOLTIP_VIEWPORT_MARGIN;

    // Prefer above the anchor; flip below when there isn't room.
    let top = rect.top - tipHeight - margin;
    if (top < margin) {
      top = rect.bottom + margin;
    }
    // Clamp vertically if still overflowing (short viewports).
    top = Math.min(top, vh - tipHeight - margin);
    top = Math.max(margin, top);

    // Prefer centered on the anchor; shift horizontally to stay in view.
    let left = rect.left + rect.width / 2 - tipWidth / 2;
    if (left < margin) left = margin;
    if (left + tipWidth > vw - margin) {
      left = Math.max(margin, vw - tipWidth - margin);
    }

    setCoords({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (!open) return undefined;
    updatePosition();
    const onReposition = () => updatePosition();
    window.addEventListener("scroll", onReposition, true);
    window.addEventListener("resize", onReposition);
    return () => {
      window.removeEventListener("scroll", onReposition, true);
      window.removeEventListener("resize", onReposition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const show = () => {
    setOpen(true);
  };
  const hide = () => setOpen(false);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={`inline-flex items-center justify-center w-4 h-4 rounded-full shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
          active
            ? "text-white/85 hover:text-white focus-visible:ring-white/70 focus-visible:ring-offset-primary-600"
            : "text-gray-400 hover:text-gray-600 focus-visible:ring-primary-500 focus-visible:ring-offset-white"
        }`}
        aria-label={`${flag.title}: ${flag.description}`}
        aria-describedby={open ? tipId : undefined}
        aria-expanded={open}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (open) hide();
          else show();
        }}
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        <FaInfoCircle className="text-[10px]" aria-hidden />
      </button>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            ref={tipRef}
            id={tipId}
            role="tooltip"
            className="pointer-events-none fixed z-[9999] w-max max-w-[14rem] rounded border border-gray-200 bg-white px-2 py-1.5 text-left text-xs font-sans font-normal text-gray-700 shadow-md"
            style={{ top: coords.top, left: coords.left }}
          >
            <span className="font-medium text-gray-900">{flag.title}</span>
            <span className="block mt-0.5 leading-snug">{flag.description}</span>
          </span>,
          document.body
        )}
    </>
  );
}

function FlagToggles({ flags, onChange }) {
  const set = new Set(flags.split("").filter(Boolean));

  const toggleFlag = (flagId) => {
    const next = new Set(set);
    if (next.has(flagId)) next.delete(flagId);
    else next.add(flagId);
    onChange(
      FLAG_OPTIONS.map((f) => f.id)
        .filter((id) => next.has(id))
        .join("")
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {FLAG_OPTIONS.map((flag) => {
        const on = set.has(flag.id);
        return (
          <div
            key={flag.id}
            role="button"
            tabIndex={0}
            aria-pressed={on}
            aria-label={`${flag.title} flag`}
            onClick={() => toggleFlag(flag.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                toggleFlag(flag.id);
              }
            }}
            className={`inline-flex items-center gap-1 rounded border pl-2.5 pr-1.5 py-1 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 ${
              on
                ? "bg-primary-600 text-white border-primary-600"
                : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
            }`}
          >
            <span className="text-sm font-mono leading-none">{flag.label}</span>
            <FlagInfoButton flag={flag} active={on} />
          </div>
        );
      })}
    </div>
  );
}

function BlockEditor({ block, onChange }) {
  if (block.type === "literal" || block.type === "group") {
    return (
      <input
        type="text"
        value={block.value ?? ""}
        onChange={(e) => onChange({ ...block, value: e.target.value })}
        className="w-full min-w-0 px-2 py-1 border rounded font-mono text-sm"
        placeholder={block.type === "group" ? "group contents" : "text"}
        spellCheck={false}
      />
    );
  }
  if (block.type === "class" || block.type === "negClass") {
    return (
      <input
        type="text"
        value={block.value ?? ""}
        onChange={(e) => onChange({ ...block, value: e.target.value })}
        className="w-full min-w-0 px-2 py-1 border rounded font-mono text-sm"
        placeholder="abc0-9"
        spellCheck={false}
      />
    );
  }
  if (block.type === "repeat") {
    return (
      <div className="flex items-center gap-2 text-sm">
        <label className="flex items-center gap-1">
          min
          <input
            type="number"
            min={0}
            value={block.min ?? 0}
            onChange={(e) =>
              onChange({ ...block, min: Number(e.target.value) })
            }
            className="w-16 px-2 py-1 border rounded"
          />
        </label>
        <label className="flex items-center gap-1">
          max
          <input
            type="number"
            min={0}
            value={block.max ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              onChange({
                ...block,
                max: v === "" ? "" : Number(v),
              });
            }}
            className="w-16 px-2 py-1 border rounded"
            placeholder="∞"
          />
        </label>
      </div>
    );
  }
  return (
    <span className="text-xs text-gray-500 font-mono">
      {blockToPattern(block) || "—"}
    </span>
  );
}

export default function RegexTool() {
  const [uiMode, setUiMode] = useState("builder"); // builder | advanced
  const [blocks, setBlocks] = useState(() => [
    { id: nextBlockId(), type: "literal", value: "hello" },
  ]);
  const [pattern, setPattern] = useState("hello");
  const [flags, setFlags] = useState("g");
  const [testMode, setTestMode] = useState("match"); // match | replace
  const [testText, setTestText] = useState("");
  const [replacement, setReplacement] = useState("");
  const [matches, setMatches] = useState([]);
  const [replacePreview, setReplacePreview] = useState(null);
  const [cheatOpen, setCheatOpen] = useState(false);
  const [escapeInput, setEscapeInput] = useState("");
  const [status, setStatus] = useState(null);
  const [builderDirty, setBuilderDirty] = useState(false);

  const builtPattern = useMemo(() => blocksToPattern(blocks), [blocks]);

  // Keep advanced pattern synced from builder when builder is source of truth
  useEffect(() => {
    if (uiMode !== "builder") return;
    setPattern(builtPattern);
  }, [builtPattern, uiMode]);

  useEffect(() => {
    const payload = consumeSessionPayload();
    const text = extractSessionText(payload);
    if (text == null) return;
    setTestText(text);
    setStatus("Loaded test text from handoff");
  }, []);

  const runTest = useCallback(() => {
    const activePattern = uiMode === "builder" ? builtPattern : pattern;
    if (!activePattern || !testText) {
      setMatches([]);
      setReplacePreview(null);
      return;
    }

    try {
      const regex = new RegExp(activePattern, flags);
      const nextMatches = [];
      let match;

      while ((match = regex.exec(testText)) !== null) {
        nextMatches.push({
          value: match[0],
          index: match.index,
          groups: match.slice(1),
          namedGroups: match.groups || null,
        });
        if (!regex.global) break;
        if (match[0] === "") {
          regex.lastIndex++;
        }
      }

      setMatches(nextMatches);

      if (testMode === "replace") {
        const replaceRegex = new RegExp(activePattern, flags);
        setReplacePreview(testText.replace(replaceRegex, replacement));
      } else {
        setReplacePreview(null);
      }
    } catch (error) {
      setMatches([{ error: error.message }]);
      setReplacePreview(null);
    }
  }, [
    uiMode,
    builtPattern,
    pattern,
    flags,
    testText,
    testMode,
    replacement,
  ]);

  // Live test when inputs change
  useEffect(() => {
    runTest();
  }, [runTest]);

  const switchToAdvanced = () => {
    setPattern(builtPattern);
    setBuilderDirty(false);
    setUiMode("advanced");
    setStatus("Switched to Advanced — pattern preserved");
  };

  const switchToBuilder = () => {
    const parsed = patternToBlocks(pattern);
    if (parsed == null) {
      setStatus(
        "Could not fully parse pattern into blocks — staying in Advanced so the raw pattern is kept."
      );
      return;
    }
    setBlocks(parsed);
    setBuilderDirty(false);
    setUiMode("builder");
    setStatus("Switched to Builder — pattern synced into blocks");
  };

  const addBlock = (type) => {
    const meta = BLOCK_PALETTE.find((p) => p.type === type);
    setBlocks((prev) => [
      ...prev,
      { id: nextBlockId(), type, ...(meta?.defaults || {}) },
    ]);
    setBuilderDirty(true);
  };

  const updateBlock = (id, next) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? next : b)));
    setBuilderDirty(true);
  };

  const removeBlock = (id) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setBuilderDirty(true);
  };

  const moveBlock = (index, dir) => {
    setBlocks((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[target];
      next[target] = tmp;
      return next;
    });
    setBuilderDirty(true);
  };

  const handleCopyPattern = async () => {
    const value = uiMode === "builder" ? builtPattern : pattern;
    const ok = await copyText(value);
    setStatus(ok ? "Copied pattern" : "Could not copy to clipboard");
  };

  const handleEscapeInsert = () => {
    const escaped = escapeRegexLiteral(escapeInput);
    if (uiMode === "builder") {
      setBlocks((prev) => [
        ...prev,
        { id: nextBlockId(), type: "literal", value: escapeInput },
      ]);
      setBuilderDirty(true);
    } else {
      setPattern((prev) => prev + escaped);
    }
    setStatus(`Escaped literal ready: ${escaped || "(empty)"}`);
  };

  const activePattern = uiMode === "builder" ? builtPattern : pattern;
  const paletteByType = Object.fromEntries(
    BLOCK_PALETTE.map((p) => [p.type, p])
  );

  return (
    <div data-tool="regex">
      <ToolScaffold
        title="Regex pattern builder"
        hideTitle
        description="Compose a pattern visually or edit it raw, then match or replace against a test string. Browser-local only."
        input={
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded border border-gray-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    if (uiMode === "advanced") switchToBuilder();
                    else setUiMode("builder");
                  }}
                  className={`px-3 py-1.5 text-sm ${
                    uiMode === "builder"
                      ? "bg-primary-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Builder
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (uiMode === "builder") switchToAdvanced();
                    else setUiMode("advanced");
                  }}
                  className={`px-3 py-1.5 text-sm ${
                    uiMode === "advanced"
                      ? "bg-primary-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Advanced
                </button>
              </div>
              <div className="inline-flex rounded border border-gray-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setTestMode("match")}
                  className={`px-3 py-1.5 text-sm ${
                    testMode === "match"
                      ? "bg-primary-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Match
                </button>
                <button
                  type="button"
                  onClick={() => setTestMode("replace")}
                  className={`px-3 py-1.5 text-sm ${
                    testMode === "replace"
                      ? "bg-primary-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Replace
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">
                  Pattern
                </label>
                <button
                  type="button"
                  onClick={handleCopyPattern}
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600"
                >
                  <FaCopy className="text-xs" />
                  Copy
                </button>
              </div>
              {uiMode === "advanced" ? (
                <input
                  type="text"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="Regular expression pattern"
                  className="w-full px-4 py-2 border rounded font-mono text-sm regex-pattern"
                  spellCheck={false}
                />
              ) : (
                <div className="px-3 py-2 border rounded bg-gray-50 font-mono text-sm break-all min-h-[2.5rem]">
                  {builtPattern || (
                    <span className="text-gray-400">Add blocks below…</span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Flags
              </label>
              <FlagToggles flags={flags} onChange={setFlags} />
            </div>

            {testMode === "replace" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Replacement
                </label>
                <input
                  type="text"
                  value={replacement}
                  onChange={(e) => setReplacement(e.target.value)}
                  placeholder="Replacement (use $1, $<name>, etc.)"
                  className="w-full px-4 py-2 border rounded font-mono text-sm"
                  spellCheck={false}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test string
              </label>
              <textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Enter text to test…"
                className="w-full h-32 p-4 border rounded regex-test-input"
                spellCheck={false}
              />
            </div>
          </div>
        }
        controls={
          <div className="w-full space-y-4">
            {uiMode === "builder" && (
              <>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Block palette
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {BLOCK_PALETTE.map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        title={item.hint}
                        onClick={() => addBlock(item.type)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <FaPlus className="text-[10px] text-gray-400" />
                        {item.label}
                        <span className="font-mono text-gray-400">
                          {item.hint}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Pattern blocks
                    {builderDirty ? (
                      <span className="ml-2 text-xs font-normal text-gray-400">
                        (edited)
                      </span>
                    ) : null}
                  </div>
                  {blocks.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No blocks yet — pick from the palette.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {blocks.map((block, index) => (
                        <li
                          key={block.id}
                          className="flex flex-wrap items-center gap-2 p-2 border border-gray-200 rounded bg-white"
                        >
                          <span className="text-xs font-medium text-gray-500 w-28 shrink-0">
                            {paletteByType[block.type]?.label || block.type}
                          </span>
                          <div className="flex-1 min-w-[10rem]">
                            <BlockEditor
                              block={block}
                              onChange={(next) => updateBlock(block.id, next)}
                            />
                          </div>
                          <code className="text-xs font-mono text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded">
                            {blockToPattern(block) || "∅"}
                          </code>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              aria-label="Move up"
                              disabled={index === 0}
                              onClick={() => moveBlock(index, -1)}
                              className="p-1.5 text-gray-500 hover:text-gray-800 disabled:opacity-30"
                            >
                              <FaArrowUp className="text-xs" />
                            </button>
                            <button
                              type="button"
                              aria-label="Move down"
                              disabled={index === blocks.length - 1}
                              onClick={() => moveBlock(index, 1)}
                              className="p-1.5 text-gray-500 hover:text-gray-800 disabled:opacity-30"
                            >
                              <FaArrowDown className="text-xs" />
                            </button>
                            <button
                              type="button"
                              aria-label="Remove block"
                              onClick={() => removeBlock(block.id)}
                              className="p-1.5 text-red-500 hover:text-red-700"
                            >
                              <FaTrash className="text-xs" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}

            <div className="p-3 border border-gray-200 rounded bg-white space-y-2">
              <div className="text-sm font-medium text-gray-700">
                Escape literal helper
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={escapeInput}
                  onChange={(e) => setEscapeInput(e.target.value)}
                  placeholder="Text with . * + ? …"
                  className="flex-1 min-w-[12rem] px-3 py-1.5 border rounded font-mono text-sm"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={handleEscapeInsert}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
                >
                  {uiMode === "builder"
                    ? "Add as literal block"
                    : "Append escaped"}
                </button>
              </div>
              {escapeInput ? (
                <p className="text-xs font-mono text-gray-600">
                  → {escapeRegexLiteral(escapeInput)}
                </p>
              ) : null}
            </div>
          </div>
        }
        preview={
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-4 min-w-0">
              <div className="text-sm text-gray-600">
                Active:{" "}
                <code className="font-mono text-primary-700">
                  /{activePattern || ""}/{flags}
                </code>
              </div>

              {matches.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-sm text-gray-800">
                    Matches (
                    {matches.filter((match) => !match.error).length})
                  </h3>
                  {matches.map((match, index) =>
                    match.error ? (
                      <div key={index} className="text-red-600 text-sm">
                        {match.error}
                      </div>
                    ) : (
                      <div
                        key={index}
                        className="p-2 bg-gray-50 rounded space-y-1 border border-gray-100"
                      >
                        <div className="flex justify-between gap-2">
                          <span className="font-mono text-sm break-all">
                            Match: {match.value}
                          </span>
                          <span className="text-gray-500 shrink-0 text-sm">
                            Index: {match.index}
                          </span>
                        </div>
                        {match.groups?.length > 0 && (
                          <div className="text-sm text-gray-600">
                            Groups:{" "}
                            {match.groups
                              .map((group, groupIndex) =>
                                group == null
                                  ? `(${groupIndex + 1}: —)`
                                  : `(${groupIndex + 1}: ${group})`
                              )
                              .join(", ")}
                          </div>
                        )}
                        {match.namedGroups &&
                          Object.keys(match.namedGroups).length > 0 && (
                            <div className="text-sm text-gray-600">
                              Named:{" "}
                              {Object.entries(match.namedGroups)
                                .map(
                                  ([name, value]) =>
                                    `${name}=${value == null ? "—" : value}`
                                )
                                .join(", ")}
                            </div>
                          )}
                      </div>
                    )
                  )}
                </div>
              )}

              {testMode === "replace" && replacePreview != null && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm text-gray-800">
                      Replace preview
                    </h3>
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await copyText(replacePreview);
                        setStatus(
                          ok ? "Copied replace preview" : "Could not copy"
                        );
                      }}
                      className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
                    >
                      <FaCopy className="text-xs" />
                      Copy
                    </button>
                  </div>
                  <pre className="p-4 bg-gray-50 rounded text-sm font-mono whitespace-pre-wrap break-all border border-gray-100">
                    {replacePreview}
                  </pre>
                </div>
              )}

              {!testText && (
                <p className="text-sm text-gray-500">
                  Enter a test string to see matches.
                </p>
              )}
            </div>

            <aside className="lg:w-64 shrink-0">
              <button
                type="button"
                onClick={() => setCheatOpen((open) => !open)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                <span className="font-medium text-gray-800">
                  Regex cheatsheet
                </span>
                <span className="text-gray-500">
                  {cheatOpen ? "Hide" : "Show"}
                </span>
              </button>
              {cheatOpen && (
                <ul className="mt-2 border border-gray-200 rounded divide-y divide-gray-100 text-sm max-h-96 overflow-y-auto">
                  {REGEX_CHEATSHEET.map((item) => (
                    <li
                      key={item.token}
                      className="px-3 py-2 flex flex-col gap-0.5"
                    >
                      <code className="font-mono text-xs text-primary-700">
                        {item.token}
                      </code>
                      <span className="text-gray-600 text-xs">
                        {item.desc}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          </div>
        }
        actions={
          <>
            <button
              type="button"
              onClick={runTest}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
            >
              {testMode === "replace" ? "Preview replace" : "Test matches"}
            </button>
            <button
              type="button"
              onClick={handleCopyPattern}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              <FaCopy />
              Copy pattern
            </button>
            {status && (
              <span className="text-sm text-gray-600" role="status">
                {status}
              </span>
            )}
          </>
        }
      />
    </div>
  );
}
