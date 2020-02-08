const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
	school: { type: String, index: true },
});

module.exports = mongoose.model('School', schoolSchema);
