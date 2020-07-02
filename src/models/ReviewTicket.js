const mongoose = require('mongoose');

const reviewTicketSchema = new mongoose.Schema({
	createdAt: Number,
	revieweeId: mongoose.Schema.Types.ObjectId,
	reviewId: mongoose.Schema.Types.ObjectId,
	authorId: mongoose.Schema.Types.ObjectId,
	authorEmail: String,
	issueType: String,
	additionalMessage: String,
	reviewContent: String,
});

reviewTicketSchema.statics.createTicket = function(
	authorId,
	authorEmail,
	revieweeId,
	reviewId,
	createdAt,
	issueType,
	additionalMessage,
	reviewContent
) {
	return this.create({
		authorId,
		authorEmail,
		revieweeId,
		reviewId,
		createdAt,
		issueType,
		additionalMessage,
		reviewContent,
	});
};

module.exports = mongoose.model('ReviewTicket', reviewTicketSchema);
