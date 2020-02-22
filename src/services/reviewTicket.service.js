const ReviewTicket = require('../models/ReviewTicket');
const nodemailer = require('nodemailer');
const mg = require('nodemailer-mailgun-transport');
const config = require('../config');

const UserService = require('./user.service');
const RevieweeService = require('./reviewee.service');

const userService = UserService();
const revieweeService = RevieweeService();

function ReviewTicketService() {
	return Object.freeze({
		createTicket,
	});

	async function createTicket(ticketInformation) {
		ticketInformation.createAt = Date.now();

		const auth = {
			auth: {
				api_key: config.mailgunAPIKey,
				domain: config.mailgunDomain,
			},
		};

		const { user } = await userService.getUserById(ticketInformation.authorId);
		const { review } = await revieweeService.getReviewById(
			ticketInformation.revieweeId,
			ticketInformation.reviewId
		);

		const nodemailerMailgun = nodemailer.createTransport(mg(auth));
		const message =
			`Created at: ${Date(ticketInformation.createAt).toString()}\n` +
			`Reviewee id: ${ticketInformation.revieweeId}\n` +
			`Review id: ${ticketInformation.reviewId}\n` +
			`Author id: ${ticketInformation.authorId}\n` +
			`Author email: ${user.email}\n` +
			`Issue type: ${ticketInformation.issueType}\n` +
			`Additional message: ${ticketInformation.additionalMessage}\n` +
			`Review content: ${review.review}\n`;

		nodemailerMailgun.sendMail({
			from: 'noreply@dosen-ku.com',
			to: 'dosenku.official@gmail.com',
			subject: 'New Review Flag',
			text: message,
		});

		let newTicket = await ReviewTicket.create(ticketInformation);
		return { newTicket };
	}
}

module.exports = ReviewTicketService;
