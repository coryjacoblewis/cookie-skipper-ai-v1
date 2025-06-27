
// This file centralizes all prompts sent to the AI model.
// Keeping prompts separate from the application logic makes them easier
// to manage, version, test, and tune without changing any code.

/**
 * The prompt sent to the Gemini model to find the "accept" button.
 * 
 * This prompt is carefully crafted to be clear and concise:
 * - It clearly states the primary goal: find the main "Accept All" button.
 * - It provides synonyms ("Agree", "Allow all") to cover common variations.
 * - It specifies the exact output format required: a JSON object with a "selector" key.
 *   This is crucial for reliable, programmatic parsing of the response.
 * - It gives an example of both a successful response and a failure case (selector: null).
 * - It clearly marks where the HTML content to be analyzed begins.
 */
export const FIND_ACCEPT_BUTTON_PROMPT = `
Analyze the following HTML content from a webpage. Your task is to identify the primary "Accept All", "Agree", "Allow all", or similar cookie consent button.

Respond with a JSON object containing a single key "selector", which holds a precise CSS selector to uniquely identify this button. The selector must be robust enough for use with document.querySelector().

If no such button can be confidently identified, respond with a JSON object where the "selector" key is null.

Example response:
{
  "selector": "#cookie-accept-button-id"
}

HTML to analyze:
---
`;