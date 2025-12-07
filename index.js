require('dotenv').config();
const Parser = require('rss-parser');
const nodemailer = require('nodemailer');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- CONFIGURATION ---
const USER_PROFILE = `
Name: Yashashav Goyal
Current Tech: Node.js, MERN, IoT (Retiring), Linux (RHCSA).
Target Role: DevOps Engineer / SRE / Backend Architect.
Learning Focus: System Design, Scalability, Kubernetes, How Big Tech (Netflix/Uber) scales.
`;

const FEED_SOURCES = [
    // Top Tier Engineering Blogs
    'https://netflixtechblog.com/feed',
    'https://eng.uber.com/feed/',
    'https://discord.com/blog/rss',
    'https://aws.amazon.com/blogs/architecture/feed/',
    // Best YouTube Channels for System Design (RSS)
    'https://www.youtube.com/feeds/videos.xml?channel_id=UC_7WrbZTCODu1o_kfZHbert', // Hussein Nasser (Backend)
    'https://www.youtube.com/feeds/videos.xml?channel_id=UCZRnT4QZtmCh812Vzz9niFw', // ByteByteGo (Arch)
    'https://www.youtube.com/feeds/videos.xml?channel_id=UCzL_0nIe8B4-7ShhVPfJkgw'  // Gaurav Sen (System Design)
];

const parser = new Parser();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- STEP 1: FETCH DATA ---
async function fetchFeeds() {
    console.log("📡 Scanning Industry Feeds...");
    const allItems = [];
    
    // We grab the latest 2 items from each source to ensure freshness
    const promises = FEED_SOURCES.map(async (url) => {
        try {
            const feed = await parser.parseURL(url);
            return feed.items.slice(0, 2).map(item => ({
                title: item.title,
                link: item.link,
                source: feed.title || 'Tech Blog',
                date: item.pubDate
            }));
        } catch (e) {
            return []; // Skip failed feeds silently
        }
    });

    const results = await Promise.all(promises);
    return results.flat();
}

// --- STEP 2: AI ANALYSIS (THE BRAIN) ---
async function generateDailyReport(feedItems) {
    console.log("🧠 Analyzing content with Gemini...");
    
    // FIX: Using specific model version to prevent 404 errors
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
    You are a Senior Staff Engineer mentoring a student named Yashashav.
    
    CONTEXT:
    ${USER_PROFILE}

    INPUT DATA (Recent Articles/Videos):
    ${JSON.stringify(feedItems)}

    TASK:
    1. Scan the Input Data. Select the top 2 MOST relevant resources for Yashashav's transition to DevOps/SRE. 
       (Ignore generic frontend or basic coding tutorials. Look for Scale, Architecture, or Cloud).
    2. For each selected resource, write a 1-sentence "Why this matters" explanation.
    3. Pick ONE "System Design Concept" (e.g., CAP Theorem, Sharding, Consistent Hashing, Rate Limiting, Leader Election). 
       Explain it in 3 sentences + 1 "Pro Tip" for interviews.

    OUTPUT FORMAT:
    Return ONLY raw HTML (no markdown blocks). Use a clean, minimal "Dark Mode" email style.
    Structure:
    - <h1> Header: "Daily Engineering Update"
    - <h2> Section: "Fresh form the Industry" (The 2 links)
    - <h2> Section: "System Design Concept of the Day"
    - Use inline CSS for styling (Background: #1a1a1a, Text: #e0e0e0, Cards: #2d2d2d).
    `;

    try {
        const result = await model.generateContent(prompt);
        let html = result.response.text();
        // Cleanup Markdown if Gemini adds it
        html = html.replace(/```html/g, '').replace(/```/g, ''); 
        return html;
    } catch (error) {
        console.error("AI Error:", error);
        return fallbackHTML(); // Fail-safe
    }
}

// --- STEP 3: SEND EMAIL ---
async function sendEmail(htmlContent) {
    console.log("📧 Sending Dispatch...");
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS // Your 16-char App Password
        }
    });

    await transporter.sendMail({
        from: `"DevOps Career Agent" <${process.env.EMAIL_USER}>`,
        to: process.env.TARGET_EMAIL,
        subject: `🚀 System Design & Scale: ${new Date().toLocaleDateString()}`,
        html: htmlContent
    });
    console.log("✅ Email sent successfully!");
}

function fallbackHTML() {
    return `<h1>Agent Error</h1><p>Could not generate analysis. Please check API quota.</p>`;
}

// --- MAIN LOOP ---
(async () => {
    try {
        const feeds = await fetchFeeds();
        if (feeds.length === 0) {
            console.log("No new feeds found.");
            // return;
            process.exit(0);
        }
        const html = await generateDailyReport(feeds);
        await sendEmail(html);
        process.exit(0);
    } catch (e) {
        console.error("Fatal Error:", e);
        process.exit(1);
    }
})();