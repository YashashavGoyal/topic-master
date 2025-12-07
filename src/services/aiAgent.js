const { GoogleGenerativeAI } = require('@google/generative-ai');

const generateReport = async (data) => {
    if (!process.env.GEMINI_API_KEY) {
        console.error("❌ MISSING API KEY");
        return null; 
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // ⚠️ TROUBLESHOOTING: 
    // If 'gemini-2.0-flash' fails, Check avaliable models with checkModels
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    let specialInstruction = "";
    if (data.isLastDay) specialInstruction = `ALERT: Last video. Warn user to update playlist ID.`;
    if (data.configStatus === 'completed') specialInstruction = `ALERT: Playlist COMPLETED.`;

    const prompt = `
    You are a DevOps Mentor.
    CONTEXT: ${specialInstruction}
    TODAY'S LESSON: ${JSON.stringify(data.dailyLesson)}
    INDUSTRY UPDATES: ${JSON.stringify(data.generalPool)}
    
    TASK: Analyze lesson, pick best industry update, teach System Design concept.
    OUTPUT: HTML (Dark Mode).
    `;

    try {
        const result = await model.generateContent(prompt);
        let html = result.response.text();
        return html.replace(/```html|```/g, ''); 
    } catch (error) {
        console.error("❌ AI AGENT CRASHED:");
        console.error("➡️ Details:", error.message);
        return null; 
    }
};

module.exports = { generateReport };