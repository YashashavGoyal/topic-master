const mongoose = require('mongoose');

const ActiveConfigSchema = new mongoose.Schema({
    playlistId: { type: String, required: true },
    currentVideoIndex: { type: Number, default: 0 },
    // Status: "start", "ongoing-5", "completed"
    status: { type: String, default: 'start' } 
});

module.exports = mongoose.model('ActiveConfig', ActiveConfigSchema);