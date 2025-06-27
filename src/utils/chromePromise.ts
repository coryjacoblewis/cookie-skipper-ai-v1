
import { ChromeMessage } from '../types';

// This utility file provides modern, Promise-based wrappers for some of Chrome's
// older, callback-based APIs. This is a crucial best practice that allows the rest
// of the codebase to use the clean and consistent `async/await` syntax instead of
// messy, nested callbacks (a.k.a. "callback hell").

/**
 * A promise-based wrapper for `chrome.runtime.sendMessage`.
 * @param message The message to send to the background script or other parts of the extension.
 * @returns A promise that resolves with the response from the message listener.
 *          The promise will reject if a runtime error occurs (e.g., the receiving end doesn't exist).
 */
export function sendMessage<TResponse = any>(message: ChromeMessage): Promise<TResponse> {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, (response: TResponse) => {
            // Chrome's callback APIs indicate errors by setting `chrome.runtime.lastError`.
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve(response);
            }
        });
    });
}

/**
 * A promise-based wrapper for `chrome.tabs.sendMessage`.
 * @param tabId The ID of the specific tab to send the message to.
 * @param message The message to send.
 * @returns A promise that resolves with the response from the content script in that tab.
 */
export function sendMessageToTab<TResponse = any>(tabId: number, message: ChromeMessage): Promise<TResponse> {
    return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, message, (response: TResponse) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve(response);
            }
        });
    });
}

// Defines the function signature for an async message handler.
type AsyncMessageHandler = (
    message: ChromeMessage, 
    sender: chrome.runtime.MessageSender
) => Promise<any>;

/**
 * A higher-order function that wraps an async message handler. This is a critical
 * utility for `chrome.runtime.onMessage.addListener`.
 * 
 * The Chrome messaging API requires that if a response is sent asynchronously, the
 * listener function must return `true`. This wrapper handles that boilerplate automatically,
 * as well as providing top-level error catching for the async handler.
 * 
 * @param handler The async handler function to wrap.
 * @returns A function that is compatible with `chrome.runtime.onMessage.addListener`.
 */
export function asyncMessageHandler(handler: AsyncMessageHandler) {
    return (message: ChromeMessage, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
        handler(message, sender)
            .then(sendResponse) // Send the resolved value of the promise as the response.
            .catch(error => {
                // Catch any uncaught errors from the handler to prevent the extension from crashing.
                console.error("Cookie Skipper AI: Uncaught error in message handler:", error);
                // Optionally, you could send an error response back to the caller here.
                // e.g., sendResponse({ error: { message: error.message } });
            });
        
        // This is the crucial part: returning `true` tells Chrome that we will be calling
        // `sendResponse` asynchronously, keeping the message channel open until our promise resolves.
        return true; 
    };
}