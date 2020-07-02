const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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
	reportedReviews: [
		{
			revieweeId: mongoose.Schema.Types.ObjectId,
			reviewId: mongoose.Schema.Types.ObjectId,
			_id: false,
		},
	],
	following: [mongoose.Schema.Types.ObjectId],
	isVerified: { type: Boolean, default: false },
});

userSchema.statics.createUser = function(userEmail, userPassword) {
	return this.create({ email: userEmail, password: userPassword });
};

userSchema.statics.findByEmail = function(userEmail) {
	return this.findOne({ email: userEmail });
};

userSchema.statics.addOutgoingReview = function(userId, review) {
	return this.findByIdAndUpdate(
		userId,
		{ $push: { outgoingReviews: review } },
		{ new: true }
	);
};

userSchema.statics.verifyUser = function(userId) {
	return this.findByIdAndUpdate(
		userId,
		{ $set: { isVerified: true } },
		{ new: true }
	);
};

module.exports = mongoose.model('User', userSchema);
