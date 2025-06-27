
import { ScanStatus, StatusUpdatePayload, MessageType } from '../types';
import { STORAGE_KEYS } from '../constants';
import { sendMessage } from '../utils/chromePromise';

// This module is responsible for managing the state of the scanning process for each tab.
// It acts as the single source of truth for a tab's current status (e.g., IDLE, SCANNING).

// Use a JavaScript Map for in-memory state. This provides a fast, temporary cache
// for the status of each tab, keyed by the tab's ID.
export const tabStates = new Map<number, StatusUpdatePayload>();

/**
 * Returns a default initial state object for a tab.
 * @param url The URL of the tab.
 */
export const getInitialState = (url: string = ""): StatusUpdatePayload => ({
    status: ScanStatus.IDLE,
    url: url,
    error: undefined
});

/**
 * Updates the status for a specific tab and notifies any listening UI (like the popup).
 * This is the central function for all state transitions.
 * @param tabId The ID of the tab to update.
 * @param newStatus A partial payload containing the fields to update.
 */
export const updateStatus = async (tabId: number, newStatus: Partial<StatusUpdatePayload>) => {
    // Get the current state or create an initial one if it doesn't exist.
    const currentState = tabStates.get(tabId) || getInitialState();
    // Merge the current state with the new status updates.
    const updatedState: StatusUpdatePayload = { ...currentState, ...newStatus };
    
    // --- Update In-Memory Cache ---
    tabStates.set(tabId, updatedState);

    // --- Persist State to Session Storage ---
    // This is a key optimization. By saving the state to `chrome.storage.session`,
    // the popup can read this value synchronously when it opens, preventing a "flash"
    // of stale content while it waits for a message from the background script.
    const sessionStateKey = `${STORAGE_KEYS.TAB_STATUS_PREFIX}${tabId}`;
    await chrome.storage.session.set({ [sessionStateKey]: updatedState });

    // --- Broadcast the Update ---
    // Send a message with the new state to the popup UI.
    try {
        await sendMessage({ type: MessageType.STATUS_UPDATE, payload: updatedState });
    } catch (error) {
        // It's very common for this to fail if the popup is not open. We can safely
        // ignore the specific "receiving end does not exist" error to keep the console clean.
        const message = (error as Error).message?.toLowerCase() ?? '';
        if (!message.includes('receiving end does not exist') && !message.includes('could not establish connection')) {
             console.warn("Cookie Skipper AI: Status update message failed unexpectedly:", error);
        }
    }
};

/**
 * Initializes listeners for tab lifecycle events to ensure proper state management
 * and cleanup, preventing memory leaks.
 */
export function initializeTabStateManagement() {
    // When a tab is updated (e.g., navigated to a new page)...
    chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
        // ...if the page is reloading, clear out the old state for that tab.
        if (changeInfo.status === 'loading') {
           tabStates.delete(tabId);
           chrome.storage.session.remove(`${STORAGE_KEYS.TAB_STATUS_PREFIX}${tabId}`);
        }
    });

    // When a tab is closed...
    chrome.tabs.onRemoved.addListener((tabId) => {
        // ...remove its state from both the in-memory map and session storage to free up resources.
        tabStates.delete(tabId);
        chrome.storage.session.remove(`${STORAGE_KEYS.TAB_STATUS_PREFIX}${tabId}`);
    });
    console.log("Cookie Skipper AI: Tab state management initialized.");
}