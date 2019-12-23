const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  outgoingReviews: [
    {
      revieweeId: mongoose.Schema.Types.ObjectId,
      reviewId: mongoose.Schema.Types.ObjectId,
    },
  ],
  following: [mongoose.Schema.Types.ObjectId],
});

module.exports = mongoose.model('User', userSchema);
