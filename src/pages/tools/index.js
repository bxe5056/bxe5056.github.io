import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FaFont,
  FaPalette,
  FaImage,
  FaVectorSquare,
  FaExchangeAlt,
  FaTools,
  FaDatabase,
  FaFilePdf,
} from "react-icons/fa";

const toolCategories = [
  {
    title: "Text Tools",
    path: "/tools/text",
    icon: FaFont,
    description: "Text processing and conversion utilities",
    features: [
      "Base64 encoder/decoder",
      "URL encoder/decoder",
      "JWT decoder",
      "Case converter",
      "Markdown preview",
      "Lorem ipsum generator",
    ],
  },
  {
    title: "PDF Tools",
    path: "/tools/pdf",
    icon: FaFilePdf,
    description: "View, modify, and convert PDF files",
    features: ["PDF Viewer", "PDF Merger", "PDF to Images", "Images to PDF", "PDF Page Reorder", "PDF Rotation"],
  },
  {
    title: "Color Tools",
    path: "/tools/color",
    icon: FaPalette,
    description: "Color manipulation and generation tools",
    features: [
      "Color picker",
      "Palette generator",
      "Gradient creator",
      "Contrast checker",
      "Color extractor",
      "Color converter (RGB/HSL/CMYK)",
    ],
  },
  {
    title: "SVG Tools",
    path: "/tools/svg",
    icon: FaVectorSquare,
    description: "SVG manipulation and optimization tools",
    features: [
      "SVG optimizer",
      "Color replacer",
      "ViewBox calculator",
      "Image to SVG converter",
      "SVG preview",
    ],
  },
  {
    title: "Developer Utilities",
    path: "/tools/dev",
    icon: FaTools,
    description: "Essential developer tools and utilities",
    features: [
      "UUID generator",
      "Hash generator",
      "Regex tester",
      "Cron expression parser",
      "Favicon generator",
    ],
  },
  {
    title: "Image Tools",
    path: "/tools/image",
    icon: FaImage,
    description: "Image processing and conversion tools",
    features: [
      "Image resizer",
      "Image cropper",
      "Image compression",
      "Format converter",
      "Metadata viewer",
    ],
  },
  {
    title: "Data Tools",
    path: "/tools/data",
    icon: FaDatabase,
    description: "Data processing and conversion tools",
    features: [
      "JSON to CSV converter",
      "CSV to JSON converter",
      "Data validator",
      "Data formatter",
    ],
  },
];

const Tools = () => {
  return (
    <div className="min-h-screen py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.h1
          className="text-4xl font-bold text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Developer Tools
        </motion.h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {toolCategories.map((category, index) => (
            <motion.div
              key={category.path}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link to={category.path} className="block">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <category.icon className="text-2xl text-primary-600 mr-3" />
                    <h2 className="text-xl font-semibold text-gray-900">
                      {category.title}
                    </h2>
                  </div>
                  <p className="text-gray-600 mb-4">{category.description}</p>
                  <div className="space-y-2">
                    {category.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="text-sm text-gray-500 flex items-center"
                      >
                        <span className="w-1.5 h-1.5 bg-primary-600 rounded-full mr-2"></span>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Tools;
