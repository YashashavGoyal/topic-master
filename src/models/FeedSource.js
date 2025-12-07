const mongoose = require('mongoose');

const FeedSourceSchema = new mongoose.Schema({
    url: { type: String, required: true },
    name: String,
    type: { type: String, default: 'general' }
});

module.exports = mongoose.model('FeedSource', FeedSourceSchema);