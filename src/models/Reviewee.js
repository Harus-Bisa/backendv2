const mongoose = require('mongoose');
const { aggregate } = require('./User');

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

revieweeSchema.statics.createReviewee = function(
	name,
	school,
	review = undefined
) {
	let newReviewee = {
		name,
		school,
		reviews: [],
	};

	if (review) {
		newReviewee.reviews.push(review);
	}

	return this.create(newReviewee);
};

revieweeSchema.statics.getReviewees = function(
	name,
	school,
	sortBy,
	ascending,
	skip,
	limit
) {
	const schoolQuery = school ? `(?i)(^| )${school}.*` : '.*';
	const nameQuery = name ? `(?i)(^| )${name}.*` : '.*';

	ascending = ascending === true ? 1 : -1;
	let sortQuery = {};

	switch (sortBy) {
		case 'name':
			sortQuery = { lowerName: ascending };
			break;
		case 'school':
			sortQuery = { lowerSchool: ascending };
			break;
		case 'totalReviews':
			sortQuery = { numberOfReviews: ascending, name: 1 };
			break;
		case 'overallRating':
			sortQuery = { overallRating: ascending, name: 1 };
			break;
	}

	return this.aggregate([
		{
			$project: {
				_id: 0,
				revieweeId: { $toString: '$_id' },
				name: '$name',
				school: '$school',
				lowerName: { $toLower: '$name' },
				lowerSchool: { $toLower: '$school' },
				numberOfReviews: {
					$cond: {
						if: { $ifNull: ['$reviews', false] },
						then: { $size: '$reviews' },
						else: 0,
					},
				},
				overallRating: { $avg: '$reviews.overallRating' },
			},
		},
		{
			$match: { name: { $regex: nameQuery }, school: { $regex: schoolQuery } },
		},
		{ $sort: sortQuery },
		{ $skip: skip },
		{ $limit: limit },
		{ $unset: ['lowerName', 'lowerSchool'] },
	]);
};

revieweeSchema.statics.createReview = function(revieweeId, newReview) {
	return this.findByIdAndUpdate(
		revieweeId,
		{ $push: { reviews: newReview } },
		{ new: true }
	);
};

module.exports = mongoose.model('Reviewee', revieweeSchema);
