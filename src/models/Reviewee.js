const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  review: String,
  courseName: String,
  overallRating: Number,
  recommendationRating: Number,
  difficultyRating: Number,
  yearTaken: Number,
  grade: String,
  textbookRequired: Boolean,
  helpfulUpVote: Number,
  helpfulDownVote: Number,
  tags: [String],
  teachingStyles: [String],
  createdAt: Number,
});

const revieweeSchema = new mongoose.Schema({
  name: String,
  school: String,
  reviews: [reviewSchema],
});

revieweeSchema.statics.getReviewees = function(
  name,
  school,
) {
  const schoolQuery = school ? `(?i)(^| )${school}.*` : '.*';
  const nameQuery = name ? `(?i)(^| )${name}.*` : '.*';

  return this.find({
    $and: [
      { name: { $regex: nameQuery } },
      { school: { $regex: schoolQuery } },
    ],
  })
};

module.exports = mongoose.model('Reviewee', revieweeSchema);
