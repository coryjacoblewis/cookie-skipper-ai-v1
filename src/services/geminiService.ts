
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { OperatingMode, ErrorCode, AppError } from "../types";
import { getCentralApiKey } from "./configService";
import * as settingsService from "./settingsService";
import { FIND_ACCEPT_BUTTON_PROMPT } from "../prompts";
import { AI_CONFIG } from "../constants";

// This service is responsible for all interactions with the Google Gemini API.
// It handles creating the API client, sending prompts, and parsing responses.

// Module-level cache for the AI instance. This is a crucial optimization to avoid
// the overhead of creating a new GoogleGenAI client on every single API call.
let cachedAiInstance: GoogleGenAI | null = null;
// The key used to create the cached instance. If this key changes (e.g., user
// switches modes or updates their API key), the cache must be invalidated.
let cachedSettingsKey: string | null = null;

/**
 * Custom error for API key related issues (missing, invalid, etc.).
 * Inherits from the base AppError for consistent error handling.
 */
export class ApiKeyError extends AppError {
  constructor(message: string) {
    super(message, ErrorCode.API_KEY_INVALID);
    this.name = 'ApiKeyError';
  }
}

/**
 * Custom error for when the user is on the free tier but has not consented
 * to data collection and ads.
 * Inherits from the base AppError.
 */
export class ConsentRequiredError extends AppError {
  constructor(message: string) {
    super(message, ErrorCode.CONSENT_REQUIRED);
    this.name = 'ConsentRequiredError';
  }
}

/**
 * Invalidates the cached AI instance. This function MUST be called whenever
 * user settings that affect the AI client (like API key or operating mode) change.
 * This is handled by a listener in background.ts.
 */
export function resetAiInstanceCache() {
  cachedAiInstance = null;
  cachedSettingsKey = null;
  console.log("Cookie Skipper AI: AI client cache invalidated.");
}

/**
 * Creates and returns a GoogleGenAI instance based on the user's current operating mode.
 * This function intelligently caches the instance and only re-creates it if settings have changed,
 * which is critical for performance.
 * @returns A promise that resolves to a configured GoogleGenAI instance.
 * @throws An ApiKeyError if the user's key is missing/invalid.
 * @throws A ConsentRequiredError if the user is on the free tier but hasn't consented.
 * @throws An AppError if the central API key cannot be fetched.
 */
async function getAiInstance(): Promise<GoogleGenAI> {
  const settings = await settingsService.getSettings();

  // Determine the current key source (user's key or central key) to build a unique cache identifier.
  const keySource = settings.mode === OperatingMode.BYOK ? settings.userKey : "central";
  // The cache key combines all settings that could require a new client instance.
  const currentSettingsKey = `${settings.mode}:${settings.consent}:${keySource}`;
  
  // --- OPTIMIZATION: Check cache first before doing any async work ---
  if (cachedAiInstance && cachedSettingsKey === currentSettingsKey) {
    return cachedAiInstance;
  }
  
  let apiKey: string | undefined;

  // Determine which API key to use based on the operating mode.
  switch (settings.mode) {
    case OperatingMode.PRO:
    case OperatingMode.FREE_AD_SUPPORTED:
      // For Pro and Free tiers, fetch the central API key from our secure server.
      apiKey = await getCentralApiKey();
      break;
    case OperatingMode.BYOK:
    default:
      // For BYOK mode, use the key the user has provided.
      apiKey = settings.userKey;
      break;
  }

  // A final cache key that includes the actual key value, in case it was fetched.
  const finalSettingsKey = `${settings.mode}:${settings.consent}:${apiKey}`;
  
  // Re-check cache after getting key, in case another concurrent call populated it while we were waiting.
  if (cachedAiInstance && cachedSettingsKey === finalSettingsKey) {
    return cachedAiInstance;
  }
  
  let aiInstance: GoogleGenAI;

  // Validate settings and create the new AI instance.
  switch (settings.mode) {
    case OperatingMode.PRO:
      if (!apiKey) throw new AppError("Central API Key could not be fetched for the PRO service.", ErrorCode.CONFIG_FETCH_FAILED);
      aiInstance = new GoogleGenAI({ apiKey });
      break;

    case OperatingMode.FREE_AD_SUPPORTED:
      // Enforce the consent requirement for the free tier.
      if (!settings.consent) throw new ConsentRequiredError("For the free service, consent is required. Please enable it in the extension's options.");
      if (!apiKey) throw new AppError("Central API Key could not be fetched for the free service.", ErrorCode.CONFIG_FETCH_FAILED);
      aiInstance = new GoogleGenAI({ apiKey });
      break;

    case OperatingMode.BYOK:
    default:
      // Enforce that a key must be present for BYOK mode.
      if (!apiKey) throw new ApiKeyError("API Key not found. Please set it in the extension options.");
      aiInstance = new GoogleGenAI({ apiKey });
      break;
  }
  
  // --- Cache the newly created instance ---
  cachedAiInstance = aiInstance;
  cachedSettingsKey = finalSettingsKey;

  return aiInstance;
}

