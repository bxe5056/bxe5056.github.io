import React, { useState } from "react";
import { motion } from "framer-motion";
import imageCompression from "browser-image-compression";
import {
  FaUpload,
  FaDownload,
  FaImage,
  FaFileImage,
  FaPalette,
  FaCode,
  FaTools,
  FaExchangeAlt,
  FaFont,
  FaTable,
  FaVectorSquare,
  FaFilePdf,
} from "react-icons/fa";
import FileSaver from "file-saver";
import JSZip from "jszip";
import { SVG } from "@svgdotjs/svg.js";
import { Link } from "react-router-dom";
import PageContainer from "../components/common/PageContainer";

const toolCategories = [
  {
    title: "Data Tools",
    path: "/tools/data",
    icon: <FaTable className="text-2xl" />,
    description: "Convert between multiple data formats",
    features: ["CSV", "JSON", "YAML", "XML", "MD Table", "HTML Table"],
    color: "purple",
  },
  {
    title: "PDF Tools",
    path: "/tools/pdf",
    icon: <FaFilePdf className="text-2xl" />,
    description: "View, modify, and merge PDF files",
    features: [
      "PDF Viewer",
      "PDF Merger",
      "PDF to Images",
      "Images to PDF",
      "PDF Page Reorder",
      "PDF Rotation",
    ],
    color: "red",
  },
  {
    title: "Color Tools",
    path: "/tools/color",
    icon: <FaPalette className="text-2xl" />,
    description: "Color picker, palette generator, and gradient creator",
    features: [
      "Color Picker",
      "Palette Generator",
      "Gradient Generator",
      "Contrast Checker",
      "Extract Colors",
    ],
    color: "pink",
  },
  {
    title: "SVG Tools",
    path: "/tools/svg",
    icon: <FaVectorSquare className="text-2xl" />,
    description: "SVG optimization and manipulation tools",
    features: ["SVG Optimizer", "Color Replacer", "ViewBox Calculator", "Image to SVG"],
    color: "blue",
  },
  {
    title: "Image Tools",
    path: "/tools/image",
    icon: <FaImage className="text-2xl" />,
    description: "Resize, crop, compress, and convert images",
    features: [
      "Image Resize",
      "Image Compress",
      "Image Crop",
      "Format Convert",
      "Metadata Viewer",
    ],
    color: "green",
  },
  {
    title: "Developer Tools",
    path: "/tools/dev",
    icon: <FaCode className="text-2xl" />,
    description: "UUID, hash generator, regex tester, and more",
    features: [
      "UUID Generator",
      "Hash Generator",
      "Regex Tester",
      "Cron Parser",
      "Favicon Generator",
    ],
    color: "orange",
  },
  {
    title: "Text Tools",
    path: "/tools/text",
    icon: <FaFont className="text-2xl" />,
    description: "Text processing and conversion utilities",
    features: [
      "Base64 Encoder/Decoder",
      "URL Encoder/Decoder",
      "JWT Decoder",
      "Case Converter",
      "Markdown Preview",
      "Lorem Ipsum Generator",
    ],
    color: "teal",
  },
];

const getToolPath = (category, feature) => {
  // Map feature names to their URL-friendly identifiers
  const featureMap = {
    // Data Tools
    CSV: "csvToJson",
    JSON: "jsonToCsv",
    YAML: "yamlToJson",
    XML: "xmlToJson",
    "MD Table": "md_tableTojson",
    "HTML Table": "html_tableTojson",
    // Text Tools
    "Base64 Encoder/Decoder": "base64",
    "URL Encoder/Decoder": "url",
    "JWT Decoder": "jwt",
    "Case Converter": "case",
    "Markdown Preview": "markdown",
    "Lorem Ipsum Generator": "lorem",
    // Color Tools
    "Color Picker": "picker",
    "Palette Generator": "palette",
    "Gradient Generator": "gradient",
    "Contrast Checker": "contrast",
    "Extract Colors": "extract",
    // SVG Tools
    "SVG Optimizer": "optimize",
    "Color Replacer": "colors",
    "ViewBox Calculator": "viewbox",
    "Image to SVG": "image-to-svg",
    // Image Tools
    "Image Resize": "resize",
    "Image Compress": "compress",
    "Image Crop": "crop",
    "Format Convert": "convert",
    "Metadata Viewer": "metadata",
    // Developer Tools
    "UUID Generator": "uuid",
    "Hash Generator": "hash",
    "Regex Tester": "regex",
    "Cron Parser": "cron",
    "Favicon Generator": "favicon",
    // PDF Tools
    "PDF Viewer": "viewer",
    "PDF Merger": "merger",
    "PDF to Images": "to-images",
    "Images to PDF": "from-images",
    "PDF Page Reorder": "reorder",
  };

  return `${category}/${featureMap[feature] || feature.toLowerCase()}`;
};

