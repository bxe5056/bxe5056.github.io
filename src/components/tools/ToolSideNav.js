import React, { useId } from "react";
import {
  FaAdjust,
  FaAlignLeft,
  FaBalanceScale,
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaClock,
  FaCode,
  FaColumns,
  FaCompress,
  FaCrop,
  FaCut,
  FaExchangeAlt,
  FaExpand,
  FaEyeDropper,
  FaFileAlt,
  FaFileCode,
  FaFileCsv,
  FaFileImage,
  FaFilePdf,
  FaFillDrip,
  FaFingerprint,
  FaFont,
  FaGlobe,
  FaHashtag,
  FaHtml5,
  FaImage,
  FaImages,
  FaInfo,
  FaLink,
  FaLock,
  FaLowVision,
  FaMagic,
  FaMarkdown,
  FaObjectGroup,
  FaPalette,
  FaQrcode,
  FaRedo,
  FaRuler,
  FaSort,
  FaStar,
  FaStream,
  FaTable,
  FaTh,
  FaTint,
  FaWrench,
} from "react-icons/fa";
import { MdGradient } from "react-icons/md";

/**
 * Icon per catalog tool id (unique across categories).
 * Kept here so catalog.js stays data-only.
 */
export const TOOL_ICONS = {
  // color
  picker: FaEyeDropper,
  palette: FaPalette,
  gradient: MdGradient,
  contrast: FaAdjust,
  extract: FaTint,
  blindness: FaLowVision,
  // pdf
  viewer: FaFilePdf,
  merger: FaObjectGroup,
  "to-images": FaImages,
  "from-images": FaFileImage,
  reorder: FaSort,
  rotate: FaRedo,
  split: FaCut,
  // svg
  optimize: FaMagic,
  colors: FaFillDrip,
  viewbox: FaExpand,
  "image-to-svg": FaImage,
  sprite: FaTh,
  // image
  resize: FaRuler,
  compress: FaCompress,
  crop: FaCrop,
  convert: FaExchangeAlt,
  metadata: FaInfo,
  // dev
  uuid: FaFingerprint,
  hash: FaHashtag,
  regex: FaCode,
  cron: FaClock,
  favicon: FaStar,
  qr: FaQrcode,
  timestamp: FaCalendarAlt,
  units: FaBalanceScale,
  // text
  base64: FaFileCode,
  url: FaLink,
  jwt: FaLock,
  case: FaFont,
  markdown: FaMarkdown,
  lorem: FaAlignLeft,
  diff: FaColumns,
  unicode: FaGlobe,
  // data
  editor: FaCode,
  csvToJson: FaFileCsv,
  jsonToCsv: FaFileCode,
  yamlToJson: FaStream,
  xmlToJson: FaFileAlt,
  md_tableToJson: FaTable,
  html_tableToJson: FaHtml5,
};

/**
 * Vertical tool list for the workspace left rail.
 * Desktop: stacked buttons (optionally icon-only). Mobile: native select (via variant).
 */
const ToolSideNav = ({
  tools = [],
  activeId,
  onChange,
  label = "Select tool",
  variant = "rail",
  collapsed = false,
  onToggleCollapsed,
}) => {
  const selectId = useId();

  if (!tools.length || typeof onChange !== "function") {
    return null;
  }

  if (variant === "select") {
    return (
      <nav aria-label={label} className="w-full">
        <label htmlFor={selectId} className="sr-only">
          {label}
        </label>
        <select
          id={selectId}
          value={activeId}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          {tools.map((tool) => (
            <option key={tool.id} value={tool.id}>
              {tool.label}
            </option>
          ))}
        </select>
      </nav>
    );
  }

  return (
    <nav aria-label={label} className="flex h-full flex-col">
      <div
        className={`mb-1 flex h-7 items-center ${
          collapsed ? "justify-center px-0" : "justify-between gap-1 px-2"
        }`}
      >
        {!collapsed ? (
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Tools
          </p>
        ) : (
          <span className="sr-only">Tools</span>
        )}
        {typeof onToggleCollapsed === "function" ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label={collapsed ? "Expand tools rail" : "Collapse tools rail"}
            aria-pressed={collapsed}
            title={collapsed ? "Expand rail" : "Collapse rail"}
          >
            {collapsed ? (
              <FaChevronRight className="h-3 w-3" aria-hidden />
            ) : (
              <FaChevronLeft className="h-3 w-3" aria-hidden />
            )}
          </button>
        ) : null}
      </div>
      <ul className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {tools.map((tool) => {
          const isActive = tool.id === activeId;
          const Icon = TOOL_ICONS[tool.id] || tool.icon || FaWrench;
          const displayLabel = tool.shortLabel || tool.label;

          return (
            <li key={tool.id} className="w-full">
              <button
                type="button"
                aria-current={isActive ? "page" : undefined}
                aria-label={tool.label}
                title={tool.label}
                onClick={() => onChange(tool.id)}
                className={`flex w-full items-center rounded-md text-left text-sm leading-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 ${
                  collapsed
                    ? "justify-center px-0 py-2"
                    : "gap-2.5 px-2 py-2"
                } ${
                  isActive
                    ? "bg-primary-50 font-semibold text-primary-700 shadow-[inset_2px_0_0_0_theme(colors.primary.500)]"
                    : "font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                }`}
              >
                <span
                  className="inline-flex h-4 w-5 shrink-0 items-center justify-center"
                  aria-hidden="true"
                >
                  <Icon
                    className={`h-4 w-4 ${
                      isActive ? "text-primary-600" : "text-gray-400"
                    }`}
                  />
                </span>
                {!collapsed ? (
                  <span className="min-w-0 flex-1 truncate leading-none">
                    {displayLabel}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default ToolSideNav;
