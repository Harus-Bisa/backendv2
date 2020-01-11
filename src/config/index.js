const dotenv = require('dotenv');

// read .env file and assign it to process.env
dotenv.config();

module.exports = {
	port: process.env.NODE_ENV === 'production' ? process.env.PORT : process.env.PORT_DEV,
	mongodbUrl: process.env.NODE_ENV === 'production' ? process.env.MONGODB_URL : process.env.MONGODB_URL_DEV,
	jwtSecret: process.env.JWT_SECRET,
};
