# Hair AI POC

This is a Proof of Concept (POC) application that uses Google's Gemini API to generate hairstyles on uploaded user images. It features a React frontend and an Express backend.

## Features

- **Preset Mode**: Apply specific styles and colors to an uploaded image.
- **Reference Mode**: Upload a reference image to transfer a hairstyle to the base image.
- **Access Control**: Simple access key verification.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- A Google Gemini API Key

## Installation

1.  **Clone the repository** (or download the source code).

2.  **Install dependencies**:
    You can install dependencies for both the server and client using the provided script or manually.

    **Manual Installation:**
    ```bash
    # Install server dependencies
    npm install

    # Install client dependencies
    cd client
    npm install
    cd ..
    ```

3.  **Environment Setup**:
    Create a `.env` file in the root directory with the following variables:

    ```env
    GEMINI_API_KEY=your_gemini_api_key_here
    ACCESS_KEY=your_optional_access_key
    PORT=3000
    ```

## Usage

### Running with the Start Script (Windows)

Double-click `start.bat` or run it from the command line:
```bash
start.bat
```
This script will build the client and start the server.

### Running Manually

1.  **Build the Client**:
    ```bash
    cd client
    npm run build
    cd ..
    ```

2.  **Start the Server**:
    ```bash
    cd server
    node index.js
    ```

The server will start on `http://localhost:3000` (or the port specified in `.env`).
The application will be accessible at `http://localhost:3000` (the server serves the built client).

## API Endpoints

-   `POST /api/verify-access`: Verify the access key.
-   `POST /api/generate-hairstyle`: Generate a new image based on inputs.

## Tech Stack

-   **Frontend**: React, Vite
-   **Backend**: Express.js, Multer
-   **AI**: Google Gemini API (`gemini-3-pro-image-preview` or similar)
