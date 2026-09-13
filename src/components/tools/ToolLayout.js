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
import SharedPasteBar from "./SharedPasteBar";
import { TOOL_CATEGORIES, getAllTools } from "../../pages/tools/catalog";
import { recordRecent } from "../../utils/tools/recents";

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

const ToolLayout = ({ title, description, children }) => {
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

  const textColorActive = useTransform(
    scrollY,
    [0, 50],
    ["rgba(37, 99, 235, 1)", "rgba(255, 255, 255, 1)"]
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
      {/* Navigation Bar */}
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
            {/* Desktop View */}
            <div className="hidden md:flex items-center space-x-2">
              {categories.map((category) => (
                <div key={category.path} className="relative">
                  <Link
                    to={category.path}
                    className="px-3 h-full flex items-center"
                  >
                    <motion.div
                      style={{
                        color: location.pathname.startsWith(category.path)
                          ? textColorActive
                          : textColorInactive,
                      }}
                      className="flex items-center text-sm font-medium"
                    >
                      <category.icon className="mr-1.5" />
                      {category.label}
                    </motion.div>
                  </Link>
                  {location.pathname.startsWith(category.path) && (
                    <motion.div
                      layoutId="activeCategory"
                      style={{ backgroundColor: textColorActive }}
                      className="absolute bottom-[-13px] left-0 right-0 h-[3px]"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                </div>
              ))}
              <div className="border-l border-gray-200 ml-2 pl-2">
                <BugReportToggle />
              </div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
            {description && (
              <p className="text-gray-600 text-lg">{description}</p>
            )}
          </div>

          <SharedPasteBar />

          <div className="bg-white rounded-xl shadow-lg p-6">{children}</div>
        </motion.div>
      </div>
    </div>
  );
};

export default ToolLayout;
