import React, { useEffect } from "react";
import { FaClipboardList } from "react-icons/fa";
import ToolSideNav from "./ToolSideNav";
import ToolUtilityRail from "./ToolUtilityRail";
import {
  TOOLS_RAIL_STICKY_TOP,
  TOOLS_WORKSPACE_OFFSET,
} from "./toolsChrome";

/**
 * Two-column tools workspace: side nav · content.
 * Rails from lg (1024px); tool select + FAB below lg.
 * Utilities open on demand via drawer (desktop) or bottom sheet (mobile).
 */
const ToolWorkspaceShell = ({
  tools = [],
  activeToolId,
  onToolChange,
  toolNavLabel = "Select tool",
  utilitiesOpen = false,
  onUtilitiesOpenChange,
  children,
}) => {
  const hasToolNav = tools.length > 0 && typeof onToolChange === "function";
  const closeUtilities = () => {
    if (typeof onUtilitiesOpenChange === "function") {
      onUtilitiesOpenChange(false);
    }
  };
  const openUtilities = () => {
    if (typeof onUtilitiesOpenChange === "function") {
      onUtilitiesOpenChange(true);
    }
  };

  useEffect(() => {
    if (!utilitiesOpen) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") {
        if (typeof onUtilitiesOpenChange === "function") {
          onUtilitiesOpenChange(false);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [utilitiesOpen, onUtilitiesOpenChange]);

  const gridCols = hasToolNav
    ? "lg:grid-cols-[13.75rem_minmax(0,1fr)]"
    : "lg:grid-cols-[minmax(0,1fr)]";

  const railMaxHeight = `calc(100vh - ${TOOLS_WORKSPACE_OFFSET} - 1.5rem)`;

  return (
    <div className="relative flex flex-1 flex-col">
      {hasToolNav && (
        <div className="mb-3 max-w-md lg:hidden">
          <ToolSideNav
            tools={tools}
            activeId={activeToolId}
            onChange={onToolChange}
            label={toolNavLabel}
            variant="select"
          />
        </div>
      )}

      <div
        className={`grid flex-1 items-start gap-3 ${gridCols}`}
        style={{
          minHeight: `min(24rem, calc(100vh - ${TOOLS_WORKSPACE_OFFSET} - 2rem))`,
        }}
      >
        {hasToolNav && (
          <aside
            className="hidden lg:block self-start"
            style={{
              position: "sticky",
              top: TOOLS_RAIL_STICKY_TOP,
              maxHeight: railMaxHeight,
            }}
          >
            <div className="flex h-full max-h-[inherit] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm">
              <ToolSideNav
                tools={tools}
                activeId={activeToolId}
                onChange={onToolChange}
                label={toolNavLabel}
                variant="rail"
              />
            </div>
          </aside>
        )}

        <div className="min-w-0 self-start rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4 lg:min-h-[inherit]">
          {children}
        </div>
      </div>

      {/* Mobile FAB → bottom sheet */}
      <button
        type="button"
        onClick={openUtilities}
        className="lg:hidden fixed bottom-5 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-lg hover:border-primary-200 hover:text-primary-700"
        aria-label="Open paste and recents"
      >
        <FaClipboardList className="h-4 w-4 text-primary-600" aria-hidden />
        Paste & recents
      </button>

      {utilitiesOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/30"
            aria-label="Dismiss utilities"
            onClick={closeUtilities}
          />
          {/* Desktop: right slide-over · Mobile: bottom sheet */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Paste and recents"
            className="relative z-10 flex w-full flex-col border-gray-200 bg-white shadow-2xl max-lg:mt-auto max-lg:max-h-[75vh] max-lg:overflow-y-auto max-lg:rounded-t-2xl max-lg:border max-lg:p-4 lg:h-full lg:w-[20rem] lg:border-l lg:p-4"
          >
            <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-gray-200 lg:hidden" />
            <ToolUtilityRail showClose onClose={closeUtilities} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolWorkspaceShell;
