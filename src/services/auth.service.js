const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
// const nodemailer = require('nodemailer');
// const mg = require('nodemailer-mailgun-transport');

const User = require('../models/User');
const VerificationToken = require('../models/VerificationToken');
const config = require('../config');
const EmailService = require('./email.service');

const emailService = EmailService();

function AuthService() {
	return Object.freeze({
		signup,
		login,
		getUserAuthenticationToken,
		sendVerificationEmail
	});

	async function sendVerificationEmail(userId, email) {
		// send verification email
		const token = await VerificationToken.create({
			userId: userId,
			token: crypto.randomBytes(16).toString('hex'),
		});
		
		const verificationLink =
			config.host + '/verification/' + token.token;

		const subject = 'Dosenku Email Verification';
		const message = 'Please verify your email by clicking this link: ' + verificationLink;
		emailService.sendEmail(email, subject, message);
	}

	async function signup(newUserData) {
		let userAlreadyExist = false;
		let newUser;

		let existingUser = await User.findOne({ email: newUserData.email });
		if (!existingUser) {
			// email is not used yet
			newUserData.password = bcrypt.hashSync(newUserData.password, 10);
			newUser = await User.create(newUserData);

			sendVerificationEmail(newUser._id, newUser.email);
		} else {
			userAlreadyExist = true;
		}
		return { userAlreadyExist, newUser };
	}

	async function login(loginData) {
		const user = await User.findOne({ email: loginData.email });
		let authorized = false;
		let credential = null;
		let verified = false;

		if (user) {
			const correctPassword = user.password;
			const passwordMatch = bcrypt.compareSync(
				loginData.password,
				correctPassword
			);

			if (passwordMatch) {
				if (user.isVerified || loginData.email == 'dosenku.official@gmail.com') {
					verified = true;
				}
				authorized = true;
				const tokenPayload = {
					userId: user._id,
				};

				const token = jwt.sign(tokenPayload, config.jwtSecret, {
					expiresIn: 86400, // 24 hours
				});

				credential = {
					userId: user._id,
					token,
				};
			}
		}

		return { authorized, credential, verified };
	}

	async function getUserAuthenticationToken(token) {
		const userToken = await VerificationToken.findOne({token: token});
		return {userToken};
	}
}

module.exports = AuthService;
