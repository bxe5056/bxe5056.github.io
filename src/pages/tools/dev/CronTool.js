import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FaCopy } from "react-icons/fa";
import ToolScaffold from "../../../components/tools/ToolScaffold";
import { copyText } from "../../../utils/tools/clipboard";
import { consumeSessionPayload } from "../../../utils/tools/session";

const PRESETS = [
  {
    id: "every-minute",
    label: "Every minute",
    expression: "* * * * *",
    editableFields: [],
  },
  {
    id: "hourly",
    label: "Hourly",
    expression: "0 * * * *",
    editableFields: ["minute"],
  },
  {
    id: "daily",
    label: "Daily",
    expression: "0 0 * * *",
    editableFields: ["minute", "hour"],
  },
  {
    id: "weekly",
    label: "Weekly",
    expression: "0 0 * * 0",
    editableFields: ["minute", "hour", "dow"],
  },
  {
    id: "weekdays",
    label: "Weekdays",
    expression: "0 0 * * 1-5",
    editableFields: ["minute", "hour"],
  },
  {
    id: "custom",
    label: "Custom",
    expression: null,
    editableFields: ["minute", "hour", "dom", "month", "dow"],
  },
];

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const FIELD_DEFS = [
  {
    key: "minute",
    label: "Minute",
    min: 0,
    max: 59,
    everyLabel: "Every minute",
  },
  {
    key: "hour",
    label: "Hour",
    min: 0,
    max: 23,
    everyLabel: "Every hour",
  },
  {
    key: "dom",
    label: "Day of month",
    min: 1,
    max: 31,
    everyLabel: "Every day of month",
  },
  {
    key: "month",
    label: "Month",
    min: 1,
    max: 12,
    everyLabel: "Every month",
    labels: MONTH_LABELS,
  },
  {
    key: "dow",
    label: "Day of week",
    min: 0,
    max: 6,
    everyLabel: "Every day of week",
    labels: DOW_LABELS,
  },
];

/**
 * @typedef {"every" | "specific" | "step" | "range"} FieldMode
 * @typedef {{ mode: FieldMode, values: number[], step: number, rangeStart: number, rangeEnd: number }} FieldState
 */

/** @returns {Record<string, FieldState>} */
function defaultFields() {
  return {
    minute: {
      mode: "every",
      values: [],
      step: 5,
      rangeStart: 0,
      rangeEnd: 59,
    },
    hour: {
      mode: "every",
      values: [],
      step: 1,
      rangeStart: 0,
      rangeEnd: 23,
    },
    dom: {
      mode: "every",
      values: [],
      step: 1,
      rangeStart: 1,
      rangeEnd: 31,
    },
    month: {
      mode: "every",
      values: [],
      step: 1,
      rangeStart: 1,
      rangeEnd: 12,
    },
    dow: {
      mode: "every",
      values: [],
      step: 1,
      rangeStart: 0,
      rangeEnd: 6,
    },
  };
}

/**
 * @param {FieldState} field
 * @param {{ min: number, max: number }} def
 * @returns {string}
 */
function fieldToPart(field, def) {
  if (field.mode === "every") return "*";
  if (field.mode === "step") {
    const step = Math.max(1, Math.min(def.max, Number(field.step) || 1));
    return `*/${step}`;
  }
  if (field.mode === "range") {
    const start = clamp(field.rangeStart, def.min, def.max);
    const end = clamp(field.rangeEnd, def.min, def.max);
    return start <= end ? `${start}-${end}` : `${end}-${start}`;
  }
  const values = [...new Set(field.values)]
    .filter((n) => n >= def.min && n <= def.max)
    .sort((a, b) => a - b);
  if (values.length === 0) return "*";
  return values.join(",");
}

/**
 * @param {Record<string, FieldState>} fields
 * @returns {string}
 */
function fieldsToExpression(fields) {
  return FIELD_DEFS.map((def) => fieldToPart(fields[def.key], def)).join(" ");
}

