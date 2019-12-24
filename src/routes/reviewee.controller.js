const express = require('express');

const RevieweeService = require('../services/reviewee.service');
const authentication = require('../middlewares/auth.middleware');

const router = express.Router();
const revieweeService = RevieweeService();

router.post('/', authentication, async (req, res) => {
	if (!req.authenticated) {
		res.statusMessage = 'Authentication is required to create new review.';
		return res.status(401).end();
	}

	try {
		const { newReviewee } = await revieweeService.createRevieweeWithReview(
			req.body
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
		const { reviewee } = await revieweeService.getReviewee(
			req.authenticated,
			req.params.revieweeId
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

router.post('/:revieweeId/reviews/:reviewId/:vote', authentication, async (req, res) => {
	if (!req.authenticated) {
		res.statusMessage = 'Authentication is required to add vote.';
		return res.status(401).end();
	}
	try {
		const { votedReview } = await revieweeService.addHelpfullnessVote(
			req.params.revieweeId,
			req.params.reviewId,
			req.params.vote
		);
		if (votedReview) {
			res.statusMessage = 'Add helpfulness vote to review is successful.';
			return res.status(201).send(votedReview);
		} else {
			res.statusMessage = 'Review not found.';
			return res.status(404).end();
		}
	} catch (err) {
		console.log(err);
		res.statusMessage =
			'There was an error adding helpfullness vote to the review.';
		return res.status(500).end();
	}
});

module.exports = router;
