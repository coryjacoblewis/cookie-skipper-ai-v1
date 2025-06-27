
// This file defines all the shared data structures and types for the application,
// ensuring type safety and consistency across different components and modules.

/**
 * Defines the types of messages that can be sent between different parts
 * of the extension (e.g., popup, background script).
 */
export enum MessageType {
  // --- Popup -> Background Script ---
  // Sent when the user clicks the "Scan Page Manually" button.
  MANUAL_SCAN_REQUEST = 'MANUAL_SCAN_REQUEST',
  // Sent by the popup when it opens to get the current status for the active tab.
  GET_STATUS = 'GET_STATUS',
  // Sent when the user clicks a button to open the extension's options page.
  OPEN_OPTIONS_PAGE = 'OPEN_OPTIONS_PAGE',

  // --- Background Script -> Popup ---
  // Sent by the background script to update the UI with the latest scan status.
  STATUS_UPDATE = 'STATUS_UPDATE',
}

/**
 * Represents the different states of the scanning process.
 */
export enum ScanStatus {
  IDLE = 'IDLE',          // The extension is ready and waiting for a command.
  SCANNING = 'SCANNING',  // The extension is fetching the page's HTML.
  ANALYZING = 'ANALYZING',// The HTML has been sent to the AI for analysis.
  SUCCESS = 'SUCCESS',    // The banner was found and successfully clicked.
  NOT_FOUND = 'NOT_FOUND',// The AI analyzed the page but did not find a banner.
  ERROR = 'ERROR',        // An error occurred at some point in the process.
}

/**
 * Defines the different monetization and operational tiers for the extension.
 */
export enum OperatingMode {
  BYOK = 'BYOK',                      // "Bring Your Own Key": User provides their own Gemini API key.
  FREE_AD_SUPPORTED = 'FREE_AD_SUPPORTED', // Free tier, funded by ads and anonymized data collection.
  PRO = 'PRO',                        // Paid premium tier with no ads or data collection.
}

/**
 * A standardized set of error codes to allow for reliable, type-safe error handling in the UI
 * without relying on brittle error message strings.
 */
export enum ErrorCode {
  // User Configuration Errors
  API_KEY_INVALID = 'API_KEY_INVALID',
  CONSENT_REQUIRED = 'CONSENT_REQUIRED',
  
  // Extension/System Errors
  COMMUNICATION_ERROR = 'COMMUNICATION_ERROR', // Failed to send a message between scripts.
  CLICK_FAILED = 'CLICK_FAILED', // The script successfully identified a button but failed to click it.
  HTML_FETCH_FAILED = 'HTML_FETCH_FAILED', // Failed to get the HTML content from the page.
  SCRIPT_INJECTION_FAILED = 'SCRIPT_INJECTION_FAILED', // The main scripting API failed.
  CONFIG_FETCH_FAILED = 'CONFIG_FETCH_FAILED', // Could not fetch the central API key from the remote server.
  
  // AI/Analysis Errors
  GENERIC_ANALYSIS_ERROR = 'GENERIC_ANALYSIS_ERROR',
}

/**
 * A base error class for all application-specific errors.
 * This ensures a consistent error structure with a code for reliable handling,
 * making it easy to catch and identify specific types of errors.
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  constructor(message: string, code: ErrorCode) {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}

// --- Message Payloads ---
// These interfaces define the shape of the data sent along with messages.

/**
 * The data structure for an error payload, containing a code for logic
 * and a message for display.
 */
export interface ErrorPayload {
  code: ErrorCode;
  message: string;
}

/**
 * The data structure for a status update, sent from the background to the popup.
 */
export interface StatusUpdatePayload {
  status: ScanStatus;
  url?: string; // The URL of the tab the status applies to.
  error?: ErrorPayload; // An error object if the status is ERROR.
}


// --- Discriminated Union for Type-Safe Messaging ---
// This pattern allows TypeScript to correctly infer the payload type based on the message's `type` property,
// eliminating the need for manual type casting and making the communication layer more robust.

// Defines messages that carry a payload.
interface StatusUpdateMessage {
  type: MessageType.STATUS_UPDATE;
  payload: StatusUpdatePayload;
}

// Defines messages that do not carry a payload.
interface SimpleMessage {
  type:
    | MessageType.MANUAL_SCAN_REQUEST
    | MessageType.GET_STATUS
    | MessageType.OPEN_OPTIONS_PAGE;
  payload?: undefined; // Explicitly undefined to enforce no payload.
}

/**
 * A union of all possible message types. This is the single type that should be
 * used for all `chrome.runtime.sendMessage` calls to ensure type safety.
 */
export type ChromeMessage =
  | StatusUpdateMessage
  | SimpleMessage;