/**
 * @param {number} n
 * @param {number} min
 * @param {number} max
 */
function clamp(n, min, max) {
  return Math.min(max, Math.max(min, Number(n) || min));
}

/**
 * Parse a single cron field into UI state.
 * @param {string} part
 * @param {{ min: number, max: number }} def
 * @returns {FieldState | null}
 */
function parseFieldPart(part, def) {
  const raw = String(part || "").trim().toUpperCase();
  if (!raw) return null;

  const nameMap =
    def.key === "month"
      ? {
          JAN: 1,
          FEB: 2,
          MAR: 3,
          APR: 4,
          MAY: 5,
          JUN: 6,
          JUL: 7,
          AUG: 8,
          SEP: 9,
          OCT: 10,
          NOV: 11,
          DEC: 12,
        }
      : def.key === "dow"
        ? { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 }
        : null;

  const toNum = (token) => {
    if (nameMap && nameMap[token] != null) return nameMap[token];
    if (!/^\d+$/.test(token)) return NaN;
    return Number(token);
  };

  if (raw === "*") {
    return {
      mode: "every",
      values: [],
      step: 1,
      rangeStart: def.min,
      rangeEnd: def.max,
    };
  }

  const stepStar = raw.match(/^\*\/(\d+)$/);
  if (stepStar) {
    return {
      mode: "step",
      values: [],
      step: clamp(Number(stepStar[1]), 1, def.max),
      rangeStart: def.min,
      rangeEnd: def.max,
    };
  }

  // Single contiguous range: n-m (no step, no lists)
  const rangeOnly = raw.match(/^([A-Z0-9]+)-([A-Z0-9]+)$/);
  if (rangeOnly) {
    const start = toNum(rangeOnly[1]);
    const end = toNum(rangeOnly[2]);
    if (
      Number.isFinite(start) &&
      Number.isFinite(end) &&
      start >= def.min &&
      end <= def.max
    ) {
      return {
        mode: "range",
        values: [],
        step: 1,
        rangeStart: start,
        rangeEnd: end,
      };
    }
  }

  // List / mixed: expand to specific values when possible
  const values = [];
  for (const chunk of raw.split(",")) {
    const stepRange = chunk.match(/^([A-Z0-9]+)-([A-Z0-9]+)\/(\d+)$/);
    if (stepRange) {
      const start = toNum(stepRange[1]);
      const end = toNum(stepRange[2]);
      const step = Number(stepRange[3]);
      if (
        !Number.isFinite(start) ||
        !Number.isFinite(end) ||
        !Number.isFinite(step) ||
        step < 1
      ) {
        return null;
      }
      for (let i = start; i <= end; i += step) {
        if (i >= def.min && i <= def.max) values.push(i);
      }
      continue;
    }

    const range = chunk.match(/^([A-Z0-9]+)-([A-Z0-9]+)$/);
    if (range) {
      const start = toNum(range[1]);
      const end = toNum(range[2]);
      if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
      for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
        if (i >= def.min && i <= def.max) values.push(i);
      }
      continue;
    }

    const stepFrom = chunk.match(/^([A-Z0-9]+)\/(\d+)$/);
    if (stepFrom) {
      const start = toNum(stepFrom[1]);
      const step = Number(stepFrom[2]);
      if (!Number.isFinite(start) || !Number.isFinite(step) || step < 1) {
        return null;
      }
      for (let i = start; i <= def.max; i += step) {
        if (i >= def.min) values.push(i);
      }
      continue;
    }

    const n = toNum(chunk);
    if (!Number.isFinite(n) || n < def.min || n > def.max) return null;
    values.push(n);
  }

  if (values.length === 0) return null;
  return {
    mode: "specific",
    values: [...new Set(values)].sort((a, b) => a - b),
    step: 1,
    rangeStart: def.min,
    rangeEnd: def.max,
  };
}

