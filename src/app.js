const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const db = require('./db');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

const revieweeController = require('./routes/reviewee.controller');
app.use('/reviewees', revieweeController);

const schoolController = require('./routes/school.controller');
app.use('/schools', schoolController);

const authController = require('./routes/auth.controller');
app.use('/', authController);

const userController = require('./routes/user.controller');
app.use('/users', userController);

const ticketController = require('./routes/ticket.controller');
app.use('/tickets', ticketController);

const recentController = require('./routes/recent.controller');
app.use('/recents', recentController);

module.exports = app;
