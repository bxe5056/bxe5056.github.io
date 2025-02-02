import React, { useState } from "react";
import {
  FaGithub,
  FaExternalLinkAlt,
  FaAppStore,
  FaGooglePlay,
  FaEye,
  FaFilePdf,
  FaUniversity,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/TextLayer.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";

// Set up PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Add this mapping at the top of the file, after imports
const TECH_URLS = {
  "React Native": "https://reactnative.dev",
  TypeScript: "https://www.typescriptlang.org",
  "Node.js": "https://nodejs.org",
  GraphQL: "https://graphql.org",
  AWS: "https://aws.amazon.com",
  "Google Maps API": "https://developers.google.com/maps",
  React: "https://reactjs.org",
  "Adobe XD": "https://www.adobe.com/products/xd.html",
  "UI/UX Design":
    "https://www.interaction-design.org/literature/topics/ui-design",
};

const ProjectCard = ({
  title,
  subtitle,
  location,
  description,
  technologies,
  imageUrl,
  demoUrl,
  pdfUrl,
  demoLabel,
  isPdf,
  githubUrl,
  appStoreUrl,
  playStoreUrl,
  presentations,
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isHovered, setIsHovered] = useState(false);

  const getViewerUrl = (url) => {
    if (isPdf) {
      return pdfUrl || url;
    }
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
      url
    )}`;
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg p-6 h-full hover:shadow-xl transition-all duration-300"
      whileHover={{ y: -5 }}
    >
      <div className="space-y-4">
        {/* Title and Subtitle */}
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-1">{title}</h3>
          <p className="text-gray-600 text-sm">{location}</p>
          <p className="text-primary-600 font-medium mb-2">{subtitle}</p>
        </div>

        {/* Description */}
        <p className="text-gray-600">{description}</p>

        {/* ETD Link and PDF Preview (if it's the thesis) */}
        {(demoUrl && demoLabel) || (isPdf && pdfUrl) ? (
          <div className="flex justify-between items-center mb-4">
            {demoUrl && demoLabel && (
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href={demoUrl}
                className="inline-flex items-center gap-2 px-2 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors duration-300"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaUniversity className="text-sm" />
                <span>{demoLabel}</span>
              </motion.a>
            )}
            {isPdf && pdfUrl && (
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors duration-300"
              >
                <FaFilePdf className="text-sm" />
                <span>{showPreview ? "Hide" : "Preview"}</span>
              </button>
            )}
          </div>
        ) : null}

        {/* PDF Preview */}
        {isPdf && showPreview && (
          <div className="mb-4">
            <div className="relative pt-[56.25%] w-full bg-gray-100 rounded-lg overflow-hidden">
              <iframe
                title={`Preview of ${title}`}
                src={getViewerUrl(pdfUrl || demoUrl)}
                className="absolute top-0 left-0 w-full h-full border-0"
                frameBorder="0"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Technologies */}
        {technologies && technologies.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Technologies & Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {technologies.map((tech) => {
                const name = typeof tech === "string" ? tech : tech.name;
                const url = typeof tech === "object" ? tech.url : null;

                return url ? (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors inline-flex items-center gap-1"
                  >
                    {name}
                    <FaExternalLinkAlt className="text-xs opacity-50" />
                  </a>
                ) : (
                  <span
                    key={name}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {name}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Presentations Section with Preview */}
        {presentations && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              Presentations:
            </h4>
            <div className="flex flex-col gap-2">
              {presentations.map((presentation, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex gap-2">
                    <a
                      href={presentation.url}
                      className="flex-1 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors duration-300"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FaExternalLinkAlt className="text-sm" />
                      <span>{presentation.title}</span>
                    </a>
                    <button
                      onClick={() => setShowPreview(presentation.url)}
                      className="inline-flex items-center gap-2 px-2 py-2 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors duration-300"
                    >
                      <FaEye className="text-sm" />
                      <span>Preview</span>
                    </button>
                  </div>
                  {showPreview === presentation.url && (
                    <div className="relative pt-[56.25%] w-full bg-gray-100 rounded-lg overflow-hidden">
                      <iframe
                        title={`Preview of ${presentation.title}`}
                        src={getViewerUrl(presentation.url)}
                        className="absolute top-0 left-0 w-full h-full border-0"
                        frameBorder="0"
                        allowFullScreen
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons with increased top margin */}
        <div className="flex flex-wrap gap-3 mt-8 pt-4 border-t border-gray-100">
          {appStoreUrl && (
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href={appStoreUrl}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors duration-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaAppStore className="text-sm" />
              <span>App Store</span>
            </motion.a>
          )}
          {playStoreUrl && (
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href={playStoreUrl}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors duration-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaGooglePlay className="text-sm" />
              <span>Play Store</span>
            </motion.a>
          )}
          {demoUrl && !demoLabel && (
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href={demoUrl}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors duration-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaExternalLinkAlt className="text-sm" />
              <span>
                {demoUrl.includes(".xd") ? "Download xD Project" : "Live Demo"}
              </span>
            </motion.a>
          )}
          {githubUrl && (
            <a
              href={githubUrl}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors duration-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaGithub className="text-sm" />
              <span>Source Code</span>
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
