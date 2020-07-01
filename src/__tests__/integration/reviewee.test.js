const request = require('supertest');
const randomstring = require('randomstring');
const mongoose = require('mongoose');

const app = require('../../app');
const Reviewee = require('../../models/Reviewee');
const RevieweeService = require('../../services/reviewee.service');
const UserService = require('../../services/user.service');
const createUserHelper = require('../helper/createUser');

const revieweeService = new RevieweeService();
const userService = new UserService();

var revieweeId;
var reviewId;

const revieweeData = {
	name: randomstring.generate(),
	school: randomstring.generate(),
	review: randomstring.generate(),
	courseName: randomstring.generate(),
	overallRating: 4.3,
	recommendationRating: 3.5,
	difficultyRating: 2.6,
	yearTaken: 2020,
	grade: randomstring.generate(),
	tags: [randomstring.generate(), randomstring.generate()],
	textbookRequired: true,
	teachingStyles: [randomstring.generate()],
};

const fakeReviewees = [
	{
		name: 'alpha beta',
		school: 'charlie delta',
		reviews: [{ overallRating: 3.0 }, { overallRating: 4.0 }],
	},
	{
		name: 'epsilon fourrier',
		school: 'Del hess',
	},
	{
		name: 'Alp',
		school: 'chat gamma',
	},
];

const newReview = {
	review: randomstring.generate(),
	courseName: randomstring.generate(),
	overallRating: 5.0,
	recommendationRating: 5.0,
	difficultyRating: 5.0,
	yearTaken: 2020,
	grade: randomstring.generate(),
	textbookRequired: true,
	tags: [randomstring.generate(), randomstring.generate()],
	teachingStyles: [randomstring.generate()],
};

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

