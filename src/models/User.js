const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
	name: String,
	email: { type: String, index: true },
	password: String,
	outgoingReviews: [
		{
			revieweeId: mongoose.Schema.Types.ObjectId,
			reviewId: mongoose.Schema.Types.ObjectId,
			_id: false,
		},
	],
	helpfulnessVotes: [
		{
			revieweeId: mongoose.Schema.Types.ObjectId,
			reviewId: mongoose.Schema.Types.ObjectId,
			vote: String,
			_id: false,
		},
	],
	following: [mongoose.Schema.Types.ObjectId],
	isVerified: { type: Boolean, default: false },
});

module.exports = mongoose.model('User', userSchema);
