import posthog from 'posthog-js'

// Initialize PostHog with your project API key
posthog.init(
    process.env.REACT_APP_POSTHOG_API_KEY,
    {
        api_host: process.env.REACT_APP_POSTHOG_HOST,
        // Enable debug mode in development
        debug: process.env.NODE_ENV === 'development',
        // Only capture events in production
        loaded: (posthog) => {
            if (process.env.NODE_ENV === 'development') posthog.opt_out_capturing()
        }
    }
)

// Helper function for tracking downloads
export const trackDownload = (documentName, documentType) => {
    posthog.capture('document_download', {
        document_name: documentName,
        document_type: documentType,
        timestamp: new Date().toISOString()
    });
};

export default posthog 