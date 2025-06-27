
import { ChromeMessage, MessageType } from '../types';
import { executeScan } from './scanManager';
import { tabStates, getInitialState } from './stateManager';
import { asyncMessageHandler } from '../utils/chromePromise';

// This module is responsible for handling all incoming messages from other parts of
// the extension (primarily the popup UI). It acts as a central router, delegating
// tasks to the appropriate modules based on the message type.

/**
 * The core async function that handles incoming messages. Using an async function
 * allows us to use `await` for cleaner handling of asynchronous Chrome APIs.
 * @param message The message received from another part of the extension.
 * @param sender Information about the script that sent the message.
 * @returns A promise that resolves with the response to be sent back to the caller.
 */
const messageHandler = async (message: ChromeMessage, sender: chrome.runtime.MessageSender): Promise<any> => {
    // A switch statement neatly routes messages to the correct logic.
    switch (message.type) {
        // Handles the request from the popup to start a manual scan.
        case MessageType.MANUAL_SCAN_REQUEST: {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            const activeTab = tabs[0];
            if (activeTab?.id && activeTab.url) {
                // Delegate the actual scan logic to the scanManager.
                // This is a "fire-and-forget" operation from the message handler's perspective.
                executeScan(activeTab.id, activeTab.url);
            }
            return; // No response needs to be sent back to the caller.
        }

        // Handles the request from the popup to get the current status of the active tab.
        case MessageType.GET_STATUS: {
            let tabId = sender.tab?.id;
            let tabUrl = sender.tab?.url;
            
            // If the sender didn't provide a tab (e.g., if the message came from the options page),
            // we need to query for the active tab ourselves.
            if (!tabId) {
                const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                const activeTab = tabs[0];
                tabId = activeTab?.id;
                tabUrl = activeTab?.url;
            }

            if (tabId) {
                // Return the state from our in-memory cache if it exists, otherwise return a default initial state.
                return tabStates.get(tabId) || getInitialState(tabUrl);
            }
            // Fallback if no tab ID could be determined.
            return getInitialState("");
        }
        
        // Handles the request to open the extension's options page.
        case MessageType.OPEN_OPTIONS_PAGE:
            chrome.runtime.openOptionsPage();
            return; // No response needed.
    }
};


/**
 * Initializes the main message listener for the extension.
 */
export function initializeMessageHandler() {
    // We wrap our async `messageHandler` in the `asyncMessageHandler` utility.
    // This utility correctly handles the asynchronous nature of our handler and
    // ensures Chrome knows to wait for a response, preventing issues with the
    // message port closing prematurely.
    chrome.runtime.onMessage.addListener(asyncMessageHandler(messageHandler));
    console.log("Cookie Skipper AI: Message handler initialized.");
}