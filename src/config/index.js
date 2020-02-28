const dotenv = require('dotenv');

// read .env file and assign it to process.env
dotenv.config();

module.exports = {
	port: process.env.PORT,
	mongodbUrl: process.env.MONGODB_URL,
	jwtSecret: process.env.JWT_SECRET,
	mailgunAPIKey: process.env.MAILGUN_API_KEY,
	mailgunDomain: process.env.MAILGUN_DOMAIN,
	host: process.env.HOST,
	clientLoginUrl: process.env.CLIENT_LOGIN_URL,
	sendgridAPIKey: process.env.SENDGRID_API_KEY,
	pepipostAPIKey: process.env.PEPIPOST_API_KEY,
};
