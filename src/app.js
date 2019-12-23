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

module.exports = app;