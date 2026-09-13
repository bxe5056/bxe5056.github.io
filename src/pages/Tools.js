import React from "react";
import { motion } from "framer-motion";
import {
  FaImage,
  FaPalette,
  FaCode,
  FaFont,
  FaTable,
  FaVectorSquare,
  FaFilePdf,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import PageContainer from "../components/common/PageContainer";
import { TOOL_CATEGORIES, getToolPath } from "./tools/catalog";

const categoryIcons = {
  data: <FaTable className="text-2xl" />,
  pdf: <FaFilePdf className="text-2xl" />,
  color: <FaPalette className="text-2xl" />,
  svg: <FaVectorSquare className="text-2xl" />,
  image: <FaImage className="text-2xl" />,
  dev: <FaCode className="text-2xl" />,
  text: <FaFont className="text-2xl" />,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  },
};

const getColorClasses = (color) => {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    green: "bg-green-50 text-green-600 hover:bg-green-100",
    purple: "bg-purple-50 text-purple-600 hover:bg-purple-100",
    orange: "bg-orange-50 text-orange-600 hover:bg-orange-100",
    pink: "bg-pink-50 text-pink-600 hover:bg-pink-100",
    teal: "bg-teal-50 text-teal-600 hover:bg-teal-100",
    red: "bg-red-50 text-red-600 hover:bg-red-100",
  };
  return colorMap[color] || colorMap.blue;
};

const Tools = () => {
  return (
    <PageContainer>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Developer Tools & Utilities
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Browse {TOOL_CATEGORIES.length} categories — jump straight into a
          tool or open a full suite from the cards below.
        </p>
      </div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {TOOL_CATEGORIES.map((category) => (
          <motion.div
            key={category.path}
            variants={itemVariants}
            className="relative group"
          >
            <div className="h-full bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 border border-gray-100">
              <Link to={category.path} className="block">
                <div className="flex items-center mb-4">
                  {categoryIcons[category.id]}
                  <h3 className="text-xl font-semibold text-gray-900 ml-3">
                    {category.title}
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">{category.description}</p>
              </Link>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Tools</h4>
                <div className="flex flex-wrap gap-2">
                  {category.tools.map((tool) => (
                    <Link
                      key={tool.id}
                      to={getToolPath(category.path, tool.id)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${getColorClasses(
                        category.color
                      )}`}
                    >
                      {tool.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </PageContainer>
  );
};

export default Tools;