/**
 * Analyzes the given HTML to find the CSS selector for the "accept all" cookies button.
 * @param html The HTML content of the page body.
 * @returns A promise that resolves to the CSS selector string, or null if not found.
 * @throws An AppError for auth issues or other API failures.
 */
export async function findAcceptButtonSelector(html: string): Promise<string | null> {
  // Construct the full prompt by combining the base instruction with the page HTML.
  // The HTML is truncated to avoid exceeding API limits.
  const prompt = `${FIND_ACCEPT_BUTTON_PROMPT}\n${html.substring(0, 30000)}`;

  try {
    const gemini = await getAiInstance();
    const response: GenerateContentResponse = await gemini.models.generateContent({
        model: AI_CONFIG.MODEL_NAME,
        contents: prompt,
        config: {
          // Instruct the model to return a JSON object directly.
          responseMimeType: "application/json",
          // Set temperature to 0 for deterministic, non-creative responses.
          temperature: 0,
          // Disable "thinking" for lower latency, as this is a simple extraction task.
          thinkingConfig: { thinkingBudget: 0 }
        }
    });

    // The Gemini API may wrap the JSON in markdown fences (```json ... ```), so we need to remove them.
    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    const parsed = JSON.parse(jsonStr);
    
    // Validate the parsed response to ensure it has the expected shape.
    if (parsed && typeof parsed.selector === 'string' && parsed.selector) {
      return parsed.selector;
    }

    // Return null if the AI explicitly couldn't find a selector.
    return null;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Re-throw our custom errors directly so they can be handled properly by the caller.
    if (error instanceof AppError) {
        throw error;
    }
    // Check for specific error messages from the Gemini SDK for better user feedback.
    if (error instanceof Error && error.message.includes('API key not valid')) {
       throw new ApiKeyError("Your Gemini API Key is invalid. Please check it in the settings.");
    }
    // For any other unexpected errors, wrap them in our base AppError for consistent handling.
    throw new AppError("An unexpected error occurred during AI analysis.", ErrorCode.GENERIC_ANALYSIS_ERROR);
  }
}

/**
 * Performs a lightweight test call to the Gemini API to validate a given API key.
 * This provides immediate feedback to the user on the options page.
 * @param apiKey The API key to test.
 * @throws {ApiKeyError} if the key is empty or the API call fails.
 */
export async function testApiKey(apiKey: string): Promise<void> {
  if (!apiKey) {
    throw new ApiKeyError("API Key cannot be empty.");
  }
  try {
    const gemini = new GoogleGenAI({ apiKey });
    // A very lightweight, low-token prompt to validate the key and model access.
    // This minimizes cost for the user.
    await gemini.models.generateContent({
        model: AI_CONFIG.MODEL_NAME,
        contents: "test",
        config: { temperature: 0, thinkingConfig: { thinkingBudget: 0 } }
    });
  } catch (error) {
    console.error("API Key test failed:", error);
    // The underlying SDK might throw a generic gRPC error. We'll wrap it in our
    // custom ApiKeyError to provide a more user-friendly message.
    throw new ApiKeyError("This API Key appears to be invalid or lacks permissions.");
  }
}