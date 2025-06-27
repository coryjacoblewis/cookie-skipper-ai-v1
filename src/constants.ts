
// This file centralizes all the constant values used across the application.
// Using constants instead of "magic strings" prevents typos and makes the code
// easier to maintain and refactor, as changes only need to be made in one place.

/**
 * Keys used for storing and retrieving data from `chrome.storage`.
 */
export const STORAGE_KEYS = {
  OPERATING_MODE: 'operatingMode', // Stores the user's chosen service tier (e.g., 'BYOK', 'PRO').
  API_KEY: 'apiKey', // Stores the user's personal Gemini API key (only for BYOK mode).
  DATA_COLLECTION_CONSENT: 'dataCollectionConsent', // Boolean flag for user consent on the free tier.
  TAB_STATUS_PREFIX: 'tab_status_', // Prefix for storing the status of individual tabs in session storage.
  CENTRAL_API_KEY_CACHE: 'centralApiKeyCache', // Key for caching the fetched central API key.
};

/**
 * URLs for all external APIs the extension communicates with.
 */
export const API_URLS = {
  // Endpoint to fetch the central API key for the Free and Pro tiers.
  CONFIG: 'https://api.cookieskipper.ai/v1/config',
  // Endpoint to send anonymized analytics data for data licensing.
  ANALYTICS: 'https://api.example-data-licensing.com/data',
};

/**
 * Constants related to payments and subscriptions.
 */
export const PAYMENT = {
  // The Stock Keeping Unit (SKU) for the Pro subscription in the Chrome Web Store.
  PRO_SKU: 'pro_monthly_subscription',
};

/**
 * Configuration for caching mechanisms.
 */
export const CACHE_CONFIG = {
  // Time-To-Live (TTL) for the cached central API key, in milliseconds.
  // Here, it's set to 1 hour to balance performance with the ability to rotate keys.
  CENTRAL_API_KEY_TTL_MS: 60 * 60 * 1000, 
};

/**
 * Configuration for the AI model.
 */
export const AI_CONFIG = {
  // The specific Gemini model to be used for analysis.
  // Centralizing this makes it easy to update the model in the future.
  MODEL_NAME: 'gemini-2.5-flash-preview-04-17',
};

/**
 * A centralized object for all user-facing text in the popup UI.
 * This makes it easy to change wording consistently and is a best practice
 * for future internationalization (i18n) efforts.
 */
export const UI_TEXT = {
  SCANNING: "Scanning page...",
  ANALYZING: "AI is analyzing...",
  SUCCESS: "Cookie banner skipped!",
  NOT_FOUND: "No cookie banner found.",
  IDLE: "Idle. Ready to scan.",
};