const Recent = require('../models/Recent');

function RecentService() {
	return Object.freeze({
		updateMostRecents,
		getMostRecentReviews,
	});

	async function updateMostRecents(type, newEntry) {
		const max_recents = 10;
		const recent = await Recent.findOneAndUpdate(
			{ type: type },
			{ $push: { mostRecents: newEntry } },
			{ upsert: true, useFindAndModify: false }
		);
		if (recent.mostRecents.length >= max_recents) {
			await Recent.findOneAndUpdate(
				{ type: type },
				{ $pop: { mostRecents: -1 } },
				{ upsert: true, useFindAndModify: false }
			);
		}
		return;
	}

	async function getMostRecentReviews() {
		let recent = await Recent.findOne({ type: 'review' });
		let mostRecentReviews = recent.mostRecents;

		return { mostRecentReviews };
	}
}

module.exports = RecentService;
