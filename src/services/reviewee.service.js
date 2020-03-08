const Reviewee = require('../models/Reviewee');
const UserService = require('./user.service');
const SchoolService = require('./school.service');
const RecentService = require('./recent.service');

const userService = UserService();
const schoolService = SchoolService();
const recentService = RecentService();

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
					createdAt: Date.now(),
				},
			],
		};

		schoolService.addRevieweeCount(revieweeData.school);

		let newReviewee = await Reviewee.create(formatedData);
		newReviewee = await formatRevieweeObject(newReviewee);
		newReviewee.reviews[0].isAuthor = true;

		const newReview = {
			name: revieweeData.name,
			school: revieweeData.school,
			review: revieweeData.review,
			overallRating: newReviewee.overallRating,
		};
		recentService.updateMostRecents('review', newReview);

		return { newReviewee };
	}

	async function getRevieweesByName(name, school) {
		const schoolQuery = school ? `(?i)(^| )${school}.*` : '.*';
		const nameQuery = name ? `(?i)(^| )${name}.*` : '.*';
		let reviewees = await Reviewee.find({
			$and: [
				{ name: { $regex: nameQuery } },
				{ school: { $regex: schoolQuery } },
			],
		});
		reviewees = reviewees.map((reviewee) => {
			let sumOverallRating = 0;
			const numberOfReviews = reviewee.reviews.length;

			for (let i = 0; i < numberOfReviews; i++) {
				sumOverallRating += reviewee.reviews[i].overallRating;
			}

			return {
				revieweeId: reviewee._id,
				name: reviewee.name,
				school: reviewee.school,
				numberOfReviews: numberOfReviews,
				overallRating:
					numberOfReviews > 0 ? sumOverallRating / numberOfReviews : 0,
			};
		});

		return { reviewees };
	}

	async function createReview(revieweeId, reviewData) {
		let newReview = {
			...reviewData,
			createdAt: Date.now(),
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
			newReview = formatReviewObject(reviewee.reviews.pop(), true);

			const mostRecentReview = {
				name: reviewee.name,
				school: reviewee.school,
				review: newReview.review,
				overallRating: newReview.overallRating,
			};
			recentService.updateMostRecents('review', mostRecentReview);
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
		if (reviewee) {
			reviewee = await formatRevieweeObject(reviewee, userId);
			if (!authenticated) {
				// limit returned review
				reviewee.reviews = limitReviewCount(reviewee.reviews, REVIEW_LIMIT);
			}
		}

		schoolService.addVisitedCount(reviewee.school);

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
				const { user } = await userService.getUserById(userId);
				if (user) {
					//make sure user exists
					const curUserVote = user.helpfulnessVotes.find(
						(vote) =>
							revieweeObject._id.equals(vote.revieweeId) &&
							formattedReviewee.reviews[i]._id.equals(vote.reviewId)
					);
					userVote = curUserVote ? curUserVote.vote : null;

					isAuthor = user.outgoingReviews.some(
						(review) =>
							revieweeObject._id.equals(review.revieweeId) &&
							formattedReviewee.reviews[i]._id.equals(review.reviewId)
					);

					hasRepoted = user.reportedReviews.some(
						(review) =>
							revieweeObject._id.equals(review.revieweeId) &&
							formattedReviewee.reviews[i]._id.equals(review.reviewId)
					);
				}
			}

			formattedReviewee.reviews[i] = formatReviewObject(
				formattedReviewee.reviews[i],
				isAuthor,
				userVote,
				hasRepoted,
			);
		}

		formattedReviewee = formattedReviewee.toObject();
		formattedReviewee.revieweeId = formattedReviewee._id;
		formattedReviewee.numberOfReviews = formattedReviewee.reviews.length;
		// formattedReviewee.reviews = formattedReviewee.reviews.reverse();
		formattedReviewee.reviews = sortReviewsByAuthor(formattedReviewee.reviews);

		if (revieweeObject.reviews.length > 0) {
			formattedReviewee.overallRating =
				sumOverallRating / formattedReviewee.reviews.length;

			formattedReviewee.recommendationRating =
				sumRecommendationRating / formattedReviewee.reviews.length;

			formattedReviewee.difficultyRating =
				sumDifficultyRating / formattedReviewee.reviews.length;

			formattedReviewee.overallRating = formattedReviewee.overallRating;
			formattedReviewee.recommendationRating =
				formattedReviewee.recommendationRating;
			formattedReviewee.difficultyRating = formattedReviewee.difficultyRating;
		} else {
			formattedReviewee.overallRating = 0;
			formattedReviewee.recommendationRating = 0;
			formattedReviewee.difficultyRating = 0;
		}

		delete formattedReviewee.__v;
		delete formattedReviewee._id;

		return formattedReviewee;
	}

	function formatReviewObject(
		reviewObject,
		isAuthor = false,
		userVote = undefined,
		hasReported = false
	) {
		if (!reviewObject) {
			return null;
		}
		let formattedReview = reviewObject.toObject();
		formattedReview.reviewId = formattedReview._id;
		formattedReview.isAuthor = isAuthor;
		formattedReview.userVote = userVote;
		formattedReview.hasReported = hasRepoted;
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

	function sortReviewsByAuthor(reviews) {
		reviews = reviews.reverse();

		let isAuthorReviews = [];
		let notAuthorReviews = [];

		reviews.forEach((review) => {
			if (review.isAuthor === true) {
				isAuthorReviews.push(review);
			} else {
				notAuthorReviews.push(review);
			}
		});

		reviews = isAuthorReviews.concat(notAuthorReviews);

		return reviews;
	}
}

module.exports = RevieweeService;
