
import { OperatingMode } from '../types';
import { STORAGE_KEYS } from '../constants';

// This service acts as the single source of truth for managing all user-configurable settings.
// It encapsulates all interactions with `chrome.storage.sync`, providing a clean,
// promise-based API for the rest of the application. This prevents other modules
// from needing to know the specific storage keys or implementation details.

/**
 * Defines the structure for the user's settings object.
 */
export interface UserSettings {
  mode: OperatingMode;
  consent: boolean;
  userKey?: string;
}

/**
 * Simple, reversible obfuscation for the API key stored in `chrome.storage.sync`.
 * This is NOT encryption and is not meant to be cryptographically secure.
 * Its purpose is to simply prevent the API key from being stored as a plain, easily-readable
 * string in the user's synced storage, adding a minor layer of protection.
 * @param data The string to encode (the API key).
 * @returns A base64 encoded string.
 */
function encode(data: string): string {
  try {
    // `btoa` is a standard browser API for base64 encoding.
    return btoa(data);
  } catch (e) {
    console.warn("Could not encode API key", e);
    return data; // Fallback to plain text if encoding fails for any reason.
  }
}

/**
 * Reverses the obfuscation on the API key.
 * @param encodedData The base64 encoded string from storage.
 * @returns The decoded, plain-text API key.
 */
function decode(encodedData: string): string {
  try {
    // `atob` is a standard browser API for base64 decoding.
    return atob(encodedData);
  } catch (e) {
    console.warn("Could not decode API key. It might not be encoded.", e);
    return encodedData; // Fallback if the data isn't valid base64.
  }
}

/**
 * Retrieves all user settings from `chrome.storage.sync`.
 * @returns A promise that resolves to the user's settings object with defaults applied.
 */
export async function getSettings(): Promise<UserSettings> {
  const keys = [
    STORAGE_KEYS.OPERATING_MODE,
    STORAGE_KEYS.DATA_COLLECTION_CONSENT,
    STORAGE_KEYS.API_KEY,
  ];
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      // Provide a default value for operating mode if one isn't set.
      const mode = result[STORAGE_KEYS.OPERATING_MODE] || OperatingMode.FREE_AD_SUPPORTED;
      const userKey = result[STORAGE_KEYS.API_KEY];

      resolve({
        mode,
        consent: !!result[STORAGE_KEYS.DATA_COLLECTION_CONSENT],
        // Decode the user key if it exists.
        userKey: userKey ? decode(userKey) : undefined,
      });
    });
  });
}

/**
 * Saves the user's chosen operating mode to storage.
 * @param mode The operating mode to save.
 */
export async function saveOperatingMode(mode: OperatingMode): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ [STORAGE_KEYS.OPERATING_MODE]: mode }, () => {
      chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve();
    });
  });
}

/**
 * Encodes and saves the user's personal Gemini API key to storage.
 * @param apiKey The plain-text API key to save.
 */
export async function saveUserApiKey(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Always encode the key before saving.
    const encodedKey = encode(apiKey);
    chrome.storage.sync.set({ [STORAGE_KEYS.API_KEY]: encodedKey }, () => {
      chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve();
    });
  });
}

/**
 * Saves the user's consent for data collection to storage.
 * @param consent The consent status (true or false) to save.
 */
export async function saveConsent(consent: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ [STORAGE_KEYS.DATA_COLLECTION_CONSENT]: consent }, () => {
      chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve();
    });
  });
}