const config = require('./config');
const mongoose = require('mongoose');

mongoose.connect(config.mongodbUrl, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true})
.then(() => console.log('MongoDB is connected'))
.catch(err => console.log('MongoDB connection error: ' + err.message));