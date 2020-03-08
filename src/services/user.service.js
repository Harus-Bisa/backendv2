const User = require('../models/User');

function UserService() {
	return Object.freeze({
		addOutgoingReview,
		updateHelpfulnessVote,
		getUserById,
		getUserByEmail,
		verifyUser,
		addReportedReview,
		// getOutgoingReviews,
		// getHelpfulnessVotes,
		// getFollowing,
	});

	async function getUserByEmail(email) {
		let user = await User.findOne({ email });
		if (user) {
			user = user.toObject();
			user.userId = user._id;

			delete user.password;
			delete user._id;
			delete user.__v;
		}
		return { user };
	}

	async function getUserById(userId) {
		let user = await User.findById(userId);
		if (user) {
			user = user.toObject();
			user.userId = user._id;

			delete user.password;
			delete user._id;
			delete user.__v;
		}
		return { user };
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

	async function addReportedReview(userId, revieweeId, reviewId) {
		const review = {
			revieweeId,
			reviewId,
		};
		console.log(userId);
		const user = await User.findByIdAndUpdate(
			userId,
			{ $push: { reportedReviews: review } },
			{ new: true }
		);
		console.log(user);
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
		let existingReviewVote;

		if (user) {
			existingReviewVote = user.helpfulnessVotes.find(
				(curVote) =>
					revieweeId == curVote.revieweeId && reviewId == curVote.reviewId
			);
		} else {
			return { cancelVote, switchVote, selectedVote, user };
		}

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
		return { cancelVote, switchVote, selectedVote, user };
	}

	async function verifyUser(userId) {
		const user = await User.findByIdAndUpdate(
			userId,
			{ $set: { isVerified: true } },
			{ new: true }
		);
		return { user };
	}
}

module.exports = UserService;
