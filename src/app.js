const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const db = require('./db');


class App {
  constructor() {
    this.express = express();

    this.database();
    this.middlewares();
    this.routes();
  }

  database() {
    db.connect();
  }

  middlewares() {
    this.express.use(bodyParser.urlencoded({ extended: true }));
    this.express.use(bodyParser.json());
    this.express.use(cors());
  }

  routes() {
    const revieweeController = require('./routes/reviewee.controller');
    this.express.use('/reviewees', revieweeController);

    const schoolController = require('./routes/school.controller');
    this.express.use('/schools', schoolController);

    const authController = require('./routes/auth.controller');
    this.express.use('/', authController);

    const userController = require('./routes/user.controller');
    this.express.use('/users', userController);

    const ticketController = require('./routes/ticket.controller');
    this.express.use('/tickets', ticketController);

    const recentController = require('./routes/recent.controller');
    this.express.use('/recents', recentController);
  }
}

module.exports = new App().express;



