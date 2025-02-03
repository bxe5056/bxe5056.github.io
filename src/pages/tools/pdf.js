import React, { useState, useEffect } from "react";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import "@react-pdf-viewer/zoom/lib/styles/index.css";
import { useDropzone } from "react-dropzone";
import ToolLayout from "../../components/tools/ToolLayout";
import {
  FaUpload,
  FaDownload,
  FaFilePdf,
  FaImage,
  FaTrash,
  FaTimes,
  FaArrowUp,
  FaArrowDown,
  FaArrowLeft,
  FaArrowRight,
  FaExclamationCircle,
  FaTimes as FaClose,
  FaBug,
} from "react-icons/fa";
import { PDFDocument } from "pdf-lib";
import FileSaver from "file-saver";
import JSZip from "jszip";
import { useNavigate, useLocation } from "react-router-dom";
import * as pdfjsLib from "pdfjs-dist";
import { showErrorWithReporting } from "../../utils/analytics";

// Initialize pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

const ErrorBanner = ({ error, onDismiss }) => {
  if (!error) return null;

  return (
    <>
      <style>
        {`
          @keyframes crawl {
            0% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(1px, 1px) rotate(5deg); }
            50% { transform: translate(0, 2px) rotate(0deg); }
            75% { transform: translate(-1px, 1px) rotate(-5deg); }
            100% { transform: translate(0, 0) rotate(0deg); }
          }
          .bug-crawl {
            animation: crawl 1s ease-in-out infinite;
            transform-origin: center;
            display: inline-block;
          }
        `}
      </style>
      <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 relative">
        <div className="flex">
          <div className="flex-shrink-0">
            <div className="bug-crawl">
              <FaBug className="h-5 w-5 text-red-600" />
            </div>
          </div>
          <div className="ml-3 pr-8">
            <p className="text-sm text-red-700 whitespace-pre-line">{error}</p>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="absolute top-4 right-4 text-red-400 hover:text-red-500"
            >
              <FaClose className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </>
  );
};

