const bcrypt = require('bcryptjs');
const randomstring = require('randomstring');
const jwt = require('jsonwebtoken');
const config = require('../../config');
const User = require('../../models/User');
const createUserHelper = require('./createUser');
const RevieweeService = require('../../services/reviewee.service');

const revieweeService = new RevieweeService();

async function createRevieweeWithReviews(
	reviewCount = 0,
	authorId = undefined
) {
	if (!authorId) {
		const {
			userEmail,
			userPassword,
			userId,
			userAuthenticationToken,
		} = await createUserHelper();

		authorId = userId;
	}

	const revieweeData = {
		name: randomstring.generate(),
		school: randomstring.generate(),
	};

	const { newReviewee } = await revieweeService.createRevieweeWithReview(
		authorId,
		revieweeData
	);

	for (i = 0; i < reviewCount; i++) {
		const review = {
			review: randomstring.generate(),
			courseName: randomstring.generate(),
			overallRating: i,
			recommendationRating: i + 1,
			difficultyRating: i + 2,
			yearTaken: 2020,
			grade: 'B+',
			textbookRequired: true,
			tags: [randomstring.generate()],
			teachingStyles: [randomstring.generate()],
		};
		await revieweeService.createReview(
			authorId,
			newReviewee.revieweeId,
			review
		);
	}

	const { reviewee } = await revieweeService.getRevieweeById(
		newReviewee.revieweeId,
		true,
		authorId
	);

	return { authorId, reviewee };
}

module.exports = createRevieweeWithReviews;
