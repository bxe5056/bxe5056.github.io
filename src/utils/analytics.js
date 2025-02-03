import posthog from "posthog-js";

const POSTHOG_KEY = process.env.REACT_APP_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.REACT_APP_PUBLIC_POSTHOG_HOST;

// Only initialize PostHog if we have the required configuration
if (POSTHOG_KEY && POSTHOG_HOST) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    // Enable debug mode in development
    debug: process.env.NODE_ENV === "development",
    // Only capture events in production
    loaded: (posthog) => {
      if (process.env.NODE_ENV === "development") posthog.opt_out_capturing();
    },
  });
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
      document_name: documentName,
      document_type: documentType,
      timestamp: new Date().toISOString(),
    });
  }
};

export default posthog;
