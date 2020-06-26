require('dotenv').config();

const databaseHelper = require('../db');

beforeAll(async () => {
  await databaseHelper.connect();
  await databaseHelper.truncate();
});

afterAll(async () => {
  // await databaseHelper.truncate();
  await databaseHelper.disconnect();
});