// Load environment variables
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { GoogleGenAI } = require('@google/genai');

const app = express();
// Render uses process.env.PORT, otherwise default to 3001
const BACKEND_PORT = process.env.PORT || 3001;

// --- Security and Middleware ---
// Replace the URL below with your actual Vercel deployment URL
const allowedOrigins = [
    'http://localhost:5173',
    'https://chanakya-catalyst.vercel.app' 
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            return callback(new Error('CORS Policy blocked this origin'), false);
        }
        return callback(null, true);
    },
    methods: ['POST', 'GET'],
    allowedHeaders: ['Content-Type'],
}));

app.use(bodyParser.json());

// --- Health Check Route ---
// Pro-Tip: Open this in your browser to "wake up" the Render server before the presentation!
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'Online', message: 'Chanakya Catalyst Backend is active' });
});

// --- Structured Data Schema ---
const MeetingSummarySchema = {
    type: "OBJECT",
    properties: {
        executive_summary: {
            type: "STRING",
            description: "A concise summary of outcomes (max 3 sentences)."
        },
        action_items: {
            type: "ARRAY",
            description: "Confirmed tasks.",
            items: {
                type: "OBJECT",
                properties: {
                    task: { "type": "STRING" },
                    owner: { "type": "STRING" },
                    due_date: { "type": "STRING" }
                }
            }
        },
        potential_blockers: {
            type: "ARRAY",
            description: "Risks requiring attention.",
            items: { "type": "STRING" }
        }
    },
    required: ["executive_summary", "action_items"]
};

// --- API Key Initialization ---
const apiKey = process.env.GEMINI_API_KEY; 
if (!apiKey) {
    console.error("FATAL ERROR: GEMINI_API_KEY is not set.");
    process.exit(1);
}
const ai = new GoogleGenAI(apiKey);

// --- REFACTORED HELPER FUNCTION ---
const generateContent = async (systemInstruction, userQuery, schema = null) => {
    try {
        const model = ai.getGenerativeModel({ 
            model: 'gemini-1.5-flash', // Updated to stable 1.5 flash
            systemInstruction: systemInstruction 
        });

        const generationConfig = {
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
            responseMimeType: schema ? "application/json" : "text/plain",
            responseSchema: schema || undefined,
        };

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: userQuery }] }],
            generationConfig,
        });

        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error during Gemini API call:", error);
        return `ERROR: ${error.message}`;
    }
};

// --- CORE ROUTES ---

// 1. Instant Summary Generator (REMOVED OLD WORKAROUND)
app.post('/api/process-summary', async (req, res) => {
    const { transcript } = req.body;
    if (!transcript) return res.status(400).json({ status: 'error', message: 'Transcript required.' });

    console.log(`[LOG] Processing Summary...`);
    const systemInstruction = `Act as an experienced Project Manager. Synthesis raw transcripts into JSON.`;
    const userQuery = `Analyze and output the structured JSON summary: \n\n${transcript}`;

    try {
        const aiResponseText = await generateContent(systemInstruction, userQuery, MeetingSummarySchema); 

        if (aiResponseText.startsWith('ERROR:')) throw new Error(aiResponseText);

        // Sanitize string if Gemini adds markdown markers
        let cleanJson = aiResponseText.trim();
        if (cleanJson.startsWith('```')) {
            cleanJson = cleanJson.replace(/```json|```/g, '').trim();
        }

        const summary = JSON.parse(cleanJson); 
        console.log(`[SUCCESS] Summary returned.`);
        res.json({ status: 'success', summary });
    } catch (e) {
        console.error("JSON Error:", e);
        res.status(500).json({
            status: 'error',
            message: 'Failed to parse AI output.',
            summary: { executive_summary: "Parsing error. Please check backend logs.", action_items: [], potential_blockers: [] }
        });
    }
});

// 2. Quick Skill Generator
app.post('/api/quick-skill', async (req, res) => {
    const { prompt } = req.body;
    const systemInstruction = `You are a PS SME. Provide a 3-paragraph executive summary about the topic.`;
    
    try {
        const responseText = await generateContent(systemInstruction, prompt);
        res.json({ status: 'success', text: responseText });
    } catch (e) {
        res.status(500).json({ status: 'error', message: 'Skill generation failed.' });
    }
});

// 3. Remediation Coach
app.post('/api/remediate-coach', async (req, res) => {
    const { prompt } = req.body;
    const systemInstruction = `You are an AI Governance Coach. Provide a 3-step actionable plan in concise list format.`;

    try {
        const responseText = await generateContent(systemInstruction, prompt);
        res.json({ status: 'success', text: responseText });
    } catch (e) {
        res.status(500).json({ status: 'error', message: 'Coaching failed.' });
    }
});

// --- Server Start ---
app.listen(BACKEND_PORT, () => {
    console.log(`[SUCCESS] Server running at http://localhost:${BACKEND_PORT}`);
});