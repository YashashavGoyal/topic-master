const ActiveConfig = require('../models/ActiveConfig');
const FeedSource = require('../models/FeedSource');

const ensureDbInitialized = async () => {
    // CHECK 1: Is ActiveConfig missing?
    const configCount = await ActiveConfig.countDocuments();
    if (configCount === 0) {
        console.log("🌱 Seeding ActiveConfig...");
        await ActiveConfig.create({
            playlistId: "PLinedj3B30sBlBWRox2V2tg9QJ2zr4M3o",
            currentVideoIndex: 0,
            status: "start"
        });
    }

    // CHECK 2: Are FeedSources missing? (This was skipped before!)
    const feedCount = await FeedSource.countDocuments();
    if (feedCount === 0) {
        console.log("🌱 Seeding FeedSources...");
        const defaultFeeds = [
            { url: 'https://netflixtechblog.com/feed', name: 'Netflix Tech' },
            { url: 'https://eng.uber.com/feed/', name: 'Uber Eng' },
            { url: 'https://aws.amazon.com/blogs/architecture/feed/', name: 'AWS Arch' },
            { url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCl4C_NK52aOGHOVv_cZf9aA', name: 'Piyush Garg' }
        ];
        await FeedSource.insertMany(defaultFeeds);
        console.log("✅ Feeds Inserted.");
    }
    
    console.log("✅ Database Integrity Check Complete.");
};

module.exports = ensureDbInitialized;