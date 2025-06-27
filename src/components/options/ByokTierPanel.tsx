
import React, { useState } from 'react';
import { CheckCircleIcon, ErrorIcon, SparklesIcon } from '../Icons';
import { useOptions } from '../../context/OptionsContext';

// Enum for the local state of the API key test.
type TestStatus = 'idle' | 'testing' | 'success' | 'error';

interface ByokTierPanelProps {
  initialApiKey: string;
  isDisabled: boolean;
}

/**
 * A UI component for the "Bring Your Own Key" (BYOK) tier on the options page.
 * It manages the input, testing, and saving of a user-provided Gemini API key.
 */
export const ByokTierPanel: React.FC<ByokTierPanelProps> = ({ initialApiKey, isDisabled }) => {
  // Get handlers from the shared options context.
  const { handleSaveKey, handleTestKey } = useOptions();
  
  // --- Local State ---
  // This state is managed locally within the component as it's specific to this panel's UI.
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testMessage, setTestMessage] = useState('');

  /**
   * Handles the "Test Key" button click. It calls the test function from the context
   * and updates the local UI state to show the result.
   */
  const onTest = async () => {
    setTestStatus('testing');
    setTestMessage('');
    const result = await handleTestKey(apiKey);
    setTestStatus(result.success ? 'success' : 'error');
    setTestMessage(result.message);
  };
  
  /**
   * Handles the "Save" button click.
   */
  const onSave = () => {
      handleSaveKey(apiKey);
      // Reset the test status after saving.
      setTestStatus('idle');
      setTestMessage('');
  };

  /**
   * A small helper component to render the correct icon based on the test status.
   */
  const TestStatusIcon: React.FC = () => {
    switch (testStatus) {
      case 'testing': return <SparklesIcon className="h-4 w-4 text-blue-400 animate-spin" />;
      case 'success': return <CheckCircleIcon className="h-4 w-4 text-green-400" />;
      case 'error': return <ErrorIcon className="h-4 w-4 text-red-400" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300">Google Gemini API Key</label>
        <p className="text-xs text-gray-500 mb-2">Get a key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google AI Studio</a>.</p>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <input 
            type="password" 
            id="apiKey" 
            value={apiKey} 
            onChange={(e) => {
                setApiKey(e.target.value);
                // Reset test status whenever the user types, as the current result is no longer valid.
                setTestStatus('idle'); 
            }} 
            disabled={isDisabled} 
            className="flex-grow px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" 
            placeholder="Enter your API key" 
          />
          <div className="flex space-x-2">
            <button 
              onClick={onTest} 
              disabled={isDisabled || !apiKey || testStatus === 'testing'} 
              className="flex-grow flex items-center justify-center space-x-1.5 py-2 px-4 rounded-md text-sm font-medium text-white bg-gray-600 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TestStatusIcon />
              <span>{testStatus === 'testing' ? 'Testing...' : 'Test Key'}</span>
            </button>
            <button 
              onClick={onSave} 
              disabled={isDisabled || !apiKey} 
              className="flex-grow py-2 px-4 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </div>
      </div>
      {/* Display the success or error message from the key test. */}
      {testMessage && (
        <p className={`text-xs text-center sm:text-left h-4 ${testStatus === 'success' ? 'text-green-400' : 'text-red-400'}`}>
          {testMessage}
        </p>
      )}
    </div>
  );
};