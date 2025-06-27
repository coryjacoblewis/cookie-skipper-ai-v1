
/**
 * This content script is not actively used in the current version of the extension.
 * 
 * The previous architecture may have used a persistent content script that was
 * injected into every page via the manifest.json file. This script would have
 * been responsible for detecting banners and communicating with the background script.
 * 
 * The current, more optimized architecture uses a different approach:
 * 1. The user clicks the extension action icon.
 * 2. The background service worker (`scanManager.ts`) programmatically injects
 *    scripts into the active tab on-demand using the `chrome.scripting.executeScript` API.
 * 
 * This on-demand injection is more performant as it avoids running unnecessary
 * JavaScript on every single page the user visits.
 *
 * This file is kept as a placeholder in case a persistent content script
 * is needed for future features (e.g., a feature that needs to constantly
 * monitor the DOM).
 */

// This empty export statement ensures the file is treated as a module by TypeScript,
// preventing potential "global scope" issues.
export {};