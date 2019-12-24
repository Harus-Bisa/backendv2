const express = require('express');

const AuthService = require('../services/auth.service');

const router = express.Router();
const authService = AuthService();

router.post('/signup', async (req, res) => {
	const { userAlreadyExist, newUser } = await authService.signup(req.body);
	try {
		if (userAlreadyExist) {
			res.statusMessage = 'Email already exists';
			return res.status(409).end();
		} else {
			res.statusMessage = 'Create user is succesful';
			return res.status(201).send(newUser);
		}
	} catch (err) {
		console.log(err);
		res.statusMessage = 'There was an error creating the user.';
		return res.status(500).end();
	}
});

router.post('/login', async (req, res) => {
	const { authorized, credential } = await authService.login(req.body);

	try {
		if (authorized) {
			res.statusMessage = 'Login is successful';
			return res.status(200).send(credential);
		} else {
			res.statusMessage = 'Please provide correct email and password';
			return res.status(401).send();
		}
	} catch (err) {
		console.log(err);
		res.statusMessage = 'There was error logging in.';
		return res.status(500).end();
	}
});

module.exports = router;