const PDFTools = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [currentPdfUrl, setCurrentPdfUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    scrollPlugin: {
      layoutEffect: false,
    },
  });
  const zoomPluginInstance = zoomPlugin();
  const navigate = useNavigate();
  const location = useLocation();
  const [pdfPreview, setPdfPreview] = useState(null);

  // Get the active tab from the URL path
  const getActiveTabFromPath = () => {
    const path = location.pathname.split("/").pop();
    switch (path) {
      case "viewer":
        return "viewer";
      case "merger":
        return "merger";
      case "to-images":
        return "to-images";
      case "from-images":
        return "from-images";
      case "reorder":
        return "reorder";
      default:
        return "viewer";
    }
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromPath());

  // Clean up object URLs when component unmounts or when files change
  useEffect(() => {
    return () => {
      if (currentPdfUrl) {
        URL.revokeObjectURL(currentPdfUrl);
      }
      // Clean up image URLs
      selectedFiles.forEach((file) => {
        if (file.url) {
          URL.revokeObjectURL(file.url);
        }
      });
    };
  }, [currentPdfUrl, selectedFiles]);

  // Clear uploads when switching tabs
  useEffect(() => {
    // Clear all files and states when switching tabs
    setSelectedFiles([]);
    setCurrentPdfUrl(null);
    setPdfPreview(null);
  }, [activeTab]);

  // Update URL when tab changes
  useEffect(() => {
    const basePath = "/tools/pdf";
    let path;
    switch (activeTab) {
      case "viewer":
        path = "viewer";
        break;
      case "merger":
        path = "merger";
        break;
      case "to-images":
        path = "to-images";
        break;
      case "from-images":
        path = "from-images";
        break;
      case "reorder":
        path = "reorder";
        break;
      default:
        path = "viewer";
    }
    navigate(`${basePath}/${path}`, { replace: true });
  }, [activeTab, navigate]);

  // Update effect to clear error on tab change
  useEffect(() => {
    setError(null);
  }, [activeTab]);

  // Add a function to generate PDF preview
  const generatePDFPreview = async (file) => {
    try {
      setError(null);
      const fileArrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(fileArrayBuffer).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.0 });

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      setPdfPreview(canvas.toDataURL());
    } catch (error) {
      console.error("Error generating PDF preview:", error);
      setError(showErrorWithReporting(error, "generating PDF preview"));
      setPdfPreview(null);
    }
  };

  // Update the extractPdfPages function to include more metadata
  const extractPdfPages = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      const totalPages = pdf.numPages;
      const pages = [];

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 }); // Scale down for preview
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        pages.push({
          pageNumber: i,
          preview: canvas.toDataURL(),
          originalIndex: i - 1,
        });
      }

      return pages;
    } catch (error) {
      const message = showErrorWithReporting(error, "extracting PDF pages");
      console.error("Error extracting PDF pages:", error);
      throw new Error(message);
    }
  };

  // Add state for page reordering
  const [pdfPages, setPdfPages] = useState([]);

  // Add function to handle page reordering
  const reorderPages = async () => {
    try {
      setIsProcessing(true);
      const pdfDoc = await PDFDocument.create();
      const sourceDoc = await PDFDocument.load(
        await selectedFiles[0].file.arrayBuffer()
      );

      // Copy pages in the new order
      for (const page of pdfPages) {
        const [copiedPage] = await pdfDoc.copyPages(sourceDoc, [
          page.pageNumber - 1,
        ]);
        pdfDoc.addPage(copiedPage);
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      FileSaver.saveAs(blob, "reordered.pdf");
    } catch (error) {
      alert(showErrorWithReporting(error, "reordering PDF pages"));
    } finally {
      setIsProcessing(false);
    }
  };

  // Add function to move pages in the reorder view
  const movePage = (fromIndex, toIndex) => {
    const newPages = [...pdfPages];
    const [movedPage] = newPages.splice(fromIndex, 1);
    newPages.splice(toIndex, 0, movedPage);
    setPdfPages(newPages);
  };

  // Add thumbnail generation function
  const generatePDFThumbnail = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 0.3 }); // Smaller scale for thumbnails

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      return canvas.toDataURL();
    } catch (error) {
      console.error("Error generating thumbnail:", error);
      return null;
    }
  };

  // Update the onDrop handler to include thumbnail generation
  const { getRootProps: getPDFRootProps, getInputProps: getPDFInputProps } =
    useDropzone({
      accept: {
        "application/pdf": [".pdf"],
      },
      onDrop: async (acceptedFiles) => {
        if (currentPdfUrl) {
          URL.revokeObjectURL(currentPdfUrl);
        }

        if (activeTab === "merger") {
          // For merger, append files to the list
          const newFiles = await Promise.all(
            acceptedFiles.map(async (file) => {
              const thumbnail = await generatePDFThumbnail(file);
              return {
                file,
                id: Math.random().toString(36).substr(2, 9),
                name: file.name,
                url: URL.createObjectURL(file),
                thumbnail,
              };
            })
          );
          setSelectedFiles((prev) => [...prev, ...newFiles]);
          // Set the current PDF URL to the last added file
          if (newFiles.length > 0) {
            setCurrentPdfUrl(newFiles[newFiles.length - 1].url);
          }
        } else if (activeTab === "reorder" && acceptedFiles[0]) {
          const pages = await extractPdfPages(acceptedFiles[0]);
          setPdfPages(pages);
          setSelectedFiles([
            {
              file: acceptedFiles[0],
              id: Math.random().toString(36).substr(2, 9),
              name: acceptedFiles[0].name,
              url: URL.createObjectURL(acceptedFiles[0]),
            },
          ]);
        } else {
          // For other tabs, replace the current file
          if (acceptedFiles[0]) {
            const url = URL.createObjectURL(acceptedFiles[0]);
            setCurrentPdfUrl(url);
            setSelectedFiles([
              {
                file: acceptedFiles[0],
                id: Math.random().toString(36).substr(2, 9),
                name: acceptedFiles[0].name,
                url,
              },
            ]);
          }
        }
      },
    });

  const { getRootProps: getImageRootProps, getInputProps: getImageInputProps } =
    useDropzone({
      accept: {
        "image/png": [".png"],
        "image/jpeg": [".jpg", ".jpeg"],
      },
      onDrop: (acceptedFiles) => {
        const newFiles = acceptedFiles.map((file) => ({
          file,
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          url: URL.createObjectURL(file),
        }));
        setSelectedFiles((prev) => {
          // Only append if we're in the Images to PDF section
          if (prev.length > 0 && prev[0].file.type.startsWith("image/")) {
            return [...prev, ...newFiles];
          }
          // Otherwise replace (for initial upload)
          return newFiles;
        });
      },
    });

  const removePDF = (idToRemove) => {
    setSelectedFiles((prev) => prev.filter((file) => file.id !== idToRemove));
  };

  const clearAllPDFs = () => {
    setSelectedFiles([]);
  };

  const movePDF = (index, direction) => {
    const newFiles = [...selectedFiles];
    const newIndex = direction === "up" ? index - 1 : index + 1;

    if (newIndex >= 0 && newIndex < newFiles.length) {
      [newFiles[index], newFiles[newIndex]] = [
        newFiles[newIndex],
        newFiles[index],
      ];
      setSelectedFiles(newFiles);
    }
  };

  const mergePDFs = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      const mergedPdf = await PDFDocument.create();

      for (const fileObj of selectedFiles) {
        const fileArrayBuffer = await fileObj.file.arrayBuffer();
        const pdf = await PDFDocument.load(fileArrayBuffer);
        const copiedPages = await mergedPdf.copyPages(
          pdf,
          pdf.getPageIndices()
        );
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });
      FileSaver.saveAs(blob, "merged.pdf");
    } catch (error) {
      setError(showErrorWithReporting(error, "merging PDFs"));
    } finally {
      setIsProcessing(false);
    }
  };

  const convertToImages = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      const file = selectedFiles[0].file; // Get the actual File object
      if (!file) return;

      const fileArrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(fileArrayBuffer).promise;
      const zip = new JSZip();

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        const pngData = canvas.toDataURL("image/png").split(",")[1];
        zip.file(`page-${i}.png`, pngData, { base64: true });
      }

      const content = await zip.generateAsync({ type: "blob" });
      FileSaver.saveAs(content, "pdf-images.zip");
    } catch (error) {
      setError(showErrorWithReporting(error, "converting PDF to images"));
    } finally {
      setIsProcessing(false);
    }
  };

  const convertToSinglePDF = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      const pdfDoc = await PDFDocument.create();

      for (const fileObj of selectedFiles) {
        const imageBytes = await fileObj.file.arrayBuffer();
        let image;

        if (fileObj.file.type.includes("png")) {
          image = await pdfDoc.embedPng(imageBytes);
        } else if (
          fileObj.file.type.includes("jpeg") ||
          fileObj.file.type.includes("jpg")
        ) {
          image = await pdfDoc.embedJpg(imageBytes);
        } else {
          continue;
        }

        const { width, height } = image.scale(1);
        const page = pdfDoc.addPage([width, height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: width,
          height: height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      FileSaver.saveAs(blob, "images-to-pdf.pdf");
    } catch (error) {
      console.error("Error converting images to PDF:", error);
      setError(showErrorWithReporting(error, "converting images to PDF"));
    } finally {
      setIsProcessing(false);
    }
  };

  const testError = () => {
    try {
      throw new Error(
        "This is a test error to demonstrate the bug reporting prompt"
      );
    } catch (error) {
      setError(showErrorWithReporting(error, "testing error reporting"));
    }
  };

  const clearError = () => setError(null);

  // Remove the Test Error Button and implement triple-click error generation
  const handleTabClick = (tabId) => {
    if (activeTab === tabId) {
      setClickCount((prev) => prev + 1);
    } else {
      setClickCount(0);
    }
    setActiveTab(tabId);
  };

  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    if (clickCount === 3) {
      testError();
      setClickCount(0);
    }
  }, [clickCount]);

  // Add console logs for debugging
  useEffect(() => {
    console.log("Current PDF URL:", currentPdfUrl);
    console.log("Selected Files:", selectedFiles);
  }, [currentPdfUrl, selectedFiles]);

  // Add moveImage function
  const moveImage = (index, direction) => {
    const newFiles = [...selectedFiles];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < newFiles.length) {
      [newFiles[index], newFiles[newIndex]] = [
        newFiles[newIndex],
        newFiles[index],
      ];
      setSelectedFiles(newFiles);
    }
  };

  // Add function to remove a page
  const removePage = (pageNumber) => {
    setPdfPages((prev) =>
      prev.filter((page) => page.pageNumber !== pageNumber)
    );
  };

  // Update the renderContent function to use handleTabClick
  const renderToolContent = () => {
    switch (activeTab) {
      case "viewer":
        return (
          <div className="w-full">
            {currentPdfUrl && selectedFiles.length > 0 ? (
              <div className="min-h-full">
                <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                  <ErrorBoundary>
                    <Viewer
                      fileUrl={currentPdfUrl}
                      plugins={[
                        defaultLayoutPluginInstance,
                        zoomPluginInstance,
                      ]}
                      defaultScale={1}
                      key={currentPdfUrl}
                    />
                  </ErrorBoundary>
                </Worker>
              </div>
            ) : (
              <div
                {...getPDFRootProps()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 h-[300px] flex flex-col justify-center"
              >
                <input {...getPDFInputProps()} />
                <FaUpload className="mx-auto text-6xl mb-6 text-gray-400" />
                <p className="text-lg">
                  Drag & drop a PDF file here, or click to select one
                </p>
              </div>
            )}
          </div>
        );
      case "merger":
        return (
          <div className="">
            <div className="flex flex-col space-y-4">
              {selectedFiles.length > 1 && (
                <div className="flex justify-between items-center">
                  <button
                    onClick={mergePDFs}
                    className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:bg-gray-400"
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Merging..." : "Merge PDFs"}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFiles([]);
                      setCurrentPdfUrl(null);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Clear All
                  </button>
                </div>
              )}
              {selectedFiles.length > 0 && (
                <div className="border rounded p-4">
                  <h3 className="text-lg font-medium mb-2">Selected PDFs:</h3>
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between bg-gray-50 p-2 rounded"
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-16 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                            {file.thumbnail ? (
                              <img
                                src={file.thumbnail}
                                alt={`Preview of ${file.name}`}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FaFilePdf className="text-gray-400 text-2xl" />
                              </div>
                            )}
                          </div>
                          <span className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 break-words">
                              {file.name}
                            </p>
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {index > 0 && (
                            <button
                              onClick={() => movePDF(index, "up")}
                              className="p-1 hover:bg-gray-200 rounded"
                              title="Move Up"
                            >
                              <FaArrowUp />
                            </button>
                          )}
                          {index < selectedFiles.length - 1 && (
                            <button
                              onClick={() => movePDF(index, "down")}
                              className="p-1 hover:bg-gray-200 rounded"
                              title="Move Down"
                            >
                              <FaArrowDown />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              const newFiles = selectedFiles.filter(
                                (f) => f.id !== file.id
                              );
                              setSelectedFiles(newFiles);
                              if (newFiles.length > 0) {
                                setCurrentPdfUrl(
                                  newFiles[newFiles.length - 1].url
                                );
                              } else {
                                setCurrentPdfUrl(null);
                              }
                            }}
                            className="p-1 hover:bg-red-100 text-red-600 rounded"
                            title="Remove"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div
                {...getPDFRootProps()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 h-[300px] flex flex-col justify-center"
              >
                <input {...getPDFInputProps()} />
                <FaUpload className="mx-auto text-6xl mb-6 text-gray-400" />
                <p className="text-lg">
                  {selectedFiles.length === 0
                    ? "Drag & drop PDFs here, or click to select multiple"
                    : "Drop more PDFs here, or click to select more"}
                </p>
              </div>
            </div>
          </div>
        );
      case "to-images":
        return (
          <div className="">
            {selectedFiles.length > 0 && (
              <button
                onClick={convertToImages}
                className="mb-4 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:bg-gray-400"
                disabled={isProcessing}
              >
                {isProcessing ? "Converting..." : "Convert PDF to Images"}
              </button>
            )}
            {selectedFiles.length > 0 ? (
              <div className="min-h-full">
                <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                  <ErrorBoundary>
                    <Viewer
                      fileUrl={currentPdfUrl}
                      plugins={[
                        defaultLayoutPluginInstance,
                        zoomPluginInstance,
                      ]}
                      defaultScale={1}
                      key={currentPdfUrl}
                    />
                  </ErrorBoundary>
                </Worker>
              </div>
            ) : (
              <div
                {...getPDFRootProps()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 h-[300px] flex flex-col justify-center"
              >
                <input {...getPDFInputProps()} />
                <FaUpload className="mx-auto text-6xl mb-6 text-gray-400" />
                <p className="text-lg">
                  Drag & drop a PDF file here, or click to select one
                </p>
              </div>
            )}
          </div>
        );
      case "from-images":
        return (
          <div className="">
            <div className="flex flex-col space-y-4">
              {selectedFiles.length > 0 && (
                <div className="flex justify-between items-center">
                  <button
                    onClick={convertToSinglePDF}
                    className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:bg-gray-400"
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Converting..." : "Convert Images to PDF"}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFiles([]);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Clear All
                  </button>
                </div>
              )}
              {selectedFiles.length > 0 && (
                <div className="border rounded p-4">
                  <h3 className="text-lg font-medium mb-2">Selected Images:</h3>
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between bg-gray-50 p-2 rounded"
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-16 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                            <img
                              src={file.url}
                              alt={`Preview of ${file.name}`}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <span className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 break-words">
                              {file.name}
                            </p>
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {index > 0 && (
                            <button
                              onClick={() => moveImage(index, "up")}
                              className="p-1 hover:bg-gray-200 rounded"
                              title="Move Up"
                            >
                              <FaArrowUp />
                            </button>
                          )}
                          {index < selectedFiles.length - 1 && (
                            <button
                              onClick={() => moveImage(index, "down")}
                              className="p-1 hover:bg-gray-200 rounded"
                              title="Move Down"
                            >
                              <FaArrowDown />
                            </button>
                          )}
                          <button
                            onClick={() => removePDF(file.id)}
                            className="p-1 hover:bg-red-100 text-red-600 rounded"
                            title="Remove"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div
                {...getImageRootProps()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 h-[300px] flex flex-col justify-center"
              >
                <input {...getImageInputProps()} />
                <FaUpload className="mx-auto text-6xl mb-6 text-gray-400" />
                <p className="text-lg">
                  {selectedFiles.length === 0
                    ? "Drag & drop images here, or click to select multiple"
                    : "Drop more images here, or click to select more"}
                </p>
              </div>
            </div>
          </div>
        );
      case "reorder":
        return (
          <div className="">
            <div className="flex flex-col space-y-4">
              {selectedFiles.length > 0 && pdfPages.length > 0 && (
                <div className="flex justify-between items-center">
                  <button
                    onClick={reorderPages}
                    className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:bg-gray-400"
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Saving..." : "Save Reordered PDF"}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFiles([]);
                      setPdfPages([]);
                      setCurrentPdfUrl(null);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Clear All
                  </button>
                </div>
              )}
              {pdfPages.length > 0 && (
                <div className="border rounded p-4">
                  <h3 className="text-lg font-medium mb-2">PDF Pages:</h3>
                  <div className="space-y-2">
                    {pdfPages.map((page, index) => (
                      <div
                        key={page.pageNumber}
                        className="flex items-center justify-between bg-gray-50 p-2 rounded"
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-16 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                            <img
                              src={page.preview}
                              alt={`Page ${page.pageNumber}`}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <span className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900">
                              Page {page.pageNumber}
                            </p>
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {index > 0 && (
                            <button
                              onClick={() => movePage(index, index - 1)}
                              className="p-1 hover:bg-gray-200 rounded"
                              title="Move Up"
                            >
                              <FaArrowUp />
                            </button>
                          )}
                          {index < pdfPages.length - 1 && (
                            <button
                              onClick={() => movePage(index, index + 1)}
                              className="p-1 hover:bg-gray-200 rounded"
                              title="Move Down"
                            >
                              <FaArrowDown />
                            </button>
                          )}
                          <button
                            onClick={() => removePage(page.pageNumber)}
                            className="p-1 hover:bg-red-100 text-red-600 rounded"
                            title="Remove"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div
                {...getPDFRootProps()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 h-[300px] flex flex-col justify-center"
              >
                <input {...getPDFInputProps()} />
                <FaUpload className="mx-auto text-6xl mb-6 text-gray-400" />
                <p className="text-lg">
                  {selectedFiles.length === 0
                    ? "Drag & drop a PDF file here, or click to select one"
                    : "Drop a new PDF here, or click to select one"}
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderContent = () => {
    return (
      <>
        <ErrorBanner error={error} onDismiss={clearError} />
        {/* Tool Selection */}
        <div>
          {/* Mobile Dropdown */}
          <div className="sm:hidden">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full px-4 py-2 text-lg font-medium bg-white border-b border-gray-200 focus:outline-none focus:ring-0 focus:border-gray-200"
            >
              {[
                { id: "viewer", label: "PDF Viewer" },
                { id: "merger", label: "PDF Merger" },
                { id: "to-images", label: "PDF to Images" },
                { id: "from-images", label: "Images to PDF" },
                { id: "reorder", label: "Page Reorder" },
              ].map((tool) => (
                <option key={tool.id} value={tool.id}>
                  {tool.label}
                </option>
              ))}
            </select>
          </div>

          {/* Desktop Tabs */}
          <div className="hidden sm:block">
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="flex space-x-2 border-b border-gray-200 min-w-max px-4 sm:px-0">
                {[
                  { id: "viewer", label: "PDF Viewer" },
                  { id: "merger", label: "PDF Merger" },
                  { id: "to-images", label: "PDF to Images" },
                  { id: "from-images", label: "Images to PDF" },
                  { id: "reorder", label: "Reorder Pages" },
                ].map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => handleTabClick(tool.id)}
                    className={`px-4 py-2 -mb-px whitespace-nowrap ${
                      activeTab === tool.id
                        ? "border-b-2 border-primary-600 text-primary-600"
                        : "text-gray-500"
                    }`}
                  >
                    {tool.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6">{renderToolContent()}</div>
      </>
    );
  };

  return (
    <ToolLayout
      title="PDF Tools"
      description="A collection of PDF manipulation and conversion tools"
    >
      <div>{renderContent()}</div>
    </ToolLayout>
  );
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught in ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}

export default PDFTools;
