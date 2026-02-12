// Load environment variables from .env file
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const BACKEND_PORT = 3001;
const FRONTEND_ORIGIN = 'http://localhost:5173'; // Vite default port

// --- Security and Middleware ---
// S&O Compliance: Correctly managing CORS policies
app.use(cors({
    origin: FRONTEND_ORIGIN,
    methods: ['POST', 'GET'],
    allowedHeaders: ['Content-Type'],
}));
app.use(bodyParser.json());

// --- Mandatory Schemas (From catalyst_schema_rules.json) ---
// const MeetingSummarySchema = {
//     type: "OBJECT",
//     properties: {
//         executive_summary: {
//             type: "STRING",
//             description: "A concise, executive-level summary of the meeting's primary outcome (max 3 sentences)."
//         },
//         action_items: {
//             type: "ARRAY",
//             description: "A list of all confirmed tasks.",
//             items: {
//                 type: "OBJECT",
//                 properties: {
//                     task: { "type": "STRING" },
//                     owner: { "type": "STRING" },
//                     due_date: { "type": "STRING" }
//                 }
//             }
//         },
//         potential_blockers: {
//             type: "ARRAY",
//             description: "List any risks or unresolved issues that require immediate management attention."
//         }
//     },
//     required: ["executive_summary", "action_items"]
// };

// server.js - Updated MeetingSummarySchema
const MeetingSummarySchema = {
    type: "OBJECT",
    properties: {
        executive_summary: {
            type: "STRING",
            description: "A concise, executive-level summary of the meeting's primary outcome (max 3 sentences)."
        },
        action_items: {
            type: "ARRAY",
            description: "A list of all confirmed tasks.",
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
            description: "List any risks or unresolved issues that require immediate management attention.",
            items: { 
                // CRITICAL FIX: Explicitly define the type as STRING, resolving the "missing field" error.
                "type": "STRING" 
            }
        }
    },
    required: ["executive_summary", "action_items"]
};

// --- API Key Initialization ---
// S&O Compliance: Using tokenization (environment variable) instead of hardcoding credentials.
const apiKey = process.env.GEMINI_API_KEY; 
if (!apiKey) {
    console.error("FATAL ERROR: GEMINI_API_KEY is not set in the .env file.");
    process.exit(1);
}
const ai = new GoogleGenAI(apiKey);

// --- REFACTORED HELPER FUNCTION: Calls Gemini with Configuration ---
// This robust helper now supports optional schema enforcement.
const generateContent = async (systemInstruction, userQuery, schema = null) => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: userQuery }] }],
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: schema ? "application/json" : "text/plain",
                responseSchema: schema || undefined,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error during Gemini API call:", error);
        return `ERROR: Could not process request through Gemini API. Details: ${error.message}`;
    }
};

// --- CORE GEMINI API ROUTES ---

// 1. Route for Instant Summary Generator (S&O Structured Data Enforced)
// app.post('/api/process-summary', async (req, res) => {
//     const { transcript } = req.body;
    
//     if (!transcript) {
//         return res.status(400).json({ status: 'error', message: 'Transcript data is required.' });
//     }

//     console.log(`[LOG] Received transcript. Orchestrating Gemini API call with structured schema...`);

//     const systemInstruction = `Act as an experienced Professional Services Project Manager. Your goal is to synthesize raw meeting transcripts into actionable project summaries. Extract only finalized decisions, action items, and clear risks.`;

//     const userQuery = `Analyze the following raw transcript and output the structured JSON summary: \n\n${transcript}`;

//     try {
//         // CRITICAL FIX: Pass the MeetingSummarySchema to enforce clean JSON output (S&O Compliance)
//         const jsonText = await generateContent(systemInstruction, userQuery, MeetingSummarySchema); 
        
//         // No more string manipulation needed, as output is guaranteed JSON format.
//         const summary = JSON.parse(jsonText); 

