const Reviewee = require('../models/Reviewee');
const UserService = require('./user.service');
const SchoolService = require('./school.service');
const RecentService = require('./recent.service');

const userService = new UserService();
const schoolService = new SchoolService();
const recentService = new RecentService();

class RevieweeService {
	async createRevieweeWithReview(authorId, revieweeData) {
		let review = undefined;
		if (revieweeData.review) {
			review = {
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
			};
		}

		let newReviewee = await Reviewee.createReviewee(
			revieweeData.name,
			revieweeData.school,
			review
		);

		newReviewee = await this.formatRevieweeObject(newReviewee);

		if (review) {
			newReviewee.reviews[0].isAuthor = true;
			userService.addOutgoingReview(
				authorId,
				newReviewee.revieweeId,
				newReviewee.reviews[0].reviewId
			);
		}

		const newReview = {
			name: revieweeData.name,
			school: revieweeData.school,
			review: revieweeData.review,
			overallRating: newReviewee.overallRating,
		};

		recentService.updateMostRecents('review', newReview);
		schoolService.addRevieweeCount(revieweeData.school);

		return { newReviewee };
	}

	async getRevieweesByName(
		name,
		school,
		index = 0,
		limit = 10,
		sortBy = 'name',
		ascending = true
	) {
		index = parseInt(index);
		limit = parseInt(limit);

		if (index < 0) {
			let reviewees = [];
			return { reviewees };
		}

		const result = await Reviewee.getReviewees(
			name,
			school,
			sortBy,
			ascending,
			index,
			limit
		);

		let reviewees = result[0].reviewees;
		const totalReviewees =
			result[0].totalReviewees.length > 0
				? result[0].totalReviewees[0].count
				: 0;

		reviewees = reviewees.map((reviewee) => {
			if (reviewee.overallRating === null) {
				reviewee.overallRating = 0;
			}

			if (reviewee.difficultyRating === null) {
				reviewee.difficultyRating = 0;
			}

			if (reviewee.recommendationRating === null) {
				reviewee.recommendationRating = 0;
			}

			return reviewee;
		});

		return { reviewees, totalReviewees };
	}

	async createReview(authorId, revieweeId, reviewData) {
		let newReview = {
			...reviewData,
			createdAt: Date.now(),
			helpfulDownVote: 0,
			helpfulUpVote: 0,
		};

		const reviewee = await Reviewee.createReview(revieweeId, newReview);
		let foundRevieweeId;

		if (reviewee) {
			foundRevieweeId = reviewee._id.toString();
			newReview = this.formatReviewObject(reviewee.reviews.pop(), true);

			const mostRecentReview = {
				name: reviewee.name,
				school: reviewee.school,
				review: newReview.review,
				overallRating: newReview.overallRating,
			};
			recentService.updateMostRecents('review', mostRecentReview);
			userService.addOutgoingReview(authorId, reviewee._id, newReview.reviewId);
		} else {
			foundRevieweeId = null;
			newReview = null;
		}

		return { foundRevieweeId, newReview };
	}

	async getRevieweeById(revieweeId, authenticated = true, userId = undefined) {
		const REVIEW_LIMIT = 3;
		let reviewee = await Reviewee.findById(revieweeId);
		if (reviewee) {
			reviewee = await this.formatRevieweeObject(reviewee, userId);
			if (!authenticated) {
				// limit returned review
				reviewee.reviews = this.limitReviewCount(
					reviewee.reviews,
					REVIEW_LIMIT
				);
			}
			schoolService.addVisitedCount(reviewee.school);
		}

		return { reviewee };
	}

	async updateHelpfulnessVote(
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
		votedReview = this.getReviewByIdFromReviewee(
			await this.formatRevieweeObject(reviewee, userId),
			reviewId
		);

		return { votedReview };
	}

