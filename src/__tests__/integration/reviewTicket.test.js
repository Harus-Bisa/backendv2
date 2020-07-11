const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const createUserHelper = require('../helper/createUser');
const createRevieweeWithReviews = require('../helper/createRevieweeWithReviews');

const randomstring= require('randomstring')

const sgMail = require('@sendgrid/mail');
jest.mock('@sendgrid/mail');

var mailApiCalled = 0;
var reviewee;
const additionalMessage = 'random message';
const issueType = 'random issue type';

var userEmail;
var userPassword;
var userId;
var userAuthenticationToken;

beforeAll(async (done) => {
	({
		userEmail,
		userPassword,
		userId,
		userAuthenticationToken,
	} = await createUserHelper());

	done();
});

describe('Review ticket endpoints', () => {
	it('submitting review ticket without authenticated should fail', async (done) => {
		const res = await request(app)
			.post('/tickets/reviews/')
			.send({});

		expect(res.statusCode).toEqual(401);
		done();
	});

	it('submitting review ticket should be successful', async (done) => {
		({ authorId, reviewee } = await createRevieweeWithReviews(1, userId));

		let ticketInfo = {
			revieweeId: reviewee.revieweeId,
			reviewId: reviewee.reviews[0].reviewId,
			authorId: userId,
			additionalMessage,
			issueType,
		};

		const res = await request(app)
			.post('/tickets/reviews/')
			.set('authorization', 'Bearer ' + userAuthenticationToken)
			.send(ticketInfo);

		expect(res.statusCode).toBe(201);
		expect(res.body.revieweeId).toBe(reviewee.revieweeId);
		expect(res.body.reviewId).toBe(reviewee.reviews[0].reviewId);
		expect(res.body.authorId).toBe(userId);
		expect(res.body.authorEmail).toBe(userEmail);
		expect(res.body.additionalMessage).toEqual(additionalMessage);
		expect(res.body.issueType).toBe(issueType);
		expect(res.body.reviewContent).toBe(reviewee.reviews[0].review);
		done();
	});

	it('sending email notification should be successful', async (done) => {
		mailApiCalled += 1;
		expect(sgMail.send).toHaveBeenCalledTimes(mailApiCalled);

		const message = sgMail.send.mock.calls[mailApiCalled - 1][0].text;
		const splitted_message = message.split('\n');
		expect(splitted_message[1].split(': ')[1]).toBe(reviewee.revieweeId);
		expect(splitted_message[2].split(': ')[1]).toBe(
			reviewee.reviews[0].reviewId
		);
		expect(splitted_message[3].split(': ')[1]).toBe(userId);
		expect(splitted_message[4].split(': ')[1]).toBe(userEmail);
		expect(splitted_message[5].split(': ')[1]).toBe(issueType);
		expect(splitted_message[6].split(': ')[1]).toBe(additionalMessage);
		expect(splitted_message[7].split(': ')[1]).toBe(reviewee.reviews[0].review);
		done();
	});

	it('user database should be updated', async (done) => {
		const user = await User.findOne({ email: userEmail });
		const userReportedReviews = user.reportedReviews;
		const userLastReportedReview =
			userReportedReviews[userReportedReviews.length - 1];

		expect(userLastReportedReview.revieweeId.toString()).toEqual(
			reviewee.revieweeId
		);
		expect(userLastReportedReview.reviewId.toString()).toEqual(
			reviewee.reviews[0].reviewId
		);
		done();
	});
});
