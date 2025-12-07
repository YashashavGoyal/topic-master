require('dotenv').config();
const Parser = require('rss-parser');
const nodemailer = require('nodemailer');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- CONFIGURATION ---

// 1. SET START DATE (YYYY-MM-DD)
// Set this to the date you started this specific playlist.
const START_DATE = new Date('2025-12-07'); 

// 2. TARGET PLAYLIST
const TARGET_PLAYLIST_ID = 'PLinedj3B30sBlBWRox2V2tg9QJ2zr4M3o'; 

// 3. GENERAL FEEDS
const GENERAL_FEEDS = [
    // Top Tier Engineering Blogs
    'https://netflixtechblog.com/feed',
    'https://eng.uber.com/feed/',
    'https://discord.com/blog/rss',
    'https://aws.amazon.com/blogs/architecture/feed/',
    
    // Best YouTube Channels for System Design (RSS)
    'https://www.youtube.com/feeds/videos.xml?channel_id=UC_7WrbZTCODu1o_kfZHbert', // Hussein Nasser (Backend)
    'https://www.youtube.com/feeds/videos.xml?channel_id=UCZRnT4QZtmCh812Vzz9niFw', // ByteByteGo (Arch)
    'https://www.youtube.com/feeds/videos.xml?channel_id=UCzL_0nIe8B4-7ShhVPfJkgw',  // Gaurav Sen (System Design)

    
    // 2. Piyush Garg (Channel ID: UCl4C_NK52aOGHOVv_cZf9aA)
    'https://www.youtube.com/feeds/videos.xml?channel_id=UCl4C_NK52aOGHOVv_cZf9aA',

];

const parser = new Parser();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- STEP 1: FETCH DATA ---
async function fetchContent() {
    console.log("📡 Aggregating Content...");
    
    // A. Fetch Playlist & Check Progress
    let dailyLesson = null;
    let courseStatus = 'IN_PROGRESS'; // Options: IN_PROGRESS, LAST_DAY, COMPLETED

    try {
        const playlistUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${TARGET_PLAYLIST_ID}`;
        const playlistFeed = await parser.parseURL(playlistUrl);
        const totalVideos = playlistFeed.items.length;

        // Calculate Days Passed
        const today = new Date();
        const diffTime = Math.abs(today - START_DATE);
        const currentDayIndex = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        console.log(`📊 Progress: Day ${currentDayIndex + 1} of ${totalVideos}`);

        if (currentDayIndex >= totalVideos) {
            courseStatus = 'COMPLETED';
        } else {
            const video = playlistFeed.items[currentDayIndex];
            
            // Check if this is the final video
            if (currentDayIndex === totalVideos - 1) {
                courseStatus = 'LAST_DAY';
            }

            dailyLesson = {
                title: video.title,
                link: video.link,
                source: "System Design Curriculum",
                progress: `Lesson ${currentDayIndex + 1}/${totalVideos}`
            };
        }
    } catch (e) {
        console.error("⚠️ Playlist Fetch Failed");
    }

    // B. Fetch General News
    let generalPool = [];
    const promises = GENERAL_FEEDS.map(async (url) => {
        try {
            const feed = await parser.parseURL(url);
            return feed.items.slice(0, 2).map(item => ({
                title: item.title,
                link: item.link,
                source: feed.title || 'Tech Source',
                date: item.pubDate
            }));
        } catch (e) { return []; }
    });

    const results = await Promise.all(promises);
    generalPool = results.flat();

    return { dailyLesson, generalPool, courseStatus };
}

// --- STEP 2: AI ANALYSIS ---
async function generateDailyReport(data) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Dynamic Prompt based on Status
    let specialInstruction = "";
    if (data.courseStatus === 'LAST_DAY') {
        specialInstruction = `
        CRITICAL ALERT: This is the LAST video in the user's playlist.
        Add a distinct, red-colored section at the top of the email titled "⚠️ COURSE COMPLETED".
        Tell the user: "You have finished this playlist. Please update 'TARGET_PLAYLIST_ID' and 'START_DATE' in your index.js file to start a new topic."
        `;
    } else if (data.courseStatus === 'COMPLETED') {
        specialInstruction = `
        CRITICAL ALERT: The user has surpassed the playlist length.
        Do NOT generate a lesson analysis. 
        Only display a large warning: "Playlist Finished. Update Agent Configuration Immediately to resume learning."
        You may still show the Industry Pulse.
        `;
    }

    const prompt = `
    You are a DevOps Mentor.
    
    COURSE STATUS: ${data.courseStatus}
    ${specialInstruction}

    TODAY'S LESSON:
    ${JSON.stringify(data.dailyLesson)}

    INDUSTRY UPDATES:
    ${JSON.stringify(data.generalPool)}

    TASK:
    1. If course is NOT completed, analyze the lesson.
    2. Pick the best industry update.
    3. Teach a System Design Concept.

    OUTPUT: HTML (Dark Mode).
    `;

    try {
        const result = await model.generateContent(prompt);
        let html = result.response.text();
        html = html.replace(/```html/g, '').replace(/```/g, ''); 
        return html;
    } catch (error) {
        return `<h1>Error generating report</h1>`;
    }
}

// --- STEP 3: SEND EMAIL ---
async function sendEmail(htmlContent, status) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    let subjectLine = `🚀 Daily Learning`;
    if (status === 'LAST_DAY') subjectLine = `⚠️ Course Finishing Today! Action Required`;
    if (status === 'COMPLETED') subjectLine = `🛑 Agent Paused: Playlist Completed`;

    await transporter.sendMail({
        from: `"Topic Master" <${process.env.EMAIL_USER}>`,
        to: process.env.TARGET_EMAIL,
        subject: subjectLine,
        html: htmlContent
    });
}

// --- MAIN ---
(async () => {
    try {
        const data = await fetchContent();
        
        // Safety check
        if (!data.dailyLesson && data.courseStatus !== 'COMPLETED') {
            console.log("No data.");
            process.exit(0);
        }

        const html = await generateDailyReport(data);
        await sendEmail(html, data.courseStatus);
        
        console.log("✅ Workflow Complete");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();