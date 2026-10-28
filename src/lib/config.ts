/**
 * Centralized Gateway Configuration
 * Validates and normalizes environment variables for the standalone onboarding gateway.
 */

function sanitizeUrl(url?: string): string {
  if (!url) return "http://localhost:4800";
  return url.trim().replace(/\/+$/, "");
}

export const gatewayConfig = {
  // wg-messaging backend URL (defaults to local backend on port 4800)
  wgMessagingUrl: sanitizeUrl(process.env.WG_MESSAGING_URL),

  // Control plane API key for authenticating requests to wg-messaging
  wgApiKey: process.env.WG_API_KEY || "local_development_key",

  // Timeout in milliseconds for backend API calls
  fetchTimeoutMs: Number(process.env.BACKEND_TIMEOUT_MS) || 15000,
};
