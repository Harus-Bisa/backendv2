const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
	name: { type: String, index: true },
	revieweeCount: Number,
	visitedCount: Number,
});

module.exports = mongoose.model('School', schoolSchema);
