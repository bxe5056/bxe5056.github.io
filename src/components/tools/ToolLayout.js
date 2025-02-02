import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
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

const categories = [
  { path: "/tools/text", icon: FaFont, label: "Text" },
  { path: "/tools/color", icon: FaPalette, label: "Color" },
  { path: "/tools/image", icon: FaImage, label: "Image" },
  { path: "/tools/svg", icon: FaVectorSquare, label: "SVG" },
  { path: "/tools/pdf", icon: FaFilePdf, label: "PDF" },
  { path: "/tools/data", icon: FaExchangeAlt, label: "Data" },
  { path: "/tools/dev", icon: FaTools, label: "Dev" },
];

const ToolLayout = ({ title, description, children }) => {
  const location = useLocation();
  const { scrollY } = useScroll({
    offset: ["start start", "end start"],
    container: typeof window !== "undefined" ? window : undefined,
  });

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
          <div className="flex items-center justify-between h-full">
            <motion.div
              style={{ color: textColorInactive }}
              className="flex items-center transition-colors duration-200"
            >
              <Link
                to="/tools"
                className="flex items-center"
                style={{ color: "inherit" }}
              >
                <FaArrowLeft className="mr-2" />
                Back to Tool Overview
              </Link>
            </motion.div>
            <div className="hidden md:flex space-x-2">
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

          <div className="bg-white rounded-xl shadow-lg p-6">{children}</div>
        </motion.div>
      </div>
    </div>
  );
};

export default ToolLayout;
