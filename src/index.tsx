
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// This is the main entry point for the popup's React application.

// Get the root HTML element where the React app will be attached.
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Create a React root and render the main App component into it.
// React.StrictMode is a wrapper that helps find potential problems in the app during development.
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// This empty export statement ensures the file is treated as a module.
export {};