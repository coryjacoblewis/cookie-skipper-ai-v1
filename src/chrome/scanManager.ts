
import { ErrorCode, ScanStatus, AppError, ErrorPayload } from '../types';
import { findAcceptButtonSelector } from '../services/geminiService';
import * as AnalyticsService from '../services/analyticsService';
import { updateStatus } from './stateManager';

// This module contains the core logic for executing a scan on a webpage.
// It orchestrates getting the page's HTML, sending it to the AI for analysis,
// and then injecting a script to click the identified button.

/**
 * This function's body is injected into the target page to perform the click.
 * It is a critical piece of the architecture.
 *
 * IMPORTANT: This function must be completely self-contained. It cannot reference
 * any variables or functions from the surrounding `scanManager.ts` module scope,
 * as it will be serialized and executed in the isolated context of the webpage.
 *
 * @param selector The CSS selector of the element to click.
 * @returns An object indicating whether the click was successful and a reason for failure.
 */
function clickerFunction(selector: string): { success: boolean, reason: string } {
    /**
     * A helper function to determine if an element is truly clickable by a user.
     * This checks for common issues like being hidden, disabled, or covered by another element.
     */
    const isElementClickable = (element: HTMLElement): { clickable: boolean; reason: string } => {
        const style = window.getComputedStyle(element);
        if (style.display === 'none') return { clickable: false, reason: 'Element is not displayed' };
        if (style.visibility === 'hidden') return { clickable: false, reason: 'Element is not visible' };
        if (parseFloat(style.opacity) < 0.1) return { clickable: false, reason: 'Element is transparent' };
        if (element.offsetWidth === 0 || element.offsetHeight === 0) return { clickable: false, reason: 'Element has no size' };
        if ((element as HTMLButtonElement).disabled) return { clickable: false, reason: 'Element is disabled' };
        
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return { clickable: false, reason: 'Element has no dimensions' };
        
        // Check if the center of the element is obscured by another element.
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const topElement = document.elementFromPoint(centerX, centerY);

        if (!topElement) return { clickable: false, reason: 'Element is off-screen' };
        // The element is only considered clickable if it's the top-most element, or if the top-most
        // element is a child of the target element (e.g., clicking on a <span> inside a <button>).
        if (topElement !== element && !element.contains(topElement)) return { clickable: false, reason: `Element is covered by <${topElement.tagName.toLowerCase()}>` };

        return { clickable: true, reason: '' };
    };
    
    try {
        const element = document.querySelector(selector) as HTMLElement | null;
        if (element) {
            const { clickable, reason } = isElementClickable(element);
            if (clickable) {
                // If all checks pass, perform the click.
                element.click();
                return { success: true, reason: '' };
            } else {
                // If the element is not clickable, return the reason.
                return { success: false, reason };
            }
        } else {
            return { success: false, reason: "Element not found" };
        }
    } catch (error) {
        // Catch any unexpected errors during the query or click.
        return { success: false, reason: (error as Error).message };
    }
}

/**
 * The main function to orchestrate the entire scanning process for a given tab.
 * @param tabId The ID of the tab to scan.
 * @param tabUrl The URL of the tab, used for analytics.
 */
export async function executeScan(tabId: number, tabUrl: string) {
    let html: string | null = null;
    try {
        // Step 1: Get the full outer HTML of the page's body.
        // We use programmatic script injection to execute a simple function on the page.
        const injectionResults = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => document.body.outerHTML,
        });
        html = injectionResults?.[0]?.result as string;
        if (!html) throw new AppError("Failed to get page HTML.", ErrorCode.HTML_FETCH_FAILED);
        
        // Step 2: Analyze the HTML with the AI to find the button selector.
        await updateStatus(tabId, { status: ScanStatus.ANALYZING });
        const selector = await findAcceptButtonSelector(html);
        const bannerHtmlContext = html.substring(0, 30000); // Take a large snippet for analytics.

        if (selector) {
            // Step 3: If a selector was found, inject the clicker function to click the element.
            const clickResults = await chrome.scripting.executeScript({
                target: { tabId },
                func: clickerFunction,
                args: [selector], // Pass the found selector as an argument to the function.
            });
            const result = clickResults?.[0]?.result as { success: boolean; reason: string };

            // Step 3a: Handle the result of the click attempt.
            if (result && result.success) {
                await updateStatus(tabId, { status: ScanStatus.SUCCESS });
                await AnalyticsService.trackScanSuccess({ url: tabUrl, selector, banner_html_context: bannerHtmlContext });
            } else {
                // The click failed for a reason determined by the injected script.
                throw new AppError(result?.reason || "Click failed for an unknown reason.", ErrorCode.CLICK_FAILED);
            }
        } else {
            // Step 4: If the AI did not find a selector, update the status accordingly.
            await updateStatus(tabId, { status: ScanStatus.NOT_FOUND });
            await AnalyticsService.trackScanNotFound({ url: tabUrl, banner_html_context: bannerHtmlContext });
        }
    } catch (error) {
        // --- Centralized Error Handling ---
        // This block catches any error from the steps above (HTML fetch, AI analysis, click injection).
        console.error("Scan failed for tab", tabId, ":", error);
        let errorPayload: ErrorPayload;

        // Create a structured error payload based on whether it's a known AppError or an unknown error.
        if (error instanceof AppError) {
            errorPayload = { code: error.code, message: error.message };
        } else {
            errorPayload = { code: ErrorCode.GENERIC_ANALYSIS_ERROR, message: "An unknown error occurred during the scan." };
        }
        
        // Update the UI to show the error state.
        await updateStatus(tabId, { status: ScanStatus.ERROR, error: errorPayload });
        // Send an analytics event to track the failure.
        await AnalyticsService.trackScanError({ 
            url: tabUrl, 
            reason: errorPayload.message, 
            banner_html_context: html ? html.substring(0, 30000) : null 
        });
    }
}