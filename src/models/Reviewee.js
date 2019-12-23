const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  review: String,
  courseName: String,
  overallRating: Number,
  recommendationRating: Number,
  difficultyRating: Number,
  yearTaken: Number,
  textbookRequired: Boolean,
  helpfulUpVote: Number,
  helpfulDownVote: Number,
  tags: [String],
  teachingStyles: [String],
});

const revieweeSchema = new mongoose.Schema({
  name: String,
  school: String,
  reviews: [reviewSchema],
});

module.exports = mongoose.model('Reviewee', revieweeSchema);
