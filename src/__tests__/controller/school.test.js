const request = require('supertest');
const randomstring = require('randomstring');
const app = require('../../app');

const SchoolService = require('../../services/school.service');
jest.mock('../../services/school.service.js');
const schoolServiceInstance = 1;

describe('School endpoints', () => {
	it('get school without school query param should be successful', async (done) => {
		SchoolService.prototype.getSchoolsByName.mockResolvedValueOnce({
			schools: [],
		});
		const res = await request(app).get('/schools');

		expect(res.statusCode).toEqual(200);
		expect(
			SchoolService.mock.instances[schoolServiceInstance].getSchoolsByName
		).toHaveBeenLastCalledWith(undefined);
		done();
	});

	it('get school with school query param should be successful', async (done) => {
		SchoolService.prototype.getSchoolsByName.mockResolvedValueOnce({
			schools: [],
		});

		const school = randomstring.generate();
		const res = await request(app)
			.get('/schools')
			.query({
				school,
			});

		expect(res.statusCode).toEqual(200);
		expect(
			SchoolService.mock.instances[schoolServiceInstance].getSchoolsByName
		).toHaveBeenLastCalledWith(school);
		done();
	});

	it('get popular school without limit query param should be successful', async (done) => {
		SchoolService.prototype.getMostPopularByVisited.mockResolvedValueOnce({
			schools: [],
		});
		const res = await request(app).get('/schools/popular');

		expect(res.statusCode).toEqual(200);
		expect(
			SchoolService.mock.instances[schoolServiceInstance].getMostPopularByVisited
    ).toHaveBeenLastCalledWith(undefined);
    
		done();
  });
  
  it('get popular school with numeric limit query param should be successful', async (done) => {
		SchoolService.prototype.getMostPopularByVisited.mockResolvedValueOnce({
			schools: [],
    });
    
    const limit = '03';
		const res = await request(app).get('/schools/popular').query({limit});

		expect(res.statusCode).toEqual(200);
		expect(
			SchoolService.mock.instances[schoolServiceInstance].getMostPopularByVisited
    ).toHaveBeenLastCalledWith(parseInt(limit));
    
		done();
  });
  
  it('get popular school with word limit query param should be successful', async (done) => {
		SchoolService.prototype.getMostPopularByVisited.mockResolvedValueOnce({
			schools: [],
    });
    
    const limit = "three";
		const res = await request(app).get('/schools/popular').query({limit});

		expect(res.statusCode).toEqual(200);
		expect(
			SchoolService.mock.instances[schoolServiceInstance].getMostPopularByVisited
    ).toHaveBeenLastCalledWith(undefined);
    
		done();
	});
});
