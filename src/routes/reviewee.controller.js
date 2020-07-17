const express = require('express');

const RevieweeService = require('../services/reviewee.service');
const UserService = require('../services/user.service');
const authentication = require('../middlewares/auth.middleware');

const router = express.Router();
const revieweeService = new RevieweeService();
const userService = new UserService();

router.post('/', authentication, async (req, res) => {
	try {
		if (!req.authenticated) {
			res.statusMessage = 'Authentication is required to create new review.';
			return res.status(401).end();
		}

		const name = req.body.name;
		const school = req.body.school;
		const review = req.body.review;
		const courseName = req.body.courseName;
		const overallRating =
			req.body.overallRating !== undefined
				? parseFloat(req.body.overallRating)
				: undefined;
		const recommendationRating =
			req.body.recommendationRating !== undefined
				? parseFloat(req.body.recommendationRating)
				: undefined;

		const difficultyRating =
			req.body.difficultyRating !== undefined
				? parseFloat(req.body.difficultyRating)
				: undefined;
		let yearTaken = req.body.yearTaken
			? parseInt(req.body.yearTaken)
			: undefined;

		const grade = req.body.grade;
		const tags = req.body.tags;
		const textbookRequired = req.body.textbookRequired;
		const teachingStyles = req.body.teachingStyles;

		if (name === undefined || school === undefined) {
			res.statusMessage = 'Please provide name and school.';
			return res.status(400).end();
		}

		if (
			(overallRating !== undefined && isNaN(overallRating)) ||
			(recommendationRating !== undefined && isNaN(recommendationRating)) ||
			(difficultyRating !== undefined && isNaN(difficultyRating)) ||
			(yearTaken !== undefined && isNaN(yearTaken))
		) {
			res.statusMessage =
				'Overall rating, recommendation rating, difficulty rating, and year taken must be number type.';
			return res.status(400).end();
		}

		const revieweeData = {
			name,
			school,
			review,
			courseName,
			overallRating,
			recommendationRating,
			difficultyRating,
			yearTaken,
			grade,
			tags,
			textbookRequired,
			teachingStyles,
		};

		const authorId = req.userId;
		const { newReviewee } = await revieweeService.createRevieweeWithReview(
			authorId,
			revieweeData
		);

		res.statusMessage = 'Create review for new reviewee is successful.';
		return res.status(201).send(newReviewee);
	} catch (err) {
		console.log(err);
		res.statusMessage =
			'There was an error creating a review for new reviewee.';
		return res.status(500).end();
	}
});

router.get('/', async (req, res) => {
	try {
		const name = req.query.name;
		const school = req.query.school;
		const index = req.query.index;
		const limit = req.query.limit;
		const sortBy = req.query.sortBy;
		let ascending = req.query.ascending;

		if (ascending && ascending === 'true') {
			ascending = true;
		} else if (ascending && ascending === 'false') {
			ascending = false;
		} else {
			ascending = undefined;
		}

		const {
			reviewees,
			totalReviewees,
		} = await revieweeService.getRevieweesByName(
			name,
			school,
			index,
			limit,
			sortBy,
			ascending
		);
		res.statusMessage =
			'Get list of reviewees matching the query is successful.';

		return res.status(200).send({ reviewees, totalReviewees });
	} catch (err) {
		console.log(err);
		res.statusMessage =
			'There was an error getting the reviewees matching the query.';
		return res.status(500).end();
	}
});

router.get('/:revieweeId', authentication, async (req, res) => {
	try {
		const { reviewee } = await revieweeService.getRevieweeById(
			req.params.revieweeId,
			req.authenticated,
			req.userId
		);
		if (reviewee) {
			res.statusMessage = 'Get reviewee is successful.';
			return res.status(200).send(reviewee);
		} else {
			res.statusMessage = 'Reviewee not found.';
			return res.status(404).end();
		}
	} catch (err) {
		console.log(err);
		res.statusMessage = 'There was an error getting the reviewee.';
		return res.status(500).end();
	}
});

router.post('/:revieweeId/reviews', authentication, async (req, res) => {
	if (!req.authenticated) {
		res.statusMessage = 'Authentication is required to create new review.';
		return res.status(401).end();
	}
	try {
		const review = {
			name: req.body.name,
			review: req.body.review,
			school: req.body.school,
			courseName: req.body.courseName,
			overallRating: req.body.overallRating,
			recommendationRating: req.body.recommendationRating,
			difficultyRating: req.body.difficultyRating,
			yearTaken: req.body.yearTaken,
			grade: req.body.grade,
			tags: req.body.tags,
			textbookRequired: req.body.textbookRequired,
			teachingStyles: req.body.teachingStyles,
		};
		const revieweeId = req.params.revieweeId;
		const authorId = req.userId;

		const { foundRevieweeId, newReview } = await revieweeService.createReview(
			authorId,
			revieweeId,
			review
		);

		if (foundRevieweeId) {
			res.statusMessage = 'Create review for a reviewee is successful.';
			return res.status(201).send(newReview);
		} else {
			res.statusMessage = 'Reviewee not found.';
			return res.status(404).end();
		}
	} catch (err) {
		console.log(err);
		res.statusMessage = 'There was an error creating the review.';
		return res.status(500).end();
	}
});

router.post(
	'/:revieweeId/reviews/:reviewId/:vote',
	authentication,
	async (req, res) => {
		if (!req.authenticated) {
			res.statusMessage = 'Authentication is required to add vote.';
			return res.status(401).end();
		}

		try {
			const userId = req.userId;
			const revieweeId = req.params.revieweeId;
			const reviewId = req.params.reviewId;
			const vote = req.params.vote;

			const {
				cancelVote,
				switchVote,
				selectedVote,
				user,
			} = await userService.updateHelpfulnessVote(
				userId,
				revieweeId,
				reviewId,
				vote
			);

			if (!user) {
				res.statusMessage =
					'There was an error finding the user associated with the authentication token.';
				return res.status(401).end();
			}

			const { votedReview } = await revieweeService.updateHelpfulnessVote(
				cancelVote,
				switchVote,
				selectedVote.revieweeId,
				selectedVote.reviewId,
				selectedVote.vote,
				req.userId
			);

			if (votedReview) {
				// check is duplicate TODO
				res.statusMessage = 'Add helpfulness vote to review is successful.';
				return res.status(201).send(votedReview);
			} else {
				// cancel adding helpfulness vote to user
				const {
					cancelVote,
					switchVote,
					selectedVote,
				} = await userService.updateHelpfulnessVote(
					userId,
					revieweeId,
					reviewId,
					vote
				);

				res.statusMessage = 'Review not found.';
				return res.status(404).end();
			}
		} catch (err) {
			console.log(err);
			res.statusMessage =
				'There was an error adding helpfullness vote to the review.';
			return res.status(500).end();
		}
	}
);

module.exports = router;