//         console.log(`[SUCCESS] Summary processed and returned to frontend.`);
//         res.json({ status: 'success', summary });
//     } catch (e) {
//         console.error("Error processing request or parsing JSON:", e);
//         // Provide a structured error response for frontend stability
//         res.status(500).json({
//             status: 'error',
//             message: 'Failed to process structured JSON output.',
//             summary: {
//                 executive_summary: `Parsing Error: AI output was non-compliant. Check backend logs. Error: ${e.message.substring(0, 100)}`,
//                 action_items: [],
//                 potential_blockers: []
//             }
//         });
//     }
// });

// server.js - Route: /api/process-summary

app.post('/api/process-summary', async (req, res) => {
    const { transcript } = req.body;
    
    if (!transcript) {
        return res.status(400).json({ status: 'error', message: 'Transcript data is required.' });
    }

    console.log(`[LOG] Received transcript. Orchestrating Gemini API call with structured schema...`);

    const systemInstruction = `Act as an experienced Professional Services Project Manager. Your goal is to synthesize raw meeting transcripts into actionable project summaries. Extract only finalized decisions, action items, and clear risks.`;

    const userQuery = `Analyze the following raw transcript and output the structured JSON summary: \n\n${transcript}`;

    try {
        // 1. Call Gemini, enforcing the MeetingSummarySchema (Fixes 400 INVALID_ARGUMENT error)
        const aiResponseText = await generateContent(systemInstruction, userQuery, MeetingSummarySchema); 
        
        // CRITICAL FIX: Check if the response is an error string first (Fixes SyntaxError on API call failure)
        if (aiResponseText.startsWith('ERROR:')) {
             throw new Error(aiResponseText);
        }

        // 2. Sanitation: Strip markdown wrappers (```json, ```) which cause JSON.parse to fail.
        const jsonText = aiResponseText.trim().replace(/```json|```/g, ''); 
        
        // 3. Safely parse the cleaned JSON string
        const summary = JSON.parse(jsonText); 

        console.log(`[SUCCESS] Summary processed and returned to frontend.`);
        res.json({ status: 'success', summary });
    } catch (e) {
        // Provides a 500 status to the client if parsing fails or an unhandled exception occurs
        console.error("Error processing request or parsing JSON:", e);
        
        // Provide a structured error response for frontend stability
        res.status(500).json({
            status: 'error',
            message: 'Failed to process structured JSON output.',
            summary: {
                executive_summary: `Parsing Error: AI output was non-compliant. Check backend logs. Error: ${e.message.substring(0, 100)}`,
                action_items: [],
                potential_blockers: []
            }
        });
    }
});

// 2. Route for Quick Skill Generator (AI Literacy Feature)
app.post('/api/quick-skill', async (req, res) => {
    const { prompt } = req.body;
    
    const systemInstruction = `You are a PS Subject Matter Expert. Provide a 3-paragraph, executive-level summary and its primary relevance to Professional Services consulting. Output in clear, professional text format.`;

    try {
        // AUDIT FIX: Use the refactored helper function
        const responseText = await generateContent(systemInstruction, prompt);
        res.json({ status: 'success', text: responseText });
    } catch (e) {
        res.status(500).json({ status: 'error', message: 'Skill generation failed.' });
    }
});

// 3. Route for Remediation Coach (S&O Governance Feature)
// This route will be called by the handleCoachingRequest function in App.jsx.
app.post('/api/remediate-coach', async (req, res) => {
    const { prompt } = req.body;
    
    // S&O Compliance: System instruction emphasizes actionable and concise advice.
    const systemInstruction = `You are an AI S&O Governance Coach. Provide a 3-step, actionable plan in a concise list format to guide the consultant on how to remediate the document and pass the S&O check. Focus only on practical steps to fix technical errors.`;

    try {
        // AUDIT FIX: Use the refactored helper function
        const responseText = await generateContent(systemInstruction, prompt);
        res.json({ status: 'success', text: responseText });
    } catch (e) {
        res.status(500).json({ status: 'error', message: 'Remediation coaching failed.' });
    }
});


// --- Server Start ---
app.listen(BACKEND_PORT, () => {
    console.log(`[SUCCESS] Chanakya Catalyst Backend running at http://localhost:${BACKEND_PORT}`);
});