
import { API_URLS, STORAGE_KEYS, CACHE_CONFIG } from '../constants';
import { AppError, ErrorCode } from '../types';

// This service is responsible for fetching remote configuration, specifically the
// central API key used for the "Free" and "Pro" tiers.

/**
 * Defines the structure of the API key cache entry stored in session storage.
 */
interface ApiKeyCache {
  key: string;
  timestamp: number; // The time when the key was fetched, used for cache invalidation.
}

/**
 * Fetches the central API key from a remote configuration server.
 * This approach is more secure and flexible than hardcoding the key in the extension,
 * as it allows the key to be rotated on the server without needing to publish a new
- * version of the extension.
 *
 * It implements caching in `chrome.storage.session` to avoid fetching the key
 * on every single request, which would be inefficient. Session storage is used
 * because it's fast (in-memory) and persists for the lifetime of a browser session.
 * 
 * It also supports a local override via an environment variable for easier development.
 * 
 * @returns {Promise<string>} The central API key.
 * @throws {AppError} If the key cannot be fetched or the response is invalid.
 */
export async function getCentralApiKey(): Promise<string> {
  // --- Development Override ---
  // Check for a local environment variable. This is extremely useful for local development
  // as it allows testing the "Free" and "Pro" tiers without a live config server.
  // The `import.meta.env` object is populated by build tools like Vite.
  if (import.meta.env.DEV && import.meta.env.VITE_CENTRAL_API_KEY) {
    console.log("Cookie Skipper AI: Using local override for central API key.");
    return import.meta.env.VITE_CENTRAL_API_KEY;
  }

  // Step 1: Check the session cache for a recent, valid key.
  try {
    const cachedData = await new Promise<{ [key: string]: any }>((resolve, reject) => {
      chrome.storage.session.get(STORAGE_KEYS.CENTRAL_API_KEY_CACHE, (items) => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }
        resolve(items);
      });
    });
    
    const cacheEntry = cachedData[STORAGE_KEYS.CENTRAL_API_KEY_CACHE];
    if (cacheEntry) {
      const { key, timestamp } = cacheEntry as ApiKeyCache;
      if (Date.now() - timestamp < CACHE_CONFIG.CENTRAL_API_KEY_TTL_MS) {
        return key;
      }
    }
  } catch (e) {
    console.warn("Cookie Skipper AI: Could not read API key from session cache", e);
  }

  // Step 2: If the cache is empty or stale, fetch the key from the remote server.
  try {
    const response = await fetch(API_URLS.CONFIG);
    if (!response.ok) {
        throw new AppError(`Failed to fetch config, status: ${response.status}`, ErrorCode.CONFIG_FETCH_FAILED);
    }

    const config = await response.json();
    const apiKey = config.apiKey;

    if (typeof apiKey !== 'string' || !apiKey) {
        throw new AppError('Invalid API key format received from config server.', ErrorCode.CONFIG_FETCH_FAILED);
    }
    
    const newCacheEntry: ApiKeyCache = { key: apiKey, timestamp: Date.now() };
    await chrome.storage.session.set({ [STORAGE_KEYS.CENTRAL_API_KEY_CACHE]: newCacheEntry });

    return apiKey;
  } catch (error) {
     console.error("Cookie Skipper AI: Central API key fetch failed.", error);
     if (error instanceof AppError) throw error;
     throw new AppError("Could not retrieve the central API key for the service.", ErrorCode.CONFIG_FETCH_FAILED);
  }
}
