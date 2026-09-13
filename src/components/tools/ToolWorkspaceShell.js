import React, { useCallback, useEffect, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaClipboardList } from "react-icons/fa";
import ToolSideNav from "./ToolSideNav";
import ToolUtilityRail from "./ToolUtilityRail";
import {
  TOOLS_RAIL_STICKY_TOP,
  TOOLS_WORKSPACE_OFFSET,
} from "./toolsChrome";

const UTILITY_OPEN_KEY = "tools.utilityRail.open";

function readUtilityOpenDefault() {
  if (typeof window === "undefined") return true;
  try {
    const stored = localStorage.getItem(UTILITY_OPEN_KEY);
    if (stored === null) return true;
    return stored === "1";
  } catch {
    return true;
  }
}

/**
 * Three-column tools workspace: side nav · content · utility rail.
 * Rails from lg (1024px); tool select + FAB / bottom sheet below lg.
 * Column tops share one grid row — no sticky stair-step vs center.
 */
const ToolWorkspaceShell = ({
  tools = [],
  activeToolId,
  onToolChange,
  toolNavLabel = "Select tool",
  children,
}) => {
  const hasToolNav = tools.length > 0 && typeof onToolChange === "function";
  const [utilityOpen, setUtilityOpen] = useState(readUtilityOpenDefault);
  const [mobileUtilityOpen, setMobileUtilityOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(UTILITY_OPEN_KEY, utilityOpen ? "1" : "0");
    } catch {
      // ignore
    }
  }, [utilityOpen]);

  useEffect(() => {
    if (!mobileUtilityOpen) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setMobileUtilityOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileUtilityOpen]);

  const toggleUtility = useCallback(() => {
    setUtilityOpen((open) => !open);
  }, []);

  const gridCols = hasToolNav
    ? utilityOpen
      ? "lg:grid-cols-[13.75rem_minmax(0,1fr)_17.5rem]"
      : "lg:grid-cols-[13.75rem_minmax(0,1fr)_auto]"
    : utilityOpen
      ? "lg:grid-cols-[minmax(0,1fr)_17.5rem]"
      : "lg:grid-cols-[minmax(0,1fr)_auto]";

  const railMaxHeight = `calc(100vh - ${TOOLS_WORKSPACE_OFFSET} - 1.5rem)`;

  return (
    <div className="relative flex flex-1 flex-col">
      {hasToolNav && (
        <div className="mb-3 lg:hidden">
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
        style={{ minHeight: `min(32rem, calc(100vh - ${TOOLS_WORKSPACE_OFFSET} - 2rem))` }}
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

        <aside
          className="hidden lg:block self-start"
          style={{
            position: "sticky",
            top: TOOLS_RAIL_STICKY_TOP,
            maxHeight: railMaxHeight,
          }}
        >
          {utilityOpen ? (
            <div className="relative flex h-full max-h-[inherit] w-[17.5rem] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
              <button
                type="button"
                onClick={toggleUtility}
                className="absolute -left-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-slate-500 shadow-sm hover:text-primary-600"
                aria-label="Collapse utilities"
                title="Collapse utilities"
              >
                <FaChevronRight className="h-2.5 w-2.5" />
              </button>
              <ToolUtilityRail />
            </div>
          ) : (
            <button
              type="button"
              onClick={toggleUtility}
              className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white px-2 py-4 text-slate-500 shadow-sm hover:border-primary-200 hover:text-primary-600"
              aria-label="Expand utilities"
              title="Expand utilities"
            >
              <FaChevronLeft className="h-3 w-3" />
              <FaClipboardList className="h-4 w-4" />
              <span
                className="text-[10px] font-semibold uppercase tracking-wide"
                style={{ writingMode: "vertical-rl" }}
              >
                Utilities
              </span>
            </button>
          )}
        </aside>
      </div>

      <button
        type="button"
        onClick={() => setMobileUtilityOpen(true)}
        className="lg:hidden fixed bottom-5 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-lg hover:border-primary-200 hover:text-primary-700"
        aria-label="Open utilities"
      >
        <FaClipboardList className="h-4 w-4 text-primary-600" aria-hidden />
        Paste & recents
      </button>

      {mobileUtilityOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/30"
            aria-label="Dismiss utilities"
            onClick={() => setMobileUtilityOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Utilities"
            className="relative z-10 max-h-[75vh] overflow-y-auto rounded-t-2xl border border-gray-200 bg-white p-4 shadow-2xl"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />
            <ToolUtilityRail
              showClose
              onClose={() => setMobileUtilityOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolWorkspaceShell;
