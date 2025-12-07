const Parser = require('rss-parser');
const FeedSource = require('../models/FeedSource');

const parser = new Parser();

const fetchPlaylist = async (config) => {
    let dailyLesson = null;
    let isLastDay = false;
    
    try {
        const playlistUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${config.playlistId}`;
        const playlistFeed = await parser.parseURL(playlistUrl);
        const totalVideos = playlistFeed.items.length;
        
        console.log(`📊 Status: ${config.status} | Index: ${config.currentVideoIndex}`);

        if (config.status !== 'completed') {
            const video = playlistFeed.items[config.currentVideoIndex];
            
            if (video) {
                dailyLesson = {
                    title: video.title,
                    link: video.link,
                    source: "System Design Curriculum",
                    progress: `Lesson ${config.currentVideoIndex + 1}/${totalVideos}`
                };
            }

            if (config.currentVideoIndex >= totalVideos - 1) {
                isLastDay = true;
            }
        }
    } catch (e) {
        console.error("⚠️ Playlist Fetch Failed:", e.message);
    }
    return { dailyLesson, isLastDay };
};

const fetchGeneralFeeds = async () => {
    const sources = await FeedSource.find();
    let generalPool = [];
    
    const promises = sources.map(async (source) => {
        try {
            const feed = await parser.parseURL(source.url);
            return feed.items.slice(0, 2).map(item => ({
                title: item.title,
                link: item.link,
                source: source.name || 'Tech Source',
                date: item.pubDate
            }));
        } catch (e) { return []; }
    });

    const results = await Promise.all(promises);
    return results.flat();
};

module.exports = { fetchPlaylist, fetchGeneralFeeds };