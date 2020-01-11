const Reviewee = require('../models/Reviewee');
const UserService = require('./user.service');

const userService = UserService();

function RevieweeService() {
	return Object.freeze({
		createRevieweeWithReview,
		getRevieweesByName,
		createReview,
		getRevieweeById,
		updateHelpfulnessVote,
		getReviewById,
	});

	async function createRevieweeWithReview(revieweeData) {
		const formatedData = {
			name: revieweeData.name,
			school: revieweeData.school,
			reviews: [
				{
					review: revieweeData.review,
					courseName: revieweeData.courseName,
					overallRating: revieweeData.overallRating,
					recommendationRating: revieweeData.recommendationRating,
					difficultyRating: revieweeData.difficultyRating,
					yearTaken: revieweeData.yearTaken,
					grade: revieweeData.grade,
					tags: revieweeData.tags,
					textbookRequired: revieweeData.textbookRequired,
					teachingStyles: revieweeData.teachingStyles,
					helpfulUpVote: 0,
					helpfulDownVote: 0,
				},
			],
		};

		const newReviewee = await Reviewee.create(formatedData);

		return { newReviewee: await formatRevieweeObject(newReviewee) };
	}

	async function getRevieweesByName(name) {
		const searchQuery = name ? `(?i)(^| )${name}.*` : '.*';
		let reviewees = await Reviewee.find({ name: { $regex: searchQuery } });
		reviewees = reviewees.map((reviewee) => {
			return {
				revieweeId: reviewee._id,
				name: reviewee.name,
				school: reviewee.school,
			};
		});

		return { reviewees };
	}

	async function createReview(revieweeId, reviewData) {
		let newReview = {
			...reviewData,
			helpfulDownVote: 0,
			helpfulUpVote: 0,
		};

		const reviewee = await Reviewee.findByIdAndUpdate(
			revieweeId,
			{ $push: { reviews: newReview } },
			{ new: true }
		);

		let foundRevieweeId;
		if (reviewee) {
			foundRevieweeId = reviewee._id;
			newReview = formatReviewObject(reviewee.reviews.pop());
		} else {
			foundRevieweeId = null;
			newReview = null;
		}

		return { revieweeId: foundRevieweeId, newReview };
	}

	async function getRevieweeById(
		revieweeId,
		authenticated = true,
		userId = undefined
	) {
		const REVIEW_LIMIT = 3;
		let reviewee = await Reviewee.findById(revieweeId);
		reviewee = await formatRevieweeObject(reviewee, userId);
		if (!authenticated) {
			// limit returned review
			reviewee.reviews = limitReviewCount(reviewee.reviews, REVIEW_LIMIT);
		}

		return { reviewee };
	}

	async function updateHelpfulnessVote(
		cancelVote,
		switchVote,
		revieweeId,
		reviewId,
		vote,
		userId
	) {
		let reviewee = null;

		const voteSelector =
			vote === 'upVote'
				? 'reviews.$[elem].helpfulUpVote'
				: 'reviews.$[elem].helpfulDownVote';
		const oppositeVoteSelector =
			vote !== 'upVote'
				? 'reviews.$[elem].helpfulUpVote'
				: 'reviews.$[elem].helpfulDownVote';

		if (cancelVote === false && switchVote === false) {
			// increase vote
			reviewee = await Reviewee.findByIdAndUpdate(
				revieweeId,
				{ $inc: { [voteSelector]: 1 } },
				{
					arrayFilters: [{ 'elem._id': reviewId }],
					new: true,
				}
			);
		} else if (cancelVote === true) {
			// dec
			reviewee = await Reviewee.findByIdAndUpdate(
				revieweeId,
				{ $inc: { [voteSelector]: -1 } },
				{
					arrayFilters: [{ 'elem._id': reviewId }],
					new: true,
				}
			);
		} else if (switchVote === true) {
			// auto change / switch
			reviewee = await Reviewee.findByIdAndUpdate(
				revieweeId,
				{ $inc: { [voteSelector]: 1, [oppositeVoteSelector]: -1 } },
				{
					arrayFilters: [{ 'elem._id': reviewId }],
					new: true,
				}
			);
		}

		let votedReview = null;
		votedReview = getReviewByIdFromReviewee(
			await formatRevieweeObject(reviewee, userId),
			reviewId
		);

		return { votedReview };
	}

	function getReviewByIdFromReviewee(reviewee, reviewId) {
		let review = null;
		if (reviewee) {
			review = reviewee.reviews.find((review) => review.reviewId == reviewId);
		}

		return review;
	}

	async function getReviewById(revieweeId, reviewId) {
		const { reviewee } = await getRevieweeById(revieweeId);
		let review = null;
		review = getReviewByIdFromReviewee(reviewee, reviewId);
		return { review };
	}

	async function formatRevieweeObject(revieweeObject, userId = undefined) {
		if (!revieweeObject) {
			return null;
		}
		let formattedReviewee = revieweeObject;

		// initialization to calculate reviews average
		let sumOverallRating = 0;
		let sumRecommendationRating = 0;
		let sumDifficultyRating = 0;

		// accumulate reviews rating
		for (let i = 0; i < formattedReviewee.reviews.length; i++) {
			sumOverallRating += formattedReviewee.reviews[i].overallRating;
			sumDifficultyRating += formattedReviewee.reviews[i].difficultyRating;
			sumRecommendationRating +=
				formattedReviewee.reviews[i].recommendationRating;

			let isAuthor = false;
			let userVote;

			if (userId) {
				const { userData } = await userService.getUserDataById(userId);

				const curUserVote = userData.helpfulnessVotes.find(
					(vote) =>
						revieweeObject._id.equals(vote.revieweeId) &&
						formattedReviewee.reviews[i]._id.equals(vote.reviewId)
				);
				userVote = curUserVote ? curUserVote.vote : null;

				// TODO: set is author flag
			}

			formattedReviewee.reviews[i] = formatReviewObject(
				formattedReviewee.reviews[i],
				isAuthor,
				userVote
			);
		}

		formattedReviewee = formattedReviewee.toObject();
		formattedReviewee.revieweeId = formattedReviewee._id;
		formattedReviewee.numberOfReviews = formattedReviewee.reviews.length;

		const FLOATING_POINT = 2;

		if (revieweeObject.reviews.length > 0) {
			formattedReviewee.overallRating = (
				sumOverallRating / formattedReviewee.reviews.length
			).toFixed(FLOATING_POINT);

			formattedReviewee.recommendationRating = (
				sumRecommendationRating / formattedReviewee.reviews.length
			).toFixed(FLOATING_POINT);

			formattedReviewee.difficultyRating = (
				sumDifficultyRating / formattedReviewee.reviews.length
			).toFixed(FLOATING_POINT);

			formattedReviewee.overallRating = parseFloat(
				formattedReviewee.overallRating
			);
			formattedReviewee.recommendationRating = parseFloat(
				formattedReviewee.recommendationRating
			);
			formattedReviewee.difficultyRating = parseFloat(
				formattedReviewee.difficultyRating
			);
		} else {
			formattedReviewee.overallRating = '-';
			formattedReviewee.recommendationRating = '-';
			formattedReviewee.difficultyRating = '-';
		}

		delete formattedReviewee.__v;
		delete formattedReviewee._id;

		return formattedReviewee;
	}

	function formatReviewObject(
		reviewObject,
		isAuthor = false,
		userVote = undefined
	) {
		if (!reviewObject) {
			return null;
		}
		let formattedReview = reviewObject.toObject();
		formattedReview.reviewId = formattedReview._id;
		formattedReview.isAuthor = isAuthor;
		formattedReview.userVote = userVote;
		delete formattedReview._id;
		return formattedReview;
	}

	function limitReviewCount(reviews, countLimit) {
		let limitedReviews = [];
		countLimit = reviews.length < countLimit ? reviews.length : countLimit;
		for (let i = 0; i < countLimit; i += 1) {
			limitedReviews.push(reviews[i]);
		}
		return limitedReviews;
	}
}

module.exports = RevieweeService;
