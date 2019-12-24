const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
	name: String,
	email: { type: String, index: true },
	password: String,
	outgoingReviews: [
		{
			revieweeId: mongoose.Schema.Types.ObjectId,
			reviewId: mongoose.Schema.Types.ObjectId,
		},
	],
	following: [mongoose.Schema.Types.ObjectId],
});

module.exports = mongoose.model('User', userSchema);