/**
 * @param {string} expression
 * @returns {Record<string, FieldState> | null}
 */
function parseExpressionToFields(expression) {
  const parts = String(expression || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length !== 5) return null;

  const fields = defaultFields();
  for (let i = 0; i < FIELD_DEFS.length; i++) {
    const def = FIELD_DEFS[i];
    const parsed = parseFieldPart(parts[i], def);
    if (!parsed) return null;
    fields[def.key] = parsed;
  }
  return fields;
}

/**
 * Expand a cron field to a Set of allowed integers.
 * @param {string} part
 * @param {number} min
 * @param {number} max
 * @returns {Set<number> | null}
 */
function expandField(part, min, max) {
  const raw = String(part || "").trim().toUpperCase();
  if (!raw) return null;

  const nameToNum = (token) => {
    const months = {
      JAN: 1,
      FEB: 2,
      MAR: 3,
      APR: 4,
      MAY: 5,
      JUN: 6,
      JUL: 7,
      AUG: 8,
      SEP: 9,
      OCT: 10,
      NOV: 11,
      DEC: 12,
    };
    const days = {
      SUN: 0,
      MON: 1,
      TUE: 2,
      WED: 3,
      THU: 4,
      FRI: 5,
      SAT: 6,
    };
    if (months[token] != null) return months[token];
    if (days[token] != null) return days[token];
    if (!/^\d+$/.test(token)) return NaN;
    return Number(token);
  };

  const out = new Set();

  const addRange = (start, end, step = 1) => {
    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      !Number.isFinite(step) ||
      step < 1
    ) {
      return false;
    }
    const a = Math.max(min, Math.min(start, end));
    const b = Math.min(max, Math.max(start, end));
    for (let i = a; i <= b; i += step) out.add(i);
    return true;
  };

  if (raw === "*") {
    addRange(min, max, 1);
    return out;
  }

  const stepStar = raw.match(/^\*\/(\d+)$/);
  if (stepStar) {
    if (!addRange(min, max, Number(stepStar[1]))) return null;
    return out;
  }

  for (const chunk of raw.split(",")) {
    const stepRange = chunk.match(/^([A-Z0-9]+)-([A-Z0-9]+)\/(\d+)$/);
    if (stepRange) {
      if (
        !addRange(
          nameToNum(stepRange[1]),
          nameToNum(stepRange[2]),
          Number(stepRange[3])
        )
      ) {
        return null;
      }
      continue;
    }
    const range = chunk.match(/^([A-Z0-9]+)-([A-Z0-9]+)$/);
    if (range) {
      if (!addRange(nameToNum(range[1]), nameToNum(range[2]), 1)) return null;
      continue;
    }
    const stepFrom = chunk.match(/^([A-Z0-9]+)\/(\d+)$/);
    if (stepFrom) {
      if (!addRange(nameToNum(stepFrom[1]), max, Number(stepFrom[2]))) {
        return null;
      }
      continue;
    }
    const n = nameToNum(chunk);
    if (!Number.isFinite(n) || n < min || n > max) return null;
    out.add(n);
  }

  return out.size > 0 ? out : null;
}

/**
 * Compute next N fire times for a 5-field cron (local timezone).
 * Day-of-month and day-of-week use OR semantics when both are constrained
 * (standard cron); when either is `*`, the other alone applies.
 * @param {string} expression
 * @param {number} count
 * @param {Date} [from]
 * @returns {Date[]}
 */
