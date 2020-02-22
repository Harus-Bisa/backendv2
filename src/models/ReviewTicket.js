const mongoose = require('mongoose');

const reviewTicketSchema = new mongoose.Schema({
  createdAt: Number,
  revieweeId: mongoose.Schema.Types.ObjectId,
  reviewId: mongoose.Schema.Types.ObjectId,
  authorId: mongoose.Schema.Types.ObjectId,
  authorEmail: String,
  issueType: String,
  additionalMessage: String,
  reviewContent: String
});

module.exports = mongoose.model('ReviewTicket', reviewTicketSchema);