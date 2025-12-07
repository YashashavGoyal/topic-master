const mongoose = require('mongoose');

const CourseHistorySchema = new mongoose.Schema({
    playlistId: String,
    title: String,
    status: { 
        type: String, 
        enum: ['completed', 'abandoned'], 
        default: 'completed' 
    },
    totalVideosWatched: Number,
    dateCompleted: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CourseHistory', CourseHistorySchema);