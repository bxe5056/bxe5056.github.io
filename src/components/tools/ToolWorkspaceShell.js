import React, { useCallback, useEffect, useState } from "react";
import { FaClipboardList } from "react-icons/fa";
import ToolSideNav from "./ToolSideNav";
import ToolUtilityRail from "./ToolUtilityRail";
import {
  TOOLS_RAIL_COLLAPSED_KEY,
  TOOLS_RAIL_STICKY_TOP,
  TOOLS_RAIL_WIDTH,
  TOOLS_RAIL_WIDTH_COLLAPSED,
  TOOLS_WORKSPACE_OFFSET,
} from "./toolsChrome";

const readRailCollapsed = () => {
  try {
    return localStorage.getItem(TOOLS_RAIL_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
};

/**
 * Two-column tools workspace: side nav · content.
 * Rails from lg (1024px); chip tool switcher + FAB below lg.
 * Utilities open on demand via drawer (desktop) or bottom sheet (mobile).
 */
const ToolWorkspaceShell = ({
  tools = [],
  activeToolId,
  onToolChange,
  toolNavLabel = "Select tool",
  workspaceTitle,
  utilitiesOpen = false,
  onUtilitiesOpenChange,
  children,
}) => {
  const hasToolNav = tools.length > 0 && typeof onToolChange === "function";
  const [railCollapsed, setRailCollapsed] = useState(readRailCollapsed);

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

  const toggleRailCollapsed = useCallback(() => {
    setRailCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(TOOLS_RAIL_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore quota / private mode */
      }
      return next;
    });
  }, []);

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

  const railWidth = railCollapsed
    ? TOOLS_RAIL_WIDTH_COLLAPSED
    : TOOLS_RAIL_WIDTH;

  const railMaxHeight = `calc(100vh - ${TOOLS_WORKSPACE_OFFSET} - 1.25rem)`;

  return (
    <div className="relative flex flex-1 flex-col">
      {hasToolNav && (
        <div className="mb-2 w-full min-w-0 lg:hidden">
          <ToolSideNav
            tools={tools}
            activeId={activeToolId}
            onChange={onToolChange}
            label={toolNavLabel}
            variant="chips"
          />
        </div>
      )}

      {/* Dynamic lg columns — Tailwind cannot see runtime width values */}
      <style>{`
        @media (min-width: 1024px) {
          .tools-workspace-grid {
            display: grid;
            grid-template-columns: ${
              hasToolNav
                ? `${railWidth} minmax(0, 1fr)`
                : "minmax(0, 1fr)"
            };
            gap: 0.625rem;
            align-items: start;
          }
        }
      `}</style>

      <div
        className="tools-workspace-grid flex flex-1 flex-col gap-2.5"
        style={{
          minHeight: `min(24rem, calc(100vh - ${TOOLS_WORKSPACE_OFFSET} - 1.5rem))`,
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
            <div
              className={`flex h-full max-h-[inherit] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm ${
                railCollapsed ? "p-1" : "p-1.5"
              }`}
            >
              <ToolSideNav
                tools={tools}
                activeId={activeToolId}
                onChange={onToolChange}
                label={toolNavLabel}
                variant="rail"
                collapsed={railCollapsed}
                onToggleCollapsed={toggleRailCollapsed}
              />
            </div>
          </aside>
        )}

        <div className="min-w-0 w-full rounded-lg border border-gray-200 bg-white p-3 pb-20 shadow-sm sm:p-3.5 max-lg:pb-24 lg:min-h-[inherit] lg:pb-3.5">
          {/* Below lg the active chip is the title; only show H2 once the rail is visible. */}
          {workspaceTitle ? (
            <h2 className="mb-2.5 hidden text-base font-semibold tracking-tight text-gray-900 sm:text-lg lg:block">
              {workspaceTitle}
            </h2>
          ) : null}
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