const Tools = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [convertedImage, setConvertedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [outputFormat, setOutputFormat] = useState("PNG");
  const [activeTab, setActiveTab] = useState("convert");
  const [bgRemoved, setBgRemoved] = useState(null);
  const [svgColors, setSvgColors] = useState([]);
  const [apiKey, setApiKey] = useState("");
  const [tolerance, setTolerance] = useState(30);
  const [samplePoint, setSamplePoint] = useState(null);

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
    setConvertedImage(null);
  };

  const convertImage = async () => {
    if (!selectedFile) return;

    setLoading(true);
    try {
      // First compress the image
      const compressedFile = await imageCompression(selectedFile, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
      });

      // Create a blob URL for the compressed image
      const url = URL.createObjectURL(compressedFile);

      // Create a new image element
      const img = new Image();
      img.src = url;

      await new Promise((resolve) => {
        img.onload = () => {
          // Create canvas
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;

          // Draw image on canvas
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);

          // Convert to desired format
          canvas.toBlob(
            (blob) => {
              const convertedUrl = URL.createObjectURL(blob);
              setConvertedImage(convertedUrl);
              resolve();
            },
            outputFormat === "PNG" ? "image/png" : "image/svg+xml"
          );
        };
      });
    } catch (error) {
      console.error("Error converting image:", error);
      alert("Error converting image. Please try again.");
    }
    setLoading(false);
  };

  const downloadImage = () => {
    if (!convertedImage) return;

    const link = document.createElement("a");
    link.href = convertedImage;
    link.download = `converted-image.${outputFormat.toLowerCase()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const removeBackgroundFree = async () => {
    if (!selectedFile) return;

    setLoading(true);
    try {
      const img = new Image();
      const url = URL.createObjectURL(selectedFile);
      img.src = url;

      await new Promise((resolve) => {
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");

          // Draw image
          ctx.drawImage(img, 0, 0);

          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          // Get background color from top-right corner or selected point
          const point = samplePoint || { x: 0, y: 0 };
          const idx = (point.y * canvas.width + point.x) * 4;
          const bgColor = {
            r: data[idx],
            g: data[idx + 1],
            b: data[idx + 2],
          };

          // Remove background based on color similarity
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Calculate color distance
            const distance = Math.sqrt(
              Math.pow(r - bgColor.r, 2) +
                Math.pow(g - bgColor.g, 2) +
                Math.pow(b - bgColor.b, 2)
            );

            // If color is similar to background, make it transparent
            if (distance < tolerance) {
              data[i + 3] = 0; // Alpha channel
            }
          }

          // Put processed image data back
          ctx.putImageData(imageData, 0, 0);

          // Convert to PNG
          canvas.toBlob((blob) => {
            const processedUrl = URL.createObjectURL(blob);
            setBgRemoved(processedUrl);
            resolve();
          }, "image/png");
        };
      });
    } catch (error) {
      console.error("Error removing background:", error);
      alert("Error removing background. Please try again.");
    }
    setLoading(false);
  };

  const handleCanvasClick = (event) => {
    if (!convertedImage) return;

    const canvas = document.createElement("canvas");
    const img = document.querySelector("#preview-image");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const rect = img.getBoundingClientRect();
    const x = Math.floor(
      (event.clientX - rect.left) * (img.naturalWidth / rect.width)
    );
    const y = Math.floor(
      (event.clientY - rect.top) * (img.naturalHeight / rect.height)
    );

    setSamplePoint({ x, y });
  };

  const removeBackground = async () => {
    if (!selectedFile || !apiKey) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("image_file", selectedFile);
      formData.append("size", "auto");

      const response = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: {
          "X-Api-Key": apiKey,
        },
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setBgRemoved(url);
      } else {
        throw new Error("Background removal failed");
      }
    } catch (error) {
      console.error("Error removing background:", error);
      alert(
        "Error removing background. Please check your API key and try again."
      );
    }
    setLoading(false);
  };

  const splitSvgByColor = async () => {
    if (!selectedFile || !selectedFile.type.includes("svg")) {
      alert("Please select an SVG file");
      return;
    }

    setLoading(true);
    try {
      const text = await selectedFile.text();
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(text, "image/svg+xml");

      // Create a map to store elements by color
      const colorMap = new Map();

      // Find all elements with fill or stroke
      const elements = svgDoc.querySelectorAll("[fill], [stroke]");
      elements.forEach((el) => {
        const fill = el.getAttribute("fill");
        const stroke = el.getAttribute("stroke");

        [fill, stroke].forEach((color) => {
          if (color && color !== "none") {
            if (!colorMap.has(color)) {
              colorMap.set(color, []);
            }
            const clone = el.cloneNode(true);
            colorMap.get(color).push(clone);
          }
        });
      });

      // Create separate SVGs for each color
      const zip = new JSZip();
      const colors = Array.from(colorMap.keys());
      setSvgColors(colors);

      colors.forEach((color) => {
        const elements = colorMap.get(color);
        const newSvg = svgDoc.documentElement.cloneNode(true);
        // Remove all existing elements
        while (newSvg.firstChild) {
          newSvg.removeChild(newSvg.firstChild);
        }
        // Add only elements of this color
        elements.forEach((el) => {
          newSvg.appendChild(el);
        });

        const svgString = new XMLSerializer().serializeToString(newSvg);
        zip.file(`${color.replace("#", "")}.svg`, svgString);
      });

      // Generate and download zip file
      const content = await zip.generateAsync({ type: "blob" });
      FileSaver.saveAs(content, "svg-colors.zip");
    } catch (error) {
      console.error("Error splitting SVG:", error);
      alert("Error splitting SVG. Please try again.");
    }
    setLoading(false);
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
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <PageContainer>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Developer Tools & Utilities
        </h1>
        <p className="text-xl text-gray-600">
          A collection of useful tools for developers, designers, and content
          creators
        </p>
      </div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {toolCategories.map((category) => (
          <motion.div
            key={category.path}
            variants={itemVariants}
            className="relative group"
          >
            <div className="h-full bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 border border-gray-100">
              <Link to={category.path} className="block">
                <div className="flex items-center mb-4">
                  {category.icon}
                  <h3 className="text-xl font-semibold text-gray-900 ml-3">
                    {category.title}
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">{category.description}</p>
              </Link>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Features:</h4>
                <div className="flex flex-wrap gap-2">
                  {category.features.map((feature) => (
                    <Link
                      key={feature}
                      to={getToolPath(category.path, feature)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${getColorClasses(
                        category.color
                      )}`}
                    >
                      {feature}
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
