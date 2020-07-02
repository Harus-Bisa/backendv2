const request = require('supertest');
const app = require('../../app');
const RecentService = require('../../services/recent.service');

const recentService = new RecentService();

describe('Recent endpoints', () => {
	it('Get empty recent review should be successful', async (done) => {
		const res = await request(app).get('/recents/reviews');

		const mostRecentReviews = res.body;
		expect(res.statusCode).toBe(200);
		expect(Array.isArray(mostRecentReviews)).toBe(true);
		expect(mostRecentReviews.length).toBe(0);
		done();
	});

	it('Get recent review should be succesful', async (done) => {
		const newReview = {
			name: 'foo',
			school: 'bar',
			review: 'foobar',
			overallRating: 3.5,
		};
		await recentService.updateMostRecents('review', newReview);
		const res = await request(app).get('/recents/reviews');

		const mostRecentReviews = res.body;
		expect(res.statusCode).toBe(200);
		expect(Array.isArray(mostRecentReviews)).toBe(true);
		expect(mostRecentReviews.length).toBe(1);
		expect(mostRecentReviews[0]).toEqual(newReview);
		done();
	});

	it('Get recent reviews should have upper count limit', async (done) => {
		let newReviews = [];
		const count_limit = 10;
		const reviewCreatedCount = 11;

		for (i = 0; i < reviewCreatedCount; i++) {
			let review = {
				name: i.toString(),
				school: 'bar',
				review: 'foobar',
				overallRating: 4.5,
			};
			newReviews.push(review);
			await recentService.updateMostRecents('review', review);
		}

		const res = await request(app).get('/recents/reviews');
		const mostRecentReviews = res.body;
		expect(res.statusCode).toBe(200);
		expect(Array.isArray(mostRecentReviews)).toBe(true);
		expect(mostRecentReviews.length).toBe(count_limit);
		expect(mostRecentReviews).toEqual(newReviews.slice(1));
		done();
	});
});
