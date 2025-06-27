
# Cookie Skipper AI

An intelligent Chrome extension that uses the Gemini AI to automatically find and click cookie consent banners, decluttering your web browsing experience.

## Overview

Cookie Skipper AI is designed to enhance the user's browsing experience by intelligently handling annoying cookie consent popups. Instead of relying on manually curated rule lists, it leverages the power of Google's Gemini large language model to analyze a webpage's structure in real-time, identify the "accept" button, and click it on the user's behalf.

The extension is built with a flexible, multi-tiered business model to cater to a wide range of users, from casual browsers to technical professionals.

## Key Features

- **AI-Powered Detection:** Uses the Gemini AI to understand the context and structure of a webpage to find the correct cookie banner button.
- **Manual Scanning:** The user is in full control and initiates a scan with a single click on the extension's icon.
- **Privacy-Focused Tiers:** Offers "Bring Your Own Key" and "Pro" tiers that do not collect any user data or show ads.
- **Transparent Free Service:** The free tier is supported by unobtrusive ads and anonymized data collection, but only with explicit user consent.
- **User-Friendly Interface:** A clean, simple popup UI provides clear status updates on the scanning process.

## Development & Demo Setup

This project requires a build step to compile the TypeScript/React code into JavaScript that the browser can understand.

### Prerequisites

-   Node.js and npm (or yarn) installed.
-   A build tool like Vite or Webpack configured. The following steps assume a basic `package.json` setup with a `build` script.

### 1. Build the Extension

First, clone the repository and install the necessary dependencies.

```bash
# Clone the repository
git clone <repository-url>
cd <repository-directory>

# Install dependencies
npm install
```

Next, build the project. This will compile all the files from the `src` directory and place the output into a `dist` directory, which is what you will load into Chrome.

```bash
# Build for production
npm run build
```

### 2. Load the Extension in Chrome

1.  Open Google Chrome and navigate to `chrome://extensions`.
2.  Enable **"Developer mode"** using the toggle switch in the top-right corner.
3.  Click the **"Load unpacked"** button that appears.
4.  Navigate to and select the `dist` folder that was created by the build process.
5.  The "Cookie Skipper AI" extension should now appear in your list of extensions.

### 3. Environment Configuration (for Local Development)

To test the "Free" and "Pro" tiers locally, you need to provide a "central" API key without deploying a live configuration server. This is done using an environment variable file.

1.  Create a file named `.env` in the root of the project directory.
2.  Add the following line to the `.env` file, replacing the placeholder with your personal Gemini API key:

    ```
    VITE_CENTRAL_API_KEY="your-personal-gemini-api-key-goes-here"
    ```

When you run your development server (e.g., `npm run dev`), the `configService` will automatically detect this variable and use it, allowing you to fully test all three tiers.

### 4. Debugging Tips

Debugging Chrome extensions involves inspecting several different components.

-   **Service Worker (Background Script):** Go to `chrome://extensions`, find "Cookie Skipper AI", and click the "Service Worker" link. This will open a dedicated DevTools window where you can view console logs and inspect network requests from the background script.
-   **Popup UI:** Right-click the extension's icon in the Chrome toolbar and select "Inspect popup". This will open DevTools for the popup's React application.
-   **Options & Privacy Pages:** Since these are full HTML pages opened in a tab, you can simply use the standard DevTools (Right-click -> Inspect, or F12).
-   **Injected Content Scripts:** After you initiate a scan, the `content-clicker.ts` script is injected into the page. You can view its source and debug it from the DevTools of the *webpage itself* under the "Sources" tab > "Content scripts" pane.

---

## File Structure Overview

