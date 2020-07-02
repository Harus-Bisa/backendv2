const Recent = require('../models/Recent');

const MAX_RECENT_REVIEWS = 10;

class RecentService {
	async updateMostRecents(type, newEntry) {
		const reviewsCount = await Recent.pushMostRecent(type, newEntry);

		// if (type == 'review' && reviewsCount > MAX_RECENT_REVIEWS) {
		//   Recent.pullMostRecent(type, newEntry);
		// }

		return { reviewsCount };
	}

	async getMostRecentReviews() {
		let mostRecentReviews = await Recent.getMostRecentReviews();

		mostRecentReviews = mostRecentReviews.slice(
			Math.max(mostRecentReviews.length - MAX_RECENT_REVIEWS, 0)
		);
		return { mostRecentReviews };
	}
}

module.exports = RecentService;
