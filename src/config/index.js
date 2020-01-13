const dotenv = require('dotenv');

// read .env file and assign it to process.env
dotenv.config();

module.exports = {
	port: process.env.PORT,
	mongodbUrl: process.env.MONGODB_URL,
	jwtSecret: process.env.JWT_SECRET,
	mailgunAPIKey: process.env.MAILGUN_API_KEY,
	mailgunDomain: process.env.MAILGUN_DOMAIN,
	host: process.env.HOST
};