function getNextRuns(expression, count = 5, from = new Date()) {
  const parts = String(expression || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length !== 5) return [];

  const minutes = expandField(parts[0], 0, 59);
  const hours = expandField(parts[1], 0, 23);
  const doms = expandField(parts[2], 1, 31);
  const months = expandField(parts[3], 1, 12);
  const dows = expandField(parts[4], 0, 6);
  if (!minutes || !hours || !doms || !months || !dows) return [];

  const domAny = parts[2] === "*";
  const dowAny = parts[4] === "*";

  const results = [];
  const cursor = new Date(from.getTime());
  cursor.setSeconds(0, 0);
  cursor.setMinutes(cursor.getMinutes() + 1);

  // Cap search: ~2 years of minutes
  const maxIterations = 60 * 24 * 366 * 2;
  for (let i = 0; i < maxIterations && results.length < count; i++) {
    const m = cursor.getMonth() + 1;
    const d = cursor.getDate();
    const dow = cursor.getDay();
    const h = cursor.getHours();
    const min = cursor.getMinutes();

    const monthOk = months.has(m);
    const minuteOk = minutes.has(min);
    const hourOk = hours.has(h);

    let dayOk;
    if (domAny && dowAny) {
      dayOk = true;
    } else if (domAny) {
      dayOk = dows.has(dow);
    } else if (dowAny) {
      dayOk = doms.has(d);
    } else {
      dayOk = doms.has(d) || dows.has(dow);
    }

    if (monthOk && dayOk && hourOk && minuteOk) {
      results.push(new Date(cursor.getTime()));
    }
    cursor.setMinutes(cursor.getMinutes() + 1);
  }

  return results;
}

/**
 * @param {unknown} payload
 * @returns {string | null}
 */
function extractSessionText(payload) {
  if (!payload || typeof payload !== "object") return null;
  if (typeof payload.text === "string" && payload.text.trim()) {
    return payload.text.trim();
  }
  return null;
}

function matchPresetId(expression) {
  const normalized = String(expression || "")
    .trim()
    .replace(/\s+/g, " ");
  const hit = PRESETS.find(
    (p) => p.expression && p.expression === normalized
  );
  return hit ? hit.id : "custom";
}

