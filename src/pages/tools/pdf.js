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
} from "react-icons/fa";
import { PDFDocument } from "pdf-lib";
import FileSaver from "file-saver";
import JSZip from "jszip";
import { useNavigate, useLocation } from "react-router-dom";
import * as pdfjsLib from "pdfjs-dist";

// Initialize pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

const PDFTools = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [currentPdfUrl, setCurrentPdfUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
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

  // Add a function to generate PDF preview
  const generatePDFPreview = async (file) => {
    try {
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
      setPdfPreview(null);
    }
  };

  // Add a function to extract pages from PDF
  const extractPdfPages = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      const totalPages = pdf.numPages;
      const pages = [];

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.5 }); // Scale down for preview
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
        });
      }

      return pages;
    } catch (error) {
      console.error("Error extracting PDF pages:", error);
      throw error;
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
      console.error("Error reordering PDF pages:", error);
      alert("Error reordering PDF pages. Please try again.");
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

  // Update onDrop for PDF files to handle page reordering
  const { getRootProps: getPDFRootProps, getInputProps: getPDFInputProps } =
    useDropzone({
      accept: {
        "application/pdf": [".pdf"],
      },
      onDrop: async (acceptedFiles) => {
        if (currentPdfUrl) {
          URL.revokeObjectURL(currentPdfUrl);
        }

        if (activeTab === "viewer") {
          if (acceptedFiles[0]) {
            const url = URL.createObjectURL(acceptedFiles[0]);
            setCurrentPdfUrl(url);
            setSelectedFiles([
              {
                file: acceptedFiles[0],
                id: Math.random().toString(36).substr(2, 9),
                name: acceptedFiles[0].name,
              },
            ]);
          }
        } else if (activeTab === "merger") {
          setSelectedFiles((prev) => [
            ...prev,
            ...acceptedFiles.map((file) => ({
              file,
              id: Math.random().toString(36).substr(2, 9),
              name: file.name,
            })),
          ]);
        } else if (activeTab === "reorder" && acceptedFiles[0]) {
          const pages = await extractPdfPages(acceptedFiles[0]);
          setPdfPages(pages);
          setSelectedFiles([
            {
              file: acceptedFiles[0],
              id: Math.random().toString(36).substr(2, 9),
              name: acceptedFiles[0].name,
            },
          ]);
        } else if (acceptedFiles[0]) {
          const newFiles = acceptedFiles.map((file) => ({
            file,
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
          }));
          setSelectedFiles(newFiles);
          generatePDFPreview(acceptedFiles[0]);
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
      console.error("Error merging PDFs:", error);
      alert("Error merging PDFs. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const convertToImages = async () => {
    try {
      setIsProcessing(true);
      const file = selectedFiles[0];
      if (!file) return;

      const fileArrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(fileArrayBuffer).promise;
      const zip = new JSZip();

      // Set a reasonable scale for the output images
      const scale = 2.0; // Adjust this value to change image quality

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });

        // Create canvas
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Render PDF page to canvas
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        // Convert canvas to PNG and add to zip
        const pngData = canvas.toDataURL("image/png").split(",")[1];
        zip.file(`page-${i}.png`, pngData, { base64: true });
      }

      // Generate and download zip file
      const content = await zip.generateAsync({ type: "blob" });
      FileSaver.saveAs(content, "pdf-images.zip");
    } catch (error) {
      console.error("Error converting PDF to images:", error);
      alert("Error converting PDF to images. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const convertToSinglePDF = async () => {
    try {
      setIsProcessing(true);
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
      alert("Error converting images to PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "viewer":
        return (
          <div className="h-[800px] w-full">
            {currentPdfUrl && selectedFiles.length > 0 ? (
              <div className="h-full">
                <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                  <Viewer
                    fileUrl={currentPdfUrl}
                    plugins={[defaultLayoutPluginInstance, zoomPluginInstance]}
                    defaultScale={1}
                    key={currentPdfUrl}
                  />
                </Worker>
              </div>
            ) : (
              <div
                {...getPDFRootProps()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 h-full flex flex-col justify-center"
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
          <div>
            <div
              {...getPDFRootProps()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-8 text-center cursor-pointer hover:border-blue-500 mb-4"
            >
              <input {...getPDFInputProps()} />
              <FaUpload className="mx-auto text-4xl mb-4 text-gray-400" />
              <p>Drag & drop PDF files here, or click to add more PDFs</p>
            </div>
            {selectedFiles.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Selected Files:</h3>
                  <button
                    onClick={clearAllPDFs}
                    className="text-red-500 hover:text-red-700 flex items-center gap-2 text-sm whitespace-nowrap"
                  >
                    <FaTrash /> Clear All
                  </button>
                </div>
                <ul className="list-none p-0 space-y-2 mb-4">
                  {selectedFiles.map((file, index) => (
                    <li
                      key={file.id}
                      className="flex bg-gray-50 p-2 rounded items-start"
                    >
                      <div className="min-w-0 flex-1 pr-4">
                        <p className="text-sm break-words">{file.name}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => movePDF(index, "up")}
                          disabled={index === 0}
                          className="text-gray-500 hover:text-gray-700 disabled:text-gray-300 p-2"
                          title="Move up"
                        >
                          <FaArrowUp size={16} />
                        </button>
                        <button
                          onClick={() => movePDF(index, "down")}
                          disabled={index === selectedFiles.length - 1}
                          className="text-gray-500 hover:text-gray-700 disabled:text-gray-300 p-2"
                          title="Move down"
                        >
                          <FaArrowDown size={16} />
                        </button>
                        <button
                          onClick={() => removePDF(file.id)}
                          className="text-red-500 hover:text-red-700 p-2"
                          title="Remove"
                        >
                          <FaTimes size={16} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={mergePDFs}
                  disabled={isProcessing || selectedFiles.length < 2}
                  className="w-full sm:w-auto bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isProcessing ? "Processing..." : "Merge PDFs"}
                </button>
              </div>
            )}
          </div>
        );
      case "to-images":
        return (
          <div className="h-[300px] flex flex-col">
            {selectedFiles.length > 0 &&
            selectedFiles[0].file.type === "application/pdf" ? (
              <div className="border-2 border-gray-300 rounded-lg p-4 mb-4 flex-1">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm break-words pr-4 flex-1">
                    {selectedFiles[0].name}
                  </p>
                  <button
                    onClick={() => {
                      setSelectedFiles([]);
                      setPdfPreview(null);
                    }}
                    className="text-red-500 hover:text-red-700 p-2"
                    title="Remove"
                  >
                    <FaTimes size={16} />
                  </button>
                </div>
                <div className="h-32 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                  {pdfPreview ? (
                    <img
                      src={pdfPreview}
                      alt="PDF Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <FaFilePdf className="text-4xl text-gray-400" />
                  )}
                </div>
              </div>
            ) : (
              <div
                {...getPDFRootProps()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 mb-4 flex-1 flex flex-col justify-center"
              >
                <input {...getPDFInputProps()} />
                <FaUpload className="mx-auto text-4xl mb-4 text-gray-400" />
                <p>Drop a PDF here to convert to images</p>
              </div>
            )}
            <button
              onClick={convertToImages}
              disabled={
                isProcessing ||
                !selectedFiles.length ||
                !selectedFiles[0].file.type === "application/pdf"
              }
              className={`w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed`}
            >
              {isProcessing ? "Processing..." : "Convert to Images"}
            </button>
          </div>
        );
      case "from-images":
        return (
          <div className="flex flex-col">
            {selectedFiles.length > 0 &&
            selectedFiles[0].file.type.startsWith("image/") ? (
              <div className="border-2 border-gray-300 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm">Selected Images:</p>
                  <div className="flex items-center gap-2">
                    <div
                      {...getImageRootProps()}
                      className="text-blue-500 hover:text-blue-700 flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <input {...getImageInputProps()} />
                      <FaUpload /> Select More
                    </div>
                    <button
                      onClick={() => setSelectedFiles([])}
                      className="text-red-500 hover:text-red-700 flex items-center gap-2 text-sm"
                    >
                      <FaTrash /> Clear All
                    </button>
                  </div>
                </div>
                <ul className="list-none p-0 space-y-2">
                  {selectedFiles.map((file, index) => (
                    <li
                      key={file.id}
                      className="flex bg-gray-50 p-2 rounded items-start"
                    >
                      <div className="h-16 w-16 bg-gray-100 rounded flex-shrink-0 mr-2 overflow-hidden">
                        <img
                          src={file.url}
                          alt={`Preview ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm break-words">{file.name}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => movePDF(index, "up")}
                          disabled={index === 0}
                          className="text-gray-500 hover:text-gray-700 disabled:text-gray-300 p-2"
                          title="Move up"
                        >
                          <FaArrowUp size={16} />
                        </button>
                        <button
                          onClick={() => movePDF(index, "down")}
                          disabled={index === selectedFiles.length - 1}
                          className="text-gray-500 hover:text-gray-700 disabled:text-gray-300 p-2"
                          title="Move down"
                        >
                          <FaArrowDown size={16} />
                        </button>
                        <button
                          onClick={() => removePDF(file.id)}
                          className="text-red-500 hover:text-red-700 p-2"
                          title="Remove"
                        >
                          <FaTimes size={16} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div
                {...getImageRootProps()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 mb-4 h-[300px] flex flex-col justify-center"
              >
                <input {...getImageInputProps()} />
                <FaUpload className="mx-auto text-4xl mb-4 text-gray-400" />
                <p>Drop PNG or JPEG images here to combine into PDF</p>
              </div>
            )}
            <button
              onClick={convertToSinglePDF}
              disabled={
                isProcessing ||
                !selectedFiles.length ||
                !selectedFiles[0].file.type.startsWith("image/")
              }
              className={`w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed`}
            >
              {isProcessing ? "Processing..." : "Convert to PDF"}
            </button>
          </div>
        );
      case "reorder":
        return (
          <div className="space-y-4">
            {selectedFiles.length === 0 ? (
              <div
                {...getPDFRootProps()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 h-[400px] flex flex-col justify-center"
              >
                <input {...getPDFInputProps()} />
                <FaUpload className="mx-auto text-6xl mb-6 text-gray-400" />
                <p className="text-lg">
                  Drop a PDF file here to reorder its pages
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    Reorder Pages: {selectedFiles[0].name}
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedFiles([]);
                      setPdfPages([]);
                    }}
                    className="text-red-500 hover:text-red-700 flex items-center gap-2 text-sm"
                  >
                    <FaTrash /> Clear
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {pdfPages.map((page, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-2 bg-gray-50"
                    >
                      <div className="aspect-[3/4] mb-2">
                        <img
                          src={page.preview}
                          alt={`Page ${page.pageNumber}`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          Page {page.pageNumber}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => movePage(index, index - 1)}
                            disabled={index === 0}
                            className="p-1 text-gray-500 hover:text-gray-700 disabled:text-gray-300"
                            title="Move left"
                          >
                            <FaArrowLeft size={14} />
                          </button>
                          <button
                            onClick={() => movePage(index, index + 1)}
                            disabled={index === pdfPages.length - 1}
                            className="p-1 text-gray-500 hover:text-gray-700 disabled:text-gray-300"
                            title="Move right"
                          >
                            <FaArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={reorderPages}
                  disabled={isProcessing || pdfPages.length === 0}
                  className="w-full sm:w-auto bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed mt-4"
                >
                  {isProcessing ? "Processing..." : "Save Reordered PDF"}
                </button>
              </>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <ToolLayout
      title="PDF Tools"
      description="A collection of PDF manipulation and conversion tools"
    >
      <div className="space-y-6">
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
                    onClick={() => setActiveTab(tool.id)}
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
        {renderContent()}
      </div>
    </ToolLayout>
  );
};

export default PDFTools;
