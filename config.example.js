/**
 * Configuration Example for L'Oréal Beauty Advisor
 * 
 * Copy this file to config.js and update with your settings.
 * The config.js file is gitignored to prevent committing sensitive data.
 */

// Cloudflare Worker API endpoint
// Replace with your actual Worker URL after deployment
const CONFIG = {
    API_ENDPOINT: 'https://loreal-beauty-advisor-api.YOUR-SUBDOMAIN.workers.dev/api/chat',
    
    // Optional: Enable debug logging
    DEBUG: false
};

// Export for use in app.js
if (typeof window !== 'undefined') {
    window.APP_CONFIG = CONFIG;
}
