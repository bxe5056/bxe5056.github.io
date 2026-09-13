import React, { useState } from "react";
import { FaCopy } from "react-icons/fa";
import { copyText } from "../../../utils/tools/clipboard";

const CATEGORIES = [
  { id: "length", label: "Length" },
  { id: "data", label: "Data size" },
  { id: "css", label: "CSS units" },
];

/** Base unit: meters */
const LENGTH_UNITS = [
  { id: "nm", label: "Nanometers (nm)", toBase: 1e-9 },
  { id: "um", label: "Micrometers (µm)", toBase: 1e-6 },
  { id: "mm", label: "Millimeters (mm)", toBase: 0.001 },
  { id: "cm", label: "Centimeters (cm)", toBase: 0.01 },
  { id: "m", label: "Meters (m)", toBase: 1 },
  { id: "km", label: "Kilometers (km)", toBase: 1000 },
  { id: "in", label: "Inches (in)", toBase: 0.0254 },
  { id: "ft", label: "Feet (ft)", toBase: 0.3048 },
  { id: "yd", label: "Yards (yd)", toBase: 0.9144 },
  { id: "mi", label: "Miles (mi)", toBase: 1609.344 },
];

/** Base unit: bytes (decimal SI + binary IEC) */
const DATA_UNITS = [
  { id: "b", label: "Bits (b)", toBase: 1 / 8 },
  { id: "B", label: "Bytes (B)", toBase: 1 },
  { id: "KB", label: "Kilobytes (KB)", toBase: 1000 },
  { id: "MB", label: "Megabytes (MB)", toBase: 1e6 },
  { id: "GB", label: "Gigabytes (GB)", toBase: 1e9 },
  { id: "TB", label: "Terabytes (TB)", toBase: 1e12 },
  { id: "KiB", label: "Kibibytes (KiB)", toBase: 1024 },
  { id: "MiB", label: "Mebibytes (MiB)", toBase: 1024 ** 2 },
  { id: "GiB", label: "Gibibytes (GiB)", toBase: 1024 ** 3 },
  { id: "TiB", label: "Tebibytes (TiB)", toBase: 1024 ** 4 },
];

/**
 * CSS units relative to px; rem/em use rootFontSize (px).
 * @param {number} rootFontSize
 */
function getCssUnits(rootFontSize) {
  const remPx = rootFontSize > 0 ? rootFontSize : 16;
  return [
    { id: "px", label: "Pixels (px)", toBase: 1 },
    { id: "rem", label: "Root em (rem)", toBase: remPx },
    { id: "em", label: "Em (em)", toBase: remPx },
  ];
}

function unitsForCategory(category, rootFontSize) {
  if (category === "length") return LENGTH_UNITS;
  if (category === "data") return DATA_UNITS;
  return getCssUnits(rootFontSize);
}

/**
 * @param {number} value
 * @returns {string}
 */
function formatNumber(value) {
  if (!Number.isFinite(value)) return "-";
  if (value === 0) return "0";

  const abs = Math.abs(value);
  if (abs >= 1e12 || abs < 1e-6) {
    return value.toExponential(6).replace(/\.?0+e/, "e");
  }

  const fixed = value.toPrecision(12);
  const num = Number(fixed);
  if (!Number.isFinite(num)) return String(value);

  let s = String(num);
  if (s.includes("e") || s.includes("E")) return num.toExponential(6);
  // Trim trailing zeros from decimal form
  if (s.includes(".")) {
    s = s.replace(/\.?0+$/, "");
  }
  return s;
}

const UnitsTool = () => {
  const [category, setCategory] = useState("length");
  const [fromUnit, setFromUnit] = useState("m");
  const [amount, setAmount] = useState("1");
  const [rootFontSize, setRootFontSize] = useState("16");
  const [copiedKey, setCopiedKey] = useState(null);

  const rootPx = Number(rootFontSize);
  const units = unitsForCategory(
    category,
    Number.isFinite(rootPx) && rootPx > 0 ? rootPx : 16
  );

  const handleCategoryChange = (next) => {
    setCategory(next);
    if (next === "length") setFromUnit("m");
    else if (next === "data") setFromUnit("B");
    else setFromUnit("px");
  };

  const numericAmount = Number(amount);
  const source = units.find((u) => u.id === fromUnit) || units[0];
  const baseValue =
    Number.isFinite(numericAmount) && source
      ? numericAmount * source.toBase
      : null;

  const results =
    baseValue == null
      ? []
      : units.map((unit) => ({
          ...unit,
          value: baseValue / unit.toBase,
          formatted: formatNumber(baseValue / unit.toBase),
        }));

  const handleCopy = async (key, value) => {
    const ok = await copyText(String(value));
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => handleCategoryChange(cat.id)}
            className={`px-4 py-2 rounded border text-sm font-medium ${
              category === cat.id
                ? "bg-primary-600 text-white border-primary-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Value
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-2 border rounded font-mono text-sm"
            step="any"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            From unit
          </label>
          <select
            value={fromUnit}
            onChange={(e) => setFromUnit(e.target.value)}
            className="w-full px-4 py-2 border rounded bg-white"
          >
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {category === "css" && (
        <div className="space-y-2 max-w-xs">
          <label className="block text-sm font-medium text-gray-700">
            Root font size (px)
          </label>
          <input
            type="number"
            min="1"
            step="1"
            value={rootFontSize}
            onChange={(e) => setRootFontSize(e.target.value)}
            className="w-full px-4 py-2 border rounded font-mono text-sm"
          />
          <p className="text-xs text-gray-500">
            rem and em both use this size (default 16px).
          </p>
        </div>
      )}

      {baseValue == null ? (
        <p className="text-sm text-red-600">Enter a valid number to convert.</p>
      ) : (
        <div className="space-y-2">
          {results.map((row) => (
            <div
              key={row.id}
              className={`flex items-center justify-between gap-3 p-3 rounded ${
                row.id === fromUnit
                  ? "bg-primary-50 border border-primary-100"
                  : "bg-gray-50"
              }`}
            >
              <div className="min-w-0">
                <div className="text-xs font-medium text-gray-500">
                  {row.label}
                </div>
                <code className="font-mono text-sm break-all text-gray-900">
                  {row.formatted}
                </code>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(row.id, row.formatted)}
                className="shrink-0 text-gray-500 hover:text-gray-700 p-2"
                title={`Copy ${row.label}`}
                aria-label={`Copy ${row.label}`}
              >
                {copiedKey === row.id ? (
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

export default UnitsTool;
