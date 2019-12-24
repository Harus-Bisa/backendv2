const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const config = require('../config');

function AuthService() {
	return Object.freeze({
		signup,
		login,
	});

	async function signup(newUserData) {
		let userAlreadyExist = false;
		let newUser;

		let existingUser = await User.findOne({ email: newUserData.email });
		if (!existingUser) {
			// email is not used yet
			newUserData.password = bcrypt.hashSync(newUserData.password, 10);
			newUser = await User.create(newUserData);
		} else {
			userAlreadyExist = true;
		}
		return { userAlreadyExist, newUser };
	}

	async function login(loginData) {
		const user = await User.findOne({ email: loginData.email });
		let authorized = false;
		let credential = null;

		if (user) {
			const correctPassword = user.password;
			const passwordMatch = bcrypt.compareSync(
				loginData.password,
				correctPassword
			);
			if (passwordMatch) {
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

		return { authorized, credential };
	}
}

module.exports = AuthService;