function FieldBuilder({ def, field, onChange }) {
  const options = [];
  for (let i = def.min; i <= def.max; i++) {
    options.push(i);
  }

  const setMode = (mode) => onChange({ ...field, mode });

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h3 className="text-sm font-medium text-gray-800">{def.label}</h3>
        <span className="text-xs text-gray-500 font-mono">
          {def.min}–{def.max}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {[
          { id: "every", label: "Every" },
          { id: "specific", label: "Specific" },
          { id: "step", label: "Every N" },
          { id: "range", label: "Range" },
        ].map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setMode(opt.id)}
            className={`px-2 py-1 text-xs rounded border ${
              field.mode === opt.id
                ? "bg-primary-600 text-white border-primary-600"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {field.mode === "every" && (
        <p className="text-sm text-gray-600">{def.everyLabel}</p>
      )}

      {field.mode === "step" && (
        <label className="flex items-center gap-2 text-sm text-gray-700">
          Every
          <input
            type="number"
            min={1}
            max={def.max}
            value={field.step}
            onChange={(e) =>
              onChange({
                ...field,
                step: clamp(Number(e.target.value), 1, def.max),
              })
            }
            className="w-20 px-2 py-1 border rounded"
          />
          <span>
            {def.key === "minute"
              ? "minute(s)"
              : def.key === "hour"
                ? "hour(s)"
                : def.key === "dom"
                  ? "day(s)"
                  : def.key === "month"
                    ? "month(s)"
                    : "day(s) of week"}
          </span>
        </label>
      )}

      {field.mode === "range" && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
          <span>From</span>
          <select
            value={field.rangeStart}
            onChange={(e) =>
              onChange({ ...field, rangeStart: Number(e.target.value) })
            }
            className="px-2 py-1 border rounded bg-white"
          >
            {options.map((n) => (
              <option key={n} value={n}>
                {def.labels ? `${def.labels[n - (def.min === 0 ? 0 : 1)] ?? n} (${n})` : n}
              </option>
            ))}
          </select>
          <span>to</span>
          <select
            value={field.rangeEnd}
            onChange={(e) =>
              onChange({ ...field, rangeEnd: Number(e.target.value) })
            }
            className="px-2 py-1 border rounded bg-white"
          >
            {options.map((n) => (
              <option key={n} value={n}>
                {def.labels ? `${def.labels[n - (def.min === 0 ? 0 : 1)] ?? n} (${n})` : n}
              </option>
            ))}
          </select>
        </div>
      )}

      {field.mode === "specific" && (
        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
          {options.map((n) => {
            const checked = field.values.includes(n);
            const label = def.labels
              ? def.labels[n - (def.min === 0 ? 0 : 1)]
              : String(n);
            return (
              <label
                key={n}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs cursor-pointer ${
                  checked
                    ? "bg-primary-50 border-primary-300 text-primary-800"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={() => {
                    const next = checked
                      ? field.values.filter((v) => v !== n)
                      : [...field.values, n];
                    onChange({ ...field, values: next });
                  }}
                />
                {label}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CronTool() {
  const [fields, setFields] = useState(() => defaultFields());
  const [presetId, setPresetId] = useState("every-minute");
  const [rawText, setRawText] = useState("* * * * *");
  const [description, setDescription] = useState("");
  const [parseError, setParseError] = useState(null);
  const [status, setStatus] = useState(null);
  const [nextCount, setNextCount] = useState(5);
  const [syncFromRaw, setSyncFromRaw] = useState(false);

  const activePreset = useMemo(
    () => PRESETS.find((p) => p.id === presetId) || PRESETS[PRESETS.length - 1],
    [presetId]
  );

  const visibleFieldKeys = activePreset.editableFields;

  const expression = useMemo(() => {
    if (presetId === "custom") {
      return fieldsToExpression(fields);
    }
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset?.expression) return fieldsToExpression(fields);

    const editable = preset.editableFields || [];
    if (editable.length === 0) return preset.expression;

    const baseParts = preset.expression.split(/\s+/);
    return FIELD_DEFS.map((def, i) => {
      if (editable.includes(def.key)) {
        return fieldToPart(fields[def.key], def);
      }
      return baseParts[i];
    }).join(" ");
  }, [presetId, fields]);

  // Keep raw textarea in sync when builders change (unless user is editing raw)
  useEffect(() => {
    if (syncFromRaw) return;
    setRawText(expression);
  }, [expression, syncFromRaw]);

  // Human-readable via dynamic cronstrue
  useEffect(() => {
    let cancelled = false;
    const expr = String(rawText || "").trim();
    if (!expr) {
      setDescription("");
      setParseError(null);
      return undefined;
    }

    (async () => {
      try {
        const cronstrue = (await import("cronstrue")).default;
        if (cancelled) return;
        const text = cronstrue.toString(expr);
        setDescription(text);
        setParseError(null);
      } catch (err) {
        if (cancelled) return;
        setDescription("");
        setParseError(err?.message || "Invalid cron expression");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rawText]);

  // Session handoff
  useEffect(() => {
    const payload = consumeSessionPayload();
    const text = extractSessionText(payload);
    if (text == null) return;

    setRawText(text);
    setSyncFromRaw(true);
    const parsed = parseExpressionToFields(text);
    if (parsed) {
      setFields(parsed);
      setPresetId(matchPresetId(text));
      setStatus("Loaded cron expression from handoff");
    } else {
      setPresetId("custom");
      setStatus("Loaded text into cron editor from handoff");
    }
  }, []);

  const nextRuns = useMemo(() => {
    if (parseError) return [];
    return getNextRuns(rawText.trim(), nextCount);
  }, [rawText, nextCount, parseError]);

  const applyRawToBuilders = useCallback(() => {
    const parsed = parseExpressionToFields(rawText);
    if (!parsed) {
      setStatus("Could not sync builders — expression is not a simple 5-field cron");
      return;
    }
    setFields(parsed);
    setPresetId(matchPresetId(rawText));
    setSyncFromRaw(false);
    setStatus("Builders synced from expression");
  }, [rawText]);

  const handlePreset = (id) => {
    setPresetId(id);
    setSyncFromRaw(false);
    setStatus(null);
    if (id === "custom") return;
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset?.expression) return;
    const parsed = parseExpressionToFields(preset.expression);
    if (parsed) setFields(parsed);
  };

  const handleFieldChange = (key, nextField) => {
    setSyncFromRaw(false);
    setFields((prev) => ({ ...prev, [key]: nextField }));
    const preset = PRESETS.find((p) => p.id === presetId);
    const editable = preset?.editableFields || [];
    // Stay on the current preset when editing one of its allowed fields;
    // otherwise fall back to Custom (e.g. unexpected key).
    if (presetId !== "custom" && !editable.includes(key)) {
      setPresetId("custom");
    }
  };

  const handleRawChange = (value) => {
    setRawText(value);
    setSyncFromRaw(true);
    const parsed = parseExpressionToFields(value);
    if (parsed) {
      setFields(parsed);
      setPresetId(matchPresetId(value));
    } else {
      setPresetId("custom");
    }
  };

  const handleCopy = async () => {
    const ok = await copyText(rawText.trim());
    setStatus(ok ? "Copied cron expression" : "Could not copy to clipboard");
  };

  return (
    <div data-tool="cron">
      <ToolScaffold
        title="Cron expression builder"
        hideTitle
        description="Build a standard 5-field cron visually, or paste one to sync the UI. Runs entirely in your browser."
        input={
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePreset(preset.id)}
                  className={`px-3 py-1.5 text-sm rounded border ${
                    presetId === preset.id
                      ? "bg-primary-600 text-white border-primary-600"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cron expression
              </label>
              <textarea
                value={rawText}
                onChange={(e) => handleRawChange(e.target.value)}
                onBlur={applyRawToBuilders}
                rows={2}
                spellCheck={false}
                className="w-full px-3 py-2 border rounded font-mono text-sm"
                placeholder="* * * * *"
              />
              <p className="mt-1 text-xs text-gray-500">
                minute · hour · day of month · month · day of week
              </p>
            </div>
          </div>
        }
        controls={
          <div className="w-full space-y-3">
            {visibleFieldKeys.length === 0 ? (
              <p className="text-sm text-gray-600 px-1 py-2">
                Uses fixed schedule — switch to Custom to edit fields
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 w-full">
                {FIELD_DEFS.filter((def) =>
                  visibleFieldKeys.includes(def.key)
                ).map((def) => (
                  <FieldBuilder
                    key={def.key}
                    def={def}
                    field={fields[def.key]}
                    onChange={(next) => handleFieldChange(def.key, next)}
                  />
                ))}
              </div>
            )}
          </div>
        }
        preview={
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
                Human readable
              </div>
              {parseError ? (
                <p className="text-sm text-red-600">{parseError}</p>
              ) : (
                <p className="text-sm text-gray-800">
                  {description || "…"}
                </p>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h3 className="text-sm font-medium text-gray-800">
                  Next run times
                </h3>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  Show
                  <select
                    value={nextCount}
                    onChange={(e) => setNextCount(Number(e.target.value))}
                    className="px-2 py-1 border rounded bg-white"
                  >
                    {[5, 10, 15, 20].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {nextRuns.length === 0 ? (
                <p className="text-sm text-gray-500">
                  {parseError
                    ? "Fix the expression to preview runs."
                    : "No upcoming runs found in the search window."}
                </p>
              ) : (
                <ol className="space-y-1 text-sm font-mono text-gray-800">
                  {nextRuns.map((d) => (
                    <li
                      key={d.toISOString()}
                      className="px-2 py-1.5 bg-gray-50 rounded border border-gray-100"
                    >
                      {d.toLocaleString(undefined, {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        }
        actions={
          <>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
            >
              <FaCopy />
              Copy expression
            </button>
            <button
              type="button"
              onClick={applyRawToBuilders}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              Sync builders from text
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
