import React, { useId } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

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
        className={`mb-1.5 flex items-center ${
          collapsed ? "justify-center px-0" : "justify-between gap-1 px-1"
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
      <ul className="flex flex-1 flex-col gap-0.5 overflow-y-auto pr-0.5">
        {tools.map((tool) => {
          const isActive = tool.id === activeId;
          const Icon = tool.icon;
          const displayLabel = tool.shortLabel || tool.label;

          return (
            <li key={tool.id}>
              <button
                type="button"
                aria-current={isActive ? "page" : undefined}
                aria-label={tool.label}
                title={tool.label}
                onClick={() => onChange(tool.id)}
                className={`flex w-full items-center rounded-lg text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 ${
                  collapsed
                    ? "justify-center px-1.5 py-2"
                    : "gap-2 px-2.5 py-1.5"
                } ${
                  isActive
                    ? "bg-primary-50 font-semibold text-primary-700 ring-1 ring-inset ring-primary-200"
                    : "font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                }`}
              >
                {Icon ? (
                  <Icon
                    className={`h-3.5 w-3.5 shrink-0 ${
                      isActive ? "text-primary-600" : "text-gray-400"
                    }`}
                    aria-hidden="true"
                  />
                ) : (
                  <span
                    className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center text-[10px] font-bold ${
                      isActive ? "text-primary-600" : "text-gray-400"
                    }`}
                    aria-hidden
                  >
                    {(displayLabel || "?").charAt(0)}
                  </span>
                )}
                {!collapsed ? (
                  <span className="min-w-0 truncate leading-snug">
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
