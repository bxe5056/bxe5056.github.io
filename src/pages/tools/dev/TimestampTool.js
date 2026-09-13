import React, { useEffect, useState } from "react";
import { FaCopy } from "react-icons/fa";
import { copyText } from "../../../utils/tools/clipboard";
import { consumeSessionPayload } from "../../../utils/tools/session";

const TIMEZONES = [
  { value: "local", label: "Local timezone" },
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "America/New_York" },
  { value: "America/Chicago", label: "America/Chicago" },
  { value: "America/Denver", label: "America/Denver" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles" },
  { value: "America/Sao_Paulo", label: "America/Sao_Paulo" },
  { value: "Europe/London", label: "Europe/London" },
  { value: "Europe/Paris", label: "Europe/Paris" },
  { value: "Europe/Berlin", label: "Europe/Berlin" },
  { value: "Europe/Moscow", label: "Europe/Moscow" },
  { value: "Asia/Dubai", label: "Asia/Dubai" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata" },
  { value: "Asia/Shanghai", label: "Asia/Shanghai" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo" },
  { value: "Asia/Seoul", label: "Asia/Seoul" },
  { value: "Australia/Sydney", label: "Australia/Sydney" },
  { value: "Pacific/Auckland", label: "Pacific/Auckland" },
];

/**
 * @param {string} raw
 * @returns {Date | null}
 */
function parseDateInput(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return null;

  if (/^-?\d+(\.\d+)?$/.test(text)) {
    const num = Number(text);
    if (!Number.isFinite(num)) return null;
    // Heuristic: 10 digits (or fewer) → seconds; longer → milliseconds
    const ms = Math.abs(num) < 1e11 ? num * 1000 : num;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // Prefer explicit ISO-ish parsing; Date.parse covers many locale strings too
  const isoCandidate = text.includes("T") || /^\d{4}-\d{2}-\d{2}/.test(text);
  if (isoCandidate) {
    const d = new Date(text);
    if (!Number.isNaN(d.getTime())) return d;
  }

  const parsed = Date.parse(text);
  if (!Number.isNaN(parsed)) return new Date(parsed);

  return null;
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

/**
 * @param {string} text
 * @returns {boolean}
 */
function looksLikeDateOrUnix(text) {
  const t = text.trim();
  if (!t) return false;
  if (/^-?\d+(\.\d+)?$/.test(t)) return true;
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return true;
  if (t.includes("T") && /\d{4}/.test(t)) return true;
  const parsed = Date.parse(t);
  return !Number.isNaN(parsed);
}

/**
 * @param {Date} date
 * @param {string} timeZone
 * @returns {string}
 */
function formatIso(date, timeZone) {
  if (timeZone === "local" || timeZone === "UTC") {
    return date.toISOString();
  }
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
      fractionalSecondDigits: 3,
    }).formatToParts(date);

    const get = (type) => parts.find((p) => p.type === type)?.value ?? "00";
    const offset = getTimeZoneOffsetLabel(date, timeZone);
    return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}.${get("fractionalSecond")}${offset}`;
  } catch {
    return date.toISOString();
  }
}

/**
 * @param {Date} date
 * @param {string} timeZone
 * @returns {string}
 */
function getTimeZoneOffsetLabel(date, timeZone) {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
    });
    const part = fmt
      .formatToParts(date)
      .find((p) => p.type === "timeZoneName")?.value;
    if (!part) return "";
    if (part === "GMT" || part === "UTC") return "Z";
    const m = part.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
    if (!m) return "";
    const sign = m[1];
    const hh = String(m[2]).padStart(2, "0");
    const mm = m[3] || "00";
    return `${sign}${hh}:${mm}`;
  } catch {
    return "";
  }
}

/**
 * @param {Date} date
 * @param {string} timeZone
 * @returns {string}
 */
function formatLocale(date, timeZone) {
  const options = {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  };
  if (timeZone !== "local") {
    options.timeZone = timeZone;
  }
  try {
    return new Intl.DateTimeFormat(undefined, options).format(date);
  } catch {
    return date.toString();
  }
}

/**
 * @param {Date} date
 * @param {Date} [now]
 * @returns {string}
 */
function formatRelative(date, now = new Date()) {
  const diffMs = date.getTime() - now.getTime();
  const abs = Math.abs(diffMs);
  const past = diffMs < 0;

  const sec = Math.round(abs / 1000);
  if (sec < 45) return past ? "just now" : "in a few seconds";

  const min = Math.round(sec / 60);
  if (min < 60) {
    return past
      ? `${min} minute${min === 1 ? "" : "s"} ago`
      : `in ${min} minute${min === 1 ? "" : "s"}`;
  }

  const hr = Math.round(min / 60);
  if (hr < 48) {
    return past
      ? `${hr} hour${hr === 1 ? "" : "s"} ago`
      : `in ${hr} hour${hr === 1 ? "" : "s"}`;
  }

  const day = Math.round(hr / 24);
  if (day < 60) {
    return past
      ? `${day} day${day === 1 ? "" : "s"} ago`
      : `in ${day} day${day === 1 ? "" : "s"}`;
  }

  const month = Math.round(day / 30.437);
  if (month < 24) {
    return past
      ? `${month} month${month === 1 ? "" : "s"} ago`
      : `in ${month} month${month === 1 ? "" : "s"}`;
  }

  const year = Math.round(day / 365.25);
  return past
    ? `${year} year${year === 1 ? "" : "s"} ago`
    : `in ${year} year${year === 1 ? "" : "s"}`;
}

const TimestampTool = () => {
  const [input, setInput] = useState(() => String(Math.floor(Date.now() / 1000)));
  const [timeZone, setTimeZone] = useState("local");
  const [copiedKey, setCopiedKey] = useState(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    const payload = consumeSessionPayload();
    const text = extractSessionText(payload);
    if (text && looksLikeDateOrUnix(text)) {
      setInput(text);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const date = parseDateInput(input);
  const valid = date != null;

  const unixSec = valid ? Math.floor(date.getTime() / 1000) : null;
  const unixMs = valid ? date.getTime() : null;
  const iso = valid ? formatIso(date, timeZone) : "";
  const locale = valid ? formatLocale(date, timeZone) : "";
  const relative = valid ? formatRelative(date, new Date(nowTick)) : "";

  const setNow = () => {
    setInput(String(Math.floor(Date.now() / 1000)));
  };

  const handleCopy = async (key, value) => {
    if (value == null || value === "") return;
    const ok = await copyText(String(value));
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    }
  };

  const rows = valid
    ? [
        { key: "sec", label: "Unix (seconds)", value: String(unixSec) },
        { key: "ms", label: "Unix (milliseconds)", value: String(unixMs) },
        { key: "iso", label: "ISO 8601", value: iso },
        { key: "locale", label: "Locale string", value: locale },
        { key: "relative", label: "Relative", value: relative },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1 space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Timestamp / date
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Unix seconds/ms, ISO 8601, or date string…"
              className="w-full px-4 py-2 border rounded font-mono text-sm"
              spellCheck={false}
            />
          </div>
          <button
            type="button"
            onClick={setNow}
            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 whitespace-nowrap"
          >
            Now
          </button>
        </div>

        <div className="space-y-2 max-w-md">
          <label className="block text-sm font-medium text-gray-700">
            Timezone
          </label>
          <select
            value={timeZone}
            onChange={(e) => setTimeZone(e.target.value)}
            className="w-full px-4 py-2 border rounded bg-white"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>

        {!valid && input.trim() && (
          <p className="text-sm text-red-600">
            Could not parse that as a date or Unix timestamp.
          </p>
        )}
      </div>

      {valid && (
        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.key}
              className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded"
            >
              <div className="min-w-0">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {row.label}
                </div>
                <code className="font-mono text-sm break-all text-gray-900">
                  {row.value}
                </code>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(row.key, row.value)}
                className="shrink-0 text-gray-500 hover:text-gray-700 p-2"
                title={`Copy ${row.label}`}
                aria-label={`Copy ${row.label}`}
              >
                {copiedKey === row.key ? (
                  <span className="text-xs text-primary-600 font-medium">
                    Copied
                  </span>
                ) : (
                  <FaCopy />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TimestampTool;
