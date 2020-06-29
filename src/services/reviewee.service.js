const Reviewee = require('../models/Reviewee');
const UserService = require('./user.service');
const SchoolService = require('./school.service');
const RecentService = require('./recent.service');

const userService = new UserService();
const schoolService = new SchoolService();
const recentService = new RecentService();

class RevieweeService {
	async createRevieweeWithReview(authorId, revieweeData) {
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

		let newReviewee = await Reviewee.create(formatedData);
		newReviewee = await this.formatRevieweeObject(newReviewee);
		newReviewee.reviews[0].isAuthor = true;

		const newReview = {
			name: revieweeData.name,
			school: revieweeData.school,
			review: revieweeData.review,
			overallRating: newReviewee.overallRating,
		};

		recentService.updateMostRecents('review', newReview);
		schoolService.addRevieweeCount(revieweeData.school);
		userService.addOutgoingReview(
			authorId,
			newReviewee.revieweeId,
			newReviewee.reviews[0].reviewId
		);

		return { newReviewee };
	}

	async getRevieweesByName(
		name,
		school,
		index = 0,
		limit = 10,
		sortBy = undefined,
		ascending = true
	) {
		let reviewees = await Reviewee.getReviewees(name, school, sortBy);
		index = parseInt(index);
		limit = parseInt(limit);

		if (index < 0) {
			reviewees = [];
			return { reviewees };
		}

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

		switch (sortBy) {
			case 'name':
				reviewees.sort((a, b) =>
					a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1
				);
				break;
			case 'school':
				reviewees.sort((a, b) =>
					a.school.toLowerCase() > b.school.toLowerCase() ? 1 : -1
				);
				break;
			case 'totalReviews':
				reviewees.sort((a, b) =>
					a.numberOfReviews > b.numberOfReviews
						? 1
						: a.numberOfReviews === b.numberOfReviews
						? a.name.toLowerCase() > b.name.toLowerCase()
							? 1
							: -1
						: -1
				);
				break;
			case 'overallRating':
				reviewees.sort((a, b) =>
					a.overallRating > b.overallRating
						? 1
						: a.overallRating === b.overallRating
						? a.name.toLowerCase() > b.name.toLowerCase()
							? 1
							: -1
						: -1
				);
				break;
    }

    if (ascending === 'false') {
      reviewees.reverse();
    }

		reviewees = reviewees.slice(index, index + limit);

		return { reviewees };
	}

	async createReview(revieweeId, reviewData) {
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
			newReview = this.formatReviewObject(reviewee.reviews.pop(), true);

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

	async getRevieweeById(revieweeId, authenticated = true, userId = undefined) {
		const REVIEW_LIMIT = 3;
		let reviewee = await Reviewee.findById(revieweeId);
		if (reviewee) {
			reviewee = await this.formatRevieweeObject(reviewee, userId);
			if (!authenticated) {
				// limit returned review
				reviewee.reviews = limitReviewCount(reviewee.reviews, REVIEW_LIMIT);
			}
		}

		schoolService.addVisitedCount(reviewee.school);

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

		// accumulate reviews rating
		for (let i = 0; i < formattedReviewee.reviews.length; i++) {
			sumOverallRating += formattedReviewee.reviews[i].overallRating;
			sumDifficultyRating += formattedReviewee.reviews[i].difficultyRating;
			sumRecommendationRating +=
				formattedReviewee.reviews[i].recommendationRating;

			let isAuthor = false;
			let userVote;
			let hasReported = false;

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

					hasReported = user.reportedReviews.some(
						(review) =>
							revieweeObject._id.equals(review.revieweeId) &&
							formattedReviewee.reviews[i]._id.equals(review.reviewId)
					);
				}
			}

			formattedReviewee.reviews[i] = this.formatReviewObject(
				formattedReviewee.reviews[i],
				isAuthor,
				userVote,
				hasReported
			);
		}

		formattedReviewee = formattedReviewee.toObject();
		formattedReviewee.revieweeId = formattedReviewee._id;
		formattedReviewee.numberOfReviews = formattedReviewee.reviews.length;
		// formattedReviewee.reviews = formattedReviewee.reviews.reverse();
		formattedReviewee.reviews = this.sortReviewsByAuthor(
			formattedReviewee.reviews
		);

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
		formattedReview.reviewId = formattedReview._id;
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
