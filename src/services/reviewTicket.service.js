const ReviewTicket = require('../models/ReviewTicket');
const nodemailer = require('nodemailer');
const mg = require('nodemailer-mailgun-transport');
const config = require('../config');

const UserService = require('./user.service');
const RevieweeService = require('./reviewee.service');
const EmailService = require('./email.service');

const userService = new UserService();
const revieweeService = new RevieweeService();
const emailService = new EmailService();

class ReviewTicketService {
	async createTicket(
		authorId,
		revieweeId,
		reviewId,
		issueType,
		additionalMessage
	) {
		userService.addReportedReview(authorId, revieweeId, reviewId);

		const { user } = await userService.getUserById(authorId);
		const { review } = await revieweeService.getReviewById(
			revieweeId,
			reviewId
		);
		const createdAt = Date.now();
		const authorEmail = user.email;
		const reviewContent = review.review;

		const message =
			`Created at: ${Date(createdAt).toString()}\n` +
			`Reviewee id: ${revieweeId}\n` +
			`Review id: ${reviewId}\n` +
			`Author id: ${authorId}\n` +
			`Author email: ${user.email}\n` +
			`Issue type: ${issueType}\n` +
			`Additional message: ${additionalMessage}\n` +
			`Review content: ${reviewContent}\n`;

		const to = 'dosenku.official@gmail.com';
		const subject = 'New Review Flag';
		emailService.sendEmail(to, subject, message);

		let newTicket = await ReviewTicket.createTicket(
			authorId,
			authorEmail,
			revieweeId,
			reviewId,
			createdAt,
			issueType,
			additionalMessage,
			reviewContent
		);
		return { newTicket };
	}
}

module.exports = ReviewTicketService;
