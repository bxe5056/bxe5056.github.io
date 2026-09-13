import React, { useEffect, useMemo } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
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
  const { scrollY } = useScroll({
    offset: ["start start", "end start"],
    container: typeof window !== "undefined" ? window : undefined,
  });

  const activeCategoryPath = useMemo(
    () =>
      categories.find((category) =>
        location.pathname.startsWith(category.path)
      )?.path || "",
    [location.pathname]
  );

  // Record hub recents when the active tool slug changes
  useEffect(() => {
    const match = getAllTools().find((tool) => tool.path === location.pathname);
    if (!match) return;
    recordRecent({
      path: match.path,
      label: match.label,
      category: match.categoryId,
    });
  }, [location.pathname]);

  // Enhanced scroll animations for the tools navbar
  const toolbarHeight = useTransform(scrollY, [0, 50], ["3.5rem", "2.75rem"]);
  const mainNavHeight = useTransform(scrollY, [0, 50], ["4rem", "3.5rem"]);
  const toolbarTop = mainNavHeight;

  const toolbarBackground = useTransform(
    scrollY,
    [0, 50],
    ["rgba(249, 250, 251, 0)", "rgba(71, 85, 105, 0.75)"]
  );

  const backdropBlur = useTransform(
    scrollY,
    [0, 50],
    ["blur(8px)", "blur(12px)"]
  );

  const boxShadow = useTransform(
    scrollY,
    [0, 50],
    ["0 0 0 0 rgba(51, 65, 85, 0)", "0 8px 32px -8px rgba(51, 65, 85, 0.15)"]
  );

  const textColorInactive = useTransform(
    scrollY,
    [0, 50],
    ["rgba(107, 114, 128, 1)", "rgba(226, 232, 240, 1)"]
  );

  const borderOpacity = useTransform(scrollY, [0, 50], ["0.05", "0.2"]);

  const handleMobileCategoryChange = (event) => {
    const nextPath = event.target.value;
    if (nextPath) {
      navigate(nextPath);
    }
  };

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ scrollMarginTop: "7.5rem" }}
    >
      {/* Category switcher — sticky under site header */}
      <motion.nav
        style={{
          backgroundColor: toolbarBackground,
          backdropFilter: backdropBlur,
          boxShadow,
          borderBottom: `1px solid rgba(51, 65, 85, ${borderOpacity.get()})`,
          height: toolbarHeight,
          top: toolbarTop,
        }}
        className="sticky z-40 transition-all duration-200"
      >
        <div className="container mx-auto px-4 h-full">
          <div className="flex items-center justify-between h-full gap-3">
            <motion.div
              style={{ color: textColorInactive }}
              className="flex items-center transition-colors duration-200 shrink-0"
            >
              <Link
                to="/tools"
                className="flex items-center text-sm sm:text-base"
                style={{ color: "inherit" }}
              >
                <FaArrowLeft className="mr-2" />
                <span className="hidden sm:inline">Back to Tool Overview</span>
                <span className="sm:hidden">Tools</span>
              </Link>
            </motion.div>
            {/* Mobile View — category select */}
            <div className="flex md:hidden items-center gap-2 min-w-0 flex-1 justify-end">
              <label htmlFor="tool-category-select" className="sr-only">
                Tool category
              </label>
              <select
                id="tool-category-select"
                value={activeCategoryPath}
                onChange={handleMobileCategoryChange}
                className="min-w-0 max-w-[10.5rem] truncate rounded-md border border-gray-300 bg-white/90 px-2 py-1.5 text-sm font-medium text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {!activeCategoryPath && (
                  <option value="">Select category</option>
                )}
                {categories.map((category) => (
                  <option key={category.path} value={category.path}>
                    {category.label}
                  </option>
                ))}
              </select>
              <div className="border-l border-gray-200 pl-2 shrink-0">
                <BugReportToggle />
              </div>
            </div>
            {/* Desktop View — segmented category pills */}
            <div className="hidden md:flex items-center gap-1.5">
              <div className="inline-flex items-center gap-0.5 rounded-full border border-gray-200/80 bg-white/70 p-1 shadow-sm backdrop-blur-sm">
                {categories.map((category) => {
                  const isActive = location.pathname.startsWith(category.path);
                  return (
                    <Link
                      key={category.path}
                      to={category.path}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary-50 text-primary-700 shadow-sm ring-1 ring-inset ring-primary-200"
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                      }`}
                    >
                      <category.icon
                        className={`h-3.5 w-3.5 ${
                          isActive ? "text-primary-600" : "text-gray-400"
                        }`}
                        aria-hidden
                      />
                      {category.label}
                    </Link>
                  );
                })}
              </div>
              <div className="border-l border-gray-200 ml-1 pl-2">
                <BugReportToggle />
              </div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Main Content — three-column workspace */}
      <div className="container mx-auto px-4 py-6 sm:py-8 pb-24 lg:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-5 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              {title}
            </h1>
            {description && (
              <p className="text-gray-600 text-base sm:text-lg">{description}</p>
            )}
          </div>

          <ToolWorkspaceShell
            tools={tools}
            activeToolId={activeToolId}
            onToolChange={onToolChange}
            toolNavLabel={toolNavLabel}
          >
            {children}
          </ToolWorkspaceShell>
        </motion.div>
      </div>
    </div>
  );
};

export default ToolLayout;
