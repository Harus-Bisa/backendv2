const request = require('supertest');
const randomstring = require('randomstring');
const app = require('../../app');

const ReviewTicketService = require('../../services/reviewTicket.service');
jest.mock('../../services/reviewTicket.service.js');
jest.mock('../../middlewares/auth.middleware.js', () =>
	jest.fn((req, res, next) => {
		req.authenticated = true;
		next();
	})
);
const ticketServiceInstance = 0;

describe('Review Ticket endpoints', () => {
	it('create ticket with missing required field should fail', async (done) => {
		const ticketData = [
			{
				revieweeId: randomstring.generate(),
				reviewId: randomstring.generate(),
				issueType: randomstring.generate(),
			},
			{
				authorId: randomstring.generate(),
				reviewId: randomstring.generate(),
				issueType: randomstring.generate(),
			},
			{
				authorId: randomstring.generate(),
				revieweeId: randomstring.generate(),
				issueType: randomstring.generate(),
			},
			{
				authorId: randomstring.generate(),
				revieweeId: randomstring.generate(),
				reviewId: randomstring.generate(),
			},
		];

		for (i = 0; i < ticketData.length; i++) {
			const res = await request(app)
				.post('/tickets/reviews')
				.send(ticketData[i]);

			expect(res.statusCode).toEqual(400);
			expect(
				ReviewTicketService.mock.instances[ticketServiceInstance].createTicket
			).not.toHaveBeenCalled();
		}

		done();
	});

	it('create ticket should be successful', async (done) => {
		ReviewTicketService.prototype.createTicket.mockResolvedValueOnce({
			newTicket: {},
		});

		const ticketData = {
			authorId: randomstring.generate(),
			revieweeId: randomstring.generate(),
			reviewId: randomstring.generate(),
			issueType: randomstring.generate(),
			additionalMessage: randomstring.generate(),
		};

		const res = await request(app)
			.post('/tickets/reviews')
			.send(ticketData);

		expect(res.statusCode).toEqual(201);
		expect(
			ReviewTicketService.mock.instances[ticketServiceInstance].createTicket
		).toHaveBeenLastCalledWith(
			ticketData.authorId,
			ticketData.revieweeId,
			ticketData.reviewId,
			ticketData.issueType,
			ticketData.additionalMessage
		);

		done();
	});
});
