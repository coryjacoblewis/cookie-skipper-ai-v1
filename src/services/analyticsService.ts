
import * as settingsService from './settingsService';
import { OperatingMode } from '../types';
import { API_URLS } from '../constants';

// This service is responsible for sending anonymized analytics data to a remote
// server for data licensing purposes. It acts as a single point of contact for all
// analytics events, ensuring consistency and proper consent checking.

// --- Payload Interfaces ---
// These define the structure of the data sent for different analytics events.

interface BasePayload {
    url: string;
    banner_html_context: string | null; // A snippet of the HTML analyzed.
}

interface SuccessPayload extends BasePayload {
    selector: string | null; // The CSS selector found by the AI.
}

interface ErrorPayload extends BasePayload {
    reason: string; // The reason for the failure.
}

/**
 * A private helper function that sends an analytics event to the server.
 * Crucially, it first checks the user's settings to ensure that data should be sent.
 * @param event The name of the event (e.g., 'scan_result').
 * @param payload The data associated with the event.
 */
async function sendEvent(event: string, payload: object) {
    const { mode, consent } = await settingsService.getSettings();
    // --- Consent Check ---
    // This is the core privacy safeguard. Data is ONLY sent if the user is on the
    // free tier AND has explicitly consented to data collection.
    if (mode !== OperatingMode.FREE_AD_SUPPORTED || !consent) {
        return; 
    }
    
    try {
        // Use `fetch` to send the data as a POST request.
        await fetch(API_URLS.ANALYTICS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // The final payload includes the event name, the specific payload data, and a timestamp.
            body: JSON.stringify({ 
                event, 
                ...payload, 
                timestamp: new Date().toISOString() 
            }),
        });
    } catch (error) {
        // Log errors to the console but don't let them interrupt the user's experience.
        console.error(`Cookie Skipper AI: Error sending analytics event '${event}':`, error);
    }
}

// --- Public API ---
// These functions provide a clean, readable API for other parts of the app to track specific events.

/**
 * Tracks a successful scan where a selector was found.
 */
export async function trackScanSuccess(payload: SuccessPayload): Promise<void> {
    await sendEvent('scan_result', { ...payload, status: 'success' });
}

/**
 * Tracks a scan where the AI did not find a cookie banner.
 */
export async function trackScanNotFound(payload: BasePayload): Promise<void> {
    await sendEvent('scan_result', { ...payload, status: 'not_found' });
}

/**
 * Tracks a scan that resulted in an error.
 */
export async function trackScanError(payload: ErrorPayload): Promise<void> {
    await sendEvent('scan_result', { ...payload, status: 'error' });
}