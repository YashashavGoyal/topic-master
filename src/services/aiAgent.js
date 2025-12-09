const { GoogleGenerativeAI } = require('@google/generative-ai');

const generateReport = async (data) => {
    // 1. Safety Check
    if (!process.env.GEMINI_API_KEY) {
        console.error("❌ MISSING API KEY");
        return null;
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Using the safe alias that worked for you
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL });

    // 2. Alerts Logic
    let specialInstruction = "";
    let alertBanner = "";
    if (data.isLastDay) {
        specialInstruction = `ALERT: This is the LAST video. Warn user to update playlist ID.`;
        alertBanner = `<div style="background: #ffebee; color: #c62828; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #ef9a9a;"><strong>⚠️ Course Finishing Today!</strong><br>Please update your Playlist ID in MongoDB tomorrow to start a new topic.</div>`;
    }
    if (data.configStatus === 'completed') {
        specialInstruction = `ALERT: Playlist COMPLETED. Tell user to update ActiveConfig.`;
        alertBanner = `<div style="background: #e3f2fd; color: #1565c0; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #90caf9;"><strong>🛑 Playlist Completed</strong><br>You have finished this course. Update your MongoDB Config to start a new one!</div>`;
    }

    // 3. The New "Pretty" Prompt
    const prompt = `
    You are a Senior Staff Engineer mentoring a student.
    
    CONTEXT: ${specialInstruction}
    TODAY'S LESSON: ${JSON.stringify(data.dailyLesson)}
    INDUSTRY UPDATES: ${JSON.stringify(data.generalPool)}
    
    TASK: Generate a clean, modern HTML Email. 
    
    GUIDELINES:
    1. **Tone:** Professional, encouraging, and concise.
    2. **Structure:**
       - **Lesson Section:** Explain the concept clearly. Why does it matter for System Design?
       - **Pulse Section:** Pick the BEST news item. Give a 1-sentence summary.
       - **Concept Section:** Teach a System Design term (e.g., CAP Theorem, Sharding) with a "Pro Tip".
    
    OUTPUT FORMAT:
    Return ONLY valid HTML code. No markdown. Use the CSS classes provided in the style block below.
    
    HTML TEMPLATE TO FILL:
    <!DOCTYPE html>
    <html>
    <head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; color: #333333; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { background: #1a1a1a; padding: 30px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
        .header p { color: #888888; margin: 5px 0 0 0; font-size: 14px; }
        .content { padding: 30px 25px; }
        .section-label { text-transform: uppercase; font-size: 11px; font-weight: 800; letter-spacing: 1px; color: #888; margin-bottom: 10px; display: block; }
        
        /* CARD STYLES */
        .card { border: 1px solid #eaeaea; border-radius: 8px; padding: 20px; margin-bottom: 30px; background: #fff; }
        .lesson-card { border-left: 5px solid #10b981; background: #f0fdf9; } /* Green */
        .news-card { border-left: 5px solid #3b82f6; }   /* Blue */
        .concept-card { border-left: 5px solid #f59e0b; background: #fffbeb; } /* Amber */
        
        h2 { margin-top: 0; font-size: 20px; color: #111; line-height: 1.3; }
        p { line-height: 1.6; color: #555; font-size: 15px; margin-bottom: 15px; }
        
        .btn { display: inline-block; background: #1a1a1a; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; font-size: 14px; }
        .btn:hover { background: #333; }
        .btn-link { color: #3b82f6; text-decoration: none; font-weight: 600; }
        
        .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eaeaea; }
    </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>TOPIC MASTER 🚀</h1>
                <p>Your Daily Engineering Brief</p>
            </div>
            
            <div class="content">
                ${alertBanner}
                
                <!-- SECTION 1: LESSON -->
                <span class="section-label">Today's Curriculum</span>
                <div class="card lesson-card">
                    <h2>[Insert Lesson Title]</h2>
                    <p><strong>Mentor's Note:</strong> [Insert Analysis Here]</p>
                    <a href="[Insert Link]" class="btn">Watch Lesson &rarr;</a>
                </div>

                <!-- SECTION 2: PULSE -->
                <span class="section-label">Industry Pulse</span>
                <div class="card news-card">
                    <h2>[Insert News Title]</h2>
                    <p><strong>Source:</strong> [Source Name]</p>
                    <p>[Insert Summary Here]</p>
                    <a href="[Insert Link]" class="btn-link">Read Full Article</a>
                </div>

                <!-- SECTION 3: CONCEPT -->
                <span class="section-label">System Design Concept</span>
                <div class="card concept-card">
                    <h2>💡 [Insert Concept Name]</h2>
                    <p>[Insert Definition]</p>
                    <p style="background: rgba(245, 158, 11, 0.1); padding: 10px; border-radius: 5px; color: #92400e; font-weight: 500;">
                        <strong>Pro Tip:</strong> [Insert Interview Tip]
                    </p>
                </div>
            </div>

            <div class="footer">
                Automated by GitHub Actions • Powered by Gemini AI<br>
                Keep building, Yashashav.
            </div>
        </div>
    </body>
    </html>
    `;

    const MAX_RETRIES = 3;
    let attempt = 0;

    while (attempt <= MAX_RETRIES) {
        try {
            const result = await model.generateContent(prompt);
            let html = result.response.text();
            return html.replace(/```html|```/g, '');
        } catch (error) {
            attempt++;
            const isQuotaError = error.message.includes('429') || error.message.includes('Quota exceeded'); // 429 or 503 sometimes

            if (isQuotaError && attempt <= MAX_RETRIES) {
                const delay = Math.pow(2, attempt) * 2000; // 4s, 8s, 16s
                console.warn(`⚠️ API Quota hit. Retrying in ${delay / 1000}s (Attempt ${attempt}/${MAX_RETRIES})...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            // Final failure handling
            console.error("❌ AI AGENT CRASHED:", error.message);
            if (isQuotaError) {
                console.error("💡 TIP: This 429 error often means your Google Cloud PROJECT'S Free Tier quota is exhausted. Creating a new API Key on the same project WON'T fix this. You need to create a completely new Google Cloud Project or enable billing.");
            }
            return null;
        }
    }
    return null;
};

module.exports = { generateReport };