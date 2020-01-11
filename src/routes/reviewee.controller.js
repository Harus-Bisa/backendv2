const express = require('express');

const RevieweeService = require('../services/reviewee.service');
const UserService = require('../services/user.service');
const authentication = require('../middlewares/auth.middleware');

const router = express.Router();
const revieweeService = RevieweeService();
const userService = UserService();

router.post('/', authentication, async (req, res) => {
	if (!req.authenticated) {
		res.statusMessage = 'Authentication is required to create new review.';
		return res.status(401).end();
	}

	try {
		const { newReviewee } = await revieweeService.createRevieweeWithReview(
			req.body
		);
		const { outgoingReview } = await userService.addOutgoingReview(
			req.userId,
			newReviewee.revieweeId,
			newReviewee.reviews[newReviewee.reviews.length - 1].reviewId
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
		const { reviewees } = await revieweeService.getRevieweesByName(
			req.query.name
		);
		res.statusMessage =
			'Get list of reviewees matching the query is successful.';
		return res.status(200).send(reviewees);
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
		const { revieweeId, newReview } = await revieweeService.createReview(
			req.params.revieweeId,
			req.body
		);
		if (revieweeId) {
			const { outgoingReview } = await userService.addOutgoingReview(
				req.userId,
				revieweeId,
				newReview.reviewId
			);
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
			const {
				cancelVote,
				switchVote,
				selectedVote,
				user
			} = await userService.updateHelpfulnessVote(
				req.userId,
				req.params.revieweeId,
				req.params.reviewId,
				req.params.vote
			);

			if (!user) {
				res.statusMessage = 'There was an error finding the user associated with the authentication token.';
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
					req.userId,
					req.params.revieweeId,
					req.params.reviewId,
					req.params.vote
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
