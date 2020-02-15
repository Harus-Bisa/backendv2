const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  createdAt: Number,
  targetId: mongoose.Schema.Types.ObjectId,
  targetType: String,
  authorId: mongoose.Schema.Types.ObjectId,
  authorEmail: String,
  issueType: String,
  message: String,
});

module.exports = mongoose.model('Ticket', ticketSchema);