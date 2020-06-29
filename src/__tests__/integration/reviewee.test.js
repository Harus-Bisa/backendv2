const request = require('supertest');
const randomstring = require('randomstring');
const app = require('../../app');
const sgMail = require('@sendgrid/mail');
const User = require('../../models/User');
const Reviewee = require('../../models/Reviewee');

jest.mock('@sendgrid/mail');

const userEmail = randomstring.generate() + '@gmail.com';
const userPassword = randomstring.generate();
var userVerificationToken;
var userAuthenticationToken;
var userId;

var revieweeId;
var reviewId;

const userInfo = {
	email: userEmail,
	password: userPassword,
};

const name = randomstring.generate();
const school = randomstring.generate();
const review = randomstring.generate();
const courseName = randomstring.generate();
const overallRating = 4.3;
const recommendationRating = 3.5;
const difficultyRating = 2.6;
const yearTaken = 2020;
const grade = randomstring.generate();
const tags = [randomstring.generate(), randomstring.generate()];
const textbookRequired = true;
const teachingStyles = [randomstring.generate()];

const revieweeData = {
	name,
	review,
	school,
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

var mailApiCalled = 0;

describe('Reviewee endpoints', () => {
	it('creating new reviewee without authenticated should fail', async (done) => {
		const res = await request(app)
			.post('/reviewees')
			.send(revieweeData);

		expect(res.statusCode).toEqual(401);
		done();
	});

	it('signup should be successful', async (done) => {
		const res = await request(app)
			.post('/signup')
			.send(userInfo);

		expect(res.statusCode).toEqual(201);
		done();
	});

	it('verification email should be sent correctly', async (done) => {
		setTimeout(() => {
			mailApiCalled += 1;
			expect(sgMail.send).toHaveBeenCalledTimes(mailApiCalled);
			expect(sgMail.send.mock.calls[mailApiCalled - 1][0].to).toBe(userEmail);

			userVerificationToken = sgMail.send.mock.calls[mailApiCalled - 1][0].text
				.split('/')
				.slice(-1)[0];
			done();
		}, 500);
	});

	it('verify user should be successful', async (done) => {
		const res = await request(app).get(
			'/verification/' + userVerificationToken
		);

		expect(res.statusCode).toEqual(302);
		done();
	});

	it('login after verified should be successful', async (done) => {
		const res = await request(app)
			.post('/login')
			.send(userInfo);

		expect(res.statusCode).toEqual(200);
		expect(res.body.userId).toBeDefined();
		expect(res.body.token).toBeDefined();

		userAuthenticationToken = res.body.token;
		userId = res.body.userId;

		done();
	});

	it('create new review for new reviewee should be successful', async (done) => {
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
		expect(res.body.name).toBe(name);
		expect(res.body.school).toBe(school);
		expect(Array.isArray(res.body.reviews)).toBe(true);
		expect(res.body.numberOfReviews).toBe(1);
		expect(res.body.overallRating).toBeDefined();
		expect(res.body.recommendationRating).toBeDefined();
		expect(res.body.difficultyRating).toBeDefined();

		// first review
		expect(res.body.reviews[0].review).toBe(review);
		expect(res.body.reviews[0].courseName).toBe(courseName);
		expect(res.body.reviews[0].overallRating).toBe(overallRating);
		expect(res.body.reviews[0].difficultyRating).toBe(difficultyRating);
		expect(res.body.reviews[0].yearTaken).toBe(yearTaken);
		expect(res.body.reviews[0].grade).toBe(grade);
		expect(res.body.reviews[0].textbookRequired).toBe(textbookRequired);
		expect(res.body.reviews[0].tags).toEqual(tags);
		expect(res.body.reviews[0].teachingStyles).toEqual(teachingStyles);
		expect(res.body.reviews[0].isAuthor).toBe(true);
		expect(res.body.reviews[0].hasReported).toBe(false);
		expect(res.body.reviews[0].userVote).toBe(null);

		done();
	});

	it('new review should be added to the user outgoing review list', async (done) => {
		const user = await User.findById(userId);
		const userOutgoingReviews = user.outgoingReviews;
		const lastOutgoingReview =
			userOutgoingReviews[userOutgoingReviews.length - 1];

		expect(lastOutgoingReview.revieweeId.toString()).toBe(revieweeId);
		expect(lastOutgoingReview.reviewId.toString()).toBe(reviewId);
		done();
	});

	it('query reviewees without options should be successful', async (done) => {
		const revieweeOne = {
			name: 'alpha beta',
			school: 'charlie delta',
			reviews: [{ overallRating: 3.0 }, { overallRating: 4.0 }],
		};

		const revieweeTwo = {
			name: 'epsilon fourrier',
			school: 'Del hess',
		};

		const revieweeThree = {
			name: 'Alp',
			school: 'chat gamma',
		};

		await Reviewee.deleteMany({});
		await Reviewee.create(revieweeOne);
		await Reviewee.create(revieweeTwo);
		await Reviewee.create(revieweeThree);

		const res = await request(app).get('/reviewees');

		expect(res.statusCode).toBe(200);
		expect(Array.isArray(res.body)).toBe(true);

		const reviewees = res.body;

		expect(reviewees[0].name).toBe(revieweeOne.name);
		expect(reviewees[0].school).toBe(revieweeOne.school);
		expect(reviewees[0].numberOfReviews).toBe(revieweeOne.reviews.length);
		const revieweeOneOverallRatingAvg =
			revieweeOne.reviews.reduce(
				(total, review) => total + review.overallRating,
				0
			) / revieweeOne.reviews.length;
		expect(reviewees[0].overallRating).toBe(revieweeOneOverallRatingAvg);

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
		expect(Array.isArray(res.body)).toBe(true);

		const reviewees = res.body;
		expect(reviewees.length).toBe(0);
		done();
	});

	it('query reviewees based on name', async (done) => {
		const res = await request(app)
			.get('/reviewees')
			.query({ name: 'alp' });

		expect(res.statusCode).toBe(200);
		expect(Array.isArray(res.body)).toBe(true);

		const reviewees = res.body;
		expect(reviewees.length).toBe(2);
		expect(reviewees[0].name).toBe('alpha beta');
		expect(reviewees[1].name).toBe('Alp');

		done();
	});

	it('query reviewees based on school', async (done) => {
		const res = await request(app)
			.get('/reviewees')
			.query({ school: 'del' });

		expect(res.statusCode).toBe(200);
		expect(Array.isArray(res.body)).toBe(true);

		const reviewees = res.body;
		expect(reviewees.length).toBe(2);
		expect(reviewees[0].name).toBe('alpha beta');
		expect(reviewees[1].name).toBe('epsilon fourrier');

		done();
	});

	it('query reviewees based on name and school', async (done) => {
		const res = await request(app)
			.get('/reviewees')
			.query({ name: 'alp', school: 'del' });

		expect(res.statusCode).toBe(200);
		expect(Array.isArray(res.body)).toBe(true);

		const reviewees = res.body;
		expect(reviewees.length).toBe(1);
		expect(reviewees[0].name).toBe('alpha beta');

		done();
	});

	it('query reviewees with limit', async (done) => {
		const res = await request(app)
			.get('/reviewees')
			.query({ name: 'alp', limit: 1 });

		expect(res.statusCode).toBe(200);
		expect(Array.isArray(res.body)).toBe(true);

		const reviewees = res.body;
		expect(reviewees.length).toBe(1);
		expect(reviewees[0].name).toBe('alpha beta');

		done();
	});

	it('query reviewees with limit and pagination', async (done) => {
		const res = await request(app)
			.get('/reviewees')
			.query({ name: 'alp', limit: 1, index: 1 });

		expect(res.statusCode).toBe(200);
		expect(Array.isArray(res.body)).toBe(true);

		const reviewees = res.body;
		expect(reviewees.length).toBe(1);
		expect(reviewees[0].name).toBe('Alp');

		done();
	});

	it('query reviewees with negative index', async (done) => {
		const res = await request(app)
			.get('/reviewees')
			.query({ index: -1 });

		expect(res.statusCode).toBe(200);
		expect(Array.isArray(res.body)).toBe(true);

		const reviewees = res.body;
		expect(reviewees.length).toBe(0);

		done();
	});

	it('query reviewees with overflow index', async (done) => {
		const res = await request(app)
			.get('/reviewees')
			.query({ index: 100 });

		expect(res.statusCode).toBe(200);
		expect(Array.isArray(res.body)).toBe(true);

		const reviewees = res.body;
		expect(reviewees.length).toBe(0);

		done();
	});

	it('query reviewees sort by name', async (done) => {
		const res = await request(app)
			.get('/reviewees')
			.query({ sortBy: 'name' });

		const reviewees = res.body;
		expect(reviewees[0].name).toBe('Alp');
		expect(reviewees[1].name).toBe('alpha beta');
		expect(reviewees[2].name).toBe('epsilon fourrier');
		done();
	});

	it('query reviewees sort by school', async (done) => {
		const res = await request(app)
			.get('/reviewees')
			.query({ sortBy: 'school' });

		const reviewees = res.body;
		expect(reviewees[0].name).toBe('alpha beta');
		expect(reviewees[1].name).toBe('Alp');
		expect(reviewees[2].name).toBe('epsilon fourrier');
		done();
	});

	it('query reviewees sort by total reviews', async (done) => {
		const res = await request(app)
			.get('/reviewees')
			.query({ sortBy: 'totalReviews' });

		const reviewees = res.body;
		expect(reviewees[0].name).toBe('Alp');
		expect(reviewees[1].name).toBe('epsilon fourrier');
		expect(reviewees[2].name).toBe('alpha beta');
		done();
	});

	it('query reviewees sort by overall rating', async (done) => {
		const res = await request(app)
			.get('/reviewees')
			.query({ sortBy: 'overallRating' });

		const reviewees = res.body;
		expect(reviewees[0].name).toBe('Alp');
		expect(reviewees[1].name).toBe('epsilon fourrier');
		expect(reviewees[2].name).toBe('alpha beta');
		done();
	});

	it('query reviewees sort by name in descending order', async (done) => {
		const res = await request(app)
			.get('/reviewees')
			.query({ sortBy: 'name', ascending: false });

		const reviewees = res.body;
		expect(reviewees[0].name).toBe('epsilon fourrier');
		expect(reviewees[1].name).toBe('alpha beta');
		expect(reviewees[2].name).toBe('Alp');
		done();
	});
});
