# Chrome Extension for JotForm Data Processing

## Overview

This Chrome extension is designed to handle JotForm submissions, create and manage Google Docs (invoices, letters, envelopes), and automate interactions with external services. It integrates with the JotForm API and Google Docs API to streamline the processing of form data.

## Features

-   Fetches JotForm submission data using an API key.
-   Generates invoices, letters, and envelopes based on templates.
-   Opens and manages Gmail drafts for further processing.
-   Integrates with external services for additional functionality.

## Installation

1. **Clone the repository:**

    ```bash
    git clone https://github.com/meeksdev/autofill-extension.git
    cd your-repository
    ```

2. **Load the extension into Chrome:**
    - Open Chrome and go to `chrome://extensions/`.
    - Enable "Developer mode" (toggle switch in the top right).
    - Click "Load unpacked" and select the extension directory.

## Configuration

### Manifest File

Ensure that manifest.json is properly configured with necessary permissions and content security policy.

```json
{
    "manifest_version": 3,
    "name": "JotForm Data Processor",
    "version": "1.0",
    "description": "Processes JotForm submissions and manages Google Docs.",
    "permissions": [
        "storage",
        "activeTab",
        "identity",
        "https://www.googleapis.com/*",
        "https://api.jotform.com/*",
        "https://www.googleapis.com/auth/gmail.compose",
        "https://www.googleapis.com/auth/documents",
        "https://www.googleapis.com/auth/drive"
    ],
    "background": {
        "service_worker": "background.js"
    },
    "action": {
        "default_icon": "images/default-icon.png",
        "default_popup": "popup/popup.html"
    },
    "content_scripts": [
        {
            "js": ["scripts/jotform-content.js"],
            "matches": ["https://www.jotform.com/*"]
        },
        {
            "js": ["scripts/pawsetrack-content.js"],
            "matches": ["https://www.pawsetrack.vet/*"],
            "run_at": "document_end"
        },
        {
            "js": ["scripts/calendar-content.js"],
            "matches": ["https://calendar.google.com/calendar/*"],
            "run_at": "document_end"
        }
    ],
    "oauth2": {
        "client_id": "your-client-id",
        "scopes": ["https://www.googleapis.com/auth/gmail.compose", "https://www.googleapis.com/auth/documents", "https://www.googleapis.com/auth/drive"]
    },
    "host_permissions": ["*://*.google.com/*", "*://*.googleapis.com/*"]
}
```

## Usage

### Fetching JotForm Data

The extension communicates with the JotForm API to retrieve submission data. Use the extension's popup interface to trigger data fetching.

### Generating Documents

Google doc templates for invoices, letters, and envelopes are used to create documents based on JotForm data. Review and adjust templates in Google Docs as needed.

### Managing Gmail Drafts

The extension creates drafts in Gmail based on the processed data. Review and finalize drafts as necessary.

## Development

### Setting Up the Development Environment

1. **Install necessary dependencies:**

    ```bash
    npm install
    ```

### Scripts

-   **Build for development:**

    ```bash
    npm run build:dev
    ```

-   **Build for production:**

    ```bash
    npm run build:prod
    ```

-   **Lint the code:**

    ```bash
    npm run lint
    ```

-   **Fix linting issues:**

    ```bash
    npm run lint:fix
    ```

### ESLint Configuration

The ESLint configuration is defined in `eslint.config.mjs`. It includes settings for globals, ECMAScript version, source type, and specific linting rules.

### Prettier Configuration

The Prettier configuration is defined in `.prettierrc`. It includes settings for print width, tab width, use of semicolons, single quotes, trailing commas, bracket spacing, arrow function parentheses, and end of line.

### Git Ignore

The `.gitignore` file includes directories and files to be excluded from version control, such as `node_modules/`, `dist/`, and `package-lock.json`.

### Testing

Test the extension thoroughly in different scenarios to ensure it works as expected. Use Chrome's extension debugging tools for troubleshooting.

### Building and Packaging

Minify and obfuscate code before publishing. Package the extension for distribution.

### Security Considerations

-   Do not store sensitive information directly in the client-side code.
-   Implement robust content security policies.
-   Regularly review code for security vulnerabilities.

## Contributing

1. Fork the repository and create a new branch for your changes.
2. Submit a pull request with a detailed description of your changes.
