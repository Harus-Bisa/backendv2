const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const VerificationToken = require('../models/VerificationToken');
const config = require('../config');
const EmailService = require('./email.service');
const UserService = require('./user.service');

const emailService = new EmailService();
const userService = new UserService();

class AuthService {
	async sendVerificationEmail(email) {
		const { user } = await userService.getUserByEmail(email);

		if (user) {
			const token = await VerificationToken.create({
				userId: user.userId,
				token: crypto.randomBytes(16).toString('hex'),
			});

			const verificationLink = config.host + '/verification/' + token.token;
			const subject = 'Dosenku Email Verification';
			const message =
				'Please verify your email by clicking this link: ' + verificationLink;

			emailService.sendEmail(email, subject, message);
		}
		return { user };
	}

	async signup(userEmail, userPassword) {
		let userAlreadyExist = false;
		let newUser;
		let { user } = await userService.getUserByEmail(userEmail);

		if (!user) {
			// email is not used yet
			userPassword = bcrypt.hashSync(userPassword, 10);
			({ newUser } = await userService.createUser(userEmail, userPassword));
			this.sendVerificationEmail(newUser.email);
		} else {
			userAlreadyExist = true;
		}
		return { userAlreadyExist, newUser };
	}

	async login(userEmail, userPassword) {
		const { user } = await userService.getUserByEmail(userEmail, true);
		let authorized = false;
		let credential = null;
		let verified = false;

		if (user) {
			const correctPassword = user.password;
			const passwordMatch = bcrypt.compareSync(userPassword, correctPassword);

			if (passwordMatch) {
				if (user.isVerified || userEmail == 'dosenku.official@gmail.com') {
					verified = true;
				}
				authorized = true;
				const tokenPayload = {
					userId: user.userId,
				};

				const token = jwt.sign(tokenPayload, config.jwtSecret, {
					expiresIn: 86400, // 24 hours
				});

				credential = {
					userId: user.userId,
					token,
				};
			}
		}

		return { authorized, credential, verified };
	}

	async getUserAuthenticationToken(token) {
		const userToken = await VerificationToken.findByToken(token);
		let user = undefined;

		if (!userToken) {
			return { user };
		}

		({ user } = await userService.verifyUser(userToken.userId));

		return { user };
	}
}

module.exports = AuthService;
