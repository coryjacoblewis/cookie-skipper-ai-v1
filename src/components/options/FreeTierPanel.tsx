
import React from 'react';
import { useOptions } from '../../context/OptionsContext';

interface FreeTierPanelProps {
  // The current consent status from settings.
  consent: boolean;
  // Whether this panel's controls should be disabled (i.e., if another tier is active).
  isDisabled: boolean;
}

/**
 * A UI component for the "Free, Ad-Supported" tier on the options page.
 * Its primary responsibility is to manage the user's consent for data collection and ads.
 */
export const FreeTierPanel: React.FC<FreeTierPanelProps> = ({ consent, isDisabled }) => {
  // Get the consent change handler from the shared options context.
  const { handleConsentChange } = useOptions();
  
  return (
    <>
      <div className="bg-gray-700/50 p-4 rounded-lg flex items-center justify-between">
        <div>
          <span className="font-medium text-gray-200">I consent to Data Collection & Ads</span>
          {/* Provides a link to the privacy policy for transparency. */}
          <p className="text-xs text-gray-400">Required for the free tier. <a href={chrome.runtime.getURL('privacy.html')} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Privacy Policy</a>.</p>
        </div>
        {/* A standard toggle switch for the consent option. */}
        <label htmlFor="consent-toggle" className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              id="consent-toggle" 
              className="sr-only peer" 
              checked={consent} 
              onChange={(e) => handleConsentChange(e.target.checked)} 
              disabled={isDisabled}
            />
            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-800 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
      {/* Show a warning message if the free tier is selected but consent is not given. */}
      {!isDisabled && !consent && <p className="text-xs text-yellow-400 text-center mt-3">The free service will be disabled until consent is given.</p>}
    </>
  );
};
