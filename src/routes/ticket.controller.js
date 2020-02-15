const express = require('express');

const TicketService = require('../services/ticket.service');
const authentication = require('../middlewares/auth.middleware');

const router = express.Router();
const ticketService = TicketService();

router.post('/', authentication, async (req, res) => {
	if (!req.authenticated) {
		res.statusMessage = 'Authentication is required to create new ticket.';
		return res.status(401).end();
	}

	try {
		const { newTicket } = await ticketService.createTicket(
			req.body
		);

		res.statusMessage = 'Create new ticket is successful.';
		return res.status(201).send(newTicket);
	} catch (err) {
		console.log(err);
		res.statusMessage =
			'There was an error creating the ticket.';
		return res.status(500).end();
	}
});

module.exports = router;
