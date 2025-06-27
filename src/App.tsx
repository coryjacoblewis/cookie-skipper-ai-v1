
import React from 'react';
import { ScanStatus, ErrorCode } from './types';
import { useExtensionStatus } from './hooks/useExtensionStatus';
import { CookieIcon, SparklesIcon, ErrorIcon, CheckCircleIcon, SearchIcon, IdleIcon, SettingsIcon } from './components/Icons';
import { UI_TEXT } from './constants';

/**
 * A small, self-contained component to display a sponsored link.
 * This is only shown for users on the free, ad-supported tier who have given consent.
 */
const AdComponent: React.FC = () => (
  <div className="mt-2 text-center text-xs text-gray-500 bg-gray-800 p-2 rounded-md">
    <a href="https://www.google.com/search?q=best+deals" target="_blank" rel="noopener sponsored" className="hover:text-gray-400 transition-colors">
      Sponsored: Find the best deals online!
    </a>
  </div>
);

/**
 * The main component for the extension's popup UI.
 * It uses the `useExtensionStatus` hook to manage all its state and communication
 * with the background script, keeping the component itself focused on presentation.
 */
const App: React.FC = () => {
  // All state logic is encapsulated in this custom hook.
  const { 
    status, 
    error, 
    lastUrl, 
    isScanning, 
    showAds, 
    handleManualScan, 
    openOptionsPage 
  } = useExtensionStatus();

  /**
   * A sub-component responsible for rendering the correct icon and text
   * based on the current scan status or error state.
   */
  const StatusDisplay: React.FC = () => {
    // If there's an error, display it with high priority.
    if (error) {
      // Determine if the error is something the user can fix in settings.
      const needsSettingsButton = error.code === ErrorCode.API_KEY_INVALID || error.code === ErrorCode.CONSENT_REQUIRED;
      
      // Provide user-friendly messages for specific, known error codes.
      let displayMessage = "An unexpected error occurred.";
      switch (error.code) {
        case ErrorCode.API_KEY_INVALID:
          displayMessage = "Your Gemini API Key is invalid or missing.";
          break;
        case ErrorCode.CONSENT_REQUIRED:
          displayMessage = "The free service requires your consent.";
          break;
        default:
          displayMessage = error.message;
          break;
      }
        
      return (
        <div className="flex flex-col items-center space-y-3 text-center">
            <ErrorIcon className="h-8 w-8 text-red-400" />
            <p className="text-sm">{displayMessage}</p>
            {/* Show a helpful button to guide the user to the options page if applicable. */}
            {needsSettingsButton && (
              <button onClick={openOptionsPage} className="text-sm bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded-md">
                  Open Settings
              </button>
            )}
        </div>
      );
    }
    
    // If no error, render the display for the current scan status.
    // All UI text is imported from constants.ts for easier management.
    switch (status) {
      case ScanStatus.SCANNING:
        return <div className="flex flex-col items-center space-y-2"><SearchIcon className="h-8 w-8 text-blue-400 animate-pulse" /><p>{UI_TEXT.SCANNING}</p></div>;
      case ScanStatus.ANALYZING:
        return <div className="flex flex-col items-center space-y-2"><SparklesIcon className="h-8 w-8 text-purple-400 animate-bounce" /><p>{UI_TEXT.ANALYZING}</p></div>;
      case ScanStatus.SUCCESS:
        return <div className="flex flex-col items-center space-y-2"><CheckCircleIcon className="h-8 w-8 text-green-400" /><p>{UI_TEXT.SUCCESS}</p></div>;
      case ScanStatus.NOT_FOUND:
        return <div className="flex flex-col items-center space-y-2"><IdleIcon className="h-8 w-8 text-gray-400" /><p>{UI_TEXT.NOT_FOUND}</p></div>;
      default: // IDLE
        return <div className="flex flex-col items-center space-y-2"><IdleIcon className="h-8 w-8 text-gray-500" /><p>{UI_TEXT.IDLE}</p></div>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100 p-4 font-sans">
      <header className="flex items-center justify-between pb-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
            <CookieIcon className="h-8 w-8 text-yellow-400" />
            <div>
              <h1 className="text-xl font-bold">Cookie Skipper AI</h1>
              <p className="text-xs text-gray-400">Powered by Gemini</p>
            </div>
        </div>
        <button onClick={openOptionsPage} title="Open Settings" className="p-2 rounded-full hover:bg-gray-700 transition-colors">
            <SettingsIcon className="h-6 w-6 text-gray-400"/>
        </button>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center text-center space-y-4">
        {/* The main status display area */}
        <div className="p-6 rounded-lg bg-gray-800 w-full min-h-[120px] flex items-center justify-center">
          <StatusDisplay />
        </div>
        
        {/* The primary action button */}
        <button
          onClick={handleManualScan}
          // Disable the button if a scan is in progress or if there's an error.
          disabled={isScanning || !!error}
          className={`w-full flex items-center justify-center space-x-2 px-4 py-3 font-semibold rounded-lg transition-colors duration-200
            ${(isScanning || !!error)
              ? 'bg-gray-600 cursor-not-allowed' // Disabled state style
              : 'bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-400' // Enabled state style
            }`}
        >
          <SearchIcon className="h-5 w-5"/>
          {/* Dynamically change button text based on scanning state. */}
          <span>{isScanning ? 'Scanning...' : 'Scan Page Manually'}</span>
        </button>
      </main>
      
      <footer className="text-center pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-500">Last scanned:</p>
          <p className="text-xs text-gray-400 truncate" title={lastUrl}>{lastUrl || 'N/A'}</p>
          {/* Conditionally render the ad component based on user settings. */}
          {showAds && <AdComponent />}
      </footer>
    </div>
  );
};

export default App;