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
    session_recording: {
      maskAllInputs: true,
      maskInputOptions: {
        password: true,
        text: !isBugReportingEnabled,
        textarea: !isBugReportingEnabled,
      },
      maskTextSelector: !isBugReportingEnabled ? "*" : "",
      maskInputFn: (text, element) => {
        if (isBugReportingEnabled) {
          return text;
        }

        // Check for specific tool sections
        if (element.closest('[data-tool="dev"]')) {
          // Mask hash generator input
          if (element.classList.contains("hash-input")) {
            return "[Hash Input Hidden]";
          }
          // Mask regex inputs
          if (
            element.classList.contains("regex-pattern") ||
            element.classList.contains("regex-test-input")
          ) {
            return "[Regex Input Hidden]";
          }
        }

        // Mask text tool inputs/outputs
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

        // Mask data tool inputs/outputs
        if (element.closest('[data-tool="data"]')) {
          if (
            element.classList.contains("data-input") ||
            element.classList.contains("data-output")
          ) {
            return "[Data Content Hidden]";
          }
        }

        return text;
      },
      maskTextFn: (text, element) => {
        if (isBugReportingEnabled) {
          return text;
        }

        // Only mask text in specific tool sections
        if (
          element.closest('[data-tool="dev"]') ||
          element.closest('[data-tool="text"]') ||
          element.closest('[data-tool="data"]')
        ) {
          return "[Content Hidden]";
        }

        return text;
      },
      maskNetworkRequestFn: (request) => {
        if (!isBugReportingEnabled) {
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
