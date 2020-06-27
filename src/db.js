const config = require('./config');
const mongoose = require('mongoose');

const connect = async () => {
  if (mongoose.connection.readyState === 0) {
    const connectUrl = process.env.NODE_ENV === 'test' ? global.__DB_URL__ : config.mongodbUrl
    await mongoose
      .connect(
        connectUrl,
        {
          useNewUrlParser: true,
          useCreateIndex: true,
          useFindAndModify: false,
          useUnifiedTopology: true,
        }
      )
      .then(() => {
        console.log('MongoDB is connected to: ', connectUrl);
      })
      .catch((err) => console.log('MongoDB connection error: ' + err.message));
  }
};
const truncate = async () => {
  if (mongoose.connection.readyState !== 0) {
    const { collections } = mongoose.connection;

    const promises = Object.keys(collections).map((collection) =>
      mongoose.connection.collection(collection).deleteMany({})
    );

    await Promise.all(promises);
  }
};

const disconnect = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

module.exports = {
  connect,
  truncate,
  disconnect,
};
