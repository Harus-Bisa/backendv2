const config = require('./config');
const mongoose = require('mongoose');

// mongoose
//   .connect(config.mongodbUrl, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     useCreateIndex: true,
//   })
//   .then(() => console.log('MongoDB is connected'))
//   .catch((err) => console.log('MongoDB connection error: ' + err.message));

const connect = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose
      .connect(
        process.env.NODE_ENV === 'test' ? global.__DB_URL__ : config.mongodbUrl,
        {
          useNewUrlParser: true,
          useCreateIndex: true,
          useFindAndModify: false,
          useUnifiedTopology: true,
        }
      )
      .then(() => {
        // console.log('MongoDB is connected to: ', global.__DB_URL__);
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
