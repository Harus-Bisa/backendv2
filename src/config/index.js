const dotenv = require('dotenv');

// read .env file and assign it to process.env
dotenv.config();

module.exports = {
	port: process.env.PORT,
	mongodbUrl: process.env.MONGODB_URL,
	jwtSecret: process.env.JWT_SECRET,
};
