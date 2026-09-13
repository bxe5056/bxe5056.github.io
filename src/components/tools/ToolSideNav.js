import React, { useId } from "react";

/**
 * Vertical tool list for the workspace left rail.
 * Desktop: stacked buttons. Mobile: native select (via variant).
 */
const ToolSideNav = ({
  tools = [],
  activeId,
  onChange,
  label = "Select tool",
  variant = "rail",
}) => {
  const selectId = useId();

  if (!tools.length || typeof onChange !== "function") {
    return null;
  }

  if (variant === "select") {
    return (
      <nav aria-label={label}>
        <label htmlFor={selectId} className="sr-only">
          {label}
        </label>
        <select
          id={selectId}
          value={activeId}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-800 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
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
      <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        Tools
      </p>
      <ul className="flex flex-1 flex-col gap-0.5 overflow-y-auto pr-0.5">
        {tools.map((tool) => {
          const isActive = tool.id === activeId;
          const Icon = tool.icon;
          const displayLabel = tool.label;

          return (
            <li key={tool.id}>
              <button
                type="button"
                aria-current={isActive ? "page" : undefined}
                onClick={() => onChange(tool.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 ${
                  isActive
                    ? "bg-primary-50 font-semibold text-primary-700 ring-1 ring-inset ring-primary-200"
                    : "font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {Icon ? (
                  <Icon
                    className={`h-3.5 w-3.5 shrink-0 ${
                      isActive ? "text-primary-600" : "text-gray-400"
                    }`}
                    aria-hidden="true"
                  />
                ) : null}
                <span className="min-w-0 leading-snug">{displayLabel}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default ToolSideNav;
