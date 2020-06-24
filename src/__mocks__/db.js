const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => console.log("In-memory MongoDB is connected"))
  .catch((err) => console.log("In-memory MongoDB connection error: " + err.message));
