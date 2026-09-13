import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaClipboardList } from "react-icons/fa";
import BugReportToggle from "../BugReportToggle";
import ToolWorkspaceShell from "./ToolWorkspaceShell";
import { TOOLS_CHROME_HEIGHT, TOOLS_STICKY_TOP } from "./toolsChrome";
import { TOOL_CATEGORIES, getAllTools } from "../../pages/tools/catalog";
import { recordRecent } from "../../utils/tools/recents";

export { default as ToolSubNav } from "./ToolSideNav";
export { default as ToolSideNav } from "./ToolSideNav";

const categories = TOOL_CATEGORIES.map((category) => ({
  path: category.path,
  label: category.shortLabel || category.title,
  title: category.title,
}));

const ToolLayout = ({
  title,
  description,
  children,
  tools,
  activeToolId,
  activeToolLabel,
  onToolChange,
  toolNavLabel = "Select tool",
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [utilitiesOpen, setUtilitiesOpen] = useState(false);

  const activeCategoryPath = useMemo(
    () =>
      categories.find((category) =>
        location.pathname.startsWith(category.path)
      )?.path || "",
    [location.pathname]
  );

  const resolvedToolLabel = useMemo(() => {
    if (activeToolLabel) return activeToolLabel;
    if (!tools?.length || !activeToolId) return null;
    const match = tools.find((tool) => tool.id === activeToolId);
    return match?.label || match?.shortLabel || null;
  }, [activeToolLabel, tools, activeToolId]);

  /** Prefer active tool name in the workspace; fall back to category title. */
  const workspaceTitle = resolvedToolLabel || title;

  useEffect(() => {
    const match = getAllTools().find((tool) => tool.path === location.pathname);
    if (!match) return;
    recordRecent({
      path: match.path,
      label: match.label,
      category: match.categoryId,
    });
  }, [location.pathname]);

  const handleCategoryChange = (event) => {
    const nextPath = event.target.value;
    if (nextPath) {
      navigate(nextPath);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex flex-col">
      {/*
        Solid sticky chrome under the fixed site header.
        Opaque background so scrolling workspace never “clips through” the bar.
      */}
      <header
        className="sticky z-40 border-b border-gray-200 bg-gray-50"
        style={{ top: TOOLS_STICKY_TOP, height: TOOLS_CHROME_HEIGHT }}
      >
        <div className="mx-auto flex h-full max-w-[90rem] items-center gap-2 px-3 sm:gap-2.5 sm:px-4">
          <Link
            to="/tools"
            className="inline-flex shrink-0 items-center gap-1 text-xs text-gray-500 hover:text-gray-800 sm:text-sm"
          >
            <FaArrowLeft className="h-3 w-3" aria-hidden />
            <span className="hidden sm:inline">Overview</span>
          </Link>

          <div className="h-4 w-px shrink-0 bg-gray-200" aria-hidden />

          <div className="min-w-0 shrink">
            <label htmlFor="tool-category-select" className="sr-only">
              Tool category
            </label>
            <select
              id="tool-category-select"
              value={activeCategoryPath}
              onChange={handleCategoryChange}
              className="max-w-[8.5rem] truncate rounded-md border border-gray-200 bg-white py-1 pl-2 pr-7 text-xs font-medium text-gray-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:max-w-[10rem] sm:text-sm"
              title={title}
            >
              {!activeCategoryPath && <option value="">Category</option>}
              {categories.map((category) => (
                <option key={category.path} value={category.path}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {description ? <p className="sr-only">{description}</p> : null}

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setUtilitiesOpen(true)}
              className="hidden lg:inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600 shadow-sm hover:border-primary-200 hover:text-primary-700"
              aria-label="Open paste and recents"
              title="Paste & recents"
            >
              <FaClipboardList
                className="h-3 w-3 text-primary-600"
                aria-hidden
              />
              <span className="hidden xl:inline">Paste & recents</span>
            </button>
            <div className="border-l border-gray-200 pl-1.5 sm:pl-2">
              <BugReportToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[90rem] flex-1 flex-col px-3 py-2.5 sm:px-4 sm:py-3 pb-24 lg:pb-3">
        <ToolWorkspaceShell
          tools={tools}
          activeToolId={activeToolId}
          onToolChange={onToolChange}
          toolNavLabel={toolNavLabel}
          workspaceTitle={workspaceTitle}
          utilitiesOpen={utilitiesOpen}
          onUtilitiesOpenChange={setUtilitiesOpen}
        >
          {children}
        </ToolWorkspaceShell>
      </div>
    </div>
  );
};

export default ToolLayout;
