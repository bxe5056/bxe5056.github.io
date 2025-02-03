import posthog from "posthog-js";

const POSTHOG_KEY = process.env.REACT_APP_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.REACT_APP_PUBLIC_POSTHOG_HOST;
const BUG_REPORTING_STORAGE_KEY = "bug_reporting_enabled";

// Global state for bug reporting
let isBugReportingEnabled =
  localStorage.getItem(BUG_REPORTING_STORAGE_KEY) === "true";

// Function to toggle bug reporting
export const toggleBugReporting = (enabled) => {
  isBugReportingEnabled = enabled;
  localStorage.setItem(BUG_REPORTING_STORAGE_KEY, enabled);

  if (POSTHOG_KEY && POSTHOG_HOST) {
    if (enabled) {
      posthog.opt_in_capturing();
    } else {
      // When disabled, we still want basic metrics but not full data capture
      posthog.opt_out_capturing();
      // Reinitialize with restricted capturing
      initializeRestrictedCapturing();
    }
  }
};

// Helper function to show error messages with bug reporting prompt
export const showErrorWithReporting = (error, context = "") => {
  const baseMessage = `An error occurred${
    context ? ` while ${context}` : ""
  }: ${error.message}`;

  if (!isBugReportingEnabled) {
    const fullMessage = `${baseMessage}\n\nWould you like to enable detailed bug reporting to help us diagnose and fix this issue?\n\nYou can enable it by clicking the crawling bug icon in the top navigation bar.`;
    console.error(error);
    return fullMessage;
  }

  // If bug reporting is enabled, just return the base message
  console.error(error);
  return baseMessage;
};

// Initialize PostHog with restricted capturing
const initializeRestrictedCapturing = () => {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    debug: process.env.NODE_ENV === "development",
    loaded: (posthog) => {
      if (process.env.NODE_ENV === "development") {
        posthog.opt_out_capturing();
      }
    },
    // Mask sensitive properties unless bug reporting is enabled
    property_blacklist: isBugReportingEnabled
      ? []
      : [
          "document_name",
          "document_type",
          "file_content",
          "image_data",
          "tool_data",
          "user_input",
          "processed_data",
        ],
    mask_all_text: false,
    mask_all_element_attributes: false,
    // Add masking configuration for images and PDFs
    session_recording: {
      maskAllInputs: false,
      maskInputOptions: {
        maskInputFn: (text, element) => {
          if (!isBugReportingEnabled) {
            // Mask filenames and image previews on the image page
            if (element.closest('[data-tool="image"]')) {
              // Mask filenames
              if (element.getAttribute("data-content-type") === "filename") {
                return "[Filename Hidden]";
              }
              // Mask image previews and thumbnails
              if (
                element instanceof HTMLImageElement ||
                element.classList.contains("image-preview") ||
                element.classList.contains("image-thumbnail")
              ) {
                return "[Image Preview Hidden]";
              }
            }
            // Mask images in the Extract Colors section
            if (
              element instanceof HTMLImageElement &&
              (element.closest('[data-tool="extract"]') ||
                element.closest('[data-section="extract-colors"]'))
            ) {
              return "[Content Hidden]";
            }
            // Mask SVG previews and text outputs
            if (element.closest('[data-tool="svg"]')) {
              // Mask SVG previews
              if (element.tagName === "svg" || element.querySelector("svg")) {
                return "[SVG Preview Hidden]";
              }
              // Mask SVG text outputs
              if (element.classList.contains("svg-output")) {
                return "[SVG Content Hidden]";
              }
            }
            // Mask color swap previews and SVG outputs
            if (element.closest('[data-tool="color-swap"]')) {
              // Mask SVG preview
              if (element.tagName === "svg" || element.querySelector("svg")) {
                return "[SVG Preview Hidden]";
              }
              // Mask SVG output text
              if (element.classList.contains("svg-output")) {
                return "[SVG Content Hidden]";
              }
            }
            // Mask data conversion input and output
            if (element.closest('[data-tool="data"]')) {
              if (
                element.classList.contains("data-input") ||
                element.classList.contains("data-output")
              ) {
                return "[Data Content Hidden]";
              }
            }
            // Mask text tool inputs and outputs
            if (element.closest('[data-tool="text"]')) {
              if (
                element.classList.contains("text-input") ||
                element.classList.contains("text-output") ||
                element.classList.contains("markdown-input") ||
                element.classList.contains("markdown-preview") ||
                element.classList.contains("lorem-output")
              ) {
                return "[Text Content Hidden]";
              }
            }
            // Mask dev tool inputs
            if (element.closest('[data-tool="dev"]')) {
              if (
                element.classList.contains("hash-input") ||
                element.classList.contains("regex-pattern") ||
                element.classList.contains("regex-test-input")
              ) {
                return "[Dev Tool Input Hidden]";
              }
            }
          }
          return text;
        },
      },
      maskNetworkRequestFn: (request) => {
        if (!isBugReportingEnabled) {
          // Mask image and SVG requests
          if (
            (request.url.match(/\.(jpg|jpeg|png|gif|bmp|svg)$/i) ||
              request.url.includes("data:image/") ||
              request.url.includes("data:image/svg+xml")) &&
            !request.url.includes("/static/")
          ) {
            return { url: "[Masked Media URL]" };
          }
        }
        return request;
      },
    },
  });
};

// Only initialize PostHog if we have the required configuration
if (POSTHOG_KEY && POSTHOG_HOST) {
  initializeRestrictedCapturing();
} else {
  // Provide a mock implementation for development
  if (process.env.NODE_ENV === "development") {
    console.warn("PostHog not initialized: Missing API key or host");
  }
}

// Helper function for tracking downloads
export const trackDownload = (documentName, documentType) => {
  if (POSTHOG_KEY && POSTHOG_HOST) {
    posthog.capture("document_download", {
      document_name: isBugReportingEnabled ? documentName : "[MASKED]",
      document_type: isBugReportingEnabled ? documentType : "[MASKED]",
      timestamp: new Date().toISOString(),
    });
  }
};

// Helper function for tracking tool usage
export const trackToolUsage = (toolName, eventName, data = {}) => {
  if (POSTHOG_KEY && POSTHOG_HOST) {
    const sanitizedData = isBugReportingEnabled
      ? data
      : {
          tool_name: toolName,
          event_type: eventName,
          timestamp: new Date().toISOString(),
        };

    posthog.capture(`tool_${eventName}`, sanitizedData);
  }
};

export const getBugReportingStatus = () => isBugReportingEnabled;

export default posthog;