```
/
├── dist/                   # The compiled output directory (loaded into Chrome)
├── public/                 # Static assets that are copied directly to the output
│   ├── icons/              # Extension icons (16x16, 48x48, 128x128)
│   ├── index.html          # HTML shell for the main popup
│   ├── options.html        # HTML shell for the options page
│   ├── privacy.html        # HTML shell for the privacy policy page
│   └── manifest.json       # The core configuration file for the extension
└── src/
    ├── components/         # Reusable React UI components
    │   └── options/        # Components specific to the options page
    ├── chrome/             # Modules specific to Chrome API interaction (background logic)
    │   ├── background.ts   # Main entry point for the service worker
    │   ├── scanManager.ts  # Orchestrates the page scanning and clicking logic
    │   ├── stateManager.ts # Manages the state for each tab
    │   └── messageHandler.ts# Routes messages between UI and background
    ├── context/            # React Context providers for state management
    ├── hooks/              # Custom React hooks for encapsulating complex logic
    ├── services/           # Business logic modules (API interaction, settings)
    │   ├── geminiService.ts# Handles all interaction with the Gemini API
    │   ├── settingsService.ts# Manages user settings in chrome.storage
    │   └── ...
    ├── utils/              # Helper functions and utilities
    ├── App.tsx             # The root React component for the popup
    ├── options.tsx         # The root React component for the options page
    ├── prompts.ts          # Centralized store for all AI prompts
    └── types.ts            # All TypeScript types, enums, and interfaces
```

## Technical Design & Architecture

The extension is built using modern web technologies and follows best practices for creating a robust, maintainable, and secure Chrome extension.

### Core Technologies
- **Manifest V3:** The latest extension manifest version, ensuring better security, performance, and a non-persistent background service worker.
- **React & TypeScript:** The popup and options pages are built as modern React applications using TypeScript for strong type safety and improved developer experience.
- **Tailwind CSS:** Used for rapid and consistent UI styling.

### Architectural Highlights

1.  **Modular Background Services:** The background logic is not monolithic. It's broken down into distinct, single-responsibility modules for clarity and maintainability.
2.  **Advanced State Management:** A combination of an in-memory `Map` (for speed) and `chrome.storage.session` (for persistence) is used to track tab status, preventing UI "flashes". The UI uses custom hooks and the React Context API for clean state management.
3.  **Secure & Performant Gemini API Integration:** A dedicated service handles all Gemini API communication, featuring client caching, centralized prompts, and obfuscation for user-provided API keys.
4.  **Flexible & Remote Configuration:** The central API key is fetched from a remote server, allowing for key rotation without updating the extension. A local `.env` file is used for development overrides.
5.  **Robust Error Handling:** A custom `AppError` base class and `ErrorCode` enum ensure consistent, structured, and type-safe error handling.
6.  **Scalable Script Injection:** A robust file-based injection strategy is used, allowing content scripts to be treated as first-class modules.

## Monetization Strategy

The business model is a flexible "Freemium" strategy designed to cater to different user segments.

### Tier 1: Free, Ad-Supported

-   **Target User:** The casual, non-technical user.
-   **Revenue Model:** Unobtrusive ads and licensing of anonymized data about cookie banners.
-   **Core Requirement:** Strictly conditional on explicit user consent.

### Tier 2: Bring Your Own Key (BYOK)

-   **Target User:** The technical or privacy-conscious user.
-   **Value Proposition:** Full functionality with no ads or data collection. User bears all API costs.
-   **Revenue Model:** None (cost-free user acquisition).

### Tier 3: Paid Pro Subscription

-   **Target User:** Users who value convenience and privacy.
-   **Value Proposition:** Seamless experience with no API key management, and no ads or data collection.
-   **Revenue Model:** Recurring subscription via the Chrome Web Store. This is the primary target for predictable revenue.

## Roadmap / Future Enhancements

-   **Backend Implementation:** Build out the production servers for the `configService` and `analyticsService`.
-   **Payment Integration:** Fully implement the `chrome.payments` API for the Pro tier subscription.
-   **Advanced AI Features:**
    -   Add a user preference to find and click "Reject All" instead of "Accept All".
    -   Improve banner detection for single-page applications (SPAs).
-   **Internationalization (i18n):** Translate the UI text into multiple languages using the centralized `UI_TEXT` constants.
-   **CI/CD Pipeline:** Set up automated building, testing, and deployment workflows using GitHub Actions.
