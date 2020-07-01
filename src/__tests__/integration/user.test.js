const request = require('supertest');
const app = require('../../app');
const mongoose = require('mongoose');
const createUserHelper = require('../helper/createUser');

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

describe('User endpoints', () => {
	it('get user without authenticated should fail', async (done) => {
		const res = await request(app).get('/users/' + userId);

		expect(res.statusCode).toEqual(401);
		done();
	});

	it('get non existent user should fail', async (done) => {
		const randomId = mongoose.Types.ObjectId();
		const res = await request(app)
			.get('/users/' + randomId)
			.set('authorization', 'Bearer ' + userAuthenticationToken);

		expect(res.statusCode).toBe(404);
		done();
	});

	it('get user should be successful', async (done) => {
		const res = await request(app)
			.get('/users/' + userId)
			.set('authorization', 'Bearer ' + userAuthenticationToken);

		expect(res.statusCode).toBe(200);
		expect(res.body.userId).toBe(userId);
		expect(res.body.password).not.toBeDefined();
		done();
	});

	it('get user with wrong token should fail', async (done) => {
		let secondUser = await createUserHelper();
		let secondUserAuthenticationToken = secondUser.userAuthenticationToken;

		const res = await request(app)
			.get('/users/' + userId)
			.set('authorization', 'Bearer ' + secondUserAuthenticationToken);

		expect(res.statusCode).toBe(401);
		done();
	});
});
