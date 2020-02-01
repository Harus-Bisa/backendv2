const express = require('express');

const AuthService = require('../services/auth.service');
const UserService = require('../services/user.service');

const router = express.Router();
const authService = AuthService();
const userService = UserService();

const config = require('../config');
const LOGIN_URL = config.clientLoginUrl;

router.post('/signup', async (req, res) => {
	const { userAlreadyExist, newUser } = await authService.signup(req.body);
	try {
		if (userAlreadyExist) {
			res.statusMessage = 'Email already exists';
			return res.status(409).end();
		} else {
			res.statusMessage = `Create user is succesful. A verification email has been sent to ${req.body.email}.`;
			return res.status(201).end();
		}
	} catch (err) {
		console.log(err);
		res.statusMessage = 'There was an error creating the user.';
		return res.status(500).end();
	}
});

router.post('/login', async (req, res) => {
	const { authorized, credential, verified } = await authService.login(
		req.body
	);

	try {
		if (authorized && verified) {
			res.statusMessage = 'Login is successful';
			return res.status(200).send(credential);
		} else if (authorized && !verified) {
			// res.statusMessage = 'User email is not verified';
			res.statusMessage = 'Akun anda belum diverifikasi';
			return res.status(401).end();
		} else {
			// res.statusMessage = 'Please provide correct email and password';
			res.statusMessage = 'Kombinasi e-mail dan password salah';
			return res.status(401).end();
		}
	} catch (err) {
		console.log(err);
		res.statusMessage = 'There was error logging in.';
		return res.status(500).end();
	}
});

router.get('/verification/:token', async (req, res) => {
	const { userToken } = await authService.getUserAuthenticationToken(
		req.params.token
	);

	if (!userToken) {
		res.statusMessage = 'We were unable to find a user for this token.';
		return res.status(404).end();
	}

	const { user } = await userService.verifyUser(userToken.userId);
	if (!user) {
		res.statusMessage = 'We were unable to find a user for this token.';
		return res.status(404).end();
	} else {
		return res.status(301).redirect(LOGIN_URL);
	}
});

router.post('/resend', async (req, res) => {
	const { user } = await userService.getUserByEmail(req.body.email);

	if (!user) {
		res.statusMessage = 'We were unable to find user with the given email.';
		return res.status(404).end();
	} else {
		authService.sendVerificationEmail(user.userId, req.body.email);
		return res.status(301).redirect(LOGIN_URL);
	}
});

module.exports = router;
