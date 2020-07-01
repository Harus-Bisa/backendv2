const bcrypt = require('bcryptjs');
const randomstring = require('randomstring');
const jwt = require('jsonwebtoken');
const config = require('../../config');
const User = require('../../models/User');

async function createUser() {
  const userEmail = randomstring.generate();
  const userPassword = randomstring.generate();

	const user = await User.create({
		email: userEmail,
		password: bcrypt.hashSync(userPassword, 10),
		isVerified: true,
	});

	const token = jwt.sign({ userId: user._id}, config.jwtSecret, {
		expiresIn: 86400, // 24 hours
	});

	userAuthenticationToken = token;
	userId = user._id.toString();
  
  return {userEmail, userPassword, userId, userAuthenticationToken}
}

module.exports = createUser;