describe('Reviewee endpoints', () => {
	it('creating new reviewee without authenticated should fail', async (done) => {
		const res = await request(app)
			.post('/reviewees')
			.send(revieweeData);

		expect(res.statusCode).toEqual(401);
		done();
	});

	it('create new reviewee with no review should be successful', async (done) => {
		const revieweeWithNoReview = {
			name: randomstring.generate(),
			school: randomstring.generate(),
		};

		const res = await request(app)
			.post('/reviewees')
			.set('authorization', 'Bearer ' + userAuthenticationToken)
			.send(revieweeWithNoReview);

		expect(res.statusCode).toBe(201);

		expect(res.body.__v).not.toBeDefined();
		expect(res.body._id).not.toBeDefined();
		expect(res.body.revieweeId).toBeDefined();
		expect(res.body.name).toBe(revieweeWithNoReview.name);
		expect(res.body.school).toBe(revieweeWithNoReview.school);
		expect(Array.isArray(res.body.reviews)).toBe(true);
		expect(res.body.numberOfReviews).toBe(0);
		expect(res.body.overallRating).toBe(0);
		expect(res.body.recommendationRating).toBe(0);
		expect(res.body.difficultyRating).toBe(0);

		done();
	});

	it('create new reviewee with one review should be successful', async (done) => {
		const res = await request(app)
			.post('/reviewees')
			.set('authorization', 'Bearer ' + userAuthenticationToken)
			.send(revieweeData);

		expect(res.statusCode).toBe(201);

		revieweeId = res.body.revieweeId;
		reviewId = res.body.reviews[0].reviewId;

		expect(res.body.__v).not.toBeDefined();
		expect(res.body._id).not.toBeDefined();
		expect(res.body.revieweeId).toBeDefined();
		expect(res.body.name).toBe(revieweeData.name);
		expect(res.body.school).toBe(revieweeData.school);
		expect(Array.isArray(res.body.reviews)).toBe(true);
		expect(res.body.numberOfReviews).toBe(1);
		expect(res.body.overallRating).toBe(revieweeData.overallRating);
		expect(res.body.recommendationRating).toBe(
			revieweeData.recommendationRating
		);
		expect(res.body.difficultyRating).toBe(revieweeData.difficultyRating);

		// first review
		expect(res.body.reviews[0].review).toBe(revieweeData.review);
		expect(res.body.reviews[0].courseName).toBe(revieweeData.courseName);
		expect(res.body.reviews[0].overallRating).toBe(revieweeData.overallRating);
		expect(res.body.reviews[0].recommendationRating).toBe(
			revieweeData.recommendationRating
		);
		expect(res.body.reviews[0].difficultyRating).toBe(
			revieweeData.difficultyRating
		);
		expect(res.body.reviews[0].yearTaken).toBe(revieweeData.yearTaken);
		expect(res.body.reviews[0].grade).toBe(revieweeData.grade);
		expect(res.body.reviews[0].textbookRequired).toBe(
			revieweeData.textbookRequired
		);
		expect(res.body.reviews[0].helpfulUpVote).toBe(0);
		expect(res.body.reviews[0].helpfulDownVote).toBe(0);
		expect(res.body.reviews[0].tags).toEqual(revieweeData.tags);
		expect(res.body.reviews[0].teachingStyles).toEqual(
			revieweeData.teachingStyles
		);
		expect(res.body.reviews[0].isAuthor).toBe(true);
		expect(res.body.reviews[0].hasReported).toBe(false);
		expect(res.body.reviews[0].userVote).toBe(null);

		done();
	});

	it('new review should be added to the user outgoing review list', async (done) => {
		const {user} = await userService.getUserById(userId);
		const userOutgoingReviews = user.outgoingReviews;
		const lastOutgoingReview =
			userOutgoingReviews[userOutgoingReviews.length - 1];

		expect(lastOutgoingReview.revieweeId.toString()).toBe(revieweeId);
		expect(lastOutgoingReview.reviewId.toString()).toBe(reviewId);
		done();
	});

	it('query reviewees without options should be successful', async (done) => {
		const revieweeOne = fakeReviewees[0];
		const revieweeTwo = fakeReviewees[1];
		const revieweeThree = fakeReviewees[2];

		await Reviewee.deleteMany({});
		await Reviewee.create(revieweeOne);
		await Reviewee.create(revieweeTwo);
		await Reviewee.create(revieweeThree);

		const res = await request(app).get('/reviewees');

		expect(res.statusCode).toBe(200);
		expect(Array.isArray(res.body.reviewees)).toBe(true);

		const reviewees = res.body.reviewees;

		expect(reviewees[0].name).toBe(revieweeOne.name);
		expect(reviewees[0].school).toBe(revieweeOne.school);
		expect(reviewees[0].numberOfReviews).toBe(revieweeOne.reviews.length);
		const revieweeOneOverallRatingAvg =
			revieweeOne.reviews.reduce(
				(total, review) => total + review.overallRating,
				0
			) / revieweeOne.reviews.length;
		expect(reviewees[0].overallRating).toBe(revieweeOneOverallRatingAvg);
		expect(reviewees[0].reviews).not.toBeDefined();

		expect(reviewees[1].name).toBe(revieweeTwo.name);
		expect(reviewees[1].school).toBe(revieweeTwo.school);
		expect(reviewees[1].numberOfReviews).toBe(0);
		expect(reviewees[1].overallRating).toBe(0);

		expect(reviewees[2].name).toBe(revieweeThree.name);
		expect(reviewees[2].school).toBe(revieweeThree.school);
		expect(reviewees[2].numberOfReviews).toBe(0);
		expect(reviewees[2].overallRating).toBe(0);

		done();
	});

	it('query reviewees with no result', async (done) => {
		const res = await request(app)
			.get('/reviewees')
			.query({ name: 'xyz', school: 'xyz' });

		expect(res.statusCode).toBe(200);
		expect(Array.isArray(res.body.reviewees)).toBe(true);

		const reviewees = res.body.reviewees;
		expect(reviewees.length).toBe(0);
		done();
	});

	it('query reviewees based on name', async (done) => {
		const res = await request(app)
			.get('/reviewees')
			.query({ name: 'alp' });

		expect(res.statusCode).toBe(200);
		expect(Array.isArray(res.body.reviewees)).toBe(true);

		const reviewees = res.body.reviewees;
		expect(reviewees.length).toBe(2);
		expect(reviewees[0].name).toBe(fakeReviewees[0].name);
		expect(reviewees[1].name).toBe(fakeReviewees[2].name);

		done();
	});

	it('query reviewees based on school', async (done) => {
		const res = await request(app)
			.get('/reviewees')
			.query({ school: 'del' });

		expect(res.statusCode).toBe(200);
		expect(Array.isArray(res.body.reviewees)).toBe(true);

		const reviewees = res.body.reviewees;
		expect(reviewees.length).toBe(2);
		expect(reviewees[0].name).toBe(fakeReviewees[0].name);
		expect(reviewees[1].name).toBe(fakeReviewees[1].name);

		done();
	});

	it('query reviewees based on name and school', async (done) => {
		const res = await request(app)
			.get('/reviewees')
			.query({ name: 'alp', school: 'del' });

		expect(res.statusCode).toBe(200);
		expect(Array.isArray(res.body.reviewees)).toBe(true);

		const reviewees = res.body.reviewees;
		expect(reviewees.length).toBe(1);
		expect(reviewees[0].name).toBe(fakeReviewees[0].name);

		done();
	});

	it('query reviewees with limit', async (done) => {
		const res = await request(app)
			.get('/reviewees')
			.query({ name: 'alp', limit: 1 });

		expect(res.statusCode).toBe(200);
		expect(Array.isArray(res.body.reviewees)).toBe(true);

		const reviewees = res.body.reviewees;
		expect(reviewees.length).toBe(1);
		expect(reviewees[0].name).toBe(fakeReviewees[0].name);

		done();
	});

	it('query reviewees with limit and pagination', async (done) => {
		const res = await request(app)
			.get('/reviewees')
			.query({ name: 'alp', limit: 1, index: 1 });

		expect(res.statusCode).toBe(200);
		expect(Array.isArray(res.body.reviewees)).toBe(true);

		const reviewees = res.body.reviewees;
		expect(reviewees.length).toBe(1);
		expect(reviewees[0].name).toBe(fakeReviewees[2].name);

		done();
	});

	it('query reviewees with negative index should 0 reviewees', async (done) => {
		const res = await request(app)
			.get('/reviewees')
			.query({ index: -1 });

		expect(res.statusCode).toBe(200);
		expect(Array.isArray(res.body.reviewees)).toBe(true);

		const reviewees = res.body.reviewees;
		expect(reviewees.length).toBe(0);

		done();
	});

	it('query reviewees with overflow index', async (done) => {
		const res = await request(app)
			.get('/reviewees')
			.query({ index: 100 });

		expect(res.statusCode).toBe(200);
		expect(Array.isArray(res.body.reviewees)).toBe(true);

		const reviewees = res.body.reviewees;
		expect(reviewees.length).toBe(0);

		done();
	});

	it('query reviewees sort by name', async (done) => {
		const res = await request(app)
			.get('/reviewees')
			.query({ sortBy: 'name' });

		const reviewees = res.body.reviewees;
		expect(reviewees[0].name).toBe(fakeReviewees[2].name);
		expect(reviewees[1].name).toBe(fakeReviewees[0].name);
		expect(reviewees[2].name).toBe(fakeReviewees[1].name);
		done();
	});

	it('query reviewees sort by school', async (done) => {
		const res = await request(app)
			.get('/reviewees')
			.query({ sortBy: 'school' });

		const reviewees = res.body.reviewees;
		expect(reviewees[0].name).toBe(fakeReviewees[0].name);
		expect(reviewees[1].name).toBe(fakeReviewees[2].name);
		expect(reviewees[2].name).toBe(fakeReviewees[1].name);
		done();
	});

	it('query reviewees sort by total reviews', async (done) => {
		const res = await request(app)
			.get('/reviewees')
			.query({ sortBy: 'totalReviews' });

		const reviewees = res.body.reviewees;
		expect(reviewees[0].name).toBe(fakeReviewees[2].name);
		expect(reviewees[1].name).toBe(fakeReviewees[1].name);
		expect(reviewees[2].name).toBe(fakeReviewees[0].name);
		done();
	});

	it('query reviewees sort by overall rating', async (done) => {
		const res = await request(app)
			.get('/reviewees')
			.query({ sortBy: 'overallRating' });

		const reviewees = res.body.reviewees;
		expect(reviewees[0].name).toBe(fakeReviewees[2].name);
		expect(reviewees[1].name).toBe(fakeReviewees[1].name);
		expect(reviewees[2].name).toBe(fakeReviewees[0].name);
		done();
	});

	it('query reviewees sort by name in descending order', async (done) => {
		const res = await request(app)
			.get('/reviewees')
			.query({ sortBy: 'name', ascending: false });

		const reviewees = res.body.reviewees;
		expect(reviewees[0].name).toBe(fakeReviewees[1].name);
		expect(reviewees[1].name).toBe(fakeReviewees[0].name);
		expect(reviewees[2].name).toBe(fakeReviewees[2].name);
		done();
	});

	it('query reviewees return correct total reviewee', async (done) => {
		const res = await request(app)
			.get('/reviewees')
			.query({ limit: 1 });

		expect(res.statusCode).toBe(200);
		expect(Array.isArray(res.body.reviewees)).toBe(true);
		const reviewees = res.body.reviewees;
		expect(reviewees.length).toBe(1);
		expect(res.body.totalReviewees).toBe(3);
		done();
	});

	it('create new review without authentication should fail', async (done) => {
		const randomRevieweeId = mongoose.Types.ObjectId();
		const res = await request(app).post(
			'/reviewees/' + randomRevieweeId + '/reviews'
		);

		expect(res.statusCode).toBe(401);
		done();
	});

	it('create new review for non existent reviewee should fail', async (done) => {
		const randomRevieweeId = mongoose.Types.ObjectId();
		const res = await request(app)
			.post('/reviewees/' + randomRevieweeId + '/reviews')
			.set('authorization', 'Bearer ' + userAuthenticationToken);

		expect(res.statusCode).toBe(404);
		done();
	});

	it('create new review should be successful', async (done) => {
		const { newReviewee } = await revieweeService.createRevieweeWithReview(
			userId,
			{}
		);

		const res = await request(app)
			.post('/reviewees/' + newReviewee.revieweeId + '/reviews')
			.set('authorization', 'Bearer ' + userAuthenticationToken)
			.send(newReview);

		expect(res.statusCode).toBe(201);
		expect(res.body.reviewId).toBeDefined();
		expect(res.body.review).toBe(newReview.review);
		expect(res.body.courseName).toBe(newReview.courseName);
		expect(res.body.overallRating).toBe(newReview.overallRating);
		expect(res.body.recommendationRating).toBe(newReview.recommendationRating);
		expect(res.body.difficultyRating).toBe(newReview.difficultyRating);
		expect(res.body.yearTaken).toBe(newReview.yearTaken);
		expect(res.body.grade).toBe(newReview.grade);
		expect(res.body.textbookRequired).toBe(newReview.textbookRequired);
		expect(res.body.helpfulUpVote).toBe(0);
		expect(res.body.helpfulDownVote).toBe(0);
		expect(res.body.tags).toEqual(newReview.tags);
		expect(res.body.teachingStyles).toEqual(newReview.teachingStyles);
		expect(res.body.isAuthor).toBe(true);
		expect(res.body.hasReported).toBe(false);
		expect(res.body.userVote).toBe(null);

		const {user} = await userService.getUserById(userId);
		const userOutgoingReviews = user.outgoingReviews;
		const lastOutgoingReview =
			userOutgoingReviews[userOutgoingReviews.length - 1];

		expect(lastOutgoingReview.revieweeId.toString()).toBe(
			newReviewee.revieweeId
		);
		expect(lastOutgoingReview.reviewId.toString()).toBe(res.body.reviewId);
		done();
	});

	it('vote review without authentication should fail', async (done) => {
		const randomRevieweeId = mongoose.Types.ObjectId();
		const randomReviewId = mongoose.Types.ObjectId();
		const res = await request(app).post(
			'/reviewees/' +
				randomRevieweeId +
				'/reviews/' +
				randomReviewId +
				'/upVote'
		);

		expect(res.statusCode).toBe(401);
		done();
	});

	it('vote review for non existent reviewee should fail', async (done) => {
		const randomRevieweeId = mongoose.Types.ObjectId();
		const randomReviewId = mongoose.Types.ObjectId();
		const res = await request(app)
			.post(
				'/reviewees/' +
					randomRevieweeId +
					'/reviews/' +
					randomReviewId +
					'/upVote'
			)
			.set('authorization', 'Bearer ' + userAuthenticationToken);

		expect(res.statusCode).toBe(404);
		done();
	});

	it('vote review for non existent review should fail', async (done) => {
		const { newReviewee } = await revieweeService.createRevieweeWithReview(
			userId,
			{}
		);
		const randomReviewId = mongoose.Types.ObjectId();
		const res = await request(app)
			.post(
				'/reviewees/' +
					newReviewee.revieweeId +
					'/reviews/' +
					randomReviewId +
					'/upVote'
			)
			.set('authorization', 'Bearer ' + userAuthenticationToken);

		expect(res.statusCode).toBe(404);
		done();
	});

	it('vote up review should be successful', async (done) => {
		let { newReviewee } = await revieweeService.createRevieweeWithReview(
			userId,
			{ review: 'random review' }
		);
		let reviewee = newReviewee;

		firstReview = newReviewee.reviews[0];
		const vote = 'upVote';
		const res = await request(app)
			.post(
				'/reviewees/' +
					reviewee.revieweeId +
					'/reviews/' +
					firstReview.reviewId +
					'/' +
					vote
			)
			.set('authorization', 'Bearer ' + userAuthenticationToken);

		expect(res.statusCode).toBe(201);
		expect(res.body.reviewId).toBe(firstReview.reviewId.toString());
		expect(res.body.userVote).toBe(vote);
		expect(res.body.helpfulUpVote).toBe(firstReview.helpfulUpVote + 1);
		expect(res.body.helpfulDownVote).toBe(firstReview.helpfulDownVote);

		done();
	});

	it('vote down review should be successful', async (done) => {
		let { newReviewee } = await revieweeService.createRevieweeWithReview(
			userId,
			{ review: 'random review' }
		);
		let reviewee = newReviewee;

		firstReview = reviewee.reviews[0];
		const vote = 'downVote';
		const res = await request(app)
			.post(
				'/reviewees/' +
					reviewee.revieweeId +
					'/reviews/' +
					firstReview.reviewId +
					'/' +
					vote
			)
			.set('authorization', 'Bearer ' + userAuthenticationToken);

		expect(res.statusCode).toBe(201);
		expect(res.body.reviewId).toBe(firstReview.reviewId.toString());
		expect(res.body.userVote).toBe(vote);
		expect(res.body.helpfulUpVote).toBe(firstReview.helpfulUpVote);
		expect(res.body.helpfulDownVote).toBe(firstReview.helpfulDownVote + 1);

		done();
	});

	it('cancel up vote should be successful', async (done) => {
		let { newReviewee } = await revieweeService.createRevieweeWithReview(
			userId,
			{ review: 'random review' }
		);
		let reviewee = newReviewee;
		firstReview = reviewee.reviews[0];

		let res;
		const votes = ['upVote', 'upVote'];
		for (i = 0; i < votes.length; i++) {
			res = await request(app)
				.post(
					'/reviewees/' +
						reviewee.revieweeId +
						'/reviews/' +
						firstReview.reviewId +
						'/' +
						votes[i]
				)
				.set('authorization', 'Bearer ' + userAuthenticationToken);
		}

		expect(res.statusCode).toBe(201);
		expect(res.body.reviewId).toBe(firstReview.reviewId.toString());
		expect(res.body.userVote).toBe(null);
		expect(res.body.helpfulUpVote).toBe(firstReview.helpfulUpVote);
		expect(res.body.helpfulDownVote).toBe(firstReview.helpfulDownVote);

		done();
	});

	it('cancel down vote should be successful', async (done) => {
		let { newReviewee } = await revieweeService.createRevieweeWithReview(
			userId,
			{ review: 'random review' }
		);
		let reviewee = newReviewee;
		firstReview = reviewee.reviews[0];

		let res;
		const votes = ['downVote', 'downVote'];
		for (i = 0; i < votes.length; i++) {
			res = await request(app)
				.post(
					'/reviewees/' +
						reviewee.revieweeId +
						'/reviews/' +
						firstReview.reviewId +
						'/' +
						votes[i]
				)
				.set('authorization', 'Bearer ' + userAuthenticationToken);
		}

		expect(res.statusCode).toBe(201);
		expect(res.body.reviewId).toBe(firstReview.reviewId.toString());
		expect(res.body.userVote).toBe(null);
		expect(res.body.helpfulUpVote).toBe(firstReview.helpfulUpVote);
		expect(res.body.helpfulDownVote).toBe(firstReview.helpfulDownVote);

		done();
	});

	it('switching up vote to down vote should be successful', async (done) => {
		let { newReviewee } = await revieweeService.createRevieweeWithReview(
			userId,
			{ review: 'random review' }
		);
		let reviewee = newReviewee;
		firstReview = reviewee.reviews[0];

		let res;
		const votes = ['upVote', 'downVote'];
		for (i = 0; i < votes.length; i++) {
			res = await request(app)
				.post(
					'/reviewees/' +
						reviewee.revieweeId +
						'/reviews/' +
						firstReview.reviewId +
						'/' +
						votes[i]
				)
				.set('authorization', 'Bearer ' + userAuthenticationToken);
		}

		expect(res.statusCode).toBe(201);
		expect(res.body.reviewId).toBe(firstReview.reviewId.toString());
		expect(res.body.userVote).toBe('downVote');
		expect(res.body.helpfulUpVote).toBe(firstReview.helpfulUpVote);
		expect(res.body.helpfulDownVote).toBe(firstReview.helpfulDownVote + 1);

		done();
	});

	it('switching down vote to up vote should be successful', async (done) => {
		let { newReviewee } = await revieweeService.createRevieweeWithReview(
			userId,
			{ review: 'random review' }
		);
		let reviewee = newReviewee;
		firstReview = reviewee.reviews[0];

		let res;
		const votes = ['downVote', 'upVote'];
		for (i = 0; i < votes.length; i++) {
			res = await request(app)
				.post(
					'/reviewees/' +
						reviewee.revieweeId +
						'/reviews/' +
						firstReview.reviewId +
						'/' +
						votes[i]
				)
				.set('authorization', 'Bearer ' + userAuthenticationToken);
		}

		expect(res.statusCode).toBe(201);
		expect(res.body.reviewId).toBe(firstReview.reviewId.toString());
		expect(res.body.userVote).toBe('upVote');
		expect(res.body.helpfulUpVote).toBe(firstReview.helpfulUpVote + 1);
		expect(res.body.helpfulDownVote).toBe(firstReview.helpfulDownVote);

		done();
	});

	it('get non existent reviewee by id should fail', async (done) => {
		const randomRevieweeId = mongoose.Types.ObjectId();
		const res = await request(app).get('/reviewees/' + randomRevieweeId);

		expect(res.statusCode).toBe(404);
		done();
	});

	it('get reviews should be succesful', async (done) => {
		const { newReviewee } = await revieweeService.createRevieweeWithReview(
			userId,
			{}
		);
		const authorId = mongoose.Types.ObjectId();
		const totalReviews = 5;
		for (i = 0; i < totalReviews; i++) {
			await revieweeService.createReview(authorId, newReviewee.revieweeId, {});
		}

		const res = await request(app)
			.get('/reviewees/' + newReviewee.revieweeId)
			.set('authorization', 'Bearer ' + userAuthenticationToken);

		expect(res.statusCode).toBe(200);
		expect(res.body.revieweeId).toBe(newReviewee.revieweeId.toString());
		expect(res.body.reviews.length).toBe(totalReviews);
		expect(res.body.numberOfReviews).toBe(totalReviews);
		done();
	});

	it('get reviews without authenticated should be limited', async (done) => {
		const totalReviewsLimit = 3;
		const { newReviewee } = await revieweeService.createRevieweeWithReview(
			userId,
			{}
		);
		const randomAuthorId = mongoose.Types.ObjectId();
		const totalReviews = 5;

		for (i = 0; i < totalReviews; i++) {
			await revieweeService.createReview(
				randomAuthorId,
				newReviewee.revieweeId,
				{}
			);
		}

		const res = await request(app).get('/reviewees/' + newReviewee.revieweeId);

		expect(res.statusCode).toBe(200);
		expect(res.body.reviews.length).toBe(totalReviewsLimit);
		expect(res.body.numberOfReviews).toBe(totalReviews);
		done();
	});

	it('isAuthor flag in review should be correct', async (done) => {
		const randomAuthorId = mongoose.Types.ObjectId();
		let { newReviewee } = await revieweeService.createRevieweeWithReview(
			randomAuthorId,
			{
				review: 'random review',
			}
		);

		await revieweeService.createReview(
			randomAuthorId,
			newReviewee.reviewId,
			{}
		);

		// without authentication token
		let res = await request(app).get('/reviewees/' + newReviewee.revieweeId);
		expect(res.statusCode).toBe(200);
		expect(res.body.reviews[0].isAuthor).toBe(false);

		// with authentication token but not author
		res = await request(app)
			.get('/reviewees/' + newReviewee.revieweeId)
			.set('authorization', 'Bearer ' + userAuthenticationToken);
		expect(res.statusCode).toBe(200);
		expect(res.body.reviews[0].isAuthor).toBe(false);

		// with authentication token and is author
		({ newReviewee } = await revieweeService.createRevieweeWithReview(userId, {
			review: 'random review',
		}));

		res = await request(app)
			.get('/reviewees/' + newReviewee.revieweeId)
			.set('authorization', 'Bearer ' + userAuthenticationToken);

		// review with isAuthor == true is in the beginning by business logic
		// more on: reviewee.service.js --> sortReviewsByAuthor
		expect(res.body.reviews[0].isAuthor).toBe(true);
		done();
	});

	it('hasReported flag in review should be correct', async (done) => {
		const randomAuthorId = mongoose.Types.ObjectId();
		let {
			newReviewee,
		} = await revieweeService.createRevieweeWithReview(randomAuthorId, {
			review: 'random review',
		});
		const { foundRevieweeId, newReview } = await revieweeService.createReview(
			randomAuthorId,
			newReviewee.revieweeId,
			{}
		);

		// without authentication token
		let res = await request(app).get('/reviewees/' + newReviewee.revieweeId);
		expect(res.statusCode).toBe(200);
		expect(res.body.reviews[0].hasReported).toBe(false);

		// with authentication token but hasn't reported review
		res = await request(app)
			.get('/reviewees/' + newReviewee.revieweeId)
			.set('authorization', 'Bearer ' + userAuthenticationToken);
		expect(res.body.reviews[0].hasReported).toBe(false);

		// with authentication token and reported review
		await userService.addReportedReview(
			userId,
			newReviewee.revieweeId,
			newReview.reviewId
		);
		res = await request(app)
			.get('/reviewees/' + newReviewee.revieweeId)
			.set('authorization', 'Bearer ' + userAuthenticationToken);
		expect(res.body.reviews[0].hasReported).toBe(true);

		done();
	});
});
