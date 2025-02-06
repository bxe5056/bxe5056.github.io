import React, { useState } from "react";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { zoomPlugin } from "@react-pdf-viewer/zoom";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

import PageContainer from "../components/common/PageContainer";
import { FaDownload, FaExternalLinkAlt } from "react-icons/fa";
import { trackDownload } from "../utils/analytics";
import posthog from "../utils/analytics";

const Resume = () => {
  const [useBoxViewer, setUseBoxViewer] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  const resumePath = "/fileFolder/EppingerResume-020625.pdf";
  const boxEmbedUrl =
    "https://app.box.com/embed/preview/q15bsl0ont4er07suzw5sllndp6uehap?direction=ASC&theme=dark";

  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const zoomPluginInstance = zoomPlugin();

  const handleDownload = (format) => {
    trackDownload("resume", format);
    const link = document.createElement("a");
    link.href = resumePath;
    link.download = `Benjamin_Eppinger_Resume.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleViewer = () => {
    setUseBoxViewer(!useBoxViewer);
    posthog.capture("resume_viewer_switch", {
      to: !useBoxViewer ? "box" : "react-pdf",
    });
  };

  return (
    <PageContainer
      title="Resume"
      subtitle="My professional experience and qualifications"
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* Action Buttons */}
        <div className="mb-8 flex flex-wrap justify-center gap-4">
          <button
            onClick={() => handleDownload("pdf")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg"
          >
            <FaDownload />
            Download PDF
          </button>

          <button
            onClick={toggleViewer}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md hover:shadow-lg"
          >
            <FaExternalLinkAlt />
            {useBoxViewer ? "Switch to PDF Viewer" : "Switch to Box Viewer"}
          </button>
        </div>

        {/* Resume Viewer */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {useBoxViewer ? (
            // Box Viewer
            <div className="relative w-full" style={{ paddingTop: "140%" }}>
              <iframe
                src={boxEmbedUrl}
                className="absolute top-0 left-0 w-full h-full"
                frameBorder="0"
                allowFullScreen
                title="Resume Box View"
              />
            </div>
          ) : (
            // PDF Viewer
            <div className="h-[calc(100vh-300px)]">
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                <Viewer
                  fileUrl={resumePath}
                  plugins={[defaultLayoutPluginInstance, zoomPluginInstance]}
                  onError={(error) => {
                    console.error(error);
                    setPdfError(true);
                    posthog.capture("resume_load_error", {
                      error: error.message,
                    });
                  }}
                  onDocumentLoad={() => {
                    posthog.capture("resume_view", {
                      viewer: "react-pdf-viewer",
                    });
                  }}
                />
              </Worker>
              {pdfError && (
                <div className="text-red-600 text-center mt-4">
                  Error loading PDF. Please try the Box viewer instead.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default Resume;
