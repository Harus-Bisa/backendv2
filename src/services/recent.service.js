const Recent = require('../models/Recent');

class RecentService {
  async updateMostRecents(type, newEntry) {
    const MAX_RECENT_REVIEWS = 10;

    const reviewsCount = await Recent.pushMostRecent(type, newEntry);

    if (type == 'review' && reviewsCount > MAX_RECENT_REVIEWS) {
      Recent.pullMostRecent(type, newEntry);
    }
  }

  async getMostRecentReviews() {
    let mostRecentReviews = await Recent.getMostRecentReviews();
    return { mostRecentReviews };
  }
}

module.exports = RecentService;
