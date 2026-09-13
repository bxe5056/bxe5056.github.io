import React, { useCallback, useEffect, useRef } from "react";
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
 * Desktop (rail): stacked buttons (optionally icon-only).
 * Narrow (chips): horizontal labeled chip switcher.
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
  const tabRefs = useRef([]);
  const activeIndex = tools.findIndex((tool) => tool.id === activeId);

  const focusTabAt = useCallback((index) => {
    const el = tabRefs.current[index];
    if (el) {
      el.focus();
      el.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }
  }, []);

  useEffect(() => {
    if (variant !== "chips" || activeIndex < 0) return;
    const el = tabRefs.current[activeIndex];
    if (!el) return;
    el.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [variant, activeIndex, activeId]);

  if (!tools.length || typeof onChange !== "function") {
    return null;
  }

  if (variant === "chips" || variant === "select") {
    const handleChipKeyDown = (event) => {
      if (!tools.length) return;
      const current =
        activeIndex >= 0 ? activeIndex : Math.max(0, tools.length - 1);
      let next = current;

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        next = (current + 1) % tools.length;
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        next = (current - 1 + tools.length) % tools.length;
      } else if (event.key === "Home") {
        event.preventDefault();
        next = 0;
      } else if (event.key === "End") {
        event.preventDefault();
        next = tools.length - 1;
      } else {
        return;
      }

      onChange(tools[next].id);
      requestAnimationFrame(() => focusTabAt(next));
    };

    return (
      <nav aria-label={label} className="w-full min-w-0">
        <div
          role="tablist"
          aria-label={label}
          aria-orientation="horizontal"
          onKeyDown={handleChipKeyDown}
          className="flex w-full min-w-0 gap-1.5 overflow-x-auto overflow-y-visible overscroll-x-contain px-1.5 py-1.5 [scrollbar-width:thin] [scrollbar-color:theme(colors.gray.300)_transparent] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300"
        >
          {tools.map((tool, index) => {
            const isActive = tool.id === activeId;
            const Icon = TOOL_ICONS[tool.id] || tool.icon || FaWrench;
            const displayLabel = tool.shortLabel || tool.label;

            return (
              <button
                key={tool.id}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                type="button"
                role="tab"
                id={`tool-chip-${tool.id}`}
                aria-selected={isActive}
                aria-label={tool.label}
                title={tool.label}
                tabIndex={isActive || (activeIndex < 0 && index === 0) ? 0 : -1}
                onClick={() => onChange(tool.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium leading-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 sm:text-sm ${
                  isActive
                    ? "border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-500"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800"
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 shrink-0 ${
                    isActive ? "text-primary-600" : "text-gray-400"
                  }`}
                  aria-hidden
                />
                <span className="whitespace-nowrap">{displayLabel}</span>
              </button>
            );
          })}
        </div>
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
