const mongoose = require('mongoose');

const recentSchema = new mongoose.Schema({
  recentType: { type: String, index: { unique: true } },
  mostRecents: Array,
});

recentSchema.statics.getMostRecentReviews = async function() {
  const recentObject = await this.findOne({ recentType: 'review' });

  if (!recentObject) {
    return [];
  } else {
    return recentObject.mostRecents;
  }
};

recentSchema.statics.pushMostRecent = async function(type, review) {
  const recent = await this.findOneAndUpdate(
    { recentType: 'review' },
    { $push: { mostRecents: review } },
    { upsert: true, new: true }
  );

  return recent.mostRecents.length;
};

// recentSchema.statics.pullMostRecent = function(type, review) {
//   this.findOneAndUpdate(
//     { recentType: type },
//     { $pop: { mostRecents: -1 } },
//     { upsert: true, new: true }
//   ).exec();
// };

module.exports = mongoose.model('Recent', recentSchema);
