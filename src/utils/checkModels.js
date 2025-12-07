require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.GEMINI_API_KEY;
const URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

(async () => {
    try {
        console.log("🔍 Querying Google AI for available models...");
        const response = await axios.get(URL);
        const models = response.data.models;
        
        console.log("\n✅ AVAILABLE MODELS:");
        models.forEach(m => {
            // We only care about models that support 'generateContent'
            if (m.supportedGenerationMethods.includes("generateContent")) {
                console.log(`- ${m.name.replace('models/', '')}`);
            }
        });
    } catch (error) {
        console.error("❌ Error fetching models:", error.response ? error.response.data : error.message);
    }
})();