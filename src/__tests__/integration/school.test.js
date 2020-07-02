const request = require('supertest');
const randomstring = require('randomstring');
const app = require('../../app');
const SchoolService = require('../../services/school.service');
const School = require('../../models/School');

const schoolService = new SchoolService();

describe('School endpoints', () => {
	it('get schools should be successful', async (done) => {
		let schoolNames = [
			randomstring.generate(),
			randomstring.generate(),
			randomstring.generate(),
		];

		for (i = 0; i < schoolNames.length; i++) {
			await schoolService.createSchool(schoolNames[i]);
		}

		const res = await request(app).get('/schools/');
		const schools = res.body;

		schoolNames.sort(function(a, b) {
			return a.toLowerCase().localeCompare(b.toLowerCase());
		});

		expect(res.statusCode).toBe(200);
		expect(Array.isArray(schools)).toBe(true);
		expect(schools).toEqual(schoolNames);

		done();
	});

	it('get schools filtered by name should be successful', async (done) => {
		const schoolNames = [
			'alpha beta',
			'charlie',
			'gamma Alp',
			'delta',
			'Alp Romeo',
		];

		for (i = 0; i < schoolNames.length; i++) {
			await schoolService.createSchool(schoolNames[i]);
		}

		const expectedResult = ['Alp Romeo', 'alpha beta', 'gamma Alp'];
		const res = await request(app)
			.get('/schools/')
			.query({ school: 'alp' });
		const schools = res.body;

		expect(res.statusCode).toBe(200);
		expect(Array.isArray(schools)).toBe(true);
		expect(schools).toEqual(expectedResult);

		done();
	});

	it('get popular schools (ranked descending by visitedCount)', async (done) => {
		await School.deleteMany({});
		const schoolNames = [
			randomstring.generate(),
			randomstring.generate(),
			randomstring.generate(),
			randomstring.generate(),
		];

		const expectedResult = [schoolNames[1], schoolNames[2], schoolNames[0]];

		for (i = 0; i < expectedResult.length; i++) {
			for (j = 0; j < expectedResult.length - i; j++) {
				await schoolService.addVisitedCount(expectedResult[i]);
			}
		}

		const limit = expectedResult.length;
		const res = await request(app)
			.get('/schools/popular')
			.query({ limit });
		const schools = res.body;

		expect(res.statusCode).toBe(200);
		expect(Array.isArray(schools)).toBe(true);
		expect(schools.length).toBe(limit);
		expect(schools).toEqual(expectedResult);
		done();
	});

	it('get popular schools (ranked descending by revieweeCount)', async (done) => {
		// NOT API ROUTE TEST, CURRENTLY USING SERVICE DIRECTLY
		await School.deleteMany({});
		const schoolNames = [
			randomstring.generate(),
			randomstring.generate(),
			randomstring.generate(),
			randomstring.generate(),
		];

		const expectedResult = [schoolNames[1], schoolNames[2], schoolNames[0]];

		for (i = 0; i < expectedResult.length; i++) {
			for (j = 0; j < expectedResult.length - i; j++) {
				await schoolService.addRevieweeCount(expectedResult[i]);
			}
		}

		const limit = expectedResult.length;
		const { schools } = await schoolService.getMostPopularByRevieweeCount(
			limit
		);

		expect(Array.isArray(schools)).toBe(true);
		expect(schools.length).toBe(limit);
		expect(schools).toEqual(expectedResult);
		done();
	});
});