	getReviewByIdFromReviewee(reviewee, reviewId) {
		let review = null;
		if (reviewee) {
			review = reviewee.reviews.find((review) => review.reviewId == reviewId);
		}

		return review;
	}

	async getReviewById(revieweeId, reviewId) {
		const { reviewee } = await this.getRevieweeById(revieweeId);
		let review = null;
		review = this.getReviewByIdFromReviewee(reviewee, reviewId);
		return { review };
	}

	async formatRevieweeObject(revieweeObject, userId = undefined) {
		if (!revieweeObject) {
			return null;
		}
		let formattedReviewee = revieweeObject;

		// initialization to calculate reviews average
		let sumOverallRating = 0;
		let sumRecommendationRating = 0;
		let sumDifficultyRating = 0;

		let countedOverallRating = 0;
		let countedDifficultyRating = 0;
		let countedRecommendationRating = 0;

		let user;
		if (userId) {
			({ user } = await userService.getUserById(userId));
		}

		// accumulate reviews rating
		for (let i = 0; i < formattedReviewee.reviews.length; i++) {
			if (formattedReviewee.reviews[i].overallRating !== undefined) {
				sumOverallRating += formattedReviewee.reviews[i].overallRating;
				countedOverallRating += 1;
			}

			if (formattedReviewee.reviews[i].difficultyRating !== undefined) {
				sumDifficultyRating += formattedReviewee.reviews[i].difficultyRating;
				countedDifficultyRating += 1;
			}

			if (formattedReviewee.reviews[i].recommendationRating !== undefined) {
				sumRecommendationRating +=
					formattedReviewee.reviews[i].recommendationRating;
				countedRecommendationRating += 1;
			}

			let isAuthor = false;
			let userVote;
			let hasReported = false;

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

				hasReported = user.reportedReviews.some(
					(review) =>
						revieweeObject._id.equals(review.revieweeId) &&
						formattedReviewee.reviews[i]._id.equals(review.reviewId)
				);
			}

			formattedReviewee.reviews[i] = this.formatReviewObject(
				formattedReviewee.reviews[i],
				isAuthor,
				userVote,
				hasReported
			);
		}

		formattedReviewee = formattedReviewee.toObject();
		formattedReviewee.revieweeId = formattedReviewee._id.toString();
		formattedReviewee.numberOfReviews = formattedReviewee.reviews.length;
		// formattedReviewee.reviews = formattedReviewee.reviews.reverse();
		formattedReviewee.reviews = this.sortReviewsByAuthor(
			formattedReviewee.reviews
		);

		formattedReviewee.overallRating =
			countedOverallRating > 0 ? sumOverallRating / countedOverallRating : 0;

		formattedReviewee.recommendationRating =
			countedRecommendationRating > 0
				? sumRecommendationRating / countedRecommendationRating
				: 0;

		formattedReviewee.difficultyRating =
			countedDifficultyRating > 0
				? sumDifficultyRating / countedDifficultyRating
				: 0;

		delete formattedReviewee.__v;
		delete formattedReviewee._id;

		return formattedReviewee;
	}

	formatReviewObject(
		reviewObject,
		isAuthor = false,
		userVote = null,
		hasReported = false
	) {
		if (!reviewObject) {
			return null;
		}
		let formattedReview = reviewObject.toObject();
		formattedReview.reviewId = formattedReview._id.toString();
		formattedReview.isAuthor = isAuthor;
		formattedReview.userVote = userVote;
		formattedReview.hasReported = hasReported;
		delete formattedReview._id;
		return formattedReview;
	}

	limitReviewCount(reviews, countLimit) {
		let limitedReviews = [];
		countLimit = reviews.length < countLimit ? reviews.length : countLimit;
		for (let i = 0; i < countLimit; i += 1) {
			limitedReviews.push(reviews[i]);
		}
		return limitedReviews;
	}

	sortReviewsByAuthor(reviews) {
		// put all reviews with isAuthor == true to the beginning of array
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
