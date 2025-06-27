
import React from 'react';
import { SparklesIcon } from '../Icons';
import { useOptions } from '../../context/OptionsContext';

interface ProTierPanelProps {
  // Prop to determine if the user is already a Pro subscriber.
  isProUser: boolean;
}

/**
 * A UI component for the "Pro User" tier on the options page.
 * It either displays an active subscription message or an "Upgrade" button.
 */
export const ProTierPanel: React.FC<ProTierPanelProps> = ({ isProUser }) => {
  // Get the upgrade handler from the shared options context.
  const { handleUpgradeToPro } = useOptions();
  
  // If the user is already a Pro, show a confirmation message.
  if (isProUser) {
    return <div className="text-green-400 font-semibold">Your Pro subscription is active.</div>;
  }

  // Otherwise, show the upgrade button which triggers the payment flow.
  return (
    <button onClick={handleUpgradeToPro} className="flex items-center justify-center space-x-2 w-full sm:w-auto px-6 py-2 font-semibold rounded-lg transition-colors duration-200 bg-yellow-500 text-gray-900 hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-yellow-400">
      <SparklesIcon className="h-5 w-5"/>
      <span>Upgrade to Pro</span>
    </button>
  );
};
