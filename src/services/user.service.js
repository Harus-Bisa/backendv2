const User = require('../models/User');

function UserService() {
	return Object.freeze({
		addOutgoingReview,
		updateHelpfulnessVote,
		getUserDataById,
		// getOutgoingReviews,
		// getHelpfulnessVotes,
		// getFollowing,
	});

	async function getUserDataById(userId) {
    let userData = await User.findById(userId);
    if (userData) {
      userData = userData.toObject();
      userData.userId = userData._id;

      delete userData.password;
      delete userData._id;
      delete userData.__v;

    }
		return { userData };
	}

	async function addOutgoingReview(userId, revieweeId, reviewId) {
		const review = {
			revieweeId,
			reviewId,
		};
		const user = await User.findByIdAndUpdate(
			userId,
			{ $push: { outgoingReviews: review } },
			{ new: true }
		);
		return { outgoingReview: review };
	}

	async function updateHelpfulnessVote(userId, revieweeId, reviewId, vote) {
		let cancelVote = false;
		let switchVote = false;
		let selectedVote = {
			revieweeId,
			reviewId,
			vote,
		};

		const user = await User.findById(userId);
		const userHelpfulnessVotes = user.helpfulnessVotes;

		const existingReviewVote = userHelpfulnessVotes.find(
			(curVote) =>
				revieweeId == curVote.revieweeId && reviewId == curVote.reviewId
		);

		if (!existingReviewVote) {
			// not yet vote previously
			const user = await User.findByIdAndUpdate(
				userId,
				{ $push: { helpfulnessVotes: selectedVote } },
				{ new: true }
			);
		} else if (existingReviewVote && existingReviewVote.vote !== vote) {
			// change vote (up to down or down to up)
			switchVote = true;
			const voteSelector = 'helpfulnessVotes.$[elem].vote';
			const user = await User.findByIdAndUpdate(
				userId,
				{ $set: { [voteSelector]: vote } },
				{
					arrayFilters: [
						{
							'elem.revieweeId': existingReviewVote.revieweeId,
							'elem.reviewId': existingReviewVote.reviewId,
						},
					],
					new: true,
				}
			);
		} else {
			// cancel vote
			cancelVote = true;
			const user = await User.findByIdAndUpdate(
				userId,
				{
					$pull: {
						helpfulnessVotes: {
							revieweeId: existingReviewVote.revieweeId,
							reviewId: existingReviewVote.reviewId,
						},
					},
				},
				{ new: true }
			);
		}
		return { cancelVote, switchVote, selectedVote };
	}
}

module.exports = UserService;
