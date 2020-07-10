const express = require('express');
const AuthService = require('../services/auth.service');
const config = require('../config');

const router = express.Router();
const authService = new AuthService();
const LOGIN_URL = config.clientLoginUrl;

router.post('/signup', async (req, res) => {
	try {
		const userEmail = req.body.email;
		const userPassword = req.body.password;

		if (userEmail === undefined || userPassword === undefined) {
			res.statusMessage = 'Please provivde email and password.';
			return res.status(400).end();
		}

		const { userAlreadyExist, newUser } = await authService.signup(
			userEmail,
			userPassword
		);
		if (userAlreadyExist) {
			res.statusMessage = 'Email already exists';
			return res.status(409).end();
		} else {
			res.statusMessage = `Create user is succesful. A verification email has been sent to ${userEmail}.`;
			return res.status(201).end();
		}
	} catch (err) {
		console.log(err);
		res.statusMessage = 'There was an error creating the user.';
		return res.status(500).end();
	}
});

router.post('/login', async (req, res) => {
	try {
		const userEmail = req.body.email;
		const userPassword = req.body.password;

		if (userEmail === undefined || userPassword === undefined) {
			res.statusMessage = 'Please provivde email and password.';
			return res.status(400).end();
		}

		const { authorized, credential, verified } = await authService.login(
			userEmail,
			userPassword
		);

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
	const userVerificationToken = req.params.token;
	const { user } = await authService.getUserAuthenticationToken(
		userVerificationToken
	);

	if (!user) {
		res.statusMessage = 'We were unable to find a user for this token.';
		return res.status(404).end();
	} else {
		return res.redirect(301, LOGIN_URL);
	}
});

router.post('/resend', async (req, res) => {
	const userEmail = req.body.email;

	if (userEmail === undefined) {
		res.statusMessage = 'Please provivde email.';
		return res.status(400).end();
	}

	const { user } = await authService.sendVerificationEmail(userEmail);

	if (!user) {
		res.statusMessage = 'We were unable to find user with the given email.';
		return res.status(404).end();
	} else {
		return res.status(200).end();
	}
});

module.exports = router;
