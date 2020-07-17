const request = require('supertest');
const randomstring = require('randomstring');
const app = require('../../app');

const RevieweeService = require('../../services/reviewee.service');
jest.mock('../../services/reviewee.service.js');

const authorId = 'userId';

jest.mock('../../middlewares/auth.middleware.js', () =>
	jest.fn((req, res, next) => {
		req.authenticated = true;
		req.userId = 'userId';
		next();
	})
);
const revieweeServiceInstance = 0;

describe('Reviewee Ticket endpoints', () => {
	it('create reviewee with missing required field should fail', async (done) => {
		const revieweeData = [
			{
				school: randomstring.generate(),
				review: randomstring.generate(),
				courseName: randomstring.generate(),
			},
			{
				name: randomstring.generate(),
				review: randomstring.generate(),
				courseName: randomstring.generate(),
			},
		];

		for (i = 0; i < revieweeData.length; i++) {
			const res = await request(app)
				.post('/reviewees')
				.send(revieweeData[i]);

			expect(res.statusCode).toEqual(400);
			expect(
				RevieweeService.mock.instances[revieweeServiceInstance]
					.createRevieweeWithReview
			).not.toHaveBeenCalled();
		}

		done();
	});

	it('create reviewee with invalid data type field should fail', async (done) => {
		const revieweeData = [
			{
				name: randomstring.generate(),
				school: randomstring.generate(),
				review: randomstring.generate(),
				courseName: randomstring.generate(),
				overallRating: 'one',
			},
			{
				name: randomstring.generate(),
				school: randomstring.generate(),
				review: randomstring.generate(),
				courseName: randomstring.generate(),
				recommendationRating: 'one',
			},
			{
				name: randomstring.generate(),
				school: randomstring.generate(),
				review: randomstring.generate(),
				courseName: randomstring.generate(),
				difficultyRating: 'one',
			},
			{
				name: randomstring.generate(),
				school: randomstring.generate(),
				review: randomstring.generate(),
				courseName: randomstring.generate(),
				yearTaken: 'one',
			},
		];

		for (i = 0; i < revieweeData.length; i++) {
			const res = await request(app)
				.post('/reviewees')
				.send(revieweeData[i]);

			expect(res.statusCode).toEqual(400);
			expect(
				RevieweeService.mock.instances[revieweeServiceInstance]
					.createRevieweeWithReview
			).not.toHaveBeenCalled();
		}

		done();
	});

	it('create reviewee with full data should be successful', async (done) => {
		RevieweeService.prototype.createRevieweeWithReview.mockResolvedValueOnce({
			newReviewee: {},
		});

		const revieweeData = {
			name: randomstring.generate(),
			school: randomstring.generate(),
			review: randomstring.generate(),
			courseName: randomstring.generate(),
			overallRating: 4,
			recommendationRating: 5.0,
			difficultyRating: 3.0,
			yearTaken: 2020,
			grade: randomstring.generate(),
			tags: [randomstring.generate()],
			textbookRequired: false,
			teachingStyles: [randomstring.generate(), randomstring.generate()],
		};

		const res = await request(app)
			.post('/reviewees')
			.send(revieweeData);

		expect(res.statusCode).toEqual(201);
		expect(
			RevieweeService.mock.instances[revieweeServiceInstance]
				.createRevieweeWithReview
		).toHaveBeenLastCalledWith(authorId, revieweeData);

		done();
	});

	it('create reviewee with minimum data should be successful', async (done) => {
		RevieweeService.prototype.createRevieweeWithReview.mockResolvedValueOnce({
			newReviewee: {},
		});

		const revieweeData = {
			name: randomstring.generate(),
			school: randomstring.generate(),
			review: randomstring.generate(),
			courseName: randomstring.generate(),
		};

		const res = await request(app)
			.post('/reviewees')
			.send(revieweeData);

		expect(res.statusCode).toEqual(201);
		expect(
			RevieweeService.mock.instances[revieweeServiceInstance]
				.createRevieweeWithReview
		).toHaveBeenLastCalledWith(authorId, revieweeData);

		done();
	});
});
