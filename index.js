require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const ensureDbInitialized = require('./src/utils/seeder');

// Models
const ActiveConfig = require('./src/models/ActiveConfig');
const CourseHistory = require('./src/models/CourseHistory');

// Services
const { fetchPlaylist, fetchGeneralFeeds } = require('./src/services/fetcher');
const { generateReport } = require('./src/services/aiAgent');
const { sendEmail } = require('./src/services/emailer');

// --- MAIN WORKFLOW ---
(async () => {
    try {
        // 1. Initialize
        await connectDB();
        await ensureDbInitialized();

        // 2. Get State
        const config = await ActiveConfig.findOne();
        if (!config) throw new Error("ActiveConfig is missing");

        // 3. Fetch Data
        console.log("📡 Fetching Content...");
        const { dailyLesson, isLastDay } = await fetchPlaylist(config);
        const generalPool = await fetchGeneralFeeds();

        // 4. Check if work is needed
        if (!dailyLesson && config.status !== 'completed') {
            console.log("No content found.");
            return;
        }

        // 5. Generate AI Report
        console.log("🧠 Generating Analysis...");
        const html = await generateReport({
            dailyLesson,
            generalPool,
            isLastDay,
            configStatus: config.status
        });

        // 6. Check for Error / Breaks
        if (!html) {
            console.error("🛑 CRITICAL: Report Generation Failed.");
            console.error("⚠️ Database update ABORTED to preserve progress.");
            console.error("⚠️ You can fix the error and run the script again to retry this lesson.");

            // Optional: Send a "System Failure" email to yourself so you know it failed
            // await sendEmail("<h1>Agent Failed</h1><p>Check logs.</p>", process.env.TARGET_EMAIL, 'normal');

            return;
        };

        // 6. Send Email
        let subjectType = 'normal';
        if (isLastDay) subjectType = 'last_day';
        if (config.status === 'completed') subjectType = 'completed';

        await sendEmail(html, process.env.TARGET_EMAIL, subjectType);

        // 7. Update State (Database)
        if (config.status !== 'completed') {
            if (isLastDay) {
                // Archive to history
                await CourseHistory.create({
                    playlistId: config.playlistId,
                    status: 'completed',
                    totalVideosWatched: config.currentVideoIndex + 1
                });
                console.log("🏆 Course Archived.");

                // Update Config
                config.status = 'completed';
                config.currentVideoIndex += 1;
                await config.save();
            } else {
                // Increment
                config.currentVideoIndex += 1;
                config.status = `ongoing-${config.currentVideoIndex}`;
                await config.save();
                console.log(`💾 Progress Saved: ${config.status}`);
            }
        }

    } catch (e) {
        console.error("❌ Fatal Error:", e);
        // Do not update DB on fatal errors
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log("👋 Workflow Complete.");
        process.exit(0);
    }
})();