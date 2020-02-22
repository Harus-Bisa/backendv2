const mongoose = require('mongoose');

const recentSchema = new mongoose.Schema({
	type: { type: String, index: true },
	mostRecents: Array,
});

module.exports = mongoose.model('Recent', recentSchema);