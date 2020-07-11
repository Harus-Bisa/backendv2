const express = require('express');

const ReviewTicketService = require('../services/reviewTicket.service');
const authentication = require('../middlewares/auth.middleware');

const router = express.Router();
const reviewTicketService = new ReviewTicketService();

router.post('/reviews/', authentication, async (req, res) => {
	if (!req.authenticated) {
		res.statusMessage = 'Authentication is required to create new ticket.';
		return res.status(401).end();
	}

	try {
		const authorId = req.body.authorId;
		const revieweeId = req.body.revieweeId;
		const reviewId = req.body.reviewId;
		const issueType = req.body.issueType;
		const additionalMessage = req.body.additionalMessage;

		if (
			authorId === undefined ||
			revieweeId === undefined ||
			reviewId === undefined ||
			issueType === undefined
		) {
			res.statusMessage =
				'Please provide authorId, revieweeId, reviewId, and issueType.';
			return res.status(400).end();
		}

		// TODO security issue using provided userId instead of token
		const { newTicket } = await reviewTicketService.createTicket(
			authorId,
			revieweeId,
			reviewId,
			issueType,
			additionalMessage
		);

		res.statusMessage = 'Review flag has been recorded successfully.';
		return res.status(201).send(newTicket);
	} catch (err) {
		console.log(err);
		res.statusMessage = 'There was an error flagging the review.';
		return res.status(500).end();
	}
});

module.exports = router;
