const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const os = require('os');

const app = express();
const port = process.env.PORT || 3000;

// Logging setup
const logFile = path.join(__dirname, 'server.log');
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

function logToFile(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    logStream.write(logMessage);
}

// Override console.log and console.error to write to file as well
const originalLog = console.log;
const originalError = console.error;

console.log = function (...args) {
    const message = args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : arg)).join(' ');
    logToFile(`INFO: ${message}`);
    originalLog.apply(console, args);
};

console.error = function (...args) {
    const message = args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : arg)).join(' ');
    logToFile(`ERROR: ${message}`);
    originalError.apply(console, args);
};


// Middleware
app.use(cors());
app.use(express.json());

// Configure Multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Helper to get local IP
function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal (i.e. 127.0.0.1) and non-ipv4 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

// Access Verification Endpoint
app.post('/api/verify-access', (req, res) => {
    const { key } = req.body;
    // Check if the key matches the environment variable
    // If ACCESS_KEY is not set in env, we might want to default to something or fail open/closed.
    // Here we fail closed if not set.
    if (process.env.ACCESS_KEY && key === process.env.ACCESS_KEY) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, error: 'Invalid access key' });
    }
});

// API Route
app.post('/api/generate-hairstyle', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'reference_image', maxCount: 1 }]), async (req, res) => {
    try {
        if (!req.files || !req.files['image']) {
            return res.status(400).json({ error: 'No base image uploaded' });
        }

        const baseFile = req.files['image'][0];
        const refFile = req.files['reference_image'] ? req.files['reference_image'][0] : null;

        console.log(`Received base image: ${baseFile.mimetype}, Size: ${baseFile.size} bytes`);
        if (refFile) {
            console.log(`Received reference image: ${refFile.mimetype}, Size: ${refFile.size} bytes`);
        }

        const { style, color, description, mode } = req.body;

        // Prepare prompt parts
        const promptParts = [];

        // 1. Add Base Image
        promptParts.push({
            inlineData: {
                mimeType: baseFile.mimetype,
                data: baseFile.buffer.toString('base64'),
            },
        });

        // 2. Add Reference Image if present
        if (refFile) {
            promptParts.push({
                inlineData: {
                    mimeType: refFile.mimetype,
                    data: refFile.buffer.toString('base64'),
                },
            });
        }

        // 3. Construct Text Prompt
        let promptText = "";

        if (mode === 'reference' && refFile) {
            promptText = `
                You are an expert hair stylist and image generator.
                I have provided two images:
                1. The first image is the "Base Image" containing a person.
                2. The second image is a "Reference Image" containing a specific hairstyle.

                YOUR TASK:
                Generate a photorealistic image of the person from the Base Image wearing the hairstyle shown in the Reference Image.

                INSTRUCTIONS:
                - Transfer the hairstyle from the Reference Image onto the person in the Base Image.
                - Adapt the reference hairstyle to fit the head shape and angle of the person in the Base Image naturally.
                - Maintain the person's original facial features, expression, lighting, and background from the Base Image as much as possible.
                - Use the hair color from the Reference Image unless specified otherwise in the additional details.
                
                Additional Details: ${description || 'None'}

                Return ONLY the image.
            `;
        } else {
            // Original Preset Mode
            let changes = [];
            if (style) changes.push(`Style: ${style}`);
            else changes.push(`Style: Maintain the original hairstyle.`);

            if (color) changes.push(`Color: ${color}`);
            else changes.push(`Color: Maintain the original hair color.`);

            promptText = `
                You are an expert hair stylist and image generator.
                I have uploaded an image of a person.
                Please generate a new photorealistic version of this image with the following specifications:
                ${changes.join('\n                ')}
                Additional Details: ${description || 'None'}
                
                Maintain the person's original facial features, expression, lighting, and background as much as possible. 
                The goal is to visualize how this specific person would look with these specific changes.
                Return ONLY the image.
            `;
        }

        promptParts.push({ text: promptText });

        console.log("Sending request to Gemini...");
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-image-preview",//"gemini-2.5-flash-image",
            contents: [{ role: "user", parts: promptParts }],
        });
        console.log("Gemini response received.");

        let generatedImage = null;
        let generatedText = "";

        // Inspect the parts for inlineData (images)
        if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    // Construct data URI
                    generatedImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                } else if (part.text) {
                    generatedText += part.text;
                }
            }
        }

        res.json({
            success: true,
            description: generatedText,
            image: generatedImage
        });

    } catch (error) {
        console.error('Error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        res.status(500).json({ error: error.message });
    }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(port, '0.0.0.0', () => {
    const localIp = getLocalIpAddress();
    console.log(`Server running on port ${port}`);
    console.log(`Local Network URL: http://${localIp}:${port}`);
    console.log(`Localhost URL: http://localhost:${port}`);
});
