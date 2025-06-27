
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { OperatingMode } from '../types';
import * as settingsService from '../services/settingsService';
import { testApiKey } from '../services/geminiService';
import { PAYMENT } from '../constants';

// This file defines a React Context for managing the state of the options page.
// Using a context is a best practice for sharing state and functions across a tree of
// components without having to pass props down manually at every level (a problem
// known as "prop drilling").

/**
 * Defines the shape of the data and functions that the context will provide
 * to its consumer components.
 */
interface OptionsContextType {
  settings: settingsService.UserSettings | null; // The current user settings.
  statusMessage: string; // A temporary message for user feedback (e.g., "Settings saved!").
  
  // Handlers for user actions.
  handleUpgradeToPro: () => void;
  handleModeChange: (newMode: OperatingMode) => void;
  handleSaveKey: (apiKey: string) => Promise<void>;
  handleTestKey: (apiKey: string) => Promise<{ success: boolean; message: string }>;
  handleConsentChange: (isEnabled: boolean) => Promise<void>;
}

// Create the React Context. It's initialized to null.
const OptionsContext = createContext<OptionsContextType | null>(null);

/**
 * The Provider component is responsible for creating and managing the state
 * and then providing it to all of its children via the Context.
 */
export const OptionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<settingsService.UserSettings | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  // When the provider mounts, fetch the initial settings from storage.
  useEffect(() => {
    settingsService.getSettings().then(setSettings);
  }, []);

  /**
   * A helper function to show a status message for a few seconds.
   * `useCallback` is used to memoize the function so it doesn't get recreated on every render.
   */
  const showStatus = useCallback((message: string) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(''), 3000);
  }, []);
  
  /**
   * Handles the "Upgrade to Pro" action.
   * This function interacts with the `chrome.payments` API for in-app purchases.
   */
  const handleUpgradeToPro = useCallback(() => {
    // Check if the payments API is available.
    if (typeof chrome !== "undefined" && chrome.payments) {
      chrome.payments.buy({
        sku: PAYMENT.PRO_SKU, // The product ID from the Chrome Web Store developer dashboard.
        success: async () => {
          // On successful payment, update the operating mode to PRO and refresh settings.
          await settingsService.saveOperatingMode(OperatingMode.PRO);
          setSettings(await settingsService.getSettings());
          showStatus("Upgrade successful! You are now a Pro user.");
        },
        failure: (error) => {
          // Handle payment failure.
          console.error("Purchase failed:", error);
          showStatus(`Upgrade failed: ${error.response?.error_message || 'Please try again.'}`);
        },
      });
    } else {
        // If the API isn't available (e.g., during local development), simulate a successful upgrade.
        console.warn("chrome.payments API not found. Simulating successful upgrade.");
        settingsService.saveOperatingMode(OperatingMode.PRO).then(() => {
          settingsService.getSettings().then(setSettings);
          showStatus("Upgrade successful! (Simulated)");
        });
    }
  }, [showStatus]);

  /**
   * Handles changing the operating mode via the radio buttons.
   */
  const handleModeChange = useCallback(async (newMode: OperatingMode) => {
    // Prevent changing away from PRO mode once subscribed.
    if (newMode === OperatingMode.PRO || settings?.mode === OperatingMode.PRO) return;
    await settingsService.saveOperatingMode(newMode);
    setSettings(await settingsService.getSettings()); // Refresh state
    showStatus(`Switched to ${newMode === OperatingMode.BYOK ? 'your own API key' : 'free'} mode.`);
  }, [settings, showStatus]);

  /**
   * Handles saving the user's personal API key.
   */
  const handleSaveKey = useCallback(async (apiKey: string) => {
    if (!apiKey) {
      showStatus('API Key cannot be empty.');
      return;
    }
    await settingsService.saveUserApiKey(apiKey);
    setSettings(await settingsService.getSettings()); // Refresh state
    showStatus('API Key saved successfully!');
  }, [showStatus]);
  
  /**
   * Handles testing the user's API key. This function doesn't modify state itself,
   * but returns a result object for the UI to display.
   */
  const handleTestKey = useCallback(async (apiKey: string) => {
    try {
      await testApiKey(apiKey);
      return { success: true, message: 'Success! This API key is valid.' };
    } catch (error: any) {
      return { success: false, message: error.message || 'An unknown error occurred.' };
    }
  }, []);

  /**
   * Handles changing the user's consent for data collection.
   */
  const handleConsentChange = useCallback(async (isEnabled: boolean) => {
    await settingsService.saveConsent(isEnabled);
    setSettings(await settingsService.getSettings()); // Refresh state
    showStatus(`Data collection preferences updated.`);
  }, [showStatus]);

  // The value object contains all the state and functions to be provided to consumers.
  const value = {
    settings,
    statusMessage,
    handleUpgradeToPro,
    handleModeChange,
    handleSaveKey,
    handleTestKey,
    handleConsentChange
  };

  return (
    <OptionsContext.Provider value={value}>
      {children}
    </OptionsContext.Provider>
  );
};

/**
 * A custom hook that provides a convenient way for components to access the
 * context's value. It also includes an error check to ensure it's used correctly.
 */
export const useOptions = (): OptionsContextType => {
  const context = useContext(OptionsContext);
  if (!context) {
    throw new Error('useOptions must be used within an OptionsProvider');
  }
  return context;
};