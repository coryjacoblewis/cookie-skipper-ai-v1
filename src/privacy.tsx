
import React from 'react';
import ReactDOM from 'react-dom/client';
import { CookieIcon } from './components/Icons';

/**
 * A React component that renders the extension's privacy policy.
 * This is crucial for user trust and for compliance with the Chrome Web Store policies,
 * especially given the app's monetization strategy.
 */
const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-300 flex justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-3xl mx-auto space-y-8">
        <header className="flex items-center space-x-3">
          <CookieIcon className="h-12 w-12 text-yellow-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
            <p className="text-md text-gray-400">For Cookie Skipper AI</p>
          </div>
        </header>

        {/* Using Tailwind's typography plugin (`prose`) for nice default styling of text content. */}
        <div className="prose prose-invert prose-lg max-w-none bg-gray-800 p-8 rounded-lg shadow-lg">
          <p>
            Welcome to Cookie Skipper AI. We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and share information, particularly in relation to our monetization strategy which includes advertising and data licensing.
          </p>

          <h2 className="text-white">1. User Consent</h2>
          <p>
            Our monetization model is based on user consent. We will <strong>not</strong> collect any data or show any ads unless you explicitly opt-in through the settings on our Options page. You have full control and can withdraw your consent at any time.
          </p>

          <h2 className="text-white">2. Information We Collect (Only with Consent)</h2>
          <p>
            When you provide consent, we collect a limited set of <strong>anonymized, non-personal data</strong>. This includes:
          </p>
          <ul>
            <li>
              <strong>Website URL:</strong> The URL of the page where a potential cookie banner was detected.
            </li>
            <li>
              <strong>Banner Information:</strong> The HTML snippet of the detected banner element. This helps us analyze different types of banners.
            </li>
            <li>
              <strong>Analysis Result:</strong> The CSS selector our AI identified (or if it failed to find one) and whether the automated click was successful.
            </li>
          </ul>
          <p className="font-semibold text-yellow-400 border-l-4 border-yellow-400 pl-4">
            We do NOT collect any personal identifiers, browsing history, form data, cookies from other websites, or any other information that could be used to personally identify you. The data is fully anonymized before being sent from your device.
          </p>

          <h2 className="text-white">3. How We Use Information</h2>
          <p>
            The anonymized data we collect is used for two primary purposes:
          </p>
          <ul>
            <li>
              <strong>Advertising:</strong> If you opt-in, we may display unobtrusive advertisements within the extension's popup window. This provides a revenue stream to support ongoing development.
            </li>
            <li>
              <strong>Data Licensing:</strong> The aggregated, anonymized data about cookie banners (e.g., "what percentage of banners on .co.uk sites use a specific HTML structure") is a valuable resource for web standards researchers and companies. We may license this non-personal, statistical data to third parties. This is a key part of our monetization strategy and allows us to keep the extension's core features free.
            </li>
          </ul>
          
          <h2 className="text-white">4. Data Storage and Security</h2>
          <p>
            Your Gemini API key is stored locally and securely on your device using `chrome.storage.sync` and is never transmitted to us or any third party. The anonymized data we collect is transmitted securely over HTTPS to our servers.
          </p>

          <h2 className="text-white">5. Your Choices and Controls</h2>
          <p>
            You are in control. You can enable or disable data collection and ads at any time from the extension's Options page. You can also review this privacy policy whenever you wish.
          </p>

          <h2 className="text-white">6. Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of any significant changes.
          </p>
          
          <p className="mt-8 text-sm text-gray-500">
            Last Updated: [Date of Last Update]
          </p>
        </div>
      </div>
    </div>
  );
};

// Boilerplate to render the React application into the DOM.
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <PrivacyPolicy />
    </React.StrictMode>
  );
}

// Ensures the file is treated as a module.
export {};