import React, { useId } from "react";

/**
 * Accessible tool picker: native select on small screens, wrapping chips on sm+.
 * Avoids horizontal scroll / clipped labels for long tool lists.
 */
const ToolSubNav = ({
  tools = [],
  activeId,
  onChange,
  label = "Select tool",
}) => {
  const selectId = useId();

  if (!tools.length || typeof onChange !== "function") {
    return null;
  }

  return (
    <nav className="mb-6" aria-label={label}>
      <div className="sm:hidden">
        <label htmlFor={selectId} className="sr-only">
          {label}
        </label>
        <select
          id={selectId}
          value={activeId}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-800 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          {tools.map((tool) => (
            <option key={tool.id} value={tool.id}>
              {tool.label}
            </option>
          ))}
        </select>
      </div>

      <div className="hidden sm:block border-b border-gray-200 pb-3">
        <div className="flex flex-wrap gap-2">
          {tools.map((tool) => {
            const isActive = tool.id === activeId;
            const Icon = tool.icon;
            const displayLabel = tool.shortLabel || tool.label;

            return (
              <button
                key={tool.id}
                type="button"
                aria-current={isActive ? "true" : undefined}
                onClick={() => onChange(tool.id)}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 ${
                  isActive
                    ? "bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-600"
                    : "bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-200 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {Icon ? (
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                ) : null}
                <span>{displayLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default ToolSubNav;
