const express = require('express');
const cors = require('cors');

const db = require('./db');

const app = express();

app.use(cors());

var controller = require('./routes/mvp');
app.use('/', controller);

module.exports = app;