const request = require('supertest');
const randomstring = require('randomstring');
const app = require('../../app');

const AuthService = require('../../services/auth.service');
jest.mock('../../services/auth.service.js');
const authServiceInstance = 0;

describe('Auth endpoints', () => {
	it('signup without username should fail', async (done) => {
		const userInfo = {
			password: randomstring.generate(),
		};

		const res = await request(app)
			.post('/signup')
			.send(userInfo);

		expect(res.statusCode).toEqual(400);
		expect(AuthService.mock.instances[authServiceInstance].signup).not.toHaveBeenCalled();
		done();
	});

	it('signup without password should fail', async (done) => {
		const userInfo = {
			email: randomstring.generate(),
		};

		const res = await request(app)
			.post('/signup')
			.send(userInfo);

		expect(res.statusCode).toEqual(400);
		expect(AuthService.mock.instances[authServiceInstance].signup).not.toHaveBeenCalled();
		done();
	});

	it('signup with email & password should be successful', async (done) => {
		AuthService.prototype.signup.mockResolvedValueOnce({
			userAlreadyExist: false,
			newUser: {},
		});

		const userInfo = {
			email: randomstring.generate(),
			password: randomstring.generate(),
		};

		const res = await request(app)
			.post('/signup')
			.send(userInfo);

		expect(res.statusCode).toEqual(201);
		expect(AuthService.mock.instances[authServiceInstance].signup).toHaveBeenLastCalledWith(
			userInfo.email,
			userInfo.password
		);
		done();
	});

	it('login without username should fail', async (done) => {
		const userInfo = {
			email: randomstring.generate(),
		};

		const res = await request(app)
			.post('/login')
			.send(userInfo);

		expect(res.statusCode).toEqual(400);
		expect(AuthService.mock.instances[authServiceInstance].login).not.toHaveBeenCalled();
		done();
	});

	it('login without password should fail', async (done) => {
		const userInfo = {
			email: randomstring.generate(),
		};

		const res = await request(app)
			.post('/login')
			.send(userInfo);

		expect(res.statusCode).toEqual(400);
		expect(AuthService.mock.instances[authServiceInstance].login).not.toHaveBeenCalled();
		done();
	});

	it('login with email & password should be successful', async (done) => {
		AuthService.prototype.login.mockResolvedValueOnce({
			authorized: true,
			credential: randomstring.generate(),
			verified: true,
		});

		const userInfo = {
			email: randomstring.generate(),
			password: randomstring.generate(),
		};

		const res = await request(app)
			.post('/login')
			.send(userInfo);

		expect(res.statusCode).toEqual(200);
		expect(AuthService.mock.instances[authServiceInstance].login).toHaveBeenLastCalledWith(
			userInfo.email,
			userInfo.password
		);
		done();
	});

	it('resend verification email without email should fail', async (done) => {
		const userInfo = {};

		const res = await request(app)
			.post('/resend')
			.send(userInfo);

		expect(res.statusCode).toEqual(400);
		expect(
			AuthService.mock.instances[authServiceInstance].sendVerificationEmail
		).not.toHaveBeenCalled();
		done();
	});

	it('resend verification email should be successful', async (done) => {
		AuthService.prototype.sendVerificationEmail.mockResolvedValueOnce({
			user: randomstring.generate(),
		});

		const email = randomstring.generate();
		const userInfo = { email };

		const res = await request(app)
			.post('/resend')
			.send(userInfo);

		expect(res.statusCode).toEqual(200);
		expect(
			AuthService.mock.instances[authServiceInstance].sendVerificationEmail
		).toHaveBeenLastCalledWith(email);

		done();
	});
});
