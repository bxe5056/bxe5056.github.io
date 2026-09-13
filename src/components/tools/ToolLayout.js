import React, { useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaFont,
  FaPalette,
  FaImage,
  FaVectorSquare,
  FaExchangeAlt,
  FaTools,
  FaFilePdf,
} from "react-icons/fa";
import BugReportToggle from "../BugReportToggle";
import ToolWorkspaceShell from "./ToolWorkspaceShell";
import { TOOLS_CHROME_HEIGHT, TOOLS_STICKY_TOP } from "./toolsChrome";
import { TOOL_CATEGORIES, getAllTools } from "../../pages/tools/catalog";
import { recordRecent } from "../../utils/tools/recents";

export { default as ToolSubNav } from "./ToolSideNav";
export { default as ToolSideNav } from "./ToolSideNav";

const categoryIcons = {
  text: FaFont,
  color: FaPalette,
  image: FaImage,
  svg: FaVectorSquare,
  pdf: FaFilePdf,
  data: FaExchangeAlt,
  dev: FaTools,
};

const categories = TOOL_CATEGORIES.map((category) => ({
  path: category.path,
  icon: categoryIcons[category.id] || FaTools,
  label: category.shortLabel || category.title,
}));

const ToolLayout = ({
  title,
  description,
  children,
  tools,
  activeToolId,
  onToolChange,
  toolNavLabel = "Select tool",
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const activeCategoryPath = useMemo(
    () =>
      categories.find((category) =>
        location.pathname.startsWith(category.path)
      )?.path || "",
    [location.pathname]
  );

  useEffect(() => {
    const match = getAllTools().find((tool) => tool.path === location.pathname);
    if (!match) return;
    recordRecent({
      path: match.path,
      label: match.label,
      category: match.categoryId,
    });
  }, [location.pathname]);

  const handleMobileCategoryChange = (event) => {
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
        <div className="mx-auto flex h-full max-w-[90rem] items-center gap-3 px-3 sm:px-4">
          <Link
            to="/tools"
            className="inline-flex shrink-0 items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
          >
            <FaArrowLeft className="h-3 w-3" aria-hidden />
            <span className="hidden sm:inline">Tools</span>
          </Link>

          <div className="min-w-0 shrink">
            <h1 className="truncate text-sm font-semibold text-gray-900 sm:text-base">
              {title}
            </h1>
            {description ? (
              <p className="sr-only">{description}</p>
            ) : null}
          </div>

          {/* Desktop categories — flex-1 so pills sit beside title, not far-right void */}
          <nav
            aria-label="Tool categories"
            className="hidden min-w-0 flex-1 md:flex md:justify-center lg:justify-end"
          >
            <div className="inline-flex max-w-full flex-wrap items-center justify-end gap-0.5 rounded-lg border border-gray-200 bg-white p-0.5 shadow-sm">
              {categories.map((category) => {
                const isActive = location.pathname.startsWith(category.path);
                return (
                  <Link
                    key={category.path}
                    to={category.path}
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors sm:px-2.5 sm:text-sm ${
                      isActive
                        ? "bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-200"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                    }`}
                  >
                    <category.icon
                      className={`h-3 w-3 ${
                        isActive ? "text-primary-600" : "text-gray-400"
                      }`}
                      aria-hidden
                    />
                    {category.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0">
            <div className="md:hidden">
              <label htmlFor="tool-category-select" className="sr-only">
                Tool category
              </label>
              <select
                id="tool-category-select"
                value={activeCategoryPath}
                onChange={handleMobileCategoryChange}
                className="max-w-[9.5rem] truncate rounded-md border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {!activeCategoryPath && (
                  <option value="">Category</option>
                )}
                {categories.map((category) => (
                  <option key={category.path} value={category.path}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="border-l border-gray-200 pl-2">
              <BugReportToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[90rem] flex-1 flex-col px-3 py-3 sm:px-4 sm:py-4 pb-24 md:pb-4">
        <ToolWorkspaceShell
          tools={tools}
          activeToolId={activeToolId}
          onToolChange={onToolChange}
          toolNavLabel={toolNavLabel}
        >
          {children}
        </ToolWorkspaceShell>
      </div>
    </div>
  );
};

export default ToolLayout;
