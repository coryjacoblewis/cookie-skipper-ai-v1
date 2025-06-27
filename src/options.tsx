
import React from 'react';
import ReactDOM from 'react-dom/client';
import { CookieIcon } from './components/Icons';
import { OperatingMode } from './types';
import { ProTierPanel } from './components/options/ProTierPanel';
import { FreeTierPanel } from './components/options/FreeTierPanel';
import { ByokTierPanel } from './components/options/ByokTierPanel';
import { OptionsProvider, useOptions } from './context/OptionsContext';

// This file is the entry point for the extension's options page.

/**
 * The main content component for the options page.
 * It consumes the shared state and functions from the OptionsContext
 * to render the UI and handle user interactions.
 */
const OptionsContent: React.FC = () => {
    // useOptions hook provides all necessary state and handlers from the context.
    const { settings, statusMessage, handleModeChange } = useOptions();

    // Show a loading state until the settings have been fetched from storage.
    if (!settings) {
        return (
          <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <p className="text-gray-400">Loading settings...</p>
          </div>
        );
    }

    /**
     * A helper function to render a tier panel. It handles the styling for
     * selected vs. unselected states.
     */
    const renderTier = (mode: OperatingMode, title: string, description: string, children: React.ReactNode) => {
        if (!settings) return null;
        const isPro = settings.mode === OperatingMode.PRO;
        const isSelected = settings.mode === mode;
        
        return (
            <div className={`p-6 rounded-lg border-2 transition-all duration-300 ${isSelected ? 'border-blue-500 bg-blue-900/30' : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'}`}>
                {/* The radio button for selecting the mode. */}
                <label className={`flex items-center ${isPro || mode === OperatingMode.PRO ? 'cursor-default' : 'cursor-pointer'}`} onClick={() => handleModeChange(mode)}>
                    <input 
                        type="radio" 
                        name="mode" 
                        value={mode} 
                        checked={isSelected} 
                        onChange={() => handleModeChange(mode)} 
                        // The mode cannot be changed if the user is a Pro subscriber.
                        disabled={isPro}
                        className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <span className="ml-3 block text-lg font-medium text-gray-100">{title}</span>
                </label>
                <p className="ml-7 mt-1 text-sm text-gray-400">{description}</p>
                
                {/* The specific controls for this tier (e.g., API key input, consent toggle) */}
                {/* These are only fully interactive when the tier is selected. */}
                <div className={`ml-7 mt-4 transition-opacity duration-300 ${isSelected ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    {children}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center font-sans p-4">
          <div className="w-full max-w-4xl mx-auto p-8 rounded-lg bg-gray-800 shadow-2xl">
            <header className="flex items-center space-x-3 pb-6 border-b border-gray-700">
              <CookieIcon className="h-10 w-10 text-yellow-400" />
              <div>
                <h1 className="text-2xl font-bold">Cookie Skipper AI Settings</h1>
                <p className="text-sm text-gray-400">Manage your preferences and subscription</p>
              </div>
            </header>
            
            <main className="mt-6">
                <h2 className="text-xl font-semibold text-gray-200 mb-4">Choose Your Service Tier</h2>
                <div className="space-y-4">
                  
                  {/* Each tier is rendered using the helper function with its specific child component. */}
                  {renderTier(OperatingMode.PRO, "Pro User ✨", "The best experience. No ads, no data collection, no hassle.", 
                    <ProTierPanel isProUser={settings.mode === OperatingMode.PRO} />
                  )}
    
                  {renderTier(OperatingMode.FREE_AD_SUPPORTED, "Free Service", "Supported by ads and anonymized data collection.", 
                    <FreeTierPanel 
                      consent={settings.consent} 
                      isDisabled={settings.mode !== OperatingMode.FREE_AD_SUPPORTED} 
                    />
                  )}
    
                  {renderTier(OperatingMode.BYOK, "Bring Your Own Key", "For technical users. No ads or data collection.",
                    <ByokTierPanel 
                      initialApiKey={settings.userKey || ''}
                      isDisabled={settings.mode !== OperatingMode.BYOK}
                    />
                  )}
    
                </div>
                {/* A small area to display temporary status messages (e.g., "API Key Saved!"). */}
                <div className="h-5 mt-6 text-center text-sm text-green-400 font-medium">{statusMessage}</div>
            </main>
          </div>
        </div>
      );
}

/**
 * The root component for the options page.
 * It wraps the main content in the OptionsProvider to provide shared state.
 */
const OptionsPage: React.FC = () => (
    <OptionsProvider>
        <OptionsContent />
    </OptionsProvider>
);

// Boilerplate to render the React application into the DOM.
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <OptionsPage />
    </React.StrictMode>
  );
}