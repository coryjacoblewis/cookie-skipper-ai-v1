
import { resetAiInstanceCache } from '../services/geminiService';
import { STORAGE_KEYS } from '../constants';
import { initializeTabStateManagement, updateStatus } from './stateManager';
import { initializeMessageHandler } from './messageHandler';
import { executeScan } from './scanManager';
import { ScanStatus } from '../types';

/**
 * This is the main entry point for the extension's service worker.
 * Its primary responsibility is to orchestrate the different modules and
 * set up event listeners for core browser events.
 */

console.log("Cookie Skipper AI: Service Worker starting up.");

// Initialize all the separate modules that handle different aspects of background logic.
// This modular approach keeps the main background file clean and easy to understand.
initializeTabStateManagement();
initializeMessageHandler();

// --- Event Listeners ---

// 1. On Installation/Update: Perform any first-time setup.
chrome.runtime.onInstalled.addListener(() => {
    // In Manifest V3, the action icon is typically always visible.
    // The deprecated declarativeContent API is no longer used.
    // The user can click the icon on any page to initiate a scan.
    console.log("Cookie Skipper AI: Extension installed/updated. Ready to scan on user action.");
});

// 2. On Action Click: This is the primary trigger for a manual scan.
chrome.action.onClicked.addListener(async (tab) => {
    // Ensure the tab has a valid ID and URL before proceeding.
    if (tab.id && tab.url) {
        // Immediately update the status to SCANNING to give the user feedback.
        await updateStatus(tab.id, { status: ScanStatus.SCANNING, url: tab.url, error: undefined });
        // Delegate the actual scan logic to the scanManager.
        // This is a "fire-and-forget" call; the scanManager will handle subsequent status updates.
        executeScan(tab.id, tab.url);
    } else {
        console.error("Cookie Skipper AI: Action clicked on a tab with no ID or URL.", tab);
    }
});

// 3. On Settings Change: Listen for changes in chrome.storage.sync.
chrome.storage.onChanged.addListener((changes, areaName) => {
    // We only care about the 'sync' storage area where our settings are stored.
    if (areaName === 'sync') {
        // Define the settings keys that would require the AI client to be re-initialized.
        const watchedKeys = [
            STORAGE_KEYS.API_KEY, 
            STORAGE_KEYS.OPERATING_MODE, 
            STORAGE_KEYS.DATA_COLLECTION_CONSENT
        ];
        // If any of the critical keys have changed...
        if (watchedKeys.some(key => key in changes)) {
            // ...invalidate the cached AI client to force it to be recreated with the new settings on the next call.
            resetAiInstanceCache();
        }
    }
});