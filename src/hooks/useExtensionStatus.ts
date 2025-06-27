
import { useState, useEffect, useCallback, useRef } from 'react';
import { ChromeMessage, MessageType, OperatingMode, ScanStatus, ErrorPayload, ErrorCode } from '../types';
import * as settingsService from '../services/settingsService';
import { STORAGE_KEYS } from '../constants';
import { sendMessage } from '../utils/chromePromise';

/**
 * A custom React hook that encapsulates all the logic for managing the popup's state
 * and its communication with the background service worker. This keeps the main `App.tsx`
 * component clean and focused on rendering the UI.
 *
 * @returns An object containing the current state and handler functions.
 */
export const useExtensionStatus = () => {
  // --- State Variables ---
  const [status, setStatus] = useState<ScanStatus>(ScanStatus.IDLE);
  const [lastUrl, setLastUrl] = useState<string>('');
  const [error, setError] = useState<ErrorPayload | null>(null);
  const [showAds, setShowAds] = useState(false);
  const successTimerRef = useRef<number | null>(null); // Timer to reset status from SUCCESS to IDLE.

  /**
   * A memoized callback to handle incoming messages from the background script.
   * Using `useCallback` prevents this function from being recreated on every render.
   */
  const handleMessage = useCallback((message: ChromeMessage) => {
    if (message.type === MessageType.STATUS_UPDATE) {
      const payload = message.payload;
      
      // Clear any existing success-to-idle timer.
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
        successTimerRef.current = null;
      }

      // Update the UI state based on the payload from the background.
      setStatus(payload.status);
      setError(payload.error || null);
      if (payload.url) {
        setLastUrl(payload.url);
      }

      // If the scan was successful, set a timer to automatically return to the IDLE state after a few seconds.
      if (payload.status === ScanStatus.SUCCESS) {
        successTimerRef.current = window.setTimeout(() => {
          setStatus(ScanStatus.IDLE);
          successTimerRef.current = null;
        }, 3000);
      }
    }
  }, []);
  
  /**
   * Handler to open the extension's options page.
   */
  const openOptionsPage = () => {
    if (typeof chrome !== "undefined" && chrome.runtime?.id) {
      chrome.runtime.openOptionsPage();
    }
  };

  /**
   * Handler for the "Scan Page Manually" button click.
   */
  const handleManualScan = async () => {
    const isScanInProgress = status === ScanStatus.SCANNING || status === ScanStatus.ANALYZING;
    if (isScanInProgress) return; // Prevent multiple scans at once.
    
    // Check if we are in a valid extension context.
    if (typeof chrome !== "undefined" && chrome.runtime?.id) {
        // Immediately update UI to give feedback.
        setStatus(ScanStatus.SCANNING);
        setError(null);
        try {
          // Send a message to the background script to start the scan.
          await sendMessage({ type: MessageType.MANUAL_SCAN_REQUEST });
        } catch (e) {
          console.error("Failed to send manual scan request", e);
          setError({ code: ErrorCode.COMMUNICATION_ERROR, message: "Could not communicate with background script." });
          setStatus(ScanStatus.ERROR);
        }
    } else {
        // Handle cases where the UI is run outside the extension (e.g., in a web browser for development).
        console.warn("Cannot scan: not in an extension context.");
        setError({ code: ErrorCode.GENERIC_ANALYSIS_ERROR, message: "Scan is only available within the Chrome extension." });
        setStatus(ScanStatus.ERROR);
    }
  };

  /**
   * The main `useEffect` hook for initialization and cleanup.
   * This runs once when the component mounts.
   */
  useEffect(() => {
    const isExtensionContext = typeof chrome !== "undefined" && chrome.runtime?.id;
    let listenerMounted = true; // Flag to prevent state updates after the component has unmounted.

    const messageListener = (message: any) => {
      // Only handle the message if the component is still mounted.
      if (listenerMounted) handleMessage(message as ChromeMessage);
    };

    if (isExtensionContext) {
      // --- State Synchronization on Popup Open ---
      // This is a crucial piece of logic to ensure the popup displays the correct state immediately.
      chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
        if (!tabs[0]?.id || !listenerMounted) return;
        const tabId = tabs[0].id;
        const sessionStateKey = `${STORAGE_KEYS.TAB_STATUS_PREFIX}${tabId}`;
        
        // 1. First, try to get the state synchronously from `chrome.storage.session`.
        // This avoids a "flash" of idle content if the state is already available.
        chrome.storage.session.get(sessionStateKey, (result) => {
          if (!listenerMounted || chrome.runtime.lastError) return;
          
          if (result && result[sessionStateKey]) {
            // If state was found in the session, use it.
            handleMessage({ type: MessageType.STATUS_UPDATE, payload: result[sessionStateKey] });
          } else {
            // 2. If no state was in the session, ask the background script for it.
            sendMessage({ type: MessageType.GET_STATUS }).then(response => {
              if (response && listenerMounted) handleMessage({ type: MessageType.STATUS_UPDATE, payload: response });
            }).catch(e => console.warn("Failed to get status:", e));
          }
        });
      });

      // Listen for any subsequent status updates from the background script.
      chrome.runtime.onMessage.addListener(messageListener);

      // Check user settings to determine if ads should be shown.
      settingsService.getSettings().then(settings => {
        if(listenerMounted) {
          setShowAds(settings.mode === OperatingMode.FREE_AD_SUPPORTED && settings.consent);
        }
      });

    } else {
      // If not in an extension context, default to IDLE.
      setStatus(ScanStatus.IDLE);
    }

    // --- Cleanup Function ---
    // This runs when the component unmounts (e.g., when the popup closes).
    return () => {
      listenerMounted = false;
      if (isExtensionContext) {
        try { 
          // Important: remove the message listener to prevent memory leaks.
          chrome.runtime.onMessage.removeListener(messageListener); 
        } 
        catch (e) { console.warn("Could not remove message listener", e); }
      }
      // Clear any pending timers to prevent state updates on an unmounted component.
      if(successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, [handleMessage]); // `handleMessage` is a stable dependency due to useCallback.

  return { 
    status, 
    error, 
    lastUrl, 
    // This is a derived state value. It simplifies logic in the UI component.
    isScanning: status === ScanStatus.SCANNING || status === ScanStatus.ANALYZING, 
    showAds, 
    handleManualScan, 
    openOptionsPage 
  };
